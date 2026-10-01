import React, { useState, useEffect } from 'react';
import {
  AlertCircle, Search, UserCheck, CheckCircle2, RotateCcw,
  Wrench, ShieldAlert, Clock, ArrowRight, MessageSquare
} from 'lucide-react';

export default function ComplaintsManager() {
  const [complaints, setComplaints] = useState([]);
  const [searchLookup, setSearchLookup] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Re-work ticket creation state
  const [selectedPastJob, setSelectedPastJob] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [isWarranty, setIsWarranty] = useState(true);

  // Resolve Ticket Modal
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchLookup.trim()) return;
    setLoadingLookup(true);
    try {
      const res = await fetch(`/api/complaints/lookup?search=${encodeURIComponent(searchLookup.trim())}`);
      const data = await res.json();
      setLookupResults(data);
      if (data.length === 0) {
        alert('No past service history found for this Registration/Chassis Number.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLookup(false);
    }
  };

  // Submit Complaint & Reassign to Same Mechanic
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedPastJob || !issueDescription) {
      alert('Please select a past job record and enter the complaint issue description');
      return;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: selectedPastJob.customer_name,
          customer_phone: selectedPastJob.customer_phone,
          reg_number: selectedPastJob.reg_number,
          chassis_number: selectedPastJob.chassis_number,
          original_job_id: selectedPastJob.id,
          assigned_mechanic_id: selectedPastJob.mechanic_id,
          issue_description: issueDescription,
          is_warranty: isWarranty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket');

      alert(`Complaint Ticket ${data.ticket_number} created and automatically reassigned to ${selectedPastJob.mechanic_name}!`);
      setSelectedPastJob(null);
      setIssueDescription('');
      setLookupResults([]);
      setSearchLookup('');
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    try {
      const res = await fetch(`/api/complaints/${resolvingTicket.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });
      if (!res.ok) throw new Error('Failed to resolve complaint');

      alert('Complaint ticket marked as RESOLVED!');
      setResolvingTicket(null);
      setResolutionNotes('');
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={24} color="var(--honda-red)" />
          Re-Work & Customer Complaint Management
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Trace previous motorcycle repairs by Registration or Chassis # and automatically reassign repeat issues to the same mechanic.
        </p>
      </div>

      {/* Re-Work Lookup Engine Panel */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.85rem' }}>
          <Search size={18} color="var(--accent-blue)" />
          Lookup Returning Motorcycle Service History
        </h3>

        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Enter Registration No (e.g. LEK-21-4521) or Chassis / Frame Number..."
              className="form-input"
              style={{ fontWeight: '700', textTransform: 'uppercase' }}
              value={searchLookup}
              onChange={(e) => setSearchLookup(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loadingLookup} className="btn btn-primary">
            <Search size={16} /> {loadingLookup ? 'Tracing History...' : 'Trace Past Repair & Mechanic'}
          </button>
        </form>

        {/* Trace Results */}
        {lookupResults.length > 0 && (
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '0.65rem', color: 'var(--accent-cyan)' }}>
              Found {lookupResults.length} Past Service Records for this Motorcycle:
            </h4>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {lookupResults.map(hist => (
                <div
                  key={hist.id}
                  onClick={() => setSelectedPastJob(hist)}
                  style={{
                    background: selectedPastJob && selectedPastJob.id === hist.id ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-card)',
                    border: `1px solid ${selectedPastJob && selectedPastJob.id === hist.id ? 'var(--honda-red)' : 'var(--border-card)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>
                      {hist.job_number} — {new Date(hist.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Vehicle: <strong>{hist.vehicle_model}</strong> ({hist.reg_number}) | Customer: <strong>{hist.customer_name}</strong> ({hist.customer_phone})
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
                      Original Complaints: <em>{hist.complaints || 'General Service'}</em>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Original Mechanic Responsible:</div>
                    <span style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--accent-blue)' }}>
                      {hist.mechanic_name || 'Floor Master'}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                      Bill: PKR {hist.grand_total}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Past Job Action Form */}
            {selectedPastJob && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--honda-red)', fontWeight: '800' }}>
                  <UserCheck size={18} />
                  <span>Reassigning Repeat Issue Directly to Original Mechanic: {selectedPastJob.mechanic_name}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer's Re-work Complaint Description *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Engine tappet noise returned after 2 days; oil leaking from clutch cover seal..."
                    className="form-textarea"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="warranty_chk"
                      checked={isWarranty}
                      onChange={(e) => setIsWarranty(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--honda-red)' }}
                    />
                    <label htmlFor="warranty_chk" style={{ fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                      Mark as Free Warranty Re-Work (Customer will not be double-charged)
                    </label>
                  </div>

                  <button onClick={handleCreateComplaint} className="btn btn-primary">
                    <RotateCcw size={16} /> Create Ticket & Reassign to {selectedPastJob.mechanic_name}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complaints History Register */}
      <div className="card-panel">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          <ShieldAlert size={18} color="var(--honda-red)" />
          Active & Resolved Customer Complaint Register ({complaints.length})
        </h3>

        <div className="table-wrapper">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Motorcycle</th>
                <th>Customer</th>
                <th>Assigned Mechanic</th>
                <th>Complaint Description</th>
                <th>Type</th>
                <th>Status</th>
                <th>Resolution Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(cmp => (
                <tr key={cmp.id}>
                  <td style={{ fontWeight: '800' }}>{cmp.ticket_number}</td>
                  <td>
                    <span style={{ fontWeight: '700' }}>{cmp.reg_number}</span>
                    {cmp.chassis_number && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cmp.chassis_number}</div>}
                  </td>
                  <td>
                    <div>{cmp.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cmp.customer_phone}</div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent-blue)' }}>{cmp.mechanic_name || 'Unassigned'}</strong>
                  </td>
                  <td style={{ maxWidth: '240px', fontSize: '0.82rem' }}>
                    {cmp.issue_description}
                  </td>
                  <td>
                    <span className={`card-badge ${cmp.is_warranty ? 'badge-red' : 'badge-blue'}`}>
                      {cmp.is_warranty ? 'Warranty Re-Work' : 'Paid Revision'}
                    </span>
                  </td>
                  <td>
                    <span className={`card-badge ${cmp.status === 'resolved' ? 'badge-emerald' : 'badge-amber'}`}>
                      {cmp.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {cmp.resolution_notes || '—'}
                  </td>
                  <td>
                    {cmp.status !== 'resolved' && (
                      <button
                        onClick={() => { setResolvingTicket(cmp); setResolutionNotes(''); }}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.3)' }}
                      >
                        <CheckCircle2 size={13} /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customer complaints registered. Excellent workshop performance!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {resolvingTicket && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Resolve Complaint Ticket: {resolvingTicket.ticket_number}</h3>
              <button onClick={() => setResolvingTicket(null)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleResolveTicket}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <div>Vehicle: <strong>{resolvingTicket.reg_number}</strong></div>
                  <div>Mechanic: <strong>{resolvingTicket.mechanic_name}</strong></div>
                  <div>Issue: <em>{resolvingTicket.issue_description}</em></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Resolution Summary / Action Taken *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Mechanic re-adjusted tappets and replaced clutch cover gasket free of charge under warranty. Customer tested and satisfied."
                    className="form-textarea"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setResolvingTicket(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Mark as Resolved</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
