import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer, Code2, Palette, FileText, Check, RotateCcw,
  Eye, ZoomIn, ZoomOut, Save, Sparkles, Layers, ShieldCheck,
  Tag, AlertCircle, HelpCircle, ArrowLeft
} from 'lucide-react';
import BarcodeCanvas from '../components/BarcodeCanvas';
import {
  fetchPrintTemplates,
  savePrintTemplate,
  activateTemplate,
  resetSystemDefaults,
  fetchAllSettings
} from '../services/settingsService';
import { printThermalDocument } from '../services/printService';

export default function PrintScriptEditor({ onNavigateBack }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_80mm_standard');
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'variables'
  const [paperPreview, setPaperPreview] = useState('80mm'); // '80mm', '58mm', 'a4'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [sampleDataType, setSampleDataType] = useState('workshop'); // 'workshop' or 'retail'
  const [saveStatus, setSaveStatus] = useState('');
  const [systemSettings, setSystemSettings] = useState({});

  // Current active draft
  const [draftName, setDraftName] = useState('');
  const [draftPaperSize, setDraftPaperSize] = useState('80mm');
  const [draftWidthMm, setDraftWidthMm] = useState(72);
  const [draftHtml, setDraftHtml] = useState('');
  const [draftCss, setDraftCss] = useState('');

  const previewFrameRef = useRef(null);

  // Load templates & settings on mount
  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await fetchAllSettings();
    setSystemSettings(s);
  };

  const loadTemplates = async () => {
    try {
      const data = await fetchPrintTemplates();
      setTemplates(data.templates || []);
      const active = data.active || data.templates[0];
      if (active) {
        selectTemplate(active);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setDraftName(tpl.name);
    setDraftPaperSize(tpl.paper_size || '80mm');
    setDraftWidthMm(tpl.receipt_width_mm || (tpl.paper_size === '58mm' ? 48 : 72));
    setDraftHtml(tpl.html_template);
    setDraftCss(tpl.custom_css);
    setPaperPreview(tpl.paper_size || '80mm');
  };

  const handleSelectTemplateChange = (id) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl) selectTemplate(tpl);
  };

  // Sample data for live preview
  const sampleInvoice = useMemo(() => {
    if (sampleDataType === 'workshop') {
      return {
        store_name: systemSettings.store_name || 'MADINA HONDA CENTRE',
        store_tagline: systemSettings.store_tagline || 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS',
        store_address: systemSettings.store_address || 'Circular Road, Near Bus Stand',
        store_phone: systemSettings.store_phone || '0300-1234567',
        store_ntn: systemSettings.store_ntn || 'NTN-7860123-4',
        invoice_no: 'INV-2026-0042',
        invoice_date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sale_type: 'WORKSHOP SERVICE',
        payment_method: 'CASH',
        customer_name: 'Chaudhry Nadeem',
        customer_phone: '0300-9876543',
        bike_model: 'Honda CG125 Special Edition',
        reg_number: 'LEM-24-9912',
        chassis_number: 'JC19E-881920',
        mechanic_name: 'Ustad Tariq (Senior)',
        items: [
          { name: 'Honda 4T 20W-50 Engine Oil (0.7L)', code: '08232-2MA-K1L', qty: 1, rate: 850, total: 850 },
          { name: 'Spark Plug C7HSA (Genuine OEM)', code: '98056-57718', qty: 1, rate: 340, total: 340 },
          { name: 'Clutch Wire Cable (Atlas Genuine)', code: '54011-098-000', qty: 1, rate: 290, total: 290 }
        ],
        labor_title: 'Full Tuning & Tappet Adjustment',
        labor_amount: 500,
        subtotal: 1980,
        discount: 80,
        grand_total: 1900,
        cash_paid: 2000,
        change_due: 100,
        gate_pass_code: 'GP-9912-88',
        footer_message: systemSettings.receipt_welcome || 'Thank you for choosing Madina Honda Centre!',
        return_policy: systemSettings.receipt_disclaimer || 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt'
      };
    } else {
      return {
        store_name: systemSettings.store_name || 'MADINA HONDA CENTRE',
        store_tagline: systemSettings.store_tagline || 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS',
        store_address: systemSettings.store_address || 'Circular Road, Near Bus Stand',
        store_phone: systemSettings.store_phone || '0300-1234567',
        store_ntn: systemSettings.store_ntn || 'NTN-7860123-4',
        invoice_no: 'INV-2026-0098',
        invoice_date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sale_type: 'COUNTER RETAIL',
        payment_method: 'CASH',
        customer_name: 'Walk-in Retail Buyer',
        customer_phone: 'N/A',
        bike_model: 'Honda CD70',
        reg_number: 'N/A',
        chassis_number: '',
        mechanic_name: '',
        items: [
          { name: 'Air Filter Element CD70 (Atlas Genuine)', code: '17211-198-000', qty: 1, rate: 380, total: 380 },
          { name: 'Brake Shoe Set Front (Atlas Honda)', code: '06430-KRF-B90', qty: 2, rate: 460, total: 920 }
        ],
        labor_title: '',
        labor_amount: 0,
        subtotal: 1300,
        discount: 0,
        grand_total: 1300,
        cash_paid: 1500,
        change_due: 200,
        gate_pass_code: '',
        footer_message: systemSettings.receipt_welcome || 'Thank you for choosing Madina Honda Centre!',
        return_policy: systemSettings.receipt_disclaimer || 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt'
      };
    }
  }, [sampleDataType, systemSettings]);

  // Replace placeholders in HTML template with sample data
  const renderedHtml = useMemo(() => {
    let html = draftHtml || '';
    if (!html) return '<div style="padding:10px;text-align:center;">Empty Template</div>';

    // Replace basic scalars
    html = html.replace(/\{\{store_name\}\}/g, sampleInvoice.store_name);
    html = html.replace(/\{\{store_tagline\}\}/g, sampleInvoice.store_tagline);
    html = html.replace(/\{\{store_address\}\}/g, sampleInvoice.store_address);
    html = html.replace(/\{\{store_phone\}\}/g, sampleInvoice.store_phone);
    html = html.replace(/\{\{store_ntn\}\}/g, sampleInvoice.store_ntn);
    html = html.replace(/\{\{invoice_no\}\}/g, sampleInvoice.invoice_no);
    html = html.replace(/\{\{invoice_date\}\}/g, sampleInvoice.invoice_date);
    html = html.replace(/\{\{sale_type\}\}/g, sampleInvoice.sale_type);
    html = html.replace(/\{\{payment_method\}\}/g, sampleInvoice.payment_method);
    html = html.replace(/\{\{subtotal\}\}/g, sampleInvoice.subtotal);
    html = html.replace(/\{\{discount\}\}/g, sampleInvoice.discount);
    html = html.replace(/\{\{grand_total\}\}/g, sampleInvoice.grand_total);
    html = html.replace(/\{\{cash_paid\}\}/g, sampleInvoice.cash_paid);
    html = html.replace(/\{\{change_due\}\}/g, sampleInvoice.change_due);
    html = html.replace(/\{\{footer_message\}\}/g, sampleInvoice.footer_message);
    html = html.replace(/\{\{return_policy\}\}/g, sampleInvoice.return_policy);

    // Customer & Vehicle Block
    if (sampleInvoice.customer_name || sampleInvoice.bike_model) {
      const custBlock = `
        <div class="customer-info-box">
          <div><strong>Customer:</strong> ${sampleInvoice.customer_name} ${sampleInvoice.customer_phone !== 'N/A' ? `(${sampleInvoice.customer_phone})` : ''}</div>
          ${sampleInvoice.bike_model ? `<div><strong>Bike:</strong> ${sampleInvoice.bike_model} | <strong>Reg:</strong> ${sampleInvoice.reg_number}</div>` : ''}
          ${sampleInvoice.mechanic_name ? `<div><strong>Mechanic:</strong> ${sampleInvoice.mechanic_name}</div>` : ''}
        </div>
      `;
      html = html.replace(/\{\{customer_vehicle_block\}\}/g, custBlock);
    } else {
      html = html.replace(/\{\{customer_vehicle_block\}\}/g, '');
    }

    // Items rows
    const itemsHtml = sampleInvoice.items.map(it => `
      <tr>
        <td>
          <div class="item-title">${it.name}</div>
          ${it.code ? `<div class="item-code">${it.code}</div>` : ''}
        </td>
        <td style="text-align: center;">${it.qty}</td>
        ${draftPaperSize === '58mm' ? '' : `<td style="text-align: right;">${it.rate}</td>`}
        <td style="text-align: right; font-weight: 700;">${it.total}</td>
      </tr>
    `).join('');
    html = html.replace(/\{\{items_rows\}\}/g, itemsHtml);

    // Labor row
    if (sampleInvoice.labor_amount > 0) {
      const laborHtml = `
        <tr style="font-style: italic;">
          <td>
            <div class="item-title">Labor &amp; Service Charges</div>
            <div class="item-code">${sampleInvoice.labor_title}</div>
          </td>
          <td style="text-align: center;">1</td>
          ${draftPaperSize === '58mm' ? '' : `<td style="text-align: right;">${sampleInvoice.labor_amount}</td>`}
          <td style="text-align: right; font-weight: 700;">${sampleInvoice.labor_amount}</td>
        </tr>
      `;
      html = html.replace(/\{\{labor_row\}\}/g, laborHtml);
    } else {
      html = html.replace(/\{\{labor_row\}\}/g, '');
    }

    // Discount block
    if (sampleInvoice.discount > 0) {
      html = html.replace(/\{\{discount_block\}\}/g, `
        <div class="ticket-row" style="color: #b91c1c;">
          <span>Discount:</span>
          <span>- PKR ${sampleInvoice.discount}</span>
        </div>
      `);
    } else {
      html = html.replace(/\{\{discount_block\}\}/g, '');
    }

    // Cash tendered block
    if (sampleInvoice.payment_method === 'CASH') {
      html = html.replace(/\{\{cash_tendered_block\}\}/g, `
        <div class="ticket-row" style="font-size: 9px; margin-top: 3px;">
          <span>Cash Paid: PKR ${sampleInvoice.cash_paid}</span>
          <span>Change: PKR ${sampleInvoice.change_due}</span>
        </div>
      `);
    } else {
      html = html.replace(/\{\{cash_tendered_block\}\}/g, '');
    }

    // Gate Pass Block
    if (sampleInvoice.gate_pass_code) {
      const gatePassHtml = `
        <div class="gate-pass-box">
          <div class="gate-pass-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            OFFICIAL BIKE RELEASE GATE PASS
          </div>
          <div style="font-size: 10px; font-weight: 800; margin: 3px 0;">
            VEHICLE REG: ${sampleInvoice.reg_number}
          </div>
          <div style="font-size: 8px; color: #333;">Security: Scan/Verify Code before exiting</div>
          <div style="margin: 4px 0; font-family: monospace; font-weight: 900; letter-spacing: 2px; font-size: 12px; border: 1px solid #000; display: inline-block; padding: 2px 8px; background: #fafafa;">
            *${sampleInvoice.gate_pass_code}*
          </div>
        </div>
      `;
      html = html.replace(/\{\{gate_pass_block\}\}/g, gatePassHtml);
    } else {
      html = html.replace(/\{\{gate_pass_block\}\}/g, '');
    }

    return html;
  }, [draftHtml, sampleInvoice, draftPaperSize]);

  // Insert a variable tag at the cursor
  const handleInsertTag = (tag) => {
    setDraftHtml(prev => prev + tag);
  };

  // Save current template
  const handleSaveTemplate = async () => {
    try {
      setSaveStatus('Saving...');
      await savePrintTemplate({
        id: selectedTemplateId,
        name: draftName,
        paper_size: draftPaperSize,
        receipt_width_mm: Number(draftWidthMm) || 72,
        html_template: draftHtml,
        custom_css: draftCss,
        is_active: 1
      });
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
      loadTemplates();
    } catch (err) {
      alert('Save error: ' + err.message);
      setSaveStatus('');
    }
  };

  // Set active template
  const handleActivate = async () => {
    try {
      await activateTemplate(selectedTemplateId);
      alert(`"${draftName}" is now the active print template for all POS receipts.`);
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  // Reset to factory defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all print scripts and system templates to original factory presets? Custom changes will be restored.')) {
      return;
    }
    try {
      await resetSystemDefaults();
      alert('Restored factory default print templates!');
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  // Real Print Test using direct native browser print with zero margins
  const handleTestPrint = () => {
    window.print();
  };

  const placeholders = [
    { tag: '{{store_name}}', desc: 'Shop Name (Madina Honda Centre)' },
    { tag: '{{store_tagline}}', desc: '3S Dealership Subtitle' },
    { tag: '{{store_address}}', desc: 'Store Location Address' },
    { tag: '{{store_phone}}', desc: 'Shop Mobile / Tel' },
    { tag: '{{store_ntn}}', desc: 'Tax / NTN Number' },
    { tag: '{{invoice_no}}', desc: 'Invoice Number' },
    { tag: '{{invoice_date}}', desc: 'Formatted Date & Time' },
    { tag: '{{sale_type}}', desc: 'Counter / Workshop / Wholesale' },
    { tag: '{{payment_method}}', desc: 'Cash / JazzCash / Khata' },
    { tag: '{{customer_vehicle_block}}', desc: 'Customer, Bike Model, Reg #' },
    { tag: '{{items_rows}}', desc: 'Dynamic Line Items Table' },
    { tag: '{{labor_row}}', desc: 'Dynamic Workshop Labor Charge' },
    { tag: '{{subtotal}}', desc: 'Raw Items Subtotal' },
    { tag: '{{discount_block}}', desc: 'Rupees / % Discount Line' },
    { tag: '{{grand_total}}', desc: 'Final Payable Amount' },
    { tag: '{{cash_tendered_block}}', desc: 'Cash Tendered & Change' },
    { tag: '{{gate_pass_block}}', desc: 'Official Barcoded Gate Pass' },
    { tag: '{{footer_message}}', desc: 'Greeting / Thank You Message' },
    { tag: '{{return_policy}}', desc: 'Receipt Terms & Conditions' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Action Bar */}
      <div style={{
        background: 'var(--aronium-tile-bg)',
        border: '1px solid var(--aronium-border)',
        borderRadius: '8px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigateBack && (
            <button onClick={onNavigateBack} className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--honda-red)', color: '#fff', padding: '6px', borderRadius: '6px' }}>
              <Code2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                Thermal Print Script &amp; Template Editor
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Live HTML &amp; CSS thermal receipt designer with real-time zero-margin roll preview
              </p>
            </div>
          </div>
        </div>

        {/* Template Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplateChange(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 10px', maxWidth: '240px' }}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.paper_size}) {t.is_active === 1 ? '★ Active' : ''}
              </option>
            ))}
          </select>

          <button onClick={handleTestPrint} className="btn btn-secondary btn-sm" title="Print real test bill on thermal printer">
            <Printer size={14} /> Print Test Slip
          </button>

          <button onClick={handleActivate} className="btn btn-outline btn-sm" title="Set this template as default for all POS prints">
            <Check size={14} /> Set as Active
          </button>

          <button onClick={handleResetDefaults} className="btn btn-outline btn-sm" title="Reset to factory preset">
            <RotateCcw size={14} /> Reset
          </button>

          <button onClick={handleSaveTemplate} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Save size={14} /> {saveStatus || 'Save Print Script'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="print-editor-container">

        {/* LEFT COLUMN: Code Editor Tabs */}
        <div className="print-editor-pane" style={{ padding: '16px' }}>
          
          {/* Template Meta Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '11px' }}>Template Name</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '12px', padding: '6px 8px' }}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '11px' }}>Paper Size</label>
              <select
                className="form-select"
                style={{ fontSize: '12px', padding: '6px 8px' }}
                value={draftPaperSize}
                onChange={(e) => {
                  setDraftPaperSize(e.target.value);
                  setPaperPreview(e.target.value);
                  if (e.target.value === '58mm') setDraftWidthMm(48);
                  else if (e.target.value === '80mm') setDraftWidthMm(72);
                  else setDraftWidthMm(190);
                }}
              >
                <option value="80mm">80mm Roll (Standard POS)</option>
                <option value="58mm">58mm Roll (Mini POS)</option>
                <option value="a4">A4 Full Page</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '11px' }}>Printable Width (mm)</label>
              <input
                type="number"
                min="40"
                max="210"
                className="form-input"
                style={{ fontSize: '12px', padding: '6px 8px' }}
                value={draftWidthMm}
                onChange={(e) => setDraftWidthMm(e.target.value)}
              />
            </div>
          </div>

          {/* Editor Mode Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--aronium-border)', paddingBottom: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('html')}
              className={`btn btn-sm ${activeTab === 'html' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px' }}
            >
              <Code2 size={13} /> HTML Template Structure
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`btn btn-sm ${activeTab === 'css' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px' }}
            >
              <Palette size={13} /> Custom CSS Stylesheet
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              className={`btn btn-sm ${activeTab === 'variables' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px' }}
            >
              <Tag size={13} /> Dynamic Placeholders ({placeholders.length})
            </button>
          </div>

          {/* TAB 1: HTML TEMPLATE */}
          {activeTab === 'html' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Enter HTML tags and curly-brace variables. Click any tag below to insert:
                </span>
              </div>

              {/* Quick Tag Insert Strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '70px', overflowY: 'auto', padding: '4px 0' }}>
                {placeholders.slice(0, 10).map(p => (
                  <span
                    key={p.tag}
                    className="placeholder-tag"
                    onClick={() => handleInsertTag(p.tag)}
                    title={`Click to append: ${p.desc}`}
                  >
                    + {p.tag}
                  </span>
                ))}
              </div>

              <textarea
                className="code-editor-area"
                value={draftHtml}
                onChange={(e) => setDraftHtml(e.target.value)}
                rows={16}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 2: CUSTOM CSS */}
          {activeTab === 'css' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target classes: <code>.thermal-ticket</code>, <code>.ticket-header</code>, <code>.items-table</code>, <code>.grand-total-row</code>, <code>.gate-pass-box</code>
              </div>
              <textarea
                className="code-editor-area"
                value={draftCss}
                onChange={(e) => setDraftCss(e.target.value)}
                rows={18}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 3: PLACEHOLDERS REFERENCE */}
          {activeTab === 'variables' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                Click any placeholder variable below to insert it directly into your HTML template:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                {placeholders.map(p => (
                  <div
                    key={p.tag}
                    onClick={() => {
                      handleInsertTag(p.tag);
                      setActiveTab('html');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--aronium-border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--honda-red)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--aronium-border)'}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: '#fb7185' }}>
                      {p.tag}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--aronium-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ⚡ Changes reflect in real time on the live receipt preview to the right.
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Interactive Thermal Slip Preview */}
        <div className="print-editor-pane" style={{ padding: '16px' }}>
          
          {/* Preview Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} color="var(--honda-red)" /> Live Roll Preview
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ({paperPreview} / {draftWidthMm}mm)
              </span>
            </div>

            {/* Test Data & Size Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                className="form-select"
                style={{ fontSize: '11px', padding: '3px 6px' }}
                value={sampleDataType}
                onChange={(e) => setSampleDataType(e.target.value)}
                title="Switch test transaction data"
              >
                <option value="workshop">Workshop Job + Gate Pass</option>
                <option value="retail">Counter Retail Sale</option>
              </select>

              <div style={{ display: 'flex', background: 'var(--aronium-bg)', borderRadius: '4px', border: '1px solid var(--aronium-border)', padding: '1px' }}>
                <button
                  onClick={() => setPaperPreview('80mm')}
                  className="btn btn-sm"
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: paperPreview === '80mm' ? 'var(--honda-red)' : 'transparent',
                    color: paperPreview === '80mm' ? '#fff' : 'var(--text-dim)',
                    border: 'none'
                  }}
                >
                  80mm
                </button>
                <button
                  onClick={() => setPaperPreview('58mm')}
                  className="btn btn-sm"
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: paperPreview === '58mm' ? 'var(--honda-red)' : 'transparent',
                    color: paperPreview === '58mm' ? '#fff' : 'var(--text-dim)',
                    border: 'none'
                  }}
                >
                  58mm
                </button>
              </div>

              {/* Zoom Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 5px' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={12} />
                </button>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', minWidth: '32px', textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 5px' }}
                  title="Zoom In"
                >
                  <ZoomIn size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Thermal Paper Simulation Container */}
          <div className="thermal-preview-stage">
            <style>{draftCss}</style>
            
            <div
              className={`thermal-roll-slip printable-receipt-area paper-${paperPreview}`}
              style={{
                width: paperPreview === '58mm' ? '180px' : paperPreview === 'a4' ? '460px' : '280px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
                padding: '10px 12px'
              }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>

          {/* Bottom Info Bar */}
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Auto paper-cut active after last footer line.</span>
            <span>Zero top &amp; bottom margins configured.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
