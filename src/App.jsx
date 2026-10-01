import React, { useState, useEffect } from 'react';
import {
  Menu, Barcode, Hash, Tag, Search, ArrowLeft,
  Lock, Sun, Moon, Minus, Square, X, ShieldAlert
} from 'lucide-react';

import PosTerminal from './views/PosTerminal';
import WorkshopLifts from './views/WorkshopLifts';
import InventoryManager from './views/InventoryManager';
import MechanicLedger from './views/MechanicLedger';
import ComplaintsManager from './views/ComplaintsManager';
import KhataManager from './views/KhataManager';
import AdminAnalytics from './views/AdminAnalytics';

import AroniumSidebar from './components/AroniumSidebar';
import BlindCloseModal from './components/BlindCloseModal';
import ExpenseModal from './components/ExpenseModal';

export default function App() {
  const [activeView, setActiveView] = useState('pos'); // 'pos', 'workshop', 'inventory', 'mechanics', 'complaints', 'khata', 'analytics'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState('admin'); // 'admin', 'cashier', 'supervisor'
  const [theme, setTheme] = useState('dark');

  // Shift & Cash Drawer
  const [activeShift, setActiveShift] = useState(null);
  const [showBlindCloseModal, setShowBlindCloseModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [newOpeningCash, setNewOpeningCash] = useState('5000');

  // Petty Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Global search query in header
  const [headerSearch, setHeaderSearch] = useState('');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch current shift
  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const res = await fetch('/api/shifts/current');
      const data = await res.json();
      setActiveShift(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNewShift = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: currentRole === 'cashier' ? 2 : 1,
          cashier_name: currentRole === 'cashier' ? 'Counter Cashier' : 'Showroom Owner',
          opening_cash: Number(newOpeningCash) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open shift');

      alert(`Shift opened with PKR ${newOpeningCash} float!`);
      setShowOpenShiftModal(false);
      fetchCurrentShift();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="aronium-app">
      
      {/* ================= ARONIUM TOP HEADER ================= */}
      <header className="aronium-header">
        {/* Menu Asterisk Button (Triggers Sidebar with all additional options) */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="aronium-menu-btn"
          title="Open Menu / Workshop & Additional Options"
        >
          <Menu size={22} />
        </button>

        {/* Aronium Header Mode Icons (Barcode, Number, Tag) */}
        <div className="aronium-header-icon" title="Barcode Scanner Mode">
          <Barcode size={18} />
        </div>
        <div className="aronium-header-icon" title="Product Code Mode">
          <Hash size={16} />
        </div>
        <div className="aronium-header-icon" title="Price Search Mode">
          <Tag size={16} />
        </div>

        {/* Prominent Search Bar (Search products by name, code or barcode) */}
        <div className="aronium-search-box">
          <Search size={15} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search products by name, code or barcode"
            className="aronium-search-input"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onFocus={() => {
              if (activeView !== 'pos') setActiveView('pos');
            }}
          />
        </div>

        {/* Right Header Area */}
        <div className="aronium-header-right">
          {/* If on other view, show Return to POS button */}
          {activeView !== 'pos' && (
            <button
              onClick={() => setActiveView('pos')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
            >
              <ArrowLeft size={13} /> Back to POS
            </button>
          )}

          {/* Active Shift Indicator */}
          {activeShift ? (
            <div
              onClick={() => setShowBlindCloseModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#34d399', background: 'rgba(16, 124, 65, 0.15)', padding: '3px 8px', borderRadius: '4px' }}
              title="Click to perform blind shift closing"
            >
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span>Shift Open (Rs {activeShift.opening_cash})</span>
            </div>
          ) : (
            <div
              onClick={() => setShowOpenShiftModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '4px' }}
              title="Click to open shift"
            >
              <Lock size={12} />
              <span>Shift Closed</span>
            </div>
          )}

          {/* Show Current Role */}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            {currentRole === 'admin' ? 'Admin' : currentRole === 'cashier' ? 'Cashier' : 'Supervisor'}
          </span>

          {/* Window Mock Controls */}
          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', marginLeft: '6px' }}>
            <Minus size={14} style={{ cursor: 'pointer' }} />
            <Square size={12} style={{ cursor: 'pointer' }} />
            <X size={14} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </header>

      {/* ================= MAIN APPLICATION VIEW ================= */}
      {activeView === 'pos' && (
        <PosTerminal
          activeShift={activeShift}
          onOpenShiftModal={() => setShowOpenShiftModal(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Other Additional Views when selected from Sidebar */}
      {activeView !== 'pos' && (
        <div className="aronium-view-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <button onClick={() => setActiveView('pos')} className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> Back to POS Cash Register
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>
              Module: {activeView}
            </span>
          </div>

          {activeView === 'workshop' && <WorkshopLifts />}
          {activeView === 'inventory' && <InventoryManager />}
          {activeView === 'mechanics' && <MechanicLedger />}
          {activeView === 'complaints' && <ComplaintsManager />}
          {activeView === 'khata' && <KhataManager />}
          {activeView === 'analytics' && <AdminAnalytics />}
        </div>
      )}

      {/* ================= ARONIUM SIDEBAR DRAWER ================= */}
      <AroniumSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        activeShift={activeShift}
        onOpenShiftModal={() => setShowOpenShiftModal(true)}
        onCloseShiftModal={() => setShowBlindCloseModal(true)}
        onOpenExpenseModal={() => setShowExpenseModal(true)}
      />

      {/* ================= BLIND SHIFT CLOSING MODAL ================= */}
      {showBlindCloseModal && activeShift && (
        <BlindCloseModal
          currentShift={activeShift}
          onClose={() => setShowBlindCloseModal(false)}
          onShiftClosed={() => fetchCurrentShift()}
        />
      )}

      {/* ================= OPEN NEW SHIFT MODAL ================= */}
      {showOpenShiftModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Open Cashier Shift</h3>
              <button onClick={() => setShowOpenShiftModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleOpenNewShift}>
              <div className="modal-body">
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                  Starting a new shift. Enter the morning opening cash float in the drawer.
                </p>
                <div className="form-group">
                  <label className="form-label">Opening Cash Float (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 5000"
                    className="form-input"
                    style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-emerald)' }}
                    value={newOpeningCash}
                    onChange={(e) => setNewOpeningCash(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowOpenShiftModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Open Shift Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECORD EXPENSE MODAL ================= */}
      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={() => fetchCurrentShift()}
        />
      )}

    </div>
  );
}
