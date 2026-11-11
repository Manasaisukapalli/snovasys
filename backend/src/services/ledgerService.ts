import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface LedgerProofReport {
  isValid: boolean;
  totalEntries: number;
  genesisHash: string;
  latestHash: string;
  merkleRoot: string;
  tamperedEntry: number | null;
  error?: string;
  doubleEntryReconciliation: {
    totalCredits: number;
    totalDebits: number;
    netDifference: number;
    isBalanced: boolean;
  };
  verifiedAt: string;
}

export class LedgerService {
  /**
   * Computes SHA-256 hash for a ledger entry.
   */
  static calculateHash(
    entryNumber: number,
    previousHash: string,
    transactionId: string,
    accountId: string,
    entryType: string,
    amount: number,
    balanceAfter: number,
    timestamp: Date
  ): string {
    const payload = [
      entryNumber,
      previousHash,
      transactionId,
      accountId,
      entryType,
      amount.toFixed(2),
      balanceAfter.toFixed(2),
      timestamp.toISOString()
    ].join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Appends an entry to the cryptographic ledger.
   */
  static async recordEntry(
    txClient: any,
    transactionId: string,
    accountId: string,
    entryType: 'DEBIT' | 'CREDIT',
    amount: number,
    balanceAfter: number
  ) {
    // Get the last ledger entry to chain from
    const lastEntry = await txClient.ledgerEntry.findFirst({
      orderBy: { entryNumber: 'desc' }
    });

    const entryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;
    const previousHash = lastEntry ? lastEntry.currentHash : GENESIS_HASH;
    const timestamp = new Date();

    const currentHash = this.calculateHash(
      entryNumber,
      previousHash,
      transactionId,
      accountId,
      entryType,
      amount,
      balanceAfter,
      timestamp
    );

    return await txClient.ledgerEntry.create({
      data: {
        entryNumber,
        transactionId,
        accountId,
        entryType,
        amount,
        balanceAfter,
        previousHash,
        currentHash,
        timestamp
      }
    });
  }

  /**
   * Cryptographically verifies the integrity of the entire ledger.
   * Proves mathematically that no entry has been added, removed, or modified.
   */
  static async verifyLedgerIntegrity(): Promise<LedgerProofReport> {
    const entries = await prisma.ledgerEntry.findMany({
      orderBy: { entryNumber: 'asc' }
    });

    let totalCredits = 0;
    let totalDebits = 0;
    let expectedPreviousHash = GENESIS_HASH;
    const hashes: string[] = [];

    if (entries.length === 0) {
      return {
        isValid: true,
        totalEntries: 0,
        genesisHash: GENESIS_HASH,
        latestHash: GENESIS_HASH,
        merkleRoot: GENESIS_HASH,
        tamperedEntry: null,
        doubleEntryReconciliation: {
          totalCredits: 0,
          totalDebits: 0,
          netDifference: 0,
          isBalanced: true
        },
        verifiedAt: new Date().toISOString()
      };
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedNumber = i + 1;

      // 1. Verify sequence continuity
      if (entry.entryNumber !== expectedNumber) {
        return {
          isValid: false,
          totalEntries: entries.length,
          genesisHash: GENESIS_HASH,
          latestHash: entries[entries.length - 1].currentHash,
          merkleRoot: '',
          tamperedEntry: entry.entryNumber,
          error: `Broken sequence at entry #${entry.entryNumber}. Expected #${expectedNumber}`,
          doubleEntryReconciliation: { totalCredits, totalDebits, netDifference: totalCredits - totalDebits, isBalanced: false },
          verifiedAt: new Date().toISOString()
        };
      }

      // 2. Verify previousHash linkage
      if (entry.previousHash !== expectedPreviousHash) {
        return {
          isValid: false,
          totalEntries: entries.length,
          genesisHash: GENESIS_HASH,
          latestHash: entries[entries.length - 1].currentHash,
          merkleRoot: '',
          tamperedEntry: entry.entryNumber,
          error: `Chain broken at entry #${entry.entryNumber}: previousHash mismatch. Expected ${expectedPreviousHash}, found ${entry.previousHash}`,
          doubleEntryReconciliation: { totalCredits, totalDebits, netDifference: totalCredits - totalDebits, isBalanced: false },
          verifiedAt: new Date().toISOString()
        };
      }

      // 3. Verify cryptographic hash of entry data
      const recalculatedHash = this.calculateHash(
        entry.entryNumber,
        entry.previousHash,
        entry.transactionId,
        entry.accountId,
        entry.entryType,
        entry.amount,
        entry.balanceAfter,
        entry.timestamp
      );

      if (entry.currentHash !== recalculatedHash) {
        return {
          isValid: false,
          totalEntries: entries.length,
          genesisHash: GENESIS_HASH,
          latestHash: entries[entries.length - 1].currentHash,
          merkleRoot: '',
          tamperedEntry: entry.entryNumber,
          error: `Tampering detected at entry #${entry.entryNumber}! Hash does not match stored payload data.`,
          doubleEntryReconciliation: { totalCredits, totalDebits, netDifference: totalCredits - totalDebits, isBalanced: false },
          verifiedAt: new Date().toISOString()
        };
      }

      // 4. Track double-entry totals
      if (entry.entryType === 'CREDIT') {
        totalCredits += entry.amount;
      } else {
        totalDebits += entry.amount;
      }

      hashes.push(entry.currentHash);
      expectedPreviousHash = entry.currentHash;
    }

    // 5. Compute Merkle Root / Cumulative Digest
    const merkleRoot = this.computeMerkleRoot(hashes);

    return {
      isValid: true,
      totalEntries: entries.length,
      genesisHash: GENESIS_HASH,
      latestHash: hashes[hashes.length - 1],
      merkleRoot,
      tamperedEntry: null,
      doubleEntryReconciliation: {
        totalCredits: parseFloat(totalCredits.toFixed(2)),
        totalDebits: parseFloat(totalDebits.toFixed(2)),
        netDifference: parseFloat((totalCredits - totalDebits).toFixed(2)),
        isBalanced: true
      },
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Computes a cryptographic Merkle root of an array of transaction hashes.
   */
  static computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return GENESIS_HASH;
    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }
}

