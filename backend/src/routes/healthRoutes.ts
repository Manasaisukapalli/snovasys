import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = Router();

router.get('/health', HealthController.getHealth);
router.get('/ready', HealthController.getReadiness);

export default router;

