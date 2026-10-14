import React, { useState, useEffect } from 'react';
import {
  Settings, Store, ShoppingCart, Printer, Wrench, Package,
  CreditCard, Shield, Save, RotateCcw, Check, AlertCircle,
  ExternalLink, Bell, Volume2, Database, Key, HelpCircle
} from 'lucide-react';
import {
  fetchAllSettings,
  saveAllSettings,
  resetSystemDefaults
} from '../services/settingsService';

export default function SettingsManager({ onOpenPrintEditor }) {
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [editingPasswordUser, setEditingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await fetchAllSettings();
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaveStatus('Saving changes...');
      await saveAllSettings(settings);
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      alert('Error saving settings: ' + err.message);
      setSaveStatus('');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all system settings and configurations to factory defaults?')) {
      return;
    }
    try {
      await resetSystemDefaults();
      alert('All settings have been reset to factory defaults.');
      loadSettings();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading System Settings...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Top Header Bar */}
      <div style={{
        background: 'var(--aronium-tile-bg)',
        border: '1px solid var(--aronium-border)',
        borderRadius: '8px',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--honda-red)', color: '#fff', padding: '7px', borderRadius: '6px' }}>
            <Settings size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              Madina Honda Centre - System Settings &amp; Preferences
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Configure store identity, POS terminal behavior, thermal printers, workshop rules, and WhatsApp alerts
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onOpenPrintEditor}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Printer size={15} /> Open Print Script Editor
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-outline btn-sm"
            title="Reset to factory presets"
          >
            <RotateCcw size={14} /> Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px' }}
          >
            <Save size={15} /> {saveStatus || 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="settings-tabs">
        <button
          onClick={() => setActiveTab('store')}
          className={`settings-tab-btn ${activeTab === 'store' ? 'active' : ''}`}
        >
          <Store size={15} /> Store &amp; 3S Dealership
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`settings-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
        >
          <ShoppingCart size={15} /> POS Cash Register
        </button>

        <button
          onClick={() => setActiveTab('printer')}
          className={`settings-tab-btn ${activeTab === 'printer' ? 'active' : ''}`}
        >
          <Printer size={15} /> Thermal Printer &amp; Hardware
        </button>

        <button
          onClick={() => setActiveTab('workshop')}
          className={`settings-tab-btn ${activeTab === 'workshop' ? 'active' : ''}`}
        >
          <Wrench size={15} /> Workshop Lifts &amp; Intake
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`settings-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          <Package size={15} /> Inventory &amp; Stock Rules
        </button>

        <button
          onClick={() => setActiveTab('khata')}
          className={`settings-tab-btn ${activeTab === 'khata' ? 'active' : ''}`}
        >
          <CreditCard size={15} /> Khata &amp; WhatsApp Alerts
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
        >
          <Shield size={15} /> Users &amp; Security
        </button>
      </div>

      {/* ================= TAB 1: STORE & DEALERSHIP PROFILE ================= */}
      {activeTab === 'store' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <Store size={18} color="var(--honda-red)" />
              Dealership Identity &amp; Invoice Header Info
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Appears on all printed receipts, Gate Passes, and reports
            </span>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Showroom / Store Name *</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_name || ''}
                onChange={(e) => handleChange('store_name', e.target.value)}
                placeholder="MADINA HONDA CENTRE"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dealership Tagline *</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_tagline || ''}
                onChange={(e) => handleChange('store_tagline', e.target.value)}
                placeholder="AUTHORIZED 3S SALES, SERVICE & SPARE PARTS"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shop Address *</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_address || ''}
                onChange={(e) => handleChange('store_address', e.target.value)}
                placeholder="Circular Road, Near Bus Stand"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Phone / Mobile *</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_phone || ''}
                onChange={(e) => handleChange('store_phone', e.target.value)}
                placeholder="0300-1234567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Helpline Number</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_whatsapp || ''}
                onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                placeholder="0300-1234567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">NTN / STRN Tax Registration #</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_ntn || ''}
                onChange={(e) => handleChange('store_ntn', e.target.value)}
                placeholder="NTN-7860123-4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Atlas Honda Dealer Code</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_dealer_code || ''}
                onChange={(e) => handleChange('store_dealer_code', e.target.value)}
                placeholder="AHL-DLR-4420"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Invoice Welcome Message (Top / Bottom Note)</label>
              <input
                type="text"
                className="form-input"
                value={settings.receipt_welcome || ''}
                onChange={(e) => handleChange('receipt_welcome', e.target.value)}
                placeholder="Thank you for choosing Madina Honda Centre!"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Warranty &amp; Return Disclaimer (Bottom of Slip)</label>
              <input
                type="text"
                className="form-input"
                value={settings.receipt_disclaimer || ''}
                onChange={(e) => handleChange('receipt_disclaimer', e.target.value)}
                placeholder="Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: POS CASH REGISTER ================= */}
      {activeTab === 'pos' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <ShoppingCart size={18} color="var(--honda-red)" />
              POS Cash Register &amp; Checkout Rules
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Controls cashier speed, tenders, audio signals, and shortcuts
            </span>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Default Payment Method</label>
              <select
                className="form-select"
                value={settings.pos_default_payment || 'cash'}
                onChange={(e) => handleChange('pos_default_payment', e.target.value)}
              >
                <option value="cash">Cash (F12)</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="khata">Khata Credit</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Checkout Stream</label>
              <select
                className="form-select"
                value={settings.pos_default_stream || 'counter_retail'}
                onChange={(e) => handleChange('pos_default_stream', e.target.value)}
              >
                <option value="counter_retail">Counter Retail Parts</option>
                <option value="inhouse">Workshop Delivery</option>
                <option value="b2b_wholesale">B2B Shop Wholesale</option>
                <option value="after_sale">After-Sales Periodic Service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Auto-Print Slip on Payment (F10)</label>
              <select
                className="form-select"
                value={settings.pos_auto_print || 'true'}
                onChange={(e) => handleChange('pos_auto_print', e.target.value)}
              >
                <option value="true">Enabled (Auto opens print preview)</option>
                <option value="false">Disabled (Cashier clicks Print manually)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Barcode Scanner Auto-Add</label>
              <select
                className="form-select"
                value={settings.pos_scanner_auto_add || 'true'}
                onChange={(e) => handleChange('pos_scanner_auto_add', e.target.value)}
              >
                <option value="true">Enabled (Scanned part added on Enter)</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audio Beep Feedback (Scan &amp; Sale)</label>
              <select
                className="form-select"
                value={settings.pos_sound_beeps || 'true'}
                onChange={(e) => handleChange('pos_sound_beeps', e.target.value)}
              >
                <option value="true">Enabled (High-pitch confirmation beeps)</option>
                <option value="false">Mute Audio</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Negative Stock Policy</label>
              <select
                className="form-select"
                value={settings.pos_allow_negative_stock || 'warn'}
                onChange={(e) => handleChange('pos_allow_negative_stock', e.target.value)}
              >
                <option value="warn">Warn Cashier but allow sale</option>
                <option value="block">Strict Block (Prevent zero stock sales)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quick Cash Tender Presets (PKR)</label>
              <input
                type="text"
                className="form-input"
                value={settings.pos_quick_cash_presets || '500,1000,5000'}
                onChange={(e) => handleChange('pos_quick_cash_presets', e.target.value)}
                placeholder="500,1000,5000"
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Comma-separated rupee buttons</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: THERMAL PRINTER & HARDWARE ================= */}
      {activeTab === 'printer' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <Printer size={18} color="var(--honda-red)" />
              Thermal Receipt Printer &amp; Hardware Layout
            </div>
            <button
              onClick={onOpenPrintEditor}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <ExternalLink size={14} /> Open Full Script &amp; Template Editor
            </button>
          </div>

          <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.25)', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="var(--honda-red)" />
            <span>
              <strong>Zero Excess Margins Engine:</strong> All receipts are configured with <code>@page &#123; margin: 0; &#125;</code> and tight vertical bounding, preventing blank trailing paper waste!
            </span>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Thermal Roll Format</label>
              <select
                className="form-select"
                value={settings.print_paper_size || '80mm'}
                onChange={(e) => {
                  handleChange('print_paper_size', e.target.value);
                  if (e.target.value === '58mm') handleChange('print_receipt_width_mm', '48');
                  else if (e.target.value === '80mm') handleChange('print_receipt_width_mm', '72');
                }}
              >
                <option value="80mm">80mm Paper Roll (Standard POS Receipt)</option>
                <option value="58mm">58mm Paper Roll (Mini POS / Bluetooth)</option>
                <option value="a4">A4 Full Sheet (Corporate Service Report)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Printable Width (mm)</label>
              <input
                type="number"
                min="40"
                max="210"
                className="form-input"
                value={settings.print_receipt_width_mm || '72'}
                onChange={(e) => handleChange('print_receipt_width_mm', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>72mm for 80mm roll; 48mm for 58mm roll</span>
            </div>

            <div className="form-group">
              <label className="form-label">Base Font Size</label>
              <select
                className="form-select"
                value={settings.print_font_size || '11px'}
                onChange={(e) => handleChange('print_font_size', e.target.value)}
              >
                <option value="9.5px">Ultra-Compact (9.5px)</option>
                <option value="10.5px">Compact (10.5px)</option>
                <option value="11px">Standard (11px)</option>
                <option value="12px">Large (12px)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Line Spacing (Height)</label>
              <select
                className="form-select"
                value={settings.print_line_spacing || '1.25'}
                onChange={(e) => handleChange('print_line_spacing', e.target.value)}
              >
                <option value="1.1">Zero Waste Ultra-Tight (1.1)</option>
                <option value="1.25">Standard POS (1.25)</option>
                <option value="1.4">Spacious (1.4)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Print Gate Pass Barcode (Workshop)</label>
              <select
                className="form-select"
                value={settings.print_show_gate_pass || 'true'}
                onChange={(e) => handleChange('print_show_gate_pass', e.target.value)}
              >
                <option value="true">Yes (Official Release Slip with Code128)</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Show Mechanic Name on Invoice</label>
              <select
                className="form-select"
                value={settings.print_show_mechanic || 'true'}
                onChange={(e) => handleChange('print_show_mechanic', e.target.value)}
              >
                <option value="true">Yes (Accountability)</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Show OEM Part Numbers in Lines</label>
              <select
                className="form-select"
                value={settings.print_show_part_numbers || 'true'}
                onChange={(e) => handleChange('print_show_part_numbers', e.target.value)}
              >
                <option value="true">Yes (e.g. 15412-MGS-D21)</option>
                <option value="false">No (Part name only - Saves paper)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Electronic Cash Drawer Kick Command</label>
              <select
                className="form-select"
                value={settings.print_cash_drawer_kick || 'true'}
                onChange={(e) => handleChange('print_cash_drawer_kick', e.target.value)}
              >
                <option value="true">Enabled (Sends RJ11 pulse to printer)</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Number of Copies</label>
              <input
                type="number"
                min="1"
                max="5"
                className="form-input"
                value={settings.print_copies || '1'}
                onChange={(e) => handleChange('print_copies', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: WORKSHOP LIFTS & INTAKE ================= */}
      {activeTab === 'workshop' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <Wrench size={18} color="var(--honda-red)" />
              Workshop Bay Operations, Intake &amp; Mechanic Splits
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Lift bay layout, mandatory dispute-prevention checks, and labor revenue shares
            </span>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Default Mechanic Labor Split (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={settings.workshop_default_mechanic_split || '50'}
                onChange={(e) => handleChange('workshop_default_mechanic_split', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>e.g. 50% Mechanic / 50% Showroom</span>
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Fuel Level Check on Intake</label>
              <select
                className="form-select"
                value={settings.workshop_require_fuel_check || 'true'}
                onChange={(e) => handleChange('workshop_require_fuel_check', e.target.value)}
              >
                <option value="true">Yes (Prevent petrol dispute with customer)</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Return Old Replaced Parts (Kabaad) Default</label>
              <select
                className="form-select"
                value={settings.workshop_return_old_parts_default || 'true'}
                onChange={(e) => handleChange('workshop_return_old_parts_default', e.target.value)}
              >
                <option value="true">Handover to Customer (Checked by default)</option>
                <option value="false">Retain at Shop (Unchecked)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="form-label">Workshop Bay Names (Comma-separated)</label>
            <textarea
              className="form-input"
              rows={2}
              value={settings.workshop_bays_list || ''}
              onChange={(e) => handleChange('workshop_bays_list', e.target.value)}
              placeholder="Lift 1 - Quick Service,Lift 2 - Main Repair,Lift 3 - Engine Overhaul,Bay 4 - Electrical,Bay 5 - Washing & Detailing"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              These bays appear on the visual workshop grid.
            </span>
          </div>
        </div>
      )}

      {/* ================= TAB 5: INVENTORY & STOCK RULES ================= */}
      {activeTab === 'inventory' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <Package size={18} color="var(--honda-red)" />
              Inventory, Stock Thresholds &amp; Bulk Import
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Controls dead-stock warnings, ABC classification, and wholesale trade margins
            </span>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Low Stock Alert Threshold (Quantity)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={settings.inventory_low_stock_threshold || '5'}
                onChange={(e) => handleChange('inventory_low_stock_threshold', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Items with stock &le; this number trigger red low-stock alert</span>
            </div>

            <div className="form-group">
              <label className="form-label">ABC Class 'A' Threshold (%)</label>
              <input
                type="number"
                min="1"
                max="90"
                className="form-input"
                value={settings.inventory_abc_a_percent || '70'}
                onChange={(e) => handleChange('inventory_abc_a_percent', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Top % of revenue items classified as Fast-Moving</span>
            </div>

            <div className="form-group">
              <label className="form-label">ABC Class 'B' Threshold (%)</label>
              <input
                type="number"
                min="1"
                max="50"
                className="form-input"
                value={settings.inventory_abc_b_percent || '20'}
                onChange={(e) => handleChange('inventory_abc_b_percent', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Next % categorized as Medium-Moving</span>
            </div>

            <div className="form-group">
              <label className="form-label">Default B2B Wholesale Discount (%)</label>
              <input
                type="number"
                min="0"
                max="40"
                className="form-input"
                value={settings.inventory_wholesale_discount_default || '10'}
                onChange={(e) => handleChange('inventory_wholesale_discount_default', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Default discount applied to local workshops</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: KHATA & WHATSAPP ================= */}
      {activeTab === 'khata' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <CreditCard size={18} color="var(--honda-red)" />
              Customer Khata Credit &amp; 1-Click WhatsApp Message Templates
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Dynamic zero-SMS-cost notifications sent to customer phone numbers
            </span>
          </div>

          <div className="settings-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Default B2B Shop Credit Limit (PKR)</label>
              <input
                type="number"
                step="5000"
                className="form-input"
                value={settings.khata_default_credit_limit || '50000'}
                onChange={(e) => handleChange('khata_default_credit_limit', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Reminder Grace Period (Days)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={settings.khata_grace_period_days || '30'}
                onChange={(e) => handleChange('khata_grace_period_days', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">1. WhatsApp Motorcycle Intake Alert Template</label>
              <textarea
                className="form-input"
                rows={2}
                value={settings.whatsapp_intake_msg || ''}
                onChange={(e) => handleChange('whatsapp_intake_msg', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Variables: &#123;customer_name&#125;, &#123;reg_no&#125;, &#123;model&#125;, &#123;job_no&#125;, &#123;work_type&#125;</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">2. WhatsApp "Ready for Delivery" Alert Template</label>
              <textarea
                className="form-input"
                rows={2}
                value={settings.whatsapp_ready_msg || ''}
                onChange={(e) => handleChange('whatsapp_ready_msg', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Variables: &#123;customer_name&#125;, &#123;reg_no&#125;, &#123;total&#125;, &#123;gate_pass&#125;</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">3. WhatsApp Khata Balance Due Reminder Template</label>
              <textarea
                className="form-input"
                rows={2}
                value={settings.whatsapp_khata_msg || ''}
                onChange={(e) => handleChange('whatsapp_khata_msg', e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Variables: &#123;customer_name&#125;, &#123;balance&#125;</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: USERS & SECURITY ================= */}
      {activeTab === 'security' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">
              <Shield size={18} color="var(--honda-red)" />
              User Accounts &amp; Role-Based Access Control (RBAC)
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Manage logins for Admin, Cashier, and Workshop Supervisor
            </span>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--aronium-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>User ID</th>
                  <th style={{ padding: '8px' }}>Full Name</th>
                  <th style={{ padding: '8px' }}>Username</th>
                  <th style={{ padding: '8px' }}>Assigned Role</th>
                  <th style={{ padding: '8px' }}>Phone</th>
                  <th style={{ padding: '8px' }}>Access Permissions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>#{u.id}</td>
                    <td style={{ padding: '8px', fontWeight: '700' }}>{u.full_name}</td>
                    <td style={{ padding: '8px', color: 'var(--honda-red)', fontWeight: '600' }}>{u.username}</td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{u.phone || 'N/A'}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-dim)' }}>
                      {u.role === 'admin' ? 'Full access, cost prices, net profits & backups' :
                       u.role === 'cashier' ? 'POS billing, blind drawer closing & lookup' :
                       'Workshop intakes, bay assignment & re-work tickets'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--aronium-bg)', border: '1px solid var(--aronium-border)', borderRadius: '6px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Database Engine: SQLite in WAL Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Data is stored locally in <code>server/data/madina_pos.db</code> with automatic crash protection.</div>
            </div>
            <span className="badge badge-green" style={{ fontSize: '11px' }}>Active &amp; Healthy</span>
          </div>
        </div>
      )}

      {/* Sticky Save Bar */}
      <div style={{
        background: 'var(--aronium-tile-bg)',
        border: '1px solid var(--aronium-border)',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {saveStatus ? <span style={{ color: '#34d399', fontWeight: '700' }}>✓ {saveStatus}</span> : 'Remember to click Save Changes to persist adjustments.'}
        </span>
        <button type="button" onClick={handleSave} className="btn btn-primary" style={{ gap: '6px' }}>
          <Save size={16} /> Save Changes
        </button>
      </div>

    </div>
  );
}
