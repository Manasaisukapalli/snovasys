import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const startTime = Date.now();

export class HealthController {
  /**
   * Health liveness probe.
   */
  static async getHealth(req: Request, res: Response): Promise<void> {
    const memory = process.memoryUsage();

    res.json({
      status: 'UP',
      service: 'BalanceVault Core Ledger API',
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        rssMb: Math.round(memory.rss / 1024 / 1024 * 100) / 100
      }
    });
  }

  /**
   * Readiness probe: checks database connectivity and ledger table access.
   */
  static async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      // Test database connectivity
      await prisma.$queryRaw`SELECT 1`;

      const ledgerCount = await prisma.ledgerEntry.count();

      res.json({
        status: 'READY',
        database: 'CONNECTED',
        ledgerAccessible: true,
        totalEntriesTracked: ledgerCount,
        checkedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'NOT_READY',
        database: 'DISCONNECTED',
        error: err.message,
        checkedAt: new Date().toISOString()
      });
    }
  }
}

