import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Send, ArrowRight, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface TransferPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransferPage: React.FC<TransferPageProps> = ({ onSuccess, onCancel }) => {
  const { account, refreshUserData } = useAuth();
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('2500');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = parseFloat(amount);
    if (!account || account.balance < parsed) {
      setError(`Insufficient vault balance! Available: ₹${account?.balance.toFixed(2) || '0.00'}`);
      setLoading(false);
      return;
    }

    try {
      const res = await api.transfer({
        recipientAccountNumber: recipientAccount.trim(),
        amount: parsed,
        description: description || 'Account Transfer'
      });

      await refreshUserData();
      setReceipt(res);
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            color: '#3b82f6',
            padding: 10,
            borderRadius: 10
          }}>
            <Send size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>Move Funds</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              ACID double-entry ledger transfer with cryptographic proof
            </p>
          </div>
        </div>

        {/* Sender Vault Balance info */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>SOURCE VAULT ACCOUNT</div>
            <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{account?.accountNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>AVAILABLE BALANCE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
              ₹{account ? account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
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

        {receipt ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 50,
              height: 50,
              margin: '0 auto 12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Transfer Complete!</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Funds successfully transferred to <strong>{receipt.recipientName}</strong>
            </p>

            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 14,
              marginTop: 16,
              textAlign: 'left',
              fontSize: '0.8rem'
            }}>
              <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} /> Cryptographic Proof Hashes
              </div>
              <div className="mono" style={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                <strong>DEBIT #{receipt.ledgerProof.debitEntryNumber}:</strong> {receipt.ledgerProof.debitHash}
              </div>
              <div className="mono" style={{ color: '#34d399', wordBreak: 'break-all', marginTop: 6 }}>
                <strong>CREDIT #{receipt.ledgerProof.creditEntryNumber}:</strong> {receipt.ledgerProof.creditHash}
              </div>
            </div>

            <button
              onClick={onSuccess}
              className="btn-primary"
              style={{ marginTop: 20, width: '100%', padding: '10px 0' }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                Recipient Account Number
              </label>
              <input
                type="text"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
                placeholder="e.g. BV-ACC-10020032"
                required
                className="mono"
                style={{ width: '100%' }}
              />
              {/* Quick shortcut presets */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Quick Paste:</span>
                <span
                  onClick={() => setRecipientAccount('BV-ACC-10020031')}
                  style={{ fontSize: '0.74rem', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Alice (BV-ACC-10020031)
                </span>
                <span
                  onClick={() => setRecipientAccount('BV-ACC-10020032')}
                  style={{ fontSize: '0.74rem', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Bob (BV-ACC-10020032)
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                Transfer Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="100"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                Payment Purpose / Note
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Project fee settlement"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? 'Processing...' : <><span>Send Funds</span> <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

