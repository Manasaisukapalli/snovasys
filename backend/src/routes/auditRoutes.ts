import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Ledger verification and interactive tamper testing endpoints
router.get('/ledger/verify', AuditController.verifyLedger);
router.get('/ledger/entries', AuditController.getLedgerEntries);
router.post('/ledger/simulate-tamper', AuditController.simulateTamper);
router.post('/ledger/repair', AuditController.repairLedger);

// Audit logs restricted to ADMIN and OPERATOR
router.get('/logs', authenticate, requireRole('ADMIN', 'OPERATOR'), AuditController.getAuditLogs);

export default router;

