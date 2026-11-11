import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Shield, Key, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
  onNavigateBootstrap: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateRegister, onNavigateBootstrap }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login({ email, password });
      login(data.token, data.user, data.account);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            margin: '0 auto 12px',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            color: '#3b82f6',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Welcome to BalanceVault</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Sign in to access secure money movement and the verifiable ledger
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@balancevault.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Authenticating...' : <><span>Sign In</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Quick Demo Credentials Presets */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            ⚡ One-Click Demo Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => fillCredentials('admin@balancevault.com', 'Admin@123456')}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#c084fc',
                padding: '8px 10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Key size={13} /> Admin
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('operator@balancevault.com', 'Admin@123456')}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#60a5fa',
                padding: '8px 10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <UserCheck size={13} /> Operator
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('alice@example.com', 'User@123456')}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#34d399',
                padding: '8px 10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              👤 Alice (₹50k)
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('bob@example.com', 'User@123456')}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#34d399',
                padding: '8px 10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              👤 Bob (₹25k)
            </button>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span
            onClick={onNavigateRegister}
            style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
          >
            Register Now
          </span>
          <div style={{ marginTop: 8 }}>
            <span
              onClick={onNavigateBootstrap}
              style={{ color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Initial Setup: Bootstrap First Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

