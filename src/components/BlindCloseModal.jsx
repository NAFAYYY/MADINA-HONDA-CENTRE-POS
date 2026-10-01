import React, { useState } from 'react';
import { Lock, AlertTriangle, CheckCircle2, DollarSign, X } from 'lucide-react';

export default function BlindCloseModal({ currentShift, onClose, onShiftClosed }) {
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!countedCash || isNaN(countedCash)) {
      setError('Please enter the exact physical cash counted in drawer');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shifts/blind-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counted_cash: Number(countedCash), notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close shift');
      setResult(data.closing_summary);
      if (onShiftClosed) onShiftClosed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>End-of-Shift Blind Cash Closing</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {!result ? (
            <form onSubmit={handleSubmit}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                <strong>Security Protocol:</strong> Count all cash in drawer physically and enter the exact amount below. The system will audit and compare against sales automatically.
              </div>

              {error && (
                <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', color: '#f43f5e', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Physical Cash Counted in Drawer (PKR) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    autoFocus
                    placeholder="e.g. 35200"
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: '800', paddingLeft: '2.5rem', color: 'var(--accent-emerald)' }}
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    required
                  />
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Rs
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Closing Notes / Shift Handover Remarks (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Notes for the next cashier or owner..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Lock size={18} /> {loading ? 'Auditing & Closing...' : 'Submit Count & Close Shift'}
              </button>
            </form>
          ) : (
            <div>
              {/* Closing Audit Results */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={42} color="var(--accent-emerald)" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Shift Successfully Reconciled & Closed</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detailed drawer audit report</p>
              </div>

              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Shift Opening Cash:</span>
                  <span style={{ fontWeight: '700' }}>PKR {result.opening_cash}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>+ Today's Cash Sales:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>PKR {result.total_cash_sales}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>+ Khata Recoveries Collected:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>PKR {result.total_khata_collected}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>- Shop Expenses Paid:</span>
                  <span style={{ fontWeight: '700', color: 'var(--honda-red)' }}>PKR {result.total_expenses_paid}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                  <span>System Expected Cash:</span>
                  <span>PKR {result.expected_cash}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: 'var(--accent-blue)' }}>
                  <span>Cashier Counted Cash:</span>
                  <span>PKR {result.counted_cash}</span>
                </div>

                <div style={{
                  borderTop: '2px solid var(--border-subtle)',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '900',
                  fontSize: '1rem',
                  color: result.variance === 0 ? 'var(--accent-emerald)' : result.variance > 0 ? 'var(--accent-blue)' : 'var(--honda-red)'
                }}>
                  <span>RECONCILIATION RESULT:</span>
                  <span>{result.status}</span>
                </div>
              </div>

              <button onClick={onClose} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                Done & Return to Main Screen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
