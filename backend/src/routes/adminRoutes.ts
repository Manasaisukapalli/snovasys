import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Restricted to ADMIN and OPERATOR
router.use(authenticate);
router.use(requireRole('ADMIN', 'OPERATOR'));

router.get('/stats', AdminController.getSystemStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:userId/status', AdminController.updateUserStatus);
router.patch('/users/:userId/role', requireRole('ADMIN'), AdminController.updateUserRole);

export default router;

