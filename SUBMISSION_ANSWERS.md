# Snovasys Fresher Hiring Challenge 2026 — Project Submission Form

Use these polished, technically rigorous answers to complete or update your submission on [hackathon.snovasys.com](https://hackathon.snovasys.com/project/mine).

---

### Project Title / Pitch
**BalanceVault — money movement with a ledger you can prove**  
*A secure account management platform with role-based access, user onboarding, and auditable account operations.*

---

### Question 1: The problem
Managing financial accounts and their associated operations requires more than just storing account balances. It demands:
1. **Server-enforced access control** to prevent unauthorized money movements.
2. **Deterministic auditability**: an immutable ledger where transactions cannot be modified or forged retroactively.
3. **Structured onboarding workflows** that enforce KYC compliance before allowing financial operations.
4. **Resilience against race conditions and overdrafts** through atomic ACID database transactions.

BalanceVault solves these challenges by combining strict Role-Based Access Control (RBAC), atomic double-entry accounting, and a cryptographically chained SHA-256 ledger that can be mathematically verified on demand.

---

### Question 2: What I built
The complete BalanceVault full-stack implementation includes:
- **Core API & Business Logic**: Node.js and Express backend with modular architecture, strict input validation, security headers (Helmet), and sliding-window rate limiting.
- **Verifiable Cryptographic Ledger**: A tamper-evident ledger where every transaction creates linked debit/credit entries hashed with SHA-256 pointers back to a Genesis block. An on-demand verification endpoint calculates continuous Merkle roots and detects any unauthorized database modification.
- **Database Architecture**: PostgreSQL integration using Prisma ORM with support for ACID transactions, referential integrity, and cascading safety.
- **Server-Side RBAC & Onboarding**: Role-based routing guarding `ADMIN`, `OPERATOR`, and `ACCOUNT_HOLDER` tiers. Registration creates pending KYC profiles which require administrative approval before outbound transfers are permitted.
- **First-Administrator Bootstrap**: A secure initial setup mechanism (`/api/auth/bootstrap-admin`) that initializes the root administrator and locks the endpoint against unauthorized replay attacks.
- **Modern Responsive Frontend**: React and Vite dashboard with real-time balance tracking, one-click demo role switching, visual ledger block explorer, and audit trail inspector.
- **Health & Readiness Probes**: `/api/health` and `/api/ready` endpoints reporting live uptime, heap memory usage, and database connectivity.
- **Automated Verification Suite**: Self-written automated test suite verifying ledger tampering detection, atomic transfers, overdraft protection, and bootstrap lockout.

---

### Question 3: How to run it
```bash
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Generate the Prisma client
npm run db:generate

# 3. Apply database migrations to the configured database
npm run db:migrate

# 4. Seed demo accounts (Admin, Operator, Alice, Bob) and Genesis ledger
npm run db:seed

# 5. Start both the backend (port 5000) and frontend (port 5173) concurrently
npm run dev

# 6. Run automated tests
npm test
```

For live deployments, configure `DATABASE_URL` with your PostgreSQL instance (e.g. Neon) and set `JWT_SECRET` and `BOOTSTRAP_SECRET` in `.env`.

---

### Question 4: AI tools I used
- **ChatGPT / Gemini**: Explored cryptographic ledger hashing architectures, double-entry reconciliation mathematics, and deployment troubleshooting.
- **OpenAI Codex / Antigravity Agent**: Accelerated full-stack monorepo scaffolding, TypeScript interface definitions, Prisma schema design, and automated test suite creation.

---

### Question 5: What the AI got wrong, and what I fixed myself
During early development and deployment, AI initially made several critical assumptions that broke in execution:
1. **PostgreSQL Role Privileges vs Application RBAC**: AI suggested handling role-based permissions exclusively via PostgreSQL database roles (`SET ROLE`) and altering passwords through project connections. On managed platforms like Neon, this caused `SQLSTATE 42501 (insufficient privilege)`. I refactored the design to maintain standard least-privilege connection pooling while strictly enforcing RBAC at the application middleware layer, which is both cloud-portable and resilient.
2. **Ledger Immutability vs Database Cascade**: AI-generated schema cascades originally had `onDelete: Cascade` on ledger entries when an account was deleted, which would violate the fundamental principle of immutable financial records. I corrected the schema constraints so that ledger history is preserved indefinitely.
3. **Bootstrap Replay Vulnerability**: Early AI implementations of the admin bootstrap endpoint did not account for race conditions where multiple admins could be created simultaneously before database write propagation. I wrapped the bootstrap check in a serializable atomic transaction with a permanent lockout flag.

---

### Question 6: What is finished & verified
All core deliverables and previously pending items have been completed and verified:
- ✅ **First-Admin Bootstrap Process**: Tested and verified. Automatically detects if root setup is needed; permanently restricts subsequent bootstrap requests.
- ✅ **Admin Login & Authentication**: Verified end-to-end with secure bcrypt hashing and JWT token issuance.
- ✅ **Registration & Onboarding Workflow**: Verified end-to-end. New users register, undergo KYC review, and upon admin approval, their accounts are automatically activated.
- ✅ **Admin Management & Audit Trail**: Live interface implemented allowing user status updates, role promotions, and full event logging.
- ✅ **Ledger Integrity Proof ("A Ledger You Can Prove")**: Mathematical verification engine actively tests the SHA-256 hash chain and confirms balanced double-entry debits/credits.
- ✅ **Automated Tests**: Unit and integration tests verify ledger tampering detection, overdraft prevention, and RBAC enforcement.

