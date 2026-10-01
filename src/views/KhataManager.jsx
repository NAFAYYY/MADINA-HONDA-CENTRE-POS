import React, { useState, useEffect } from 'react';
import {
  CreditCard, Search, Plus, DollarSign, MessageSquare,
  FileText, Store, User, ArrowUpRight, ArrowDownLeft, X
} from 'lucide-react';

export default function KhataManager() {
  const [activeTab, setActiveTab] = useState('b2b_shops'); // 'b2b_shops' or 'customers'
  const [b2bShops, setB2bShops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [paymentParty, setPaymentParty] = useState(null); // { party_type, party_id, name, current_balance }
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Statement View Modal
  const [statementParty, setStatementParty] = useState(null);
  const [statementData, setStatementData] = useState([]);

  // Add Shop Form
  const [newShop, setNewShop] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    address: '',
    credit_limit: 50000
  });

  useEffect(() => {
    fetchB2BShops();
    fetchCustomers();
  }, []);

  const fetchB2BShops = async () => {
    try {
      const res = await fetch('/api/khata/b2b-shops');
      const data = await res.json();
      setB2bShops(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/khata/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Payment Against Balance
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentParty || !paymentAmount) return;
    try {
      const res = await fetch('/api/khata/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_type: paymentParty.party_type,
          party_id: paymentParty.party_id,
          amount: Number(paymentAmount),
          notes: paymentNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      alert(`Payment of PKR ${paymentAmount} recorded! Remaining balance: PKR ${data.balance_after}`);
      setPaymentParty(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchB2BShops();
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add New Shop
  const handleAddShopSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/khata/b2b-shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShop)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add shop');

      alert('Local motorcycle workshop added to B2B Khata directory!');
      setShowAddShopModal(false);
      setNewShop({ shop_name: '', owner_name: '', phone: '', address: '', credit_limit: 50000 });
      fetchB2BShops();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Statement
  const handleOpenStatement = async (partyType, party) => {
    setStatementParty({ ...party, party_type: partyType });
    try {
      const res = await fetch(`/api/khata/statement/${partyType}/${party.id}`);
      const data = await res.json();
      setStatementData(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 1-Click WhatsApp Balance Reminder
  const sendWhatsAppReminder = (name, phone, balance) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${name}!\n` +
      `This is a friendly account reminder from Madina Honda Centre.\n` +
      `Your current outstanding balance is: PKR ${balance}.\n` +
      `Kindly arrange payment at your earliest convenience. Thank you for your continued business!`
    );
    window.open(`https://wa.me/${intlPhone}?text=${msg}`, '_blank');
  };

  // Filter lists
  const filteredShops = b2bShops.filter(s =>
    s.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalShopCredit = b2bShops.reduce((acc, s) => acc + s.current_balance, 0);
  const totalCustomerCredit = customers.reduce((acc, c) => acc + c.current_balance, 0);

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CreditCard size={24} color="var(--honda-red)" />
            Customer & Local Shop Khata (Credit Ledger)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track outstanding balances, credit limits, recovery payments & send WhatsApp balance reminders with 1 click.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => setShowAddShopModal(true)} className="btn btn-primary">
            <Plus size={16} /> Register New Local Shop
          </button>
        </div>
      </div>

      {/* Credit Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card-panel" style={{ borderLeft: '5px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              TOTAL B2B LOCAL SHOPS OUTSTANDING UDHAAR
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
              PKR {totalShopCredit}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across {b2bShops.length} registered workshops</span>
          </div>
          <Store size={36} color="var(--accent-blue)" style={{ opacity: 0.4 }} />
        </div>

        <div className="card-panel" style={{ borderLeft: '5px solid var(--honda-red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              TOTAL RETAIL CUSTOMER OUTSTANDING UDHAAR
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--honda-red)', marginTop: '0.2rem' }}>
              PKR {totalCustomerCredit}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across {customers.length} retail accounts</span>
          </div>
          <User size={36} color="var(--honda-red)" style={{ opacity: 0.4 }} />
        </div>
      </div>

      {/* Navigation Tabs (Shops vs Customers) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'b2b_shops' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('b2b_shops')}
          >
            <Store size={15} /> 1. B2B Local Bike Shops ({b2bShops.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'customers' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('customers')}
          >
            <User size={15} /> 2. Retail Customers ({customers.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            className="form-input"
            style={{ paddingLeft: '2.2rem', padding: '0.45rem 2.2rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tab 1: Local Bike Shops Directory */}
      {activeTab === 'b2b_shops' && (
        <div className="card-panel">
          <div className="table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Shop Details</th>
                  <th>Owner / Contact</th>
                  <th>Address</th>
                  <th>Credit Limit</th>
                  <th>Current Balance (Udhaar)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map(shop => {
                  const isOverLimit = shop.current_balance >= shop.credit_limit;
                  return (
                    <tr key={shop.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>{shop.shop_name}</strong>
                      </td>
                      <td>
                        <div>{shop.owner_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{shop.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {shop.address || '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        PKR {shop.credit_limit}
                      </td>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: shop.current_balance > 0 ? 'var(--honda-red)' : 'var(--accent-emerald)' }}>
                          PKR {shop.current_balance}
                        </strong>
                      </td>
                      <td>
                        <span className={`card-badge ${isOverLimit ? 'badge-red' : shop.current_balance > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                          {isOverLimit ? 'Limit Exceeded' : shop.current_balance > 0 ? 'Balance Due' : 'Clear'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => setPaymentParty({ party_type: 'b2b_shop', party_id: shop.id, name: shop.shop_name, current_balance: shop.current_balance })}
                            className="btn btn-primary btn-sm"
                            title="Receive cash payment against balance"
                          >
                            <DollarSign size={13} /> Receive
                          </button>
                          <button
                            onClick={() => handleOpenStatement('b2b_shop', shop)}
                            className="btn btn-outline btn-sm"
                            title="View Statement Ledger"
                          >
                            <FileText size={13} /> Ledger
                          </button>
                          {shop.current_balance > 0 && (
                            <button
                              onClick={() => sendWhatsAppReminder(shop.owner_name, shop.phone, shop.current_balance)}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: '#25D366', color: '#25D366' }}
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare size={13} />
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
        </div>
      )}

      {/* Tab 2: Retail Customers Khata */}
      {activeTab === 'customers' && (
        <div className="card-panel">
          <div className="table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile Number</th>
                  <th>Address</th>
                  <th>Outstanding Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td><strong>{cust.name}</strong></td>
                    <td>{cust.phone}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cust.address || '—'}</td>
                    <td>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--honda-red)' }}>
                        PKR {cust.current_balance}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => setPaymentParty({ party_type: 'customer', party_id: cust.id, name: cust.name, current_balance: cust.current_balance })}
                          className="btn btn-primary btn-sm"
                        >
                          <DollarSign size={13} /> Receive Payment
                        </button>
                        <button
                          onClick={() => handleOpenStatement('customer', cust)}
                          className="btn btn-outline btn-sm"
                        >
                          <FileText size={13} /> Statement
                        </button>
                        <button
                          onClick={() => sendWhatsAppReminder(cust.name, cust.phone, cust.current_balance)}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: '#25D366', color: '#25D366' }}
                        >
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customer accounts with credit balance.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {paymentParty && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Receive Payment Against Khata</h3>
              <button onClick={() => setPaymentParty(null)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div>Account: <strong>{paymentParty.name}</strong></div>
                  <div style={{ marginTop: '0.3rem' }}>
                    Current Due Balance: <strong style={{ color: 'var(--honda-red)', fontSize: '1.1rem' }}>PKR {paymentParty.current_balance}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount Collected (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 5000"
                    className="form-input"
                    style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-emerald)' }}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receipt Notes / Cheque / Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. Cash collected by cashier / Raast transfer"
                    className="form-input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setPaymentParty(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Recovery Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New B2B Local Shop Modal */}
      {showAddShopModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Register New B2B Motorcycle Workshop</h3>
              <button onClick={() => setShowAddShopModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleAddShopSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Shop / Workshop Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Madni Autos & Repair"
                    className="form-input"
                    value={newShop.shop_name}
                    onChange={(e) => setNewShop({ ...newShop, shop_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Owner / Ustad Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ustad Shabbir"
                    className="form-input"
                    value={newShop.owner_name}
                    onChange={(e) => setNewShop({ ...newShop, owner_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="0300-1122334"
                    className="form-input"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Location / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Shell Pump, Main GT Road"
                    className="form-input"
                    value={newShop.address}
                    onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Approved Credit Limit (PKR)</label>
                  <input
                    type="number"
                    step="5000"
                    className="form-input"
                    value={newShop.credit_limit}
                    onChange={(e) => setNewShop({ ...newShop, credit_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddShopModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Workshop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Ledger Modal */}
      {statementParty && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
                Account Statement: {statementParty.shop_name || statementParty.name}
              </h3>
              <button onClick={() => setStatementParty(null)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div>Contact: <strong>{statementParty.phone}</strong></div>
                <div>Current Balance: <strong style={{ color: 'var(--honda-red)', fontSize: '1.1rem' }}>PKR {statementParty.current_balance}</strong></div>
              </div>

              <div className="table-wrapper" style={{ maxHeight: '350px' }}>
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Invoice / Ref</th>
                      <th>Credit Sale (Dr)</th>
                      <th>Payment Paid (Cr)</th>
                      <th>Balance After</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map(st => (
                      <tr key={st.id}>
                        <td>{new Date(st.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`card-badge ${st.type === 'sale_credit' ? 'badge-red' : 'badge-emerald'}`}>
                            {st.type === 'sale_credit' ? 'Parts on Credit' : 'Payment Received'}
                          </span>
                        </td>
                        <td>{st.invoice_number || '—'}</td>
                        <td style={{ color: 'var(--honda-red)', fontWeight: '700' }}>
                          {st.type === 'sale_credit' ? `PKR ${st.amount}` : '—'}
                        </td>
                        <td style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                          {st.type === 'payment_received' ? `PKR ${st.amount}` : '—'}
                        </td>
                        <td style={{ fontWeight: '800' }}>PKR {st.balance_after}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.notes}</td>
                      </tr>
                    ))}
                    {statementData.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No statement history records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setStatementParty(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
