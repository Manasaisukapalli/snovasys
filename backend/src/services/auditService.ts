import { prisma } from '../config/prisma.js';

export interface AuditParams {
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string | string[];
  status?: 'SUCCESS' | 'FAILURE';
}

export class AuditService {
  static async log(params: AuditParams) {
    try {
      const detailsString = typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details || null;

      const ua = Array.isArray(params.userAgent) ? params.userAgent.join(', ') : params.userAgent;

      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          actorEmail: params.actorEmail || null,
          action: params.action,
          resource: params.resource,
          details: detailsString,
          ipAddress: params.ipAddress || '127.0.0.1',
          userAgent: ua || 'system',
          status: params.status || 'SUCCESS'
        }
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}

