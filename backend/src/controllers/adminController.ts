import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuditService } from '../services/auditService.js';

export class AdminController {
  /**
   * Get all registered users and their accounts.
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              balance: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
    }
  }

  /**
   * Approve or reject a user onboarding KYC workflow.
   */
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const { status } = req.body;

      if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be APPROVED, REJECTED, PENDING, or SUSPENDED.' });
        return;
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { accounts: true }
      });

      if (!targetUser) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: { status }
        });

        // If status changed to APPROVED, activate their accounts; if SUSPENDED, freeze them
        const accountStatus = status === 'APPROVED' ? 'ACTIVE' : (status === 'SUSPENDED' ? 'FROZEN' : 'ACTIVE');
        await tx.account.updateMany({
          where: { userId },
          data: { status: accountStatus }
        });

        return u;
      });

      await AuditService.log({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: `USER_STATUS_UPDATED_${status}`,
        resource: `/api/admin/users/${userId}/status`,
        details: { previousStatus: targetUser.status, newStatus: status, targetEmail: targetUser.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      res.json({
        message: `User status successfully updated to ${status}.`,
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
          status: updated.status
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update user status', details: err.message });
    }
  }

  /**
   * Update user role (e.g. promote to OPERATOR or ADMIN).
   */
  static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const { role } = req.body;

      if (!['ADMIN', 'OPERATOR', 'ACCOUNT_HOLDER'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be ADMIN, OPERATOR, or ACCOUNT_HOLDER.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      await AuditService.log({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'USER_ROLE_CHANGED',
        resource: `/api/admin/users/${userId}/role`,
        details: { newRole: role, targetEmail: updated.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      res.json({
        message: `User role updated to ${role}.`,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update user role', details: err.message });
    }
  }

  /**
   * System-wide statistics and metrics.
   */
  static async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const [userCount, accountCount, transactionCount, ledgerCount, auditCount, balanceAggregate] = await Promise.all([
        prisma.user.count(),
        prisma.account.count(),
        prisma.transaction.count(),
        prisma.ledgerEntry.count(),
        prisma.auditLog.count(),
        prisma.account.aggregate({
          _sum: { balance: true }
        })
      ]);

      res.json({
        stats: {
          totalUsers: userCount,
          totalAccounts: accountCount,
          totalTransactions: transactionCount,
          totalLedgerEntries: ledgerCount,
          totalAuditEvents: auditCount,
          totalLiquidity: balanceAggregate._sum.balance || 0.0
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch system stats', details: err.message });
    }
  }
}

