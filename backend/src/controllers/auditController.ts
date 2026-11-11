import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { LedgerService } from '../services/ledgerService.js';

export class AuditController {
  /**
   * Retrieve system audit logs.
   */
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { action, status, limit = '50', page = '1' } = req.query;
      const take = parseInt(limit as string, 10);
      const skip = (parseInt(page as string, 10) - 1) * take;

      const where: any = {};
      if (action) where.action = action as string;
      if (status) where.status = status as string;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          take,
          skip,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.auditLog.count({ where })
      ]);

      res.json({
        logs,
        pagination: {
          total,
          page: parseInt(page as string, 10),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
    }
  }

  /**
   * Retrieve the cryptographic ledger entries.
   */
  static async getLedgerEntries(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '100' } = req.query;

      const entries = await prisma.ledgerEntry.findMany({
        take: parseInt(limit as string, 10),
        orderBy: { entryNumber: 'desc' },
        include: {
          account: {
            select: { accountNumber: true, user: { select: { fullName: true } } }
          },
          transaction: {
            select: { referenceNumber: true, type: true, description: true }
          }
        }
      });

      res.json({ entries });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch ledger entries', details: err.message });
    }
  }

  /**
   * Verify the entire cryptographic ledger chain and double-entry reconciliation.
   * Proves mathematically whether the ledger has been modified or is 100% authentic.
   */
  static async verifyLedger(req: Request, res: Response): Promise<void> {
    try {
      const report = await LedgerService.verifyLedgerIntegrity();
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: 'Ledger verification failed', details: err.message });
    }
  }
}

