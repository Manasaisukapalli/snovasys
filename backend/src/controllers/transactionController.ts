import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { LedgerService } from '../services/ledgerService.js';
import { AuditService } from '../services/auditService.js';

export class TransactionController {
  /**
   * Deposit funds into user's account.
   */
  static async deposit(req: Request, res: Response): Promise<void> {
    try {
      const { amount, description } = req.body;
      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Deposit amount must be a positive number.' });
        return;
      }

      const userAccount = await prisma.account.findFirst({
        where: { userId: req.user!.id, status: 'ACTIVE' }
      });

      if (!userAccount) {
        res.status(404).json({ error: 'Active account not found for user.' });
        return;
      }

      const referenceNumber = `BV-DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const result = await prisma.$transaction(async (tx) => {
        // Update account balance
        const updatedAccount = await tx.account.update({
          where: { id: userAccount.id },
          data: { balance: { increment: parsedAmount } }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            referenceNumber,
            targetAccountId: userAccount.id,
            amount: parsedAmount,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: description || 'Account fund deposit'
          }
        });

        // Record cryptographic ledger entry
        const ledgerEntry = await LedgerService.recordEntry(
          tx,
          transaction.id,
          userAccount.id,
          'CREDIT',
          parsedAmount,
          updatedAccount.balance
        );

        return { updatedAccount, transaction, ledgerEntry };
      });

      await AuditService.log({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'DEPOSIT_SUCCESS',
        resource: `/api/transactions/${result.transaction.id}`,
        details: { amount: parsedAmount, referenceNumber, newBalance: result.updatedAccount.balance },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      res.status(201).json({
        message: 'Deposit completed successfully.',
        transaction: result.transaction,
        account: result.updatedAccount,
        ledgerProof: {
          entryNumber: result.ledgerEntry.entryNumber,
          hash: result.ledgerEntry.currentHash,
          previousHash: result.ledgerEntry.previousHash
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Deposit failed', details: err.message });
    }
  }

  /**
   * Transfer funds between accounts with atomic balance updates and balanced ledger entries.
   */
  static async transfer(req: Request, res: Response): Promise<void> {
    try {
      const { recipientAccountNumber, amount, description } = req.body;
      const parsedAmount = parseFloat(amount);

      if (!recipientAccountNumber || typeof recipientAccountNumber !== 'string') {
        res.status(400).json({ error: 'Recipient account number is required.' });
        return;
      }

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Transfer amount must be greater than zero.' });
        return;
      }

      const senderAccount = await prisma.account.findFirst({
        where: { userId: req.user!.id, status: 'ACTIVE' }
      });

      if (!senderAccount) {
        res.status(404).json({ error: 'Active sender account not found.' });
        return;
      }

      if (senderAccount.accountNumber === recipientAccountNumber.trim()) {
        res.status(400).json({ error: 'Cannot transfer funds to the same account.' });
        return;
      }

      const recipientAccount = await prisma.account.findUnique({
        where: { accountNumber: recipientAccountNumber.trim() },
        include: { user: { select: { fullName: true } } }
      });

      if (!recipientAccount || recipientAccount.status !== 'ACTIVE') {
        res.status(404).json({ error: 'Recipient account not found or is currently inactive.' });
        return;
      }

      // Check sufficient balance (Overdraft protection)
      if (senderAccount.balance < parsedAmount) {
        await AuditService.log({
          actorId: req.user!.id,
          actorEmail: req.user!.email,
          action: 'TRANSFER_REJECTED_INSUFFICIENT_FUNDS',
          resource: '/api/transactions/transfer',
          details: { balance: senderAccount.balance, requestedAmount: parsedAmount },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'FAILURE'
        });

        res.status(400).json({
          error: `Insufficient balance. Available: ₹${senderAccount.balance.toFixed(2)}, Requested: ₹${parsedAmount.toFixed(2)}`
        });
        return;
      }

      const referenceNumber = `BV-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Execute atomic money movement in ACID transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Deduct from sender
        const updatedSender = await tx.account.update({
          where: { id: senderAccount.id },
          data: { balance: { decrement: parsedAmount } }
        });

        // 2. Add to recipient
        const updatedRecipient = await tx.account.update({
          where: { id: recipientAccount.id },
          data: { balance: { increment: parsedAmount } }
        });

        // 3. Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            referenceNumber,
            sourceAccountId: senderAccount.id,
            targetAccountId: recipientAccount.id,
            amount: parsedAmount,
            type: 'TRANSFER',
            status: 'COMPLETED',
            description: description || `Transfer to ${recipientAccount.user.fullName}`
          }
        });

        // 4. Record DEBIT ledger entry for sender
        const debitEntry = await LedgerService.recordEntry(
          tx,
          transaction.id,
          senderAccount.id,
          'DEBIT',
          parsedAmount,
          updatedSender.balance
        );

        // 5. Record CREDIT ledger entry for recipient
        const creditEntry = await LedgerService.recordEntry(
          tx,
          transaction.id,
          recipientAccount.id,
          'CREDIT',
          parsedAmount,
          updatedRecipient.balance
        );

        return { transaction, updatedSender, updatedRecipient, debitEntry, creditEntry };
      });

      await AuditService.log({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'TRANSFER_SUCCESS',
        resource: `/api/transactions/${result.transaction.id}`,
        details: {
          referenceNumber,
          amount: parsedAmount,
          sourceAccount: senderAccount.accountNumber,
          targetAccount: recipientAccount.accountNumber
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      res.status(201).json({
        message: 'Funds transferred successfully.',
        transaction: result.transaction,
        senderBalance: result.updatedSender.balance,
        recipientName: recipientAccount.user.fullName,
        ledgerProof: {
          debitEntryNumber: result.debitEntry.entryNumber,
          debitHash: result.debitEntry.currentHash,
          creditEntryNumber: result.creditEntry.entryNumber,
          creditHash: result.creditEntry.currentHash
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Transfer failed', details: err.message });
    }
  }

  /**
   * Get transaction history for current user.
   */
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userAccounts = await prisma.account.findMany({
        where: { userId: req.user!.id },
        select: { id: true }
      });

      const accountIds = userAccounts.map(a => a.id);

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { sourceAccountId: { in: accountIds } },
            { targetAccountId: { in: accountIds } }
          ]
        },
        include: {
          sourceAccount: { select: { accountNumber: true, user: { select: { fullName: true } } } },
          targetAccount: { select: { accountNumber: true, user: { select: { fullName: true } } } },
          ledgerEntries: {
            select: {
              entryNumber: true,
              entryType: true,
              amount: true,
              balanceAfter: true,
              currentHash: true,
              previousHash: true,
              timestamp: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ transactions });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch transaction history', details: err.message });
    }
  }
}

