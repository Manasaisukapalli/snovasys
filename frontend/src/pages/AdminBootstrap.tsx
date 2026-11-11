import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ShieldAlert, CheckCircle, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

interface BootstrapProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const AdminBootstrap: React.FC<BootstrapProps> = ({ onSuccess, onNavigateLogin }) => {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('Primary Administrator');
  const [email, setEmail] = useState('admin@balancevault.com');
  const [password, setPassword] = useState('Admin@123456');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [statusInfo, setStatusInfo] = useState<{ isBootstrapped: boolean; adminCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const res = await api.getBootstrapStatus();
      setStatusInfo(res);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.bootstrapAdmin({
        fullName,
        email,
        password,
        bootstrapSecret: bootstrapSecret || undefined
      });

      setSuccessMsg('Administrator successfully initialized!');
      login(res.token, res.user);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Bootstrap failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '50px auto', padding: '0 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52,
            height: 52,
            margin: '0 auto 12px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>First-Admin Bootstrap</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Initialize system root credentials and verify administrative access
          </p>
        </div>

        {/* Live System Status Pill */}
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bootstrap Security Status</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: statusInfo?.isBootstrapped ? '#fbbf24' : '#34d399' }}>
              {checking ? 'Checking status...' : statusInfo?.isBootstrapped ? `🔒 Initialized (${statusInfo.adminCount} Admin)` : '🔓 Awaiting First Administrator'}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', padding: 6 }}
            title="Refresh status"
          >
            <RefreshCw size={16} className={checking ? 'spin' : ''} />
          </button>
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

        {successMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleBootstrap} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
              Administrator Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
              Administrator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              style={{ width: '100%' }}
            />
          </div>

          {statusInfo?.isBootstrapped && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#fbbf24', marginBottom: 6 }}>
                Master Bootstrap Token (Required once initialized)
              </label>
              <input
                type="password"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
                placeholder="Default: BV_INITIAL_SETUP_SECURE_TOKEN_2026"
                style={{ width: '100%', borderColor: '#fbbf24' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                An administrator already exists. Further bootstrap calls require the operator secret token configured in .env.
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Bootstrapping Admin...' : <><span>Initialize Administrator</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          <span
            onClick={onNavigateLogin}
            style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
          >
            ← Return to Standard Login
          </span>
        </div>
      </div>
    </div>
  );
};

