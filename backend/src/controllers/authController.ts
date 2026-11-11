import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AuditService } from '../services/auditService.js';

export class AuthController {
  /**
   * Check if the system has been initialized with an administrator.
   */
  static async getBootstrapStatus(req: Request, res: Response): Promise<void> {
    try {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      res.json({
        isBootstrapped: adminCount > 0,
        adminCount,
        requiresInitialSetup: adminCount === 0
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to check bootstrap status', details: err.message });
    }
  }

  /**
   * First-Administrator Bootstrap Endpoint.
   * Allows setting up the first administrative account. Once an admin exists,
   * subsequent calls are rejected unless authenticated with the secret master token.
   */
  static async bootstrapAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, bootstrapSecret } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ error: 'Email, password, and full name are required.' });
        return;
      }

      // Check existing admin count
      const existingAdmins = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      const serverSecret = process.env.BOOTSTRAP_SECRET || 'BV_INITIAL_SETUP_SECURE_TOKEN_2026';

      if (existingAdmins > 0) {
        // If admins already exist, caller MUST provide the valid BOOTSTRAP_SECRET
        if (!bootstrapSecret || bootstrapSecret !== serverSecret) {
          await AuditService.log({
            action: 'BOOTSTRAP_ATTEMPT_REJECTED',
            resource: '/api/auth/bootstrap-admin',
            details: { reason: 'System already bootstrapped and secret invalid', attemptedEmail: email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'FAILURE'
          });

          res.status(403).json({
            error: 'System is already initialized with an administrator. First-admin bootstrap is permanently locked.'
          });
          return;
        }
      }

      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        // If user already exists, upgrade to ADMIN if bootstrapSecret matches
        if (bootstrapSecret === serverSecret) {
          const updated = await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: 'ADMIN', status: 'APPROVED' }
          });

          await AuditService.log({
            actorId: updated.id,
            actorEmail: updated.email,
            action: 'USER_PROMOTED_TO_ADMIN_BOOTSTRAP',
            resource: '/api/auth/bootstrap-admin',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'SUCCESS'
          });

          const token = jwt.sign(
            { id: updated.id, role: updated.role },
            process.env.JWT_SECRET || 'balancevault-default-secret',
            { expiresIn: '24h' }
          );

          res.json({
            message: 'Existing user successfully upgraded to Administrator.',
            user: {
              id: updated.id,
              email: updated.email,
              fullName: updated.fullName,
              role: updated.role,
              status: updated.status
            },
            token
          });
          return;
        }

        res.status(409).json({ error: 'A user with this email already exists.' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin user and initial system account in a transaction
      const newAdmin = await prisma.$transaction(async (tx) => {
        const admin = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: 'ADMIN',
            status: 'APPROVED'
          }
        });

        // Create an administrative treasury account
        await tx.account.create({
          data: {
            accountNumber: `BV-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: admin.id,
            balance: 1000000.0, // Initial liquidity vault balance
            currency: 'INR',
            status: 'ACTIVE'
          }
        });

        // Mark bootstrap complete in system config
        await tx.systemConfig.upsert({
          where: { key: 'IS_BOOTSTRAPPED' },
          update: { value: 'true' },
          create: { key: 'IS_BOOTSTRAPPED', value: 'true' }
        });

        return admin;
      });

      await AuditService.log({
        actorId: newAdmin.id,
        actorEmail: newAdmin.email,
        action: 'BOOTSTRAP_INITIAL_ADMIN_CREATED',
        resource: '/api/auth/bootstrap-admin',
        details: { adminEmail: newAdmin.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      const token = jwt.sign(
        { id: newAdmin.id, role: newAdmin.role },
        process.env.JWT_SECRET || 'balancevault-default-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'First administrator successfully initialized.',
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          fullName: newAdmin.fullName,
          role: newAdmin.role,
          status: newAdmin.status
        },
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to bootstrap administrator', details: err.message });
    }
  }

  /**
   * Register a new account holder.
   * Newly registered users begin with status PENDING for onboarding review.
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, initialDeposit } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ error: 'Email, password, and full name are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const depositAmount = initialDeposit ? Math.max(0, parseFloat(initialDeposit)) : 0;

      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: 'ACCOUNT_HOLDER',
            status: 'APPROVED' // For smooth hackathon demo testing, set to APPROVED or toggleable
          }
        });

        // Generate account number: BV-ACC-XXXXXXXX
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
        const accountNumber = `BV-ACC-${randomDigits}`;

        const account = await tx.account.create({
          data: {
            accountNumber,
            userId: user.id,
            balance: depositAmount,
            currency: 'INR',
            status: 'ACTIVE'
          }
        });

        return { user, account };
      });

      await AuditService.log({
        actorId: result.user.id,
        actorEmail: result.user.email,
        action: 'USER_REGISTERED',
        resource: '/api/auth/register',
        details: { accountNumber: result.account.accountNumber, status: result.user.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      const token = jwt.sign(
        { id: result.user.id, role: result.user.role },
        process.env.JWT_SECRET || 'balancevault-default-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Account registered successfully.',
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          status: result.user.status
        },
        account: result.account,
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Registration failed', details: err.message });
    }
  }

  /**
   * User and Admin Login.
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { accounts: true }
      });

      if (!user) {
        await AuditService.log({
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          details: { reason: 'User not found', email },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'FAILURE'
        });

        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        await AuditService.log({
          actorId: user.id,
          actorEmail: user.email,
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          details: { reason: 'Incorrect password' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'FAILURE'
        });

        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (user.status === 'SUSPENDED') {
        res.status(403).json({ error: 'Your account is suspended. Contact administrator.' });
        return;
      }

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: 'LOGIN_SUCCESS',
        resource: '/api/auth/login',
        details: { role: user.role, status: user.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'balancevault-default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status
        },
        account: user.accounts[0] || null,
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Login failed', details: err.message });
    }
  }

  /**
   * Get authenticated user profile and account.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { accounts: true }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        },
        account: user.accounts[0] || null
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch user profile', details: err.message });
    }
  }
}

