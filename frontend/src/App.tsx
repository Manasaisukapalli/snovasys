import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { AdminBootstrap } from './pages/AdminBootstrap.js';
import { Dashboard } from './pages/Dashboard.js';
import { TransferPage } from './pages/TransferModal.js';
import { LedgerProof } from './pages/LedgerProof.js';
import { AdminUsers } from './pages/AdminUsers.js';
import { AdminAuditLogs } from './pages/AdminAuditLogs.js';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Initializing BalanceVault...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main style={{ flex: 1 }}>
        {!user ? (
          <>
            {currentTab === 'register' && (
              <Register
                onSuccess={() => setCurrentTab('dashboard')}
                onNavigateLogin={() => setCurrentTab('login')}
              />
            )}
            {currentTab === 'bootstrap' && (
              <AdminBootstrap
                onSuccess={() => setCurrentTab('dashboard')}
                onNavigateLogin={() => setCurrentTab('login')}
              />
            )}
            {(currentTab === 'login' || (currentTab !== 'register' && currentTab !== 'bootstrap')) && (
              <Login
                onSuccess={() => setCurrentTab('dashboard')}
                onNavigateRegister={() => setCurrentTab('register')}
                onNavigateBootstrap={() => setCurrentTab('bootstrap')}
              />
            )}
          </>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                onNavigateTransfer={() => setCurrentTab('transfer')}
                onNavigateLedgerProof={() => setCurrentTab('ledger-proof')}
              />
            )}

            {currentTab === 'transfer' && (
              <TransferPage
                onSuccess={() => setCurrentTab('dashboard')}
                onCancel={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'ledger-proof' && (
              <LedgerProof />
            )}

            {currentTab === 'admin-users' && (
              <AdminUsers />
            )}

            {currentTab === 'audit-logs' && (
              <AdminAuditLogs />
            )}
          </>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        backgroundColor: 'rgba(17, 24, 39, 0.5)'
      }}>
        BalanceVault © 2026 — Snovasys Fresher Hiring Challenge 2026 Submission. Built with Node.js, Express, Prisma, and React.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

