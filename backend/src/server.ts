import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global sliding-window rate limiter
app.use(rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// Root health probe
app.get('/', (req, res) => {
  res.json({
    name: 'BalanceVault Core API',
    tagline: 'Money movement with a ledger you can prove',
    status: 'OPERATIONAL',
    docs: '/api/health'
  });
});

// Mount routes
app.use('/api', healthRoutes);
app.use('/health', healthRoutes);
app.use('/ready', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 BalanceVault Server running on http://localhost:${PORT}`);
    console.log(`🔒 Health Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Readiness Endpoint: http://localhost:${PORT}/api/ready`);
    console.log(`📊 Ledger Verification: http://localhost:${PORT}/api/audit/ledger/verify`);
    console.log(`======================================================\n`);
  });
}

export default app;

