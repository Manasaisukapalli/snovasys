"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
function calculateHash(entryNumber, previousHash, transactionId, accountId, entryType, amount, balanceAfter, timestamp) {
    const payload = [
        entryNumber,
        previousHash,
        transactionId,
        accountId,
        entryType,
        amount.toFixed(2),
        balanceAfter.toFixed(2),
        timestamp.toISOString()
    ].join('|');
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
async function main() {
    console.log('🌱 Seeding BalanceVault Database...');
    // Clean existing data for clean demo
    await prisma.ledgerEntry.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.systemConfig.deleteMany({});
    const passwordHash = await bcryptjs_1.default.hash('Admin@123456', 10);
    const userPasswordHash = await bcryptjs_1.default.hash('User@123456', 10);
    // 1. Create Administrator
    const admin = await prisma.user.create({
        data: {
            email: 'admin@balancevault.com',
            fullName: 'System Administrator',
            passwordHash,
            role: 'ADMIN',
            status: 'APPROVED'
        }
    });
    const adminAccount = await prisma.account.create({
        data: {
            accountNumber: 'BV-TREASURY-01',
            userId: admin.id,
            balance: 1000000.0,
            currency: 'INR',
            status: 'ACTIVE'
        }
    });
    // 2. Create Operator
    const operator = await prisma.user.create({
        data: {
            email: 'operator@balancevault.com',
            fullName: 'Chief Operations Officer',
            passwordHash,
            role: 'OPERATOR',
            status: 'APPROVED'
        }
    });
    // 3. Create Sample Account Holders
    const alice = await prisma.user.create({
        data: {
            email: 'alice@example.com',
            fullName: 'Alice Sharma',
            passwordHash: userPasswordHash,
            role: 'ACCOUNT_HOLDER',
            status: 'APPROVED'
        }
    });
    const aliceAccount = await prisma.account.create({
        data: {
            accountNumber: 'BV-ACC-10020031',
            userId: alice.id,
            balance: 50000.0,
            currency: 'INR',
            status: 'ACTIVE'
        }
    });
    const bob = await prisma.user.create({
        data: {
            email: 'bob@example.com',
            fullName: 'Bob Verma',
            passwordHash: userPasswordHash,
            role: 'ACCOUNT_HOLDER',
            status: 'APPROVED'
        }
    });
    const bobAccount = await prisma.account.create({
        data: {
            accountNumber: 'BV-ACC-10020032',
            userId: bob.id,
            balance: 25000.0,
            currency: 'INR',
            status: 'ACTIVE'
        }
    });
    // 4. Create Initial Deposit Transaction & Genesis Ledger Entries
    const depositTx = await prisma.transaction.create({
        data: {
            referenceNumber: 'BV-INIT-DEP-001',
            targetAccountId: aliceAccount.id,
            amount: 50000.0,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: 'Initial funding deposit'
        }
    });
    const t1 = new Date();
    const hash1 = calculateHash(1, GENESIS_HASH, depositTx.id, aliceAccount.id, 'CREDIT', 50000.0, 50000.0, t1);
    await prisma.ledgerEntry.create({
        data: {
            entryNumber: 1,
            transactionId: depositTx.id,
            accountId: aliceAccount.id,
            entryType: 'CREDIT',
            amount: 50000.0,
            balanceAfter: 50000.0,
            previousHash: GENESIS_HASH,
            currentHash: hash1,
            timestamp: t1
        }
    });
    // 5. Create Bob's Deposit & Entry #2
    const bobDepositTx = await prisma.transaction.create({
        data: {
            referenceNumber: 'BV-INIT-DEP-002',
            targetAccountId: bobAccount.id,
            amount: 25000.0,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: 'Initial funding deposit'
        }
    });
    const t2 = new Date(Date.now() + 1000);
    const hash2 = calculateHash(2, hash1, bobDepositTx.id, bobAccount.id, 'CREDIT', 25000.0, 25000.0, t2);
    await prisma.ledgerEntry.create({
        data: {
            entryNumber: 2,
            transactionId: bobDepositTx.id,
            accountId: bobAccount.id,
            entryType: 'CREDIT',
            amount: 25000.0,
            balanceAfter: 25000.0,
            previousHash: hash1,
            currentHash: hash2,
            timestamp: t2
        }
    });
    // 6. Record System Config
    await prisma.systemConfig.create({
        data: {
            key: 'IS_BOOTSTRAPPED',
            value: 'true'
        }
    });
    // 7. Initial Audit Log
    await prisma.auditLog.create({
        data: {
            actorId: admin.id,
            actorEmail: admin.email,
            action: 'SYSTEM_SEEDED_BOOTSTRAP',
            resource: 'SYSTEM',
            details: 'System initialized with demo accounts and cryptographic genesis ledger.',
            ipAddress: '127.0.0.1',
            status: 'SUCCESS'
        }
    });
    console.log('✅ BalanceVault Database Seeded Successfully!');
    console.log('--------------------------------------------------');
    console.log('Credentials:');
    console.log('👑 Admin:     admin@balancevault.com    | Admin@123456');
    console.log('⚙️ Operator:  operator@balancevault.com | Admin@123456');
    console.log('👤 Alice:     alice@example.com         | User@123456 (Account: BV-ACC-10020031)');
    console.log('👤 Bob:       bob@example.com           | User@123456 (Account: BV-ACC-10020032)');
    console.log('--------------------------------------------------');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
