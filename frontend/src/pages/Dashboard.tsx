import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Wallet, Send, ArrowDownLeft, ArrowUpRight, CheckCircle2, Shield, Plus, RefreshCw } from 'lucide-react';

interface DashboardProps {
  onNavigateTransfer: () => void;
  onNavigateLedgerProof: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTransfer, onNavigateLedgerProof }) => {
  const { user, account, refreshUserData } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('5000');
  const [depositLoading, setDepositLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await api.getHistory();
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    try {
      await api.deposit({
        amount: parseFloat(depositAmount),
        description: 'Self Account Deposit via BalanceVault'
      });
      await refreshUserData();
      await fetchTransactions();
      setShowDepositModal(false);
    } catch (err: any) {
      alert(err.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px' }}>
      {/* Top Banner for Onboarding KYC Status */}
      {user && user.status === 'PENDING' && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.95rem' }}>
              Onboarding Review Pending
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Your account registration is under administrator review. Once verified, all outbound money movements will be unlocked.
            </div>
          </div>
          <span className="badge badge-pending">PENDING KYC</span>
        </div>
      )}

      {/* Account Balance & Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Balance Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Vault Balance
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                ₹{account ? account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: '#38bdf8',
              padding: 10,
              borderRadius: 10
            }}>
              <Wallet size={24} />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: 14 }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ACCOUNT NUMBER</div>
              <div className="mono" style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 600 }}>
                {account?.accountNumber || 'Pending Allocation'}
              </div>
            </div>
            <span className="badge badge-approved">
              {account?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Quick Money Actions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Actions
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              Money Movement & Proof
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Execute ACID double-entry transfers and verify mathematical ledger integrity.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setShowDepositModal(true)}
              className="btn-success"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Deposit
            </button>

            {user?.role === 'ACCOUNT_HOLDER' && (
              <button
                onClick={onNavigateTransfer}
                className="btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.88rem' }}
              >
                <Send size={16} /> Transfer
              </button>
            )}

            <button
              onClick={onNavigateLedgerProof}
              className="btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.88rem' }}
            >
              <Shield size={16} color="#34d399" /> Verify Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Transaction History</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Chained ledger movements linked to this account
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} className={loadingTx ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {loadingTx ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading ledger transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions found yet. Use <strong>Deposit</strong> to fund your account and record the first entry!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Reference</th>
                  <th style={{ padding: '10px 12px' }}>Counterparty</th>
                  <th style={{ padding: '10px 12px' }}>Amount</th>
                  <th style={{ padding: '10px 12px' }}>Ledger Hash</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  const isOutgoing = tx.sourceAccount?.accountNumber === account?.accountNumber;
                  const latestEntry = tx.ledgerEntries && tx.ledgerEntries[0];

                  return (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: '1px solid #1f2937', transition: 'background-color 0.15s' }}
                    >
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          color: isDeposit ? '#34d399' : isOutgoing ? '#f87171' : '#38bdf8'
                        }}>
                          {isDeposit ? <ArrowDownLeft size={16} /> : isOutgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }} className="mono">
                        {tx.referenceNumber}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {isDeposit ? 'Direct Vault Deposit' : isOutgoing ? (tx.targetAccount?.user?.fullName || tx.targetAccount?.accountNumber) : (tx.sourceAccount?.user?.fullName || tx.sourceAccount?.accountNumber)}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: isDeposit || !isOutgoing ? '#34d399' : '#f87171' }}>
                        {isOutgoing ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {latestEntry ? (
                          <span
                            className="mono"
                            style={{
                              backgroundColor: '#1f2937',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.78rem',
                              color: '#93c5fd'
                            }}
                            title={latestEntry.currentHash}
                          >
                            #{latestEntry.entryNumber} {latestEntry.currentHash.substring(0, 10)}...
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          style={{
                            backgroundColor: '#374151',
                            color: '#e5e7eb',
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          }}
                        >
                          View Proof
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Deposit Funds into Vault
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              Add simulated funds to your account. This executes an atomic double-entry transaction and recalculates the SHA-256 cryptographic ledger chain.
            </p>

            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  step="100"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDepositModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  disabled={depositLoading}
                  style={{ flex: 1 }}
                >
                  {depositLoading ? 'Recording...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Cryptographic Receipt Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="card" style={{ maxWidth: 560, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={22} color="#34d399" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  Cryptographic Ledger Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#1f2937', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reference:</span>{' '}
                  <span className="mono" style={{ fontWeight: 600 }}>{selectedTx.referenceNumber}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>{' '}
                  <span style={{ fontWeight: 700, color: '#34d399' }}>₹{selectedTx.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
                  <span>{selectedTx.type}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{selectedTx.status}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
              Associated Cryptographic Ledger Entries:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
              {selectedTx.ledgerEntries && selectedTx.ledgerEntries.map((le: any) => (
                <div key={le.entryNumber} style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: le.entryType === 'CREDIT' ? '#34d399' : '#f87171' }}>
                      Entry #{le.entryNumber} ({le.entryType})
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>Balance After: ₹{le.balanceAfter.toFixed(2)}</span>
                  </div>
                  <div className="mono" style={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                    <strong>Prev:</strong> {le.previousHash}
                  </div>
                  <div className="mono" style={{ color: '#60a5fa', wordBreak: 'break-all', marginTop: 2 }}>
                    <strong>Hash:</strong> {le.currentHash}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                className="btn-secondary"
                onClick={() => setSelectedTx(null)}
                style={{ fontSize: '0.85rem' }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

