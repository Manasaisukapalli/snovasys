import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { requireApprovedAccount } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.post('/deposit', requireApprovedAccount, TransactionController.deposit);
router.post('/transfer', requireApprovedAccount, TransactionController.transfer);
router.get('/history', TransactionController.getHistory);

export default router;

