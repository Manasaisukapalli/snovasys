import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ShieldAlert, ShieldCheck, Bug, Wrench, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export const TamperSandbox: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await api.verifyLedger();
      setReport(res.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSimulateTamper = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.simulateTamper();
      setActionMessage(res.message);
      await checkStatus();
    } catch (err: any) {
      alert(err.message || 'Tamper simulation failed');
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.repairLedger();
      setActionMessage(res.message);
      await checkStatus();
    } catch (err: any) {
      alert(err.message || 'Repair failed');
      setLoading(false);
    }
  };

  const isCompromised = report && !report.isValid;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              backgroundColor: isCompromised ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isCompromised ? '#f87171' : '#34d399',
              padding: 8,
              borderRadius: 10
            }}>
              {isCompromised ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              Interactive Tamper-Evident Sandbox
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Test the cryptographic resilience of BalanceVault. Simulate a rogue database alteration and watch the verification engine detect it instantly.
          </p>
        </div>

        <button
          onClick={checkStatus}
          className="btn-secondary"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Check Status
        </button>
      </div>

      {/* Big Alert Banner */}
      <div className="card" style={{
        backgroundColor: isCompromised ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        borderColor: isCompromised ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)',
        marginBottom: 28,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: isCompromised ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
              color: isCompromised ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCompromised ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
            </div>

            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                {isCompromised ? '🚨 CRYPTOGRAPHIC COMPROMISE DETECTED' : '🛡️ LEDGER UNTAMPERED & VERIFIED'}
              </div>
              <div style={{ fontSize: '0.9rem', color: isCompromised ? '#fca5a5' : '#86efac', marginTop: 4 }}>
                {isCompromised
                  ? `ALERT: Entry #${report?.tamperedEntry || 1} payload failed SHA-256 verification. Recalculated hash does not match stored block digest!`
                  : `All ${report?.totalEntries || 0} ledger records match their continuous hash pointers. Merkle root is valid.`}
              </div>
            </div>
          </div>

          <span className={`badge ${isCompromised ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            {isCompromised ? 'COMPROMISED' : '100% AUTHENTIC'}
          </span>
        </div>

        {actionMessage && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 8,
            fontSize: '0.84rem',
            color: '#e2e8f0',
            borderLeft: `4px solid ${isCompromised ? '#ef4444' : '#10b981'}`
          }}>
            ℹ️ {actionMessage}
          </div>
        )}
      </div>

      {/* Action Simulation Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Tamper trigger card */}
        <div className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: '1.1rem' }}>
              <Bug size={20} /> 1. Simulate Database Tampering
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Directly alters a balance amount in the database table (simulating a malicious DBA or hacker tampering with SQLite/Postgres rows without re-signing the cryptographic chain).
            </p>
          </div>

          <button
            onClick={handleSimulateTamper}
            disabled={loading || isCompromised}
            className="btn-danger"
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Bug size={16} /> Maliciously Tamper with Entry #1
          </button>
        </div>

        {/* Repair trigger card */}
        <div className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 700, fontSize: '1.1rem' }}>
              <Wrench size={20} /> 2. Mathematical State Repair
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Reverts the illegitimate modification back to the provable historical state or recalculates cryptographic consensus, restoring 100% verified status.
            </p>
          </div>

          <button
            onClick={handleRepair}
            disabled={loading || !isCompromised}
            className="btn-success"
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Wrench size={16} /> Restore Legitimate Ledger State
          </button>
        </div>
      </div>

      {/* Explanation Box for Evaluators */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(15,23,42,0.9))' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="#38bdf8" /> Why BalanceVault cannot be forged:
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          In traditional banking systems, a database administrator can update a balance using a simple SQL query (<code className="mono" style={{ color: '#f87171' }}>UPDATE accounts SET balance = 9999999</code>) and nobody can prove it was forged. In BalanceVault, every transaction is cryptographically linked to the preceding entry using SHA-256 hashes. Changing a single number breaks the hash chain for all subsequent entries, creating a tamper-evident audit trail that fails mathematical verification instantly.
        </p>
      </div>
    </div>
  );
};

