import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.js';

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record failed access attempt in audit log
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'ACCESS_DENIED_RBAC',
        resource: req.originalUrl,
        details: { requiredRoles: allowedRoles, userRole: req.user.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'FAILURE'
      });

      res.status(403).json({
        error: `Forbidden. Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
};

export const requireApprovedAccount = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  // Admins and operators bypass the onboarding status check
  if (req.user.role === 'ADMIN' || req.user.role === 'OPERATOR') {
    return next();
  }

  if (req.user.status !== 'APPROVED') {
    res.status(403).json({
      error: `Your account onboarding status is ${req.user.status}. Financial operations are restricted until your KYC/onboarding is approved by an administrator.`
    });
    return;
  }

  next();
};

