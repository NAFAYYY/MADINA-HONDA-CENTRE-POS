import React from 'react';
import {
  ShoppingCart, Wrench, Package, Users, AlertCircle, CreditCard,
  TrendingUp, Lock, DollarSign, X, Sun, Moon, Shield, Store
} from 'lucide-react';

export default function AroniumSidebar({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  currentRole,
  onRoleChange,
  theme,
  onToggleTheme,
  activeShift,
  onOpenShiftModal,
  onCloseShiftModal,
  onOpenExpenseModal
}) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'pos', label: 'POS Cash Register', icon: ShoppingCart, roles: ['admin', 'cashier', 'supervisor'] },
    { id: 'workshop', label: 'Workshop Lift Bays & Intake', icon: Wrench, roles: ['admin', 'supervisor', 'cashier'] },
    { id: 'inventory', label: 'Spare Parts & Bulk Import', icon: Package, roles: ['admin', 'supervisor', 'cashier'] },
    { id: 'mechanics', label: 'Mechanic Ledger & Peshgi', icon: Users, roles: ['admin', 'supervisor'] },
    { id: 'complaints', label: 'Re-Work & Complaints', icon: AlertCircle, roles: ['admin', 'supervisor', 'cashier'] },
    { id: 'khata', label: 'Khata Credit Management', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'analytics', label: 'Owner Analytics (Admin)', icon: TrendingUp, roles: ['admin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="aronium-sidebar-overlay" onClick={onClose}>
      <aside className="aronium-sidebar" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-badge">M</div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', lineHeight: 1.2 }}>MADINA HONDA</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>POS & Workshop ERP</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ border: 'none', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="sidebar-nav-list">
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px 4px' }}>
            Operations & Modules
          </div>

          {allowedItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onClose();
                }}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '16px 12px 4px' }}>
            Quick Actions
          </div>

          {/* Shift Drawer Button */}
          {activeShift ? (
            <button
              onClick={() => {
                onClose();
                onCloseShiftModal();
              }}
              className="sidebar-nav-item"
              style={{ color: '#fbbf24' }}
            >
              <Lock size={17} />
              <span>Close Shift (Blind Count)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenShiftModal();
              }}
              className="sidebar-nav-item"
              style={{ color: '#34d399' }}
            >
              <Lock size={17} />
              <span>Open Cashier Shift</span>
            </button>
          )}

          {/* Expense Button */}
          <button
            onClick={() => {
              onClose();
              onOpenExpenseModal();
            }}
            className="sidebar-nav-item"
          >
            <DollarSign size={17} color="var(--honda-red)" />
            <span>Record Daily Expense (Tea/Misc)</span>
          </button>
        </div>

        {/* Footer Settings & Role Switcher */}
        <div className="sidebar-footer">
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Active User Role
            </label>
            <select
              className="form-select"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="admin">Showroom Owner / Admin</option>
              <option value="cashier">Counter Cashier</option>
              <option value="supervisor">Workshop Supervisor</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Theme: {theme === 'dark' ? 'Aronium Dark' : 'Daylight POS'}
            </span>
            <button
              onClick={onToggleTheme}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Toggle
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
