import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ShieldCheck, ShieldAlert, CheckCircle2, RefreshCw, Hash, Link2, Scale } from 'lucide-react';

export const LedgerProof: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyLedger();
      setReport(res.report);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const fetchEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await api.getLedgerEntries(50);
      setEntries(res.entries || []);
    } catch (err) {
      console.error('Fetch entries error:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    runVerification();
    fetchEntries();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            A Ledger You Can Prove
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Cryptographically chained SHA-256 ledger with mathematical zero-trust proof
          </p>
        </div>

        <button
          onClick={() => { runVerification(); fetchEntries(); }}
          className="btn-primary"
          disabled={verifying}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}
        >
          <RefreshCw size={16} className={verifying ? 'spin' : ''} />
          {verifying ? 'Computing Proof...' : 'Re-verify Ledger Integrity'}
        </button>
      </div>

      {/* Verification Status Banner */}
      {report && (
        <div className="card" style={{
          backgroundColor: report.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: report.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)',
          marginBottom: 28
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                backgroundColor: report.isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: report.isValid ? '#34d399' : '#f87171',
                padding: 12,
                borderRadius: 12
              }}>
                {report.isValid ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  {report.isValid ? 'Ledger Integrity Status: 100% Mathematically Verified' : 'TAMPERING DETECTED IN LEDGER CHAIN!'}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {report.isValid
                    ? `Every single one of the ${report.totalEntries} entries matches its cryptographic hash, sequential pointer, and double-entry balance.`
                    : report.error}
                </div>
              </div>
            </div>

            <span className={`badge ${report.isValid ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              {report.isValid ? 'UNTAMPERED' : 'COMPROMISED'}
            </span>
          </div>

          {/* Cryptographic Digests Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL ENTRIES CHAINED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {report.totalEntries} Records
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DOUBLE-ENTRY RECONCILIATION</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#34d399', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={16} /> Balanced (Diff: ₹{report.doubleEntryReconciliation.netDifference.toFixed(2)})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MERKLE ROOT DIGEST</div>
              <div className="mono" style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: 4, wordBreak: 'break-all' }}>
                {report.merkleRoot}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LAST VERIFIED TIMESTAMP</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {new Date(report.verifiedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Ledger Chain Explorer */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Hash size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            Cryptographic Block & Entry Explorer
          </h3>
        </div>

        {loadingEntries ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading ledger chain entries...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Ledger is currently empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: 16,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono" style={{
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}>
                      ENTRY #{entry.entryNumber}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: entry.entryType === 'CREDIT' ? '#34d399' : '#f87171'
                    }}>
                      {entry.entryType} ₹{entry.amount.toFixed(2)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ({entry.account?.user?.fullName || entry.account?.accountNumber})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Balance After: <strong style={{ color: '#fff' }}>₹{entry.balanceAfter.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Hashes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link2 size={13} color="#64748b" />
                    <span style={{ color: '#64748b', minWidth: 100 }}>Previous Hash:</span>
                    <span className="mono" style={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                      {entry.previousHash}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} color="#34d399" />
                    <span style={{ color: '#64748b', minWidth: 100 }}>Entry Hash:</span>
                    <span className="mono" style={{ color: '#60a5fa', fontWeight: 600, wordBreak: 'break-all' }}>
                      {entry.currentHash}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

