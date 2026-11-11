import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Ledger verification can be public or operator-accessible to support "a ledger you can prove"!
router.get('/ledger/verify', AuditController.verifyLedger);
router.get('/ledger/entries', AuditController.getLedgerEntries);

// Audit logs restricted to ADMIN and OPERATOR
router.get('/logs', authenticate, requireRole('ADMIN', 'OPERATOR'), AuditController.getAuditLogs);

export default router;

