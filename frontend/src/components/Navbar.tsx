import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Database, Users, History, Send, LogOut, CheckCircle2, BarChart2, Bug, Lock } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const navItem = (id: string, label: string, icon: React.ReactNode) => {
    const isActive = currentTab === id;
    return (
      <button
        onClick={() => setCurrentTab(id)}
        style={{
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
          color: isActive ? '#60a5fa' : 'var(--text-muted)',
          borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
          borderRadius: 0,
          padding: '10px 12px',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.2s ease'
        }}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'rgba(7, 10, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>
              Balance<span style={{ color: '#38bdf8' }}>Vault</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-indicator" />
              <span>Verifiable Ledger</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {navItem('dashboard', 'Overview', <Database size={15} />)}

            {user.role === 'ACCOUNT_HOLDER' && (
              navItem('transfer', 'Transfer', <Send size={15} />)
            )}

            {navItem('ledger-proof', 'Ledger Proof', <CheckCircle2 size={15} color="#34d399" />)}
            {navItem('tamper-sandbox', 'Tamper Sandbox', <Bug size={15} color="#f87171" />)}
            {navItem('analytics', 'Analytics', <BarChart2 size={15} color="#38bdf8" />)}
            {navItem('security-arch', 'Security & RBAC', <Lock size={15} color="#c084fc" />)}

            {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
              <>
                {navItem('admin-users', 'Users', <Users size={15} />)}
                {navItem('audit-logs', 'Audit Trail', <History size={15} />)}
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
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8rem',
                borderRadius: 8
              }}
              title="Logout"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCurrentTab('login')}
              className="btn-secondary"
              style={{ fontSize: '0.84rem', padding: '7px 16px' }}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentTab('register')}
              className="btn-primary"
              style={{ fontSize: '0.84rem', padding: '7px 16px' }}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
