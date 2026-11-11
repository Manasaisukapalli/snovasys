import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Users, UserCheck, UserX, Shield, RefreshCw, Check, AlertTriangle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers(),
        api.getStats()
      ]);
      setUsers(usersRes.users || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setActionLoading(userId);
    try {
      await api.updateUserStatus(userId, newStatus);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.updateUserRole(userId, newRole);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Role update failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            User Management & KYC Onboarding
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Approve onboarding applications, govern roles, and inspect vault accounts
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Users
        </button>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL USERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{stats.totalUsers}</div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE ACCOUNTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>{stats.totalAccounts}</div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LEDGER ENTRIES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>{stats.totalLedgerEntries}</div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SYSTEM LIQUIDITY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
              ₹{stats.totalLiquidity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading users...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>User Details</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Account Number</th>
                  <th style={{ padding: '10px 12px' }}>Balance</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const primaryAccount = u.accounts && u.accounts[0];

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{u.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${
                          u.role === 'ADMIN' ? 'badge-admin' : u.role === 'OPERATOR' ? 'badge-operator' : 'badge-user'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '12px' }} className="mono">
                        {primaryAccount?.accountNumber || '—'}
                      </td>

                      <td style={{ padding: '12px', fontWeight: 700, color: '#f3f4f6' }}>
                        ₹{primaryAccount ? primaryAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${
                          u.status === 'APPROVED' ? 'badge-approved' : u.status === 'PENDING' ? 'badge-pending' : 'badge-user'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {u.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                disabled={actionLoading === u.id}
                                style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34d399',
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'REJECTED')}
                                disabled={actionLoading === u.id}
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <UserX size={14} /> Reject
                              </button>
                            </>
                          )}

                          {u.role === 'ACCOUNT_HOLDER' && (
                            <button
                              onClick={() => handleUpdateRole(u.id, 'OPERATOR')}
                              disabled={actionLoading === u.id}
                              style={{
                                backgroundColor: '#374151',
                                color: '#60a5fa',
                                padding: '5px 8px',
                                fontSize: '0.75rem'
                              }}
                              title="Promote to Operator"
                            >
                              Make Operator
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

