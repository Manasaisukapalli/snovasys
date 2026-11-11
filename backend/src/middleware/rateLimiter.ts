import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export const rateLimiter = (options: { windowMs?: number; max?: number; message?: string } = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 100; // 100 requests per window
  const message = options.message || 'Too many requests. Please slow down.';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      await AuditService.log({
        action: 'RATE_LIMIT_EXCEEDED',
        resource: req.originalUrl,
        details: { ip: key, count: record.count, max },
        ipAddress: key,
        userAgent: req.headers['user-agent'],
        status: 'FAILURE'
      });

      res.status(429).json({ error: message, retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) });
      return;
    }

    next();
  };
};

