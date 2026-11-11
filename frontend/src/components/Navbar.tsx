import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Database, Users, History, Send, LogOut, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#fff' }}>
              Balance<span style={{ color: '#3b82f6' }}>Vault</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Provable Ledger Platform
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentTab('dashboard')}
              style={{
                backgroundColor: currentTab === 'dashboard' ? 'var(--primary)' : 'transparent',
                color: currentTab === 'dashboard' ? '#fff' : 'var(--text-muted)',
                padding: '8px 14px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Database size={16} /> Overview
            </button>

            {user.role === 'ACCOUNT_HOLDER' && (
              <button
                onClick={() => setCurrentTab('transfer')}
                style={{
                  backgroundColor: currentTab === 'transfer' ? 'var(--primary)' : 'transparent',
                  color: currentTab === 'transfer' ? '#fff' : 'var(--text-muted)',
                  padding: '8px 14px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Send size={16} /> Transfer Money
              </button>
            )}

            <button
              onClick={() => setCurrentTab('ledger-proof')}
              style={{
                backgroundColor: currentTab === 'ledger-proof' ? 'var(--primary)' : 'transparent',
                color: currentTab === 'ledger-proof' ? '#fff' : 'var(--text-muted)',
                padding: '8px 14px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle2 size={16} color="#34d399" /> Ledger Proof
            </button>

            {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
              <>
                <button
                  onClick={() => setCurrentTab('admin-users')}
                  style={{
                    backgroundColor: currentTab === 'admin-users' ? 'var(--primary)' : 'transparent',
                    color: currentTab === 'admin-users' ? '#fff' : 'var(--text-muted)',
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Users size={16} /> User Management
                </button>

                <button
                  onClick={() => setCurrentTab('audit-logs')}
                  style={{
                    backgroundColor: currentTab === 'audit-logs' ? 'var(--primary)' : 'transparent',
                    color: currentTab === 'audit-logs' ? '#fff' : 'var(--text-muted)',
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <History size={16} /> Audit Trail
                </button>
              </>
            )}
          </nav>
        )}

        {/* User Info & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f3f4f6' }}>
                {user.fullName}
              </div>
              <span className={`badge ${
                user.role === 'ADMIN' ? 'badge-admin' : user.role === 'OPERATOR' ? 'badge-operator' : 'badge-user'
              }`}>
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid var(--border)',
                color: '#f87171',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.82rem'
              }}
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCurrentTab('login')}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentTab('register')}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

