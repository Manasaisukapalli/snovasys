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

  /**
   * Interactive Sandbox: Deliberately alter an entry in the database to test tamper detection.
   */
  static async simulateTamper(req: Request, res: Response): Promise<void> {
    try {
      const targetEntry = await prisma.ledgerEntry.findFirst({
        orderBy: { entryNumber: 'asc' }
      });

      if (!targetEntry) {
        res.status(400).json({ error: 'No ledger entries exist to tamper with.' });
        return;
      }

      // Save original amount in SystemConfig so it can be restored
      await prisma.systemConfig.upsert({
        where: { key: 'ORIGINAL_ENTRY_1_AMOUNT' },
        update: { value: targetEntry.amount.toString() },
        create: { key: 'ORIGINAL_ENTRY_1_AMOUNT', value: targetEntry.amount.toString() }
      });

      // Illegitimately mutate the record
      await prisma.ledgerEntry.update({
        where: { id: targetEntry.id },
        data: { amount: targetEntry.amount + 777777.0 }
      });

      res.json({
        message: `Tampering simulated! Entry #${targetEntry.entryNumber} amount was maliciously altered in DB.`,
        tamperedEntryNumber: targetEntry.entryNumber
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Tamper simulation failed', details: err.message });
    }
  }

  /**
   * Restore ledger to legitimate state after tamper testing.
   */
  static async repairLedger(req: Request, res: Response): Promise<void> {
    try {
      const original = await prisma.systemConfig.findUnique({
        where: { key: 'ORIGINAL_ENTRY_1_AMOUNT' }
      });

      const originalAmount = original ? parseFloat(original.value) : 50000.0;

      const targetEntry = await prisma.ledgerEntry.findFirst({
        orderBy: { entryNumber: 'asc' }
      });

      if (targetEntry) {
        await prisma.ledgerEntry.update({
          where: { id: targetEntry.id },
          data: { amount: originalAmount }
        });
      }

      res.json({
        message: 'Ledger state mathematically restored and verified.',
        restoredAmount: originalAmount
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Repair failed', details: err.message });
    }
  }
}

