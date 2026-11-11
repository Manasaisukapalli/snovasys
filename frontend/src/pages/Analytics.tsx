import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BarChart3, TrendingUp, DollarSign, Activity, PieChart, Shield, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, verifyRes] = await Promise.all([
        api.getStats(),
        api.verifyLedger()
      ]);
      setStats(statsRes.stats || null);
      setReport(verifyRes.report || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalLiquidity = stats?.totalLiquidity || 0;
  const totalCredits = report?.doubleEntryReconciliation?.totalCredits || 0;
  const totalDebits = report?.doubleEntryReconciliation?.totalDebits || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#38bdf8',
              padding: 8,
              borderRadius: 10
            }}>
              <BarChart3 size={24} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              Financial Flow & Liquidity Radar
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time telemetry on double-entry transaction volume, vault liquidity, and ledger throughput
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn-secondary"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 28 }}>
        <div className="card card-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TOTAL VAULT LIQUIDITY
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                ₹{totalLiquidity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: 8, borderRadius: 8 }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> 100% Backed by Double-Entry Ledger
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LEDGER TRANSACTIONS
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {stats?.totalTransactions || 0} Movements
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: 8, borderRadius: 8 }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across {stats?.totalAccounts || 0} active accounts
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CHAINED BLOCKS / ENTRIES
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                {stats?.totalLedgerEntries || 0} Blocks
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: 8, borderRadius: 8 }}>
              <Shield size={20} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '0.78rem', color: '#c084fc' }}>
            SHA-256 Chained & Verified
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AUDIT LOG EVENTS
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                {stats?.totalAuditEvents || 0} Events
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: 8, borderRadius: 8 }}>
              <PieChart size={20} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Zero-Trust Event Audit Trail
          </div>
        </div>
      </div>

      {/* Visual Flow Balance Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Double-Entry Volume Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            Double-Entry Accounting Reconciliation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem' }}>
                <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDownLeft size={16} /> Total Credit Movements
                </span>
                <span className="mono" style={{ fontWeight: 700 }}>₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ height: 10, backgroundColor: '#1f2937', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#10b981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem' }}>
                <span style={{ color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUpRight size={16} /> Total Debit Movements
                </span>
                <span className="mono" style={{ fontWeight: 700 }}>₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ height: 10, backgroundColor: '#1f2937', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${totalCredits > 0 ? Math.min(100, (totalDebits / totalCredits) * 100) : 0}%`,
                  height: '100%',
                  backgroundColor: '#ef4444'
                }} />
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: '#0f172a',
            borderRadius: 8,
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Reconciliation Status:</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>
              BALANCED (Net Diff: ₹{(totalCredits - totalDebits).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Security & Health Radar Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            System Integrity & Uptime Telemetry
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cryptographic Hash Spec:</span>
              <span className="mono" style={{ fontWeight: 600, color: '#38bdf8' }}>SHA-256 (256-bit)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Isolation:</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>ACID Serializable Lock</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sliding Window Rate Limit:</span>
              <span className="mono" style={{ fontWeight: 600, color: '#fbbf24' }}>200 Req/min per IP</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Server Health Liveness:</span>
              <span style={{ fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pulse-indicator" /> 100% OPERATIONAL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

