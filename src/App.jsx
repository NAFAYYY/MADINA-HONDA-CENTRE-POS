import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Menu, Barcode, Hash, Tag, Search, ArrowLeft,
  Lock, Sun, Moon, Minus, Square, X, ShieldAlert,
  Settings, Printer, Plus
} from 'lucide-react';

import PosTerminal from './views/PosTerminal';
import WorkshopLifts from './views/WorkshopLifts';
import InventoryManager from './views/InventoryManager';
import MechanicLedger from './views/MechanicLedger';
import ComplaintsManager from './views/ComplaintsManager';
import KhataManager from './views/KhataManager';
import AdminAnalytics from './views/AdminAnalytics';
import SettingsManager from './views/SettingsManager';
import PrintScriptEditor from './views/PrintScriptEditor';

import AroniumSidebar from './components/AroniumSidebar';
import BlindCloseModal from './components/BlindCloseModal';
import ExpenseModal from './components/ExpenseModal';

export default function App() {
  const [activeView, setActiveView] = useState('pos'); // 'pos', 'workshop', 'inventory', 'mechanics', 'complaints', 'khata', 'analytics', 'settings', 'print-editor'
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

  // Global search query in header & autocomplete dropdown
  const [headerSearch, setHeaderSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  const addToCartRef = useRef(null);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch current shift and products catalog on mount
  useEffect(() => {
    fetchCurrentShift();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products for header search:', err);
    }
  };

  // Instant Autocomplete Search Matches
  const matchingProducts = useMemo(() => {
    if (!headerSearch.trim()) return [];
    const q = headerSearch.toLowerCase().trim();
    return allProducts.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.part_number && p.part_number.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.model_compat && p.model_compat.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [headerSearch, allProducts]);

  // Click Outside to Close Search Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global F3 shortcut to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        if (activeView !== 'pos') setActiveView('pos');
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeView]);

  // Add selected product to POS cart and clear search
  const handleSelectProduct = (product) => {
    if (activeView !== 'pos') {
      setActiveView('pos');
    }
    if (addToCartRef.current) {
      addToCartRef.current(product);
    }
    setHeaderSearch('');
    setIsSearchDropdownOpen(false);
    setSelectedSearchIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Keyboard navigation inside search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSearchDropdownOpen(true);
      setSelectedSearchIndex(i => Math.min(matchingProducts.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingProducts.length > 0) {
        const selected = matchingProducts[selectedSearchIndex] || matchingProducts[0];
        handleSelectProduct(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchDropdownOpen(false);
      setHeaderSearch('');
    }
  };

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
          <Menu size={20} />
        </button>

        {/* Brand Crest */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px', borderRight: '1px solid var(--aronium-border)' }}>
          <div style={{
            background: 'var(--honda-red)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '3px',
            letterSpacing: '0.05em'
          }}>
            HONDA
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--text-main)' }}>
            MADINA
          </span>
        </div>

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
        <div className="aronium-search-box" ref={searchBoxRef}>
          <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by name, code or barcode (or press F3)..."
            className="aronium-search-input"
            value={headerSearch}
            onChange={(e) => {
              setHeaderSearch(e.target.value);
              setIsSearchDropdownOpen(true);
              setSelectedSearchIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (activeView !== 'pos') setActiveView('pos');
              if (headerSearch.trim()) setIsSearchDropdownOpen(true);
            }}
          />

          {/* Clear Button (X) */}
          {headerSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setHeaderSearch('');
                setIsSearchDropdownOpen(false);
                if (searchInputRef.current) searchInputRef.current.focus();
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}

          <span
            onClick={() => {
              if (activeView !== 'pos') setActiveView('pos');
              if (searchInputRef.current) {
                searchInputRef.current.focus();
                searchInputRef.current.select();
              }
            }}
            style={{
              position: 'absolute',
              right: '8px',
              fontSize: '10px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--aronium-bg)',
              padding: '2px 5px',
              borderRadius: '3px',
              border: '1px solid var(--aronium-border)',
              cursor: 'pointer'
            }}
            title="Press F3 to focus search bar"
          >
            F3
          </span>

          {/* Live Floating Dropdown */}
          {isSearchDropdownOpen && headerSearch.trim() && (
            <div className="aronium-search-dropdown">
              <div className="search-dropdown-header">
                <span>
                  Matching Spare Parts ({matchingProducts.length} found)
                </span>
                <span style={{ fontSize: '10px' }}>
                  [↑/↓ Navigate • Enter / Click to Add • Esc to Close]
                </span>
              </div>

              <div className="search-dropdown-list">
                {matchingProducts.length > 0 ? (
                  matchingProducts.map((p, idx) => {
                    const isSelected = selectedSearchIndex === idx;
                    const isOutOfStock = p.stock_quantity <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`search-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectProduct(p)}
                        onMouseEnter={() => setSelectedSearchIndex(idx)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
                              {p.name}
                            </span>
                            {p.model_compat && (
                              <span className="card-badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                                {p.model_compat}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: '#fb7185', fontWeight: '600' }}>
                              {p.part_number}
                            </span>
                            {p.shelf_location && (
                              <span>📍 {p.shelf_location}</span>
                            )}
                            {p.barcode && p.barcode !== p.part_number && (
                              <span>Barcode: {p.barcode}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`card-badge ${isOutOfStock ? 'badge-red' : p.stock_quantity <= (p.min_stock_alert || 5) ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '10.5px' }}>
                            {isOutOfStock ? 'Out of Stock' : `${p.stock_quantity} in stock`}
                          </span>

                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', minWidth: '75px', textAlign: 'right' }}>
                            PKR {p.retail_price}
                          </span>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '11px', padding: '3px 8px', gap: '4px' }}
                          >
                            <Plus size={12} /> Add
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    <div>No products found matching "<strong>{headerSearch}</strong>"</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-dim)' }}>
                      Verify part number or Honda description. Press <strong>F3</strong> for full catalog.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

          {/* Quick Settings Button */}
          <button
            onClick={() => setActiveView('settings')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '11px', padding: '4px 8px', gap: '4px', borderColor: 'var(--aronium-border)' }}
            title="System Settings & Hardware Config"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>

          {/* Active Shift Indicator */}
          {activeShift ? (
            <div
              onClick={() => setShowBlindCloseModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontVariantNumeric: 'tabular-nums'
              }}
              title="Click to perform blind shift closing"
            >
              <span className="pulse-dot" style={{ width: '7px', height: '7px' }} />
              <span>Shift Open (Rs {activeShift.opening_cash})</span>
            </div>
          ) : (
            <div
              onClick={() => setShowOpenShiftModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '4px 10px',
                borderRadius: '4px'
              }}
              title="Click to open shift"
            >
              <Lock size={12} />
              <span>Shift Closed</span>
            </div>
          )}

          {/* Show Current Role */}
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-dim)',
            background: 'var(--aronium-tile-bg)',
            border: '1px solid var(--aronium-border)',
            padding: '3px 8px',
            borderRadius: '4px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {currentRole === 'admin' ? 'Admin' : currentRole === 'cashier' ? 'Cashier' : 'Supervisor'}
          </span>

          {/* Window Mock Controls */}
          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', marginLeft: '4px' }}>
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
          headerSearch={headerSearch}
          setHeaderSearch={setHeaderSearch}
          onRegisterAddItem={(fn) => { addToCartRef.current = fn; }}
          onNavigateView={setActiveView}
          onOpenPrintEditor={() => setActiveView('print-editor')}
          onFocusSearch={() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
              searchInputRef.current.select();
            }
          }}
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
          {activeView === 'settings' && <SettingsManager onOpenPrintEditor={() => setActiveView('print-editor')} />}
          {activeView === 'print-editor' && <PrintScriptEditor onNavigateBack={() => setActiveView('settings')} />}
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
