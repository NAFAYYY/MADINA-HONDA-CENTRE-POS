import React, { useState } from 'react';
import { DollarSign, X, Check } from 'lucide-react';

export default function ExpenseModal({ onClose, onExpenseAdded }) {
  const [category, setCategory] = useState('tea_refreshment');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('Counter Cashier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description) {
      setError('Please provide a valid amount and description');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount: Number(amount), description, paid_by: paidBy })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record expense');
      if (onExpenseAdded) onExpenseAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} color="var(--honda-red)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Record Daily Shop Expense</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', color: '#f43f5e', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Expense Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="tea_refreshment">Tea, Water & Staff Refreshment</option>
                <option value="electricity_utility">Electricity / Generator Fuel</option>
                <option value="tools_maintenance">Workshop Tools & Maintenance</option>
                <option value="shop_rent">Shop Rent & Security</option>
                <option value="stationery_cleaning">Stationery & Cleaning Supplies</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (PKR) *</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 350"
                className="form-input"
                style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--honda-red)' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Remarks *</label>
              <input
                type="text"
                placeholder="e.g. Daily morning tea for mechanics and customers"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Paid By</label>
              <input
                type="text"
                className="form-input"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Check size={16} /> {loading ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
