import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, PiggyBank, ArrowDownRight, ArrowUpRight,
  Printer, CheckCircle2, AlertCircle, Plus, Wallet, Wrench
} from 'lucide-react';

export default function MechanicLedger() {
  const [mechanics, setMechanics] = useState([]);
  const [selectedMech, setSelectedMech] = useState(null);
  const [dailySheet, setDailySheet] = useState(null);

  // Modals
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showChargePartModal, setShowChargePartModal] = useState(false);

  // Forms
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');

  const [savingsAction, setSavingsAction] = useState('deposit');
  const [savingsAmount, setSavingsAmount] = useState('');

  const [products, setProducts] = useState([]);
  const [chargePartId, setChargePartId] = useState('');
  const [chargeQty, setChargeQty] = useState(1);

  useEffect(() => {
    fetchMechanics();
    fetchProducts();
  }, []);

  const fetchMechanics = async () => {
    try {
      const res = await fetch('/api/mechanics');
      const data = await res.json();
      setMechanics(data);
      if (data.length > 0 && !selectedMech) {
        handleSelectMechanic(data[0]);
      } else if (selectedMech) {
        const updated = data.find(m => m.id === selectedMech.id);
        if (updated) setSelectedMech(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMechanic = async (mech) => {
    setSelectedMech(mech);
    try {
      const res = await fetch(`/api/mechanics/${mech.id}/daily-sheet`);
      const sheet = await res.json();
      setDailySheet(sheet);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Peshgi Advance
  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMech || !advanceAmount) return;
    try {
      const res = await fetch(`/api/mechanics/${selectedMech.id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(advanceAmount), reason: advanceReason })
      });
      if (!res.ok) throw new Error('Failed to record advance');

      alert(`Cash Advance (Peshgi) of PKR ${advanceAmount} recorded for ${selectedMech.name}`);
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      setAdvanceReason('');
      fetchMechanics();
      handleSelectMechanic(selectedMech);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Savings Deposit/Withdrawal
  const handleSavingsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMech || !savingsAmount) return;
    try {
      const res = await fetch(`/api/mechanics/${selectedMech.id}/savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: savingsAction, amount: Number(savingsAmount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update savings');

      alert(`Savings ${savingsAction === 'deposit' ? 'deposit' : 'withdrawal'} of PKR ${savingsAmount} processed!`);
      setShowSavingsModal(false);
      setSavingsAmount('');
      fetchMechanics();
      handleSelectMechanic(selectedMech);
    } catch (err) {
      alert(err.message);
    }
  };

  // Charge Part to Personal Account
  const handleChargePartSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMech || !chargePartId) return;
    try {
      const res = await fetch(`/api/mechanics/${selectedMech.id}/charge-part`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: chargePartId, quantity: Number(chargeQty) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to charge part');

      alert(`Charged part to ${selectedMech.name}'s personal balance (PKR ${data.chargeAmount})`);
      setShowChargePartModal(false);
      setChargePartId('');
      setChargeQty(1);
      fetchMechanics();
      handleSelectMechanic(selectedMech);
    } catch (err) {
      alert(err.message);
    }
  };

  // Execute Daily Settlement
  const handleExecuteSettlement = async () => {
    if (!selectedMech || !dailySheet) return;
    const { netPayable } = dailySheet.summary;

    if (!window.confirm(`Confirm End-of-Day Settlement Payout of PKR ${netPayable} for ${selectedMech.name}? This will clear daily advances and print receipt.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/mechanics/${selectedMech.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_amount: netPayable,
          clear_advances: true,
          clear_parts: true,
          notes: 'Daily closing settlement'
        })
      });
      if (!res.ok) throw new Error('Settlement failed');

      alert(`Settlement successful! PKR ${netPayable} paid to ${selectedMech.name}.`);
      fetchMechanics();
      handleSelectMechanic(selectedMech);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--honda-red)" />
            Mechanic Commission, Peshgi & Savings Ledger
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Dynamic labor split tracking, cash advances (*peshgi*), retained savings, personal parts accounts & daily cashouts.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Mechanics List | Right Selected Daily Settlement Sheet */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem' }}>
        
        {/* Left Column: Mechanics Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mechanics.map(m => {
            const isSelected = selectedMech && selectedMech.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => handleSelectMechanic(m)}
                className="card-panel"
                style={{
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? 'var(--honda-red)' : 'var(--border-card)'}`,
                  background: isSelected ? 'rgba(225, 29, 72, 0.08)' : 'var(--bg-card)',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>{m.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.phone} | Split: {m.default_commission_rate}%</p>
                  </div>
                  <span className="card-badge badge-blue">
                    {m.active_jobs_count} Active Jobs
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.78rem', background: 'var(--bg-input)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Retained Savings</span>
                    <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>PKR {m.retained_savings}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Peshgi Advance</span>
                    <strong style={{ color: 'var(--honda-red)', fontSize: '0.9rem' }}>PKR {m.total_advances}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Parts Taken</span>
                    <strong style={{ color: 'var(--accent-amber)', fontSize: '0.9rem' }}>PKR {m.personal_parts_balance}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Mechanic Full Ledger & Daily Payout */}
        <div>
          {selectedMech && dailySheet ? (
            <div className="card-panel">
              {/* Profile Header & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {selectedMech.name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: '600' }}>
                    Standard Revenue Share: {selectedMech.default_commission_rate}% Labor
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setShowAdvanceModal(true)} className="btn btn-outline btn-sm">
                    <ArrowDownRight size={14} color="var(--honda-red)" /> Give Advance (Peshgi)
                  </button>
                  <button onClick={() => setShowSavingsModal(true)} className="btn btn-outline btn-sm">
                    <PiggyBank size={14} color="var(--accent-emerald)" /> Savings
                  </button>
                  <button onClick={() => setShowChargePartModal(true)} className="btn btn-outline btn-sm">
                    <Wrench size={14} color="var(--accent-amber)" /> Charge Part
                  </button>
                </div>
              </div>

              {/* Financial Balance Summary Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                    Retained Savings (Deposit)
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                    PKR {dailySheet.summary.retained_savings}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kept safe with shop</span>
                </div>

                <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#f43f5e', fontWeight: '700' }}>
                    Cash Advances (Peshgi)
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f43f5e' }}>
                    PKR {dailySheet.summary.total_advances}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To be deducted today</span>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: '700' }}>
                    Personal Parts On Credit
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-amber)' }}>
                    PKR {dailySheet.summary.personal_parts_balance}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Charged at trade rate</span>
                </div>
              </div>

              {/* Today's Jobs Completed */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.65rem' }}>
                Today's Repaired Motorcycles ({dailySheet.todayJobs.length} Jobs):
              </h4>

              <div className="table-wrapper" style={{ maxHeight: '180px', marginBottom: '1.25rem' }}>
                <table className="pos-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Job #</th>
                      <th>Vehicle Reg</th>
                      <th>Service Scope</th>
                      <th>Total Labor</th>
                      <th>Mechanic 50%</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySheet.todayJobs.map(j => (
                      <tr key={j.id}>
                        <td style={{ fontWeight: '700' }}>{j.job_number}</td>
                        <td>{j.reg_number} ({j.vehicle_model})</td>
                        <td>{j.work_type}</td>
                        <td>PKR {j.dynamic_labor_amount}</td>
                        <td style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}>PKR {j.mechanic_share}</td>
                        <td>
                          <span className={`card-badge ${j.status === 'paid_delivered' ? 'badge-emerald' : 'badge-amber'}`}>
                            {j.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dailySheet.todayJobs.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No jobs registered for this mechanic today yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* End of Day Settlement Sheet */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '900', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  End-of-Day Net Settlement Calculation
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Today's Total Labor Generated:</span>
                    <span>PKR {dailySheet.summary.totalLaborEarned}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                    <span>Mechanic's Share (50%):</span>
                    <span>+ PKR {dailySheet.summary.totalMechShare}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)' }}>
                    <span>+ Retained Savings with Shop:</span>
                    <span>+ PKR {dailySheet.summary.retained_savings}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e' }}>
                    <span>- Cash Advances (Peshgi):</span>
                    <span>- PKR {dailySheet.summary.total_advances}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)' }}>
                    <span>- Personal Parts Borrowed:</span>
                    <span>- PKR {dailySheet.summary.personal_parts_balance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-blue)' }}>
                    <span>Shop's Retained Labor Share:</span>
                    <span>PKR {dailySheet.summary.totalShopShare}</span>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>NET CASH PAYOUT TO MECHANIC TODAY:</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                      PKR {dailySheet.summary.netPayable}
                    </span>
                  </div>

                  <button onClick={handleExecuteSettlement} className="btn btn-primary btn-lg">
                    <Wallet size={18} /> Payout & Settle Day
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <p>Select a technician from the left list to review their ledger.</p>
            </div>
          )}
        </div>

      </div>

      {/* ================= CASH ADVANCE (PESHGI) MODAL ================= */}
      {showAdvanceModal && selectedMech && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Give Cash Advance (Peshgi)</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleAdvanceSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  Advancing cash to: <strong>{selectedMech.name}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Advance Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    placeholder="e.g. 500"
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--honda-red)' }}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Household grocery emergency"
                    className="form-input"
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SAVINGS MODAL ================= */}
      {showSavingsModal && selectedMech && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Manage Retained Savings</h3>
              <button onClick={() => setShowSavingsModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleSavingsSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  Current Savings with Shop: <strong style={{ color: 'var(--accent-emerald)' }}>PKR {selectedMech.retained_savings}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Action</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSavingsAction('deposit')}
                      className={`btn btn-sm ${savingsAction === 'deposit' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                    >
                      Deposit (Save Money)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavingsAction('withdraw')}
                      className={`btn btn-sm ${savingsAction === 'withdraw' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                    >
                      Withdraw (Cashout)
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1000"
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: '800' }}
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSavingsModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Process Savings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CHARGE PART MODAL ================= */}
      {showChargePartModal && selectedMech && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Charge Spare Part to Mechanic</h3>
              <button onClick={() => setShowChargePartModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleChargePartSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  If {selectedMech.name} takes a spare part for personal use, it is charged to their balance at trade wholesale price.
                </p>
                <div className="form-group">
                  <label className="form-label">Select Spare Part</label>
                  <select
                    className="form-select"
                    value={chargePartId}
                    onChange={(e) => setChargePartId(e.target.value)}
                    required
                  >
                    <option value="">Select Part...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.model_compat}) - Wholesale: PKR {p.wholesale_price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={chargeQty}
                    onChange={(e) => setChargeQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowChargePartModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Charge to Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
