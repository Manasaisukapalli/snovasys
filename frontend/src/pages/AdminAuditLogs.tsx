import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { History, Shield, RefreshCw, Filter, CheckCircle2, XCircle } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (actionFilter) params.action = actionFilter;
      const res = await api.getAuditLogs(params);
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, actionFilter]);

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            System Audit Trail
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Immutable event log capturing authentication, transfers, rate limits, and administrative overrides
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success Only</option>
          <option value="FAILURE">Failures & Violations</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
        >
          <option value="">All Actions</option>
          <option value="LOGIN_SUCCESS">Login Success</option>
          <option value="LOGIN_FAILED">Login Failed</option>
          <option value="TRANSFER_SUCCESS">Transfer Success</option>
          <option value="ACCESS_DENIED_RBAC">RBAC Access Denied</option>
          <option value="BOOTSTRAP_INITIAL_ADMIN_CREATED">Admin Bootstrap</option>
          <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit events...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit records match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Action Event</th>
                  <th style={{ padding: '10px 12px' }}>Actor</th>
                  <th style={{ padding: '10px 12px' }}>Resource</th>
                  <th style={{ padding: '10px 12px' }}>Details</th>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px' }}>
                        {isSuccess ? (
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={15} /> OK
                          </span>
                        ) : (
                          <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={15} /> FAIL
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px', fontWeight: 600, color: '#f3f4f6' }}>
                        {log.action}
                      </td>

                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {log.actorEmail || 'System / Anonymous'}
                      </td>

                      <td style={{ padding: '12px' }} className="mono">
                        {log.resource}
                      </td>

                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.78rem', maxWidth: 280, wordBreak: 'break-all' }}>
                        {log.details || '—'}
                      </td>

                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
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

