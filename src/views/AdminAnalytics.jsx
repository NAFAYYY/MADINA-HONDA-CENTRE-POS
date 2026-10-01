import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Wallet, ShieldAlert, Package,
  Users, HardDrive, Download, AlertTriangle, ArrowUpRight, BarChart3, RefreshCw
} from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backupMsg, setBackupMsg] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error('Backup failed');
      setBackupMsg(`Local backup successfully created: ${json.backupFileName} (${(json.sizeBytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="pulse-dot" style={{ margin: '0 auto 1rem' }} />
        <p>Loading real-time executive showroom analytics...</p>
      </div>
    );
  }

  const { today, streams, workshop, inventory_alerts, top_parts, mechanics } = data;

  return (
    <div>
      {/* Top Banner with Backup Tool */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={24} color="var(--honda-red)" />
            Owner's Connected Analytics & Intelligence
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Live gross profit, 4-stream revenue mix, mechanic productivity & offline database backup.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchDashboard} className="btn btn-outline btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleCreateBackup} className="btn btn-secondary btn-sm">
            <HardDrive size={14} /> 1-Click Backup
          </button>
          <a href="/api/backup/download" download className="btn btn-primary btn-sm">
            <Download size={14} /> Save to USB Flash Drive
          </a>
        </div>
      </div>

      {backupMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
          {backupMsg}
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Today's True Net Profit */}
        <div className="card-panel" style={{ borderLeft: '5px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Today's Net Gross Profit
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '0.35rem' }}>
            PKR {today.net_profit}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            (Parts Margin + Shop Labor) - Expenses
          </div>
        </div>

        {/* Total Today's Revenue */}
        <div className="card-panel" style={{ borderLeft: '5px solid var(--accent-blue)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Today's Total Sales Revenue
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '0.35rem' }}>
            PKR {today.total_revenue}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Across {today.total_invoices} invoices billed
          </div>
        </div>

        {/* Cash in Drawer vs Credit Extended */}
        <div className="card-panel" style={{ borderLeft: '5px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Cash in Hand vs. Udhaar Today
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
              PKR {today.cash_collected}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--honda-red)' }}>
              Udhaar: PKR {today.credit_extended}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Cash Collected vs Credit Extended
          </div>
        </div>

        {/* Shop Petty Expenses */}
        <div className="card-panel" style={{ borderLeft: '5px solid var(--honda-red)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Today's Shop Expenses
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#f43f5e', marginTop: '0.35rem' }}>
            PKR {today.today_expenses}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Tea, utility, workshop maintenance
          </div>
        </div>

      </div>

      {/* Second Row: 4-Stream Revenue Breakdown & Inventory Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* 4-Stream Breakdown */}
        <div className="card-panel">
          <div className="card-header-row">
            <h3 className="card-title">
              <BarChart3 size={18} color="var(--honda-red)" />
              4-Stream Revenue Breakdown Today
            </h3>
            <span className="card-badge badge-blue">Multi-Channel</span>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              { id: 'inhouse', label: '1. In-House Workshop Consumption', color: 'var(--honda-red)' },
              { id: 'counter_retail', label: '2. Walk-in Counter Parts Retail', color: 'var(--accent-emerald)' },
              { id: 'b2b_wholesale', label: '3. Local Shop Wholesale (B2B)', color: 'var(--accent-blue)' },
              { id: 'after_sale', label: '4. After-Sales / Service Packages', color: 'var(--accent-purple)' }
            ].map(streamInfo => {
              const row = streams.find(s => s.stream === streamInfo.id) || { count: 0, revenue: 0, profit: 0 };
              const percent = today.total_revenue > 0 ? ((row.revenue / today.total_revenue) * 100).toFixed(0) : 0;

              return (
                <div key={streamInfo.id} style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{streamInfo.label}</span>
                    <span style={{ fontWeight: '900', color: streamInfo.color }}>PKR {row.revenue} ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: streamInfo.color, borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <span>Invoices: {row.count}</span>
                    <span>Gross Profit: PKR {row.profit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory & Workshop Floor Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Workshop Lift Bays Summary */}
          <div className="card-panel">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
              Workshop Floor Health
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Occupied Bays</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--honda-red)' }}>{workshop.active_lifts}</div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for Delivery</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>{workshop.ready_lifts}</div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Jobs</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-blue)' }}>{workshop.pending_jobs}</div>
              </div>
            </div>
          </div>

          {/* Stock Alerts & Dead Stock Card */}
          <div className="card-panel">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
              Inventory Intelligence (ABC)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: '700' }}>Critical Low Stock</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f43f5e' }}>{inventory_alerts.low_stock_items} Parts</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Needs supplier reorder</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: '700' }}>Class C Dead Stock</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-amber)' }}>{inventory_alerts.dead_stock_items} Parts</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Capital locked (slow)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Third Row: Mechanic Productivity Today & Top Fast Moving Parts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        
        {/* Mechanic Efficiency Table */}
        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '0.85rem' }}>
            <Users size={18} color="var(--accent-blue)" />
            Technician Performance & Labor Split Today
          </h3>
          <div className="table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Mechanic</th>
                  <th>Bikes Serviced</th>
                  <th>Total Labor</th>
                  <th>Mechanic Share (50%)</th>
                  <th>Showroom Share (50%)</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="card-badge badge-blue">{m.jobs_completed}</span>
                    </td>
                    <td>PKR {m.total_labor_generated}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>PKR {m.mechanic_share}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>PKR {m.shop_share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Fast-Moving Spare Parts (Class A) */}
        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '0.85rem' }}>
            <Package size={18} color="var(--accent-emerald)" />
            Top Fast-Moving Parts (Class A)
          </h3>
          <div className="table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top_parts.map((tp, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '700' }}>{tp.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tp.part_number}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '800' }}>{tp.total_sold}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>PKR {tp.total_revenue}</td>
                  </tr>
                ))}
                {top_parts.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No parts sold yet today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
