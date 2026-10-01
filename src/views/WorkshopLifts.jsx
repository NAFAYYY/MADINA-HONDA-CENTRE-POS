import React, { useState, useEffect } from 'react';
import {
  Wrench, Plus, CheckCircle2, Clock, ShieldCheck, AlertCircle,
  Fuel, MessageSquare, Trash2, Edit3, User, CheckSquare
} from 'lucide-react';

export default function WorkshopLifts() {
  const [lifts, setLifts] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [targetLiftId, setTargetLiftId] = useState(null);
  const [activeJobDetails, setActiveJobDetails] = useState(null);

  // Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    vehicle_model: 'Honda CD70',
    reg_number: '',
    chassis_number: '',
    engine_number: '',
    odometer: '',
    lift_id: '',
    mechanic_id: '',
    work_type: 'General Tuning & Oil Change',
    complaints: '',
    fuel_level: 'Half',
    inspection_notes: 'Mirrors & toolkit intact. No body dents.',
    old_parts_returned: 1,
    dynamic_labor_amount: 400,
    is_rework: false
  });

  // Active Job Parts Form
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [dynamicLabor, setDynamicLabor] = useState(0);

  useEffect(() => {
    fetchLifts();
    fetchMechanics();
    fetchProducts();
  }, []);

  const fetchLifts = async () => {
    try {
      const res = await fetch('/api/workshop/lifts');
      const data = await res.json();
      setLifts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMechanics = async () => {
    try {
      const res = await fetch('/api/mechanics');
      const data = await res.json();
      setMechanics(data);
      if (data.length > 0 && !intakeForm.mechanic_id) {
        setIntakeForm(prev => ({ ...prev, mechanic_id: data[0].id }));
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

  // Open Intake Modal for specific Lift
  const handleOpenIntake = (liftId = null) => {
    setTargetLiftId(liftId);
    setIntakeForm(prev => ({
      ...prev,
      lift_id: liftId || (lifts[0] ? lifts[0].id : ''),
      reg_number: '',
      chassis_number: '',
      customer_name: '',
      customer_phone: '',
      complaints: ''
    }));
    setShowIntakeModal(true);
  };

  // Open Manage Active Job Details
  const handleManageJob = async (jobId) => {
    try {
      const res = await fetch(`/api/workshop/jobs/${jobId}`);
      const job = await res.json();
      setActiveJobDetails(job);
      setDynamicLabor(job.dynamic_labor_amount);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Intake Form
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeForm.customer_name || !intakeForm.customer_phone || !intakeForm.reg_number) {
      alert('Please fill customer name, mobile number and registration number');
      return;
    }

    try {
      const res = await fetch('/api/workshop/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Job Card');

      alert(`Job Card Created Successfully! Job #: ${data.job_number} | Gate Pass: ${data.gate_pass_code}`);
      setShowIntakeModal(false);
      fetchLifts();
    } catch (err) {
      alert('Error creating intake: ' + err.message);
    }
  };

  // Add Part to Active Job Card
  const handleAddPartToJob = async () => {
    if (!selectedPartId || !activeJobDetails) return;
    try {
      const res = await fetch(`/api/workshop/jobs/${activeJobDetails.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedPartId, quantity: Number(partQty) || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add part');

      handleManageJob(activeJobDetails.id);
      fetchProducts(); // Refresh stock
      setSelectedPartId('');
      setPartQty(1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Remove Part from Active Job
  const handleRemovePartFromJob = async (partItemId) => {
    if (!activeJobDetails) return;
    try {
      const res = await fetch(`/api/workshop/jobs/${activeJobDetails.id}/parts/${partItemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove part');

      handleManageJob(activeJobDetails.id);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Dynamic Labor
  const handleUpdateLabor = async () => {
    if (!activeJobDetails) return;
    try {
      const res = await fetch(`/api/workshop/jobs/${activeJobDetails.id}/labor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamic_labor_amount: Number(dynamicLabor) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update labor');

      handleManageJob(activeJobDetails.id);
      fetchLifts();
      alert(`Labor adjusted to PKR ${data.dynamic_labor_amount} (Mechanic 50%: PKR ${data.mechanic_share} | Shop 50%: PKR ${data.shop_share})`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Mark Job as Ready for Delivery
  const handleMarkReady = async () => {
    if (!activeJobDetails) return;
    try {
      const res = await fetch(`/api/workshop/jobs/${activeJobDetails.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      alert('Job marked READY FOR PICKUP! Lift is now free, and invoice is available at Counter POS.');
      setActiveJobDetails(null);
      fetchLifts();
    } catch (err) {
      alert(err.message);
    }
  };

  // 1-Click WhatsApp Messages
  const sendWhatsAppIntake = () => {
    if (!activeJobDetails) return;
    const phone = activeJobDetails.customer_phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${activeJobDetails.customer_name}!\n` +
      `Your ${activeJobDetails.vehicle_model} (Reg: ${activeJobDetails.reg_number}) has been received at Madina Honda Centre.\n` +
      `Job Card #: ${activeJobDetails.job_number}\n` +
      `Assigned Mechanic: ${activeJobDetails.mechanic_name || 'Floor Master'}\n` +
      `Gate Pass Code: ${activeJobDetails.gate_pass_code}\n` +
      `We will notify you once your bike is inspected and ready!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const sendWhatsAppReady = () => {
    if (!activeJobDetails) return;
    const phone = activeJobDetails.customer_phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${activeJobDetails.customer_name}!\n` +
      `Good news! Your motorcycle (${activeJobDetails.vehicle_model} - ${activeJobDetails.reg_number}) is READY for collection!\n` +
      `Total Bill: PKR ${activeJobDetails.grand_total} (Parts + Labor)\n` +
      `Job Card #: ${activeJobDetails.job_number}\n` +
      `Please collect from Madina Honda Centre counter and receive your Gate Pass.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wrench size={24} color="var(--honda-red)" />
            Workshop Lift Bays & Job Cards
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time physical lift status, vehicle intake, dispute-prevention checklists, and dynamic labor splits.
          </p>
        </div>

        <button onClick={() => handleOpenIntake()} className="btn btn-primary btn-lg">
          <Plus size={18} /> New Bike Intake & Job Card
        </button>
      </div>

      {/* Visual Lift Bays Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {lifts.map(lift => {
          const isOccupied = lift.status === 'occupied' && lift.current_job_id;
          return (
            <div
              key={lift.id}
              className="card-panel"
              style={{
                borderLeft: `5px solid ${isOccupied ? 'var(--honda-red)' : 'var(--accent-emerald)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px'
              }}
            >
              {/* Lift Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{lift.name}</span>
                  <span className={`card-badge ${isOccupied ? 'badge-red' : 'badge-emerald'}`}>
                    {isOccupied ? 'In Service' : 'Lift Available'}
                  </span>
                </div>

                {isOccupied ? (
                  /* Active Vehicle on Lift */
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {lift.reg_number}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {lift.vehicle_model} {lift.chassis_number ? `| Chassis: ${lift.chassis_number}` : ''}
                    </div>

                    <div style={{ background: 'var(--bg-input)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                      <div>Customer: <strong>{lift.customer_name}</strong> ({lift.customer_phone})</div>
                      <div>Mechanic: <strong style={{ color: 'var(--accent-blue)' }}>{lift.mechanic_name || 'Unassigned'}</strong></div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        Work: {lift.work_type}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Idle / Available Lift */
                  <div style={{ textAlign: 'center', padding: '1.75rem 0', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Bay is Empty & Ready</p>
                    <p style={{ fontSize: '0.78rem' }}>Assign next incoming motorcycle</p>
                  </div>
                )}
              </div>

              {/* Lift Action Footer */}
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                {isOccupied ? (
                  <button onClick={() => handleManageJob(lift.current_job_id)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    <Edit3 size={14} /> Manage Job, Parts & Labor
                  </button>
                ) : (
                  <button onClick={() => handleOpenIntake(lift.id)} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                    <Plus size={14} /> Intake Bike to this Bay
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= INTAKE & JOB CARD MODAL ================= */}
      {showIntakeModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="var(--honda-red)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Motorcycle Intake & Job Card Creation</h3>
              </div>
              <button onClick={() => setShowIntakeModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleIntakeSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Section A: Customer Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    1. Customer Information
                  </h4>
                  <div className="form-group">
                    <label className="form-label">Customer Mobile Number *</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      className="form-input"
                      value={intakeForm.customer_phone}
                      onChange={(e) => setIntakeForm({ ...intakeForm, customer_phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Haji Tanveer"
                      className="form-input"
                      value={intakeForm.customer_name}
                      onChange={(e) => setIntakeForm({ ...intakeForm, customer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address / Locality (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Model Town"
                      className="form-input"
                      value={intakeForm.customer_address}
                      onChange={(e) => setIntakeForm({ ...intakeForm, customer_address: e.target.value })}
                    />
                  </div>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-blue)', margin: '1rem 0 0.75rem', textTransform: 'uppercase' }}>
                    2. Assignment & Service
                  </h4>
                  <div className="form-group">
                    <label className="form-label">Assign Lift / Bay</label>
                    <select
                      className="form-select"
                      value={intakeForm.lift_id}
                      onChange={(e) => setIntakeForm({ ...intakeForm, lift_id: e.target.value })}
                    >
                      <option value="">No Lift (Bench / Yard)</option>
                      {lifts.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.status === 'occupied' ? '(Busy)' : '(Available)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign Mechanic / Technician *</label>
                    <select
                      className="form-select"
                      value={intakeForm.mechanic_id}
                      onChange={(e) => setIntakeForm({ ...intakeForm, mechanic_id: e.target.value })}
                    >
                      {mechanics.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.default_commission_rate}% Commission Split)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Labor Charge (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={intakeForm.dynamic_labor_amount}
                      onChange={(e) => setIntakeForm({ ...intakeForm, dynamic_labor_amount: e.target.value })}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Split: 50% Mechanic (PKR {intakeForm.dynamic_labor_amount / 2}) / 50% Shop (PKR {intakeForm.dynamic_labor_amount / 2})
                    </span>
                  </div>
                </div>

                {/* Section B: Vehicle & Inspection Checklist */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--honda-red)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    3. Motorcycle Specs & Identity
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <select
                        className="form-select"
                        value={intakeForm.vehicle_model}
                        onChange={(e) => setIntakeForm({ ...intakeForm, vehicle_model: e.target.value })}
                      >
                        <option value="Honda CD70">Honda CD70</option>
                        <option value="Honda CG125">Honda CG125</option>
                        <option value="Honda Pridor">Honda Pridor</option>
                        <option value="Honda CB150F">Honda CB150F</option>
                        <option value="Honda CD70 Dream">Honda CD70 Dream</option>
                        <option value="Other">Other / Non-Honda</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reg # (e.g. LEK-21-4521) *</label>
                      <input
                        type="text"
                        placeholder="LEK-21-4521"
                        className="form-input"
                        style={{ fontWeight: '800', textTransform: 'uppercase' }}
                        value={intakeForm.reg_number}
                        onChange={(e) => setIntakeForm({ ...intakeForm, reg_number: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Chassis / Frame # (Mandatory)</label>
                      <input
                        type="text"
                        placeholder="HA02E-984215"
                        className="form-input"
                        value={intakeForm.chassis_number}
                        onChange={(e) => setIntakeForm({ ...intakeForm, chassis_number: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Meter (km)</label>
                      <input
                        type="number"
                        placeholder="14500"
                        className="form-input"
                        value={intakeForm.odometer}
                        onChange={(e) => setIntakeForm({ ...intakeForm, odometer: e.target.value })}
                      />
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-amber)', margin: '1rem 0 0.75rem', textTransform: 'uppercase' }}>
                    4. Dispute-Prevention 30-Sec Inspection
                  </h4>

                  <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Fuel size={14} color="var(--accent-amber)" /> Fuel Gauge Level on Intake
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Reserve', 'Half', 'Full'].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setIntakeForm({ ...intakeForm, fuel_level: lvl })}
                            className={`btn btn-sm ${intakeForm.fuel_level === lvl ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                      <label className="form-label">Scratches / Pre-existing Condition</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeForm.inspection_notes}
                        onChange={(e) => setIntakeForm({ ...intakeForm, inspection_notes: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="old_parts"
                        style={{ width: '18px', height: '18px', accentColor: 'var(--honda-red)' }}
                        checked={intakeForm.old_parts_returned === 1}
                        onChange={(e) => setIntakeForm({ ...intakeForm, old_parts_returned: e.target.checked ? 1 : 0 })}
                      />
                      <label htmlFor="old_parts" style={{ fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
                        Old Replaced Parts (Kabaad) to be Handed Over to Customer
                      </label>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Customer Complaints / Work Scope</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Engine oil change, clutch cable hard, rear brake noise..."
                      className="form-textarea"
                      value={intakeForm.complaints}
                      onChange={(e) => setIntakeForm({ ...intakeForm, complaints: e.target.value })}
                    />
                  </div>

                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowIntakeModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg">
                  <CheckCircle2 size={18} /> Confirm Intake & Generate Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MANAGE ACTIVE JOB DETAILS MODAL ================= */}
      {activeJobDetails && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="var(--honda-red)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                  Job Card: {activeJobDetails.job_number} — {activeJobDetails.reg_number}
                </h3>
              </div>
              <button onClick={() => setActiveJobDetails(null)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <div className="modal-body">
              {/* Top Summary Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer</div>
                  <strong style={{ fontSize: '0.95rem' }}>{activeJobDetails.customer_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeJobDetails.customer_phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Motorcycle Specs</div>
                  <strong style={{ fontSize: '0.95rem' }}>{activeJobDetails.vehicle_model}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chassis: {activeJobDetails.chassis_number || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Mechanic & Bay</div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--accent-blue)' }}>{activeJobDetails.mechanic_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bay: {activeJobDetails.lift_name}</div>
                </div>
              </div>

              {/* WhatsApp Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button onClick={sendWhatsAppIntake} className="btn btn-outline btn-sm" style={{ flex: 1, borderColor: '#25D366', color: '#25D366' }}>
                  <MessageSquare size={14} /> Send Intake WhatsApp Slip
                </button>
                <button onClick={sendWhatsAppReady} className="btn btn-outline btn-sm" style={{ flex: 1, borderColor: '#25D366', color: '#25D366' }}>
                  <MessageSquare size={14} /> Send "Ready for Pickup" WhatsApp
                </button>
              </div>

              {/* Parts Consumption Table */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Parts Consumed From Store (Auto-deducted):</span>
                <span style={{ color: 'var(--accent-emerald)' }}>Parts Total: PKR {activeJobDetails.parts_total}</span>
              </h4>

              <div className="table-wrapper" style={{ maxHeight: '180px', marginBottom: '1rem' }}>
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Part Number</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobDetails.parts && activeJobDetails.parts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '600' }}>{p.part_name}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.part_number}</td>
                        <td>{p.quantity}</td>
                        <td>{p.unit_price}</td>
                        <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>PKR {p.total_price}</td>
                        <td>
                          <button onClick={() => handleRemovePartFromJob(p.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!activeJobDetails.parts || activeJobDetails.parts.length === 0) && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No parts added yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Part to Job Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <select
                  className="form-select"
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                >
                  <option value="">Select Spare Part from Inventory...</option>
                  {products.map(pr => (
                    <option key={pr.id} value={pr.id} disabled={pr.stock_quantity <= 0}>
                      {pr.name} ({pr.model_compat}) - Stock: {pr.stock_quantity} - PKR {pr.retail_price}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={partQty}
                  onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                />

                <button onClick={handleAddPartToJob} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add Part
                </button>
              </div>

              {/* Dynamic Labor & 50/50 Split Adjuster */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Dynamic Labor & Commission Split</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      className="form-input"
                      style={{ width: '130px', fontWeight: '800', color: 'var(--accent-blue)', textAlign: 'right' }}
                      value={dynamicLabor}
                      onChange={(e) => setDynamicLabor(e.target.value)}
                    />
                    <button onClick={handleUpdateLabor} className="btn btn-secondary btn-sm">
                      Apply Labor
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Mechanic Share (50%): <strong style={{ color: 'var(--accent-emerald)' }}>PKR {dynamicLabor * 0.5}</strong></span>
                  <span>Showroom Share (50%): <strong style={{ color: 'var(--accent-blue)' }}>PKR {dynamicLabor * 0.5}</strong></span>
                </div>
              </div>

              {/* Total Job Card Grand Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                <span>TOTAL REPAIR ESTIMATE:</span>
                <span>PKR {activeJobDetails.grand_total}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setActiveJobDetails(null)} className="btn btn-secondary">
                Close
              </button>
              <button onClick={handleMarkReady} className="btn btn-success btn-lg">
                <CheckCircle2 size={18} /> Mark Work Done & Free Lift Bay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
