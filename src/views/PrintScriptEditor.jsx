import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer, ArrowLeft, Save, RotateCcw, Check, Eye, EyeOff,
  ChevronUp, ChevronDown, GripVertical, Sparkles, Sliders,
  Building2, FileText, User, ShoppingBag, Wrench, Calculator,
  ShieldCheck, MessageSquare, ZoomIn, ZoomOut, Zap,
  CheckCircle2, Layers, AlertCircle, Info, Type, Bold
} from 'lucide-react';
import {
  DEFAULT_RECEIPT_CONFIG,
  RECEIPT_PRESETS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  fetchReceiptConfig,
  saveReceiptConfig,
  generateReceiptHtml
} from '../services/receiptConfig';
import { executeThermalPrint } from '../services/printService';
import { fetchAllSettings } from '../services/settingsService';

export default function PrintScriptEditor({ onNavigateBack }) {
  const [config, setConfig] = useState(DEFAULT_RECEIPT_CONFIG);
  const [systemSettings, setSystemSettings] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('standard_retail');
  const [sampleDataType, setSampleDataType] = useState('workshop'); // 'workshop' or 'retail'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [saveStatus, setSaveStatus] = useState('');
  const [expandedBlockId, setExpandedBlockId] = useState('header');

  // Drag and Drop state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Load config & system settings on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cfg, s] = await Promise.all([
        fetchReceiptConfig(),
        fetchAllSettings()
      ]);
      setConfig(cfg || DEFAULT_RECEIPT_CONFIG);
      setSystemSettings(s || {});
    } catch (err) {
      console.error('Error initializing PrintScriptEditor:', err);
    }
  };

  // Sample data for live preview
  const sampleInvoice = useMemo(() => {
    if (sampleDataType === 'workshop') {
      return {
        sale: {
          invoice_number: 'INV-2026-0042',
          created_at: new Date().toISOString(),
          stream: 'inhouse',
          payment_method: 'cash',
          customer_name: 'Chaudhry Nadeem',
          subtotal: 1980,
          discount: 80,
          grand_total: 1900,
          cash_tendered: 2000,
          change_returned: 100,
        },
        items: [
          { name: 'Honda 4T 20W-50 Engine Oil (0.7L)', part_number: '08232-2MA-K1L', quantity: 1, unit_price: 850, total_price: 850 },
          { name: 'Spark Plug C7HSA (Genuine OEM)', part_number: '98056-57718', quantity: 1, unit_price: 340, total_price: 340 },
          { name: 'Clutch Wire Cable (Atlas Genuine)', part_number: '54011-098-000', quantity: 1, unit_price: 290, total_price: 290 }
        ],
        jobDetails: {
          customer_name: 'Chaudhry Nadeem',
          vehicle_model: 'Honda CG125 Special Edition',
          reg_number: 'LEM-24-9912',
          chassis_number: 'JC19E-881920',
          mechanic_name: 'Ustad Tariq (Senior)',
          work_type: 'Full Tuning & Tappet Adjustment',
          dynamic_labor_amount: 500,
          gate_pass_code: 'GP-9912-88'
        }
      };
    } else {
      return {
        sale: {
          invoice_number: 'INV-2026-0098',
          created_at: new Date().toISOString(),
          stream: 'retail',
          payment_method: 'cash',
          customer_name: 'Walk-in Retail Buyer',
          subtotal: 1300,
          discount: 0,
          grand_total: 1300,
          cash_tendered: 1500,
          change_returned: 200,
        },
        items: [
          { name: 'Air Filter Element CD70 (Atlas Genuine)', part_number: '17211-198-000', quantity: 1, unit_price: 380, total_price: 380 },
          { name: 'Brake Shoe Set Front (Atlas Honda)', part_number: '06430-KRF-B90', quantity: 2, unit_price: 460, total_price: 920 }
        ],
        jobDetails: null
      };
    }
  }, [sampleDataType]);

  // Live rendered receipt HTML
  const receiptHtml = useMemo(() => {
    return generateReceiptHtml(config, sampleInvoice, systemSettings);
  }, [config, sampleInvoice, systemSettings]);

  // Estimated physical height of receipt in millimeters
  const estimatedHeightMm = useMemo(() => {
    let mm = 6; // padding
    const blocks = config.blocks || [];
    for (const b of blocks) {
      if (!b.visible) continue;
      if (b.id === 'header') {
        mm += 6;
        if (b.show_tagline) mm += 3.5;
        if (b.show_address) mm += 3.5;
        if (b.show_phone) mm += 3.5;
        if (b.show_ntn) mm += 3;
      } else if (b.id === 'meta') {
        mm += 7;
      } else if (b.id === 'customer') {
        if (sampleInvoice.sale.customer_name || sampleInvoice.jobDetails) {
          mm += 6;
          if (b.show_bike && sampleInvoice.jobDetails) mm += 3.5;
          if (b.show_mechanic && sampleInvoice.jobDetails) mm += 3;
          if (b.show_chassis && sampleInvoice.jobDetails) mm += 3;
        }
      } else if (b.id === 'items') {
        mm += 5; // table header
        const count = sampleInvoice.items.length;
        mm += count * (b.show_part_numbers ? 6.5 : 4.5);
      } else if (b.id === 'labor') {
        if (sampleInvoice.jobDetails && sampleInvoice.jobDetails.dynamic_labor_amount > 0) mm += 4.5;
      } else if (b.id === 'totals') {
        mm += 6;
        if (b.show_subtotal) mm += 3.5;
        if (b.show_discount) mm += 3.5;
        if (b.show_cash_paid) mm += 3.5;
      } else if (b.id === 'gate_pass') {
        if (sampleInvoice.jobDetails && sampleInvoice.jobDetails.gate_pass_code) {
          mm += (b.barcode_height || 26) * 0.35 + 10;
        }
      } else if (b.id === 'footer') {
        if (b.show_greeting) mm += 3.5;
        if (b.show_disclaimer) mm += 3.5;
      }
    }
    return Math.round(mm);
  }, [config, sampleInvoice]);

  // 1-Click Preset Selection
  const handleSelectPreset = (key) => {
    const p = RECEIPT_PRESETS[key];
    if (p) {
      setConfig({ ...p.config });
      setSelectedPreset(key);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...config.blocks];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setConfig(prev => ({ ...prev, blocks: updated }));
    setDraggedIdx(null);
    setDragOverIdx(null);
    setSelectedPreset('custom');
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Button Reorder (Move Up / Down)
  const handleMoveBlock = (idx, step) => {
    const targetIdx = idx + step;
    if (targetIdx < 0 || targetIdx >= config.blocks.length) return;
    const updated = [...config.blocks];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setConfig(prev => ({ ...prev, blocks: updated }));
    setSelectedPreset('custom');
  };

  // Toggle block visibility
  const handleToggleBlockVisibility = (blockId) => {
    setConfig(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, visible: !b.visible } : b)
    }));
    setSelectedPreset('custom');
  };

  // Update specific block property
  const handleUpdateBlockProp = (blockId, prop, value) => {
    setConfig(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, [prop]: value } : b)
    }));
    setSelectedPreset('custom');
  };

  // Real Print Test using bulletproof isolated portal
  const handleTestPrint = async () => {
    try {
      await executeThermalPrint(receiptHtml, config.width_mm || 72);
    } catch (err) {
      alert('Print error: ' + err.message);
    }
  };

  // Save configuration
  const handleSave = async () => {
    try {
      setSaveStatus('Saving layout...');
      await saveReceiptConfig(config);
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      alert('Failed to save receipt layout: ' + err.message);
      setSaveStatus('');
    }
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm('Reset receipt layout back to Standard Factory Retail preset?')) {
      handleSelectPreset('standard_retail');
    }
  };

  // Icon mapping
  const getBlockIcon = (id) => {
    switch (id) {
      case 'header': return <Building2 size={16} color="#38bdf8" />;
      case 'meta': return <FileText size={16} color="#fbbf24" />;
      case 'customer': return <User size={16} color="#34d399" />;
      case 'items': return <ShoppingBag size={16} color="#f472b6" />;
      case 'labor': return <Wrench size={16} color="#a78bfa" />;
      case 'totals': return <Calculator size={16} color="#22c55e" />;
      case 'gate_pass': return <ShieldCheck size={16} color="#f87171" />;
      case 'footer': return <MessageSquare size={16} color="#94a3b8" />;
      default: return <Layers size={16} color="var(--honda-red)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* TOP ACTION BAR */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--honda-red)', color: '#fff', padding: '6px', borderRadius: '6px' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                Visual Receipt Designer &amp; Thermal Script Builder
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                100% Visual Drag &amp; Drop — Reorder sections, customize font size, weight &amp; family, eliminate paper waste.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleReset} className="btn btn-outline btn-sm" title="Restore standard defaults">
            <RotateCcw size={14} /> Reset
          </button>
          
          <button
            onClick={handleTestPrint}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Direct print to thermal printer using isolated zero-margin portal"
          >
            <Printer size={15} color="var(--honda-red)" /> Print Test Slip ({config.paper_size})
          </button>

          <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Save size={14} /> {saveStatus || 'Save Layout for POS'}
          </button>
        </div>
      </div>

      {/* QUICK PRESETS SELECTOR */}
      <div style={{
        background: 'var(--aronium-tile-bg)',
        border: '1px solid var(--aronium-border)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={14} color="#fbbf24" /> Instant Presets:
        </span>

        {Object.entries(RECEIPT_PRESETS).map(([k, p]) => (
          <button
            key={k}
            onClick={() => handleSelectPreset(k)}
            className={`preset-chip ${selectedPreset === k ? 'active' : ''}`}
            title={p.desc}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* TWO-COLUMN DESIGNER LAYOUT */}
      <div className="print-editor-container">

        {/* LEFT COLUMN: Visual Drag & Drop Block Builder */}
        <div className="print-editor-pane" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* GLOBAL TYPOGRAPHY & ROLL FORMATTING CARD */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--aronium-border)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={14} color="var(--honda-red)" /> Global Typography &amp; Roll Sizing
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Applies across all receipt blocks
              </span>
            </div>

            {/* Row 1: Font Family & Base Font Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>
                  Font Family
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '5px 8px' }}
                  value={config.font_family || 'monospace'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, font_family: e.target.value }));
                    setSelectedPreset('custom');
                  }}
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.note}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>
                  Base Text Size
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '5px 8px' }}
                  value={config.font_size || '10.5px'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, font_size: e.target.value }));
                    setSelectedPreset('custom');
                  }}
                >
                  {FONT_SIZES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>
                  Base Text Weight
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '5px 8px' }}
                  value={config.font_weight || '500'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, font_weight: e.target.value }));
                    setSelectedPreset('custom');
                  }}
                >
                  {FONT_WEIGHTS.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Roll Size, Printable Width, Density, Divider */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', paddingTop: '2px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Paper Roll Size</label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                  value={config.paper_size}
                  onChange={(e) => {
                    const size = e.target.value;
                    setConfig(prev => ({
                      ...prev,
                      paper_size: size,
                      width_mm: size === '58mm' ? 48 : 72
                    }));
                    setSelectedPreset('custom');
                  }}
                >
                  <option value="80mm">80mm Roll (Standard)</option>
                  <option value="58mm">58mm Roll (Mini POS)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Print Width (mm)</label>
                <input
                  type="number"
                  min="40"
                  max="80"
                  className="form-input"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                  value={config.width_mm}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, width_mm: Number(e.target.value) || 72 }));
                    setSelectedPreset('custom');
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Line Spacing</label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                  value={config.line_spacing || '1.2'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, line_spacing: e.target.value }));
                    setSelectedPreset('custom');
                  }}
                >
                  <option value="1.1">1.1 (Ultra Compact)</option>
                  <option value="1.2">1.2 (Standard)</option>
                  <option value="1.3">1.3 (Spacious)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Divider Style</label>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                  value={config.divider_style || 'dashed'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, divider_style: e.target.value }));
                    setSelectedPreset('custom');
                  }}
                >
                  <option value="dashed">Dashed (- - -)</option>
                  <option value="dotted">Dotted (. . .)</option>
                  <option value="solid">Solid (——)</option>
                  <option value="none">None (Zero Lines)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
              Receipt Layout Blocks (Drag ⠿ to Reorder):
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click block to expand typography &amp; toggles
            </span>
          </div>

          {/* DRAGGABLE BLOCKS LIST */}
          <div className="block-builder-list">
            {(config.blocks || []).map((b, idx) => {
              const isExpanded = expandedBlockId === b.id;
              const isDragging = draggedIdx === idx;
              const isDragOver = dragOverIdx === idx;

              return (
                <div
                  key={b.id}
                  className={`block-card ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Card Header Bar */}
                  <div className={`block-card-header ${isExpanded ? 'has-body' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        className="block-drag-handle"
                        title="Drag up or down to reorder"
                      >
                        <GripVertical size={16} />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBlockVisibility(b.id)}
                        className="btn btn-sm"
                        style={{
                          background: b.visible ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: b.visible ? '#22c55e' : '#f87171',
                          border: 'none',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={b.visible ? 'Visible on slip (Click to hide)' : 'Hidden from slip (Click to show)'}
                      >
                        {b.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        onClick={() => setExpandedBlockId(isExpanded ? null : b.id)}
                      >
                        {getBlockIcon(b.id)}
                        <span style={{
                          fontSize: '12.5px',
                          fontWeight: '700',
                          color: b.visible ? 'var(--text-main)' : 'var(--text-dim)',
                          textDecoration: b.visible ? 'none' : 'line-through'
                        }}>
                          {b.name}
                        </span>
                      </div>
                    </div>

                    {/* Up / Down Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, -1)}
                        disabled={idx === 0}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 5px', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ChevronUp size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 1)}
                        disabled={idx === config.blocks.length - 1}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 5px', opacity: idx === config.blocks.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Visual Block Settings */}
                  {isExpanded && (
                    <div className="block-card-body">
                      
                      {/* 1. Header Block Settings */}
                      {b.id === 'header' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '10px' }}>Custom Shop Title (Optional)</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={systemSettings.store_name || 'MADINA HONDA CENTRE'}
                              value={b.custom_title || ''}
                              onChange={(e) => handleUpdateBlockProp('header', 'custom_title', e.target.value)}
                              style={{ fontSize: '11px', padding: '4px 6px' }}
                            />
                          </div>

                          {/* Header Typography: Title Size & Weight */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Title Font Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.title_size || '14px'}
                                onChange={(e) => handleUpdateBlockProp('header', 'title_size', e.target.value)}
                              >
                                <option value="11px">11px (Small)</option>
                                <option value="12px">12px (Compact)</option>
                                <option value="13px">13px (Medium)</option>
                                <option value="14px">14px (Standard Large)</option>
                                <option value="16px">16px (Extra Large)</option>
                                <option value="18px">18px (Huge Header)</option>
                                <option value="20px">20px (Maximum)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Title Font Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.title_weight || '900'}
                                onChange={(e) => handleUpdateBlockProp('header', 'title_weight', e.target.value)}
                              >
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                                <option value="800">800 (Extra Bold)</option>
                                <option value="900">900 (Black / Ultra Heavy)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Alignment:</span>
                            {['left', 'center', 'right'].map(align => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => handleUpdateBlockProp('header', 'align', align)}
                                className="btn btn-sm"
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: (b.align || 'center') === align ? 'var(--honda-red)' : 'transparent',
                                  color: (b.align || 'center') === align ? '#fff' : 'var(--text-dim)',
                                  border: '1px solid var(--aronium-border)'
                                }}
                              >
                                {align.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_tagline !== false}
                                onChange={(e) => handleUpdateBlockProp('header', 'show_tagline', e.target.checked)}
                              />
                              Show Dealership Tagline
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_address !== false}
                                onChange={(e) => handleUpdateBlockProp('header', 'show_address', e.target.checked)}
                              />
                              Show Store Address
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_phone !== false}
                                onChange={(e) => handleUpdateBlockProp('header', 'show_phone', e.target.checked)}
                              />
                              Show Phone / WhatsApp
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_ntn !== false}
                                onChange={(e) => handleUpdateBlockProp('header', 'show_ntn', e.target.checked)}
                              />
                              Show NTN / Tax ID
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 2. Meta Block Settings */}
                      {b.id === 'meta' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.meta_size || '9.5px'}
                                onChange={(e) => handleUpdateBlockProp('meta', 'meta_size', e.target.value)}
                              >
                                <option value="8px">8px (Tiny)</option>
                                <option value="8.5px">8.5px (Compact)</option>
                                <option value="9.5px">9.5px (Standard)</option>
                                <option value="10.5px">10.5px (Large)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Text Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.meta_weight || '500'}
                                onChange={(e) => handleUpdateBlockProp('meta', 'meta_weight', e.target.value)}
                              >
                                <option value="400">400 (Regular)</option>
                                <option value="500">500 (Medium)</option>
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_date_time !== false}
                                onChange={(e) => handleUpdateBlockProp('meta', 'show_date_time', e.target.checked)}
                              />
                              Show Date &amp; Time
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_stream !== false}
                                onChange={(e) => handleUpdateBlockProp('meta', 'show_stream', e.target.checked)}
                              />
                              Show Sale Type
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_payment !== false}
                                onChange={(e) => handleUpdateBlockProp('meta', 'show_payment', e.target.checked)}
                              />
                              Show Payment Method
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 3. Customer Block Settings */}
                      {b.id === 'customer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.customer_size || '9px'}
                                onChange={(e) => handleUpdateBlockProp('customer', 'customer_size', e.target.value)}
                              >
                                <option value="8px">8px (Compact)</option>
                                <option value="9px">9px (Standard)</option>
                                <option value="10px">10px (Large)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Text Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.customer_weight || '500'}
                                onChange={(e) => handleUpdateBlockProp('customer', 'customer_weight', e.target.value)}
                              >
                                <option value="400">400 (Regular)</option>
                                <option value="500">500 (Medium)</option>
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_name !== false}
                                onChange={(e) => handleUpdateBlockProp('customer', 'show_name', e.target.checked)}
                              />
                              Customer Name &amp; Phone
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_bike !== false}
                                onChange={(e) => handleUpdateBlockProp('customer', 'show_bike', e.target.checked)}
                              />
                              Motorcycle Model &amp; Reg #
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_mechanic !== false}
                                onChange={(e) => handleUpdateBlockProp('customer', 'show_mechanic', e.target.checked)}
                              />
                              Assigned Mechanic Name
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_chassis === true}
                                onChange={(e) => handleUpdateBlockProp('customer', 'show_chassis', e.target.checked)}
                              />
                              Chassis Number
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 4. Items Table Settings */}
                      {b.id === 'items' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Typography: Table Size & Item Name Weight */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Table Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.table_font_size || '9.5px'}
                                onChange={(e) => handleUpdateBlockProp('items', 'table_font_size', e.target.value)}
                              >
                                <option value="8px">8px (Ultra Compact)</option>
                                <option value="8.5px">8.5px (Compact)</option>
                                <option value="9px">9px (Tight)</option>
                                <option value="9.5px">9.5px (Standard Retail)</option>
                                <option value="10.5px">10.5px (Large High-Legibility)</option>
                                <option value="11.5px">11.5px (Extra Large)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Item Title Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.item_name_weight || '700'}
                                onChange={(e) => handleUpdateBlockProp('items', 'item_name_weight', e.target.value)}
                              >
                                <option value="500">500 (Medium)</option>
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                                <option value="800">800 (Extra Bold Contrast)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_part_numbers !== false}
                                onChange={(e) => handleUpdateBlockProp('items', 'show_part_numbers', e.target.checked)}
                              />
                              Show Part Numbers (Uncheck to save ~25% paper!)
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_unit_rate !== false}
                                onChange={(e) => handleUpdateBlockProp('items', 'show_unit_rate', e.target.checked)}
                              />
                              Show Unit Rate Column
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 5. Labor Settings */}
                      {b.id === 'labor' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.labor_size || '9.5px'}
                                onChange={(e) => handleUpdateBlockProp('labor', 'labor_size', e.target.value)}
                              >
                                <option value="8.5px">8.5px (Compact)</option>
                                <option value="9.5px">9.5px (Standard)</option>
                                <option value="10.5px">10.5px (Large)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Amount Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.labor_weight || '600'}
                                onChange={(e) => handleUpdateBlockProp('labor', 'labor_weight', e.target.value)}
                              >
                                <option value="500">500 (Medium)</option>
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                              </select>
                            </div>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={b.show_work_type !== false}
                              onChange={(e) => handleUpdateBlockProp('labor', 'show_work_type', e.target.checked)}
                            />
                            Show Service Work Description
                          </label>
                        </div>
                      )}

                      {/* 6. Totals Settings */}
                      {b.id === 'totals' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Typography: Grand Total Size & Weight */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Grand Total Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.grand_total_size_px || '13.5px'}
                                onChange={(e) => handleUpdateBlockProp('totals', 'grand_total_size_px', e.target.value)}
                              >
                                <option value="10.5px">10.5px (Compact)</option>
                                <option value="12px">12px (Standard)</option>
                                <option value="13.5px">13.5px (Prominent Large)</option>
                                <option value="15px">15px (Extra Bold Large)</option>
                                <option value="17px">17px (Huge Contrast)</option>
                                <option value="19px">19px (Maximum Punch)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Grand Total Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.grand_total_weight || '900'}
                                onChange={(e) => handleUpdateBlockProp('totals', 'grand_total_weight', e.target.value)}
                              >
                                <option value="700">700 (Bold)</option>
                                <option value="800">800 (Extra Bold)</option>
                                <option value="900">900 (Black / Ultra Heavy)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_subtotal !== false}
                                onChange={(e) => handleUpdateBlockProp('totals', 'show_subtotal', e.target.checked)}
                              />
                              Show Subtotal Line
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_discount !== false}
                                onChange={(e) => handleUpdateBlockProp('totals', 'show_discount', e.target.checked)}
                              />
                              Show Discount Breakdown
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={b.show_cash_paid !== false}
                                onChange={(e) => handleUpdateBlockProp('totals', 'show_cash_paid', e.target.checked)}
                              />
                              Show Cash Received &amp; Change
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 7. Gate Pass Settings */}
                      {b.id === 'gate_pass' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Reg # Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.reg_size || '9.5px'}
                                onChange={(e) => handleUpdateBlockProp('gate_pass', 'reg_size', e.target.value)}
                              >
                                <option value="8.5px">8.5px (Compact)</option>
                                <option value="9.5px">9.5px (Standard)</option>
                                <option value="11px">11px (Large)</option>
                                <option value="12.5px">12.5px (Extra Bold)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Reg # Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.reg_weight || '900'}
                                onChange={(e) => handleUpdateBlockProp('gate_pass', 'reg_weight', e.target.value)}
                              >
                                <option value="700">700 (Bold)</option>
                                <option value="800">800 (Extra Bold)</option>
                                <option value="900">900 (Black / Ultra)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Barcode Height:</span>
                            {[20, 26, 32].map(h => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => handleUpdateBlockProp('gate_pass', 'barcode_height', h)}
                                className="btn btn-sm"
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: (b.barcode_height || 26) === h ? 'var(--honda-red)' : 'transparent',
                                  color: (b.barcode_height || 26) === h ? '#fff' : 'var(--text-dim)',
                                  border: '1px solid var(--aronium-border)'
                                }}
                              >
                                {h}px
                              </button>
                            ))}
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={b.show_security_note !== false}
                              onChange={(e) => handleUpdateBlockProp('gate_pass', 'show_security_note', e.target.checked)}
                            />
                            Show Security Verification Note
                          </label>
                        </div>
                      )}

                      {/* 8. Footer Settings */}
                      {b.id === 'footer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Footer Text Size</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.footer_size || '8.5px'}
                                onChange={(e) => handleUpdateBlockProp('footer', 'footer_size', e.target.value)}
                              >
                                <option value="7px">7px (Micro)</option>
                                <option value="7.5px">7.5px (Tiny)</option>
                                <option value="8.5px">8.5px (Standard)</option>
                                <option value="9.5px">9.5px (Large)</option>
                              </select>
                            </div>

                            <div>
                              <label className="form-label" style={{ fontSize: '10px' }}>Greeting Weight</label>
                              <select
                                className="form-select"
                                style={{ fontSize: '10.5px', padding: '3px 6px' }}
                                value={b.greeting_weight || '600'}
                                onChange={(e) => handleUpdateBlockProp('footer', 'greeting_weight', e.target.value)}
                              >
                                <option value="400">400 (Regular)</option>
                                <option value="500">500 (Medium)</option>
                                <option value="600">600 (Semi-Bold)</option>
                                <option value="700">700 (Bold)</option>
                              </select>
                            </div>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={b.show_greeting !== false}
                              onChange={(e) => handleUpdateBlockProp('footer', 'show_greeting', e.target.checked)}
                            />
                            Show Thank You Greeting
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={b.show_disclaimer !== false}
                              onChange={(e) => handleUpdateBlockProp('footer', 'show_disclaimer', e.target.checked)}
                            />
                            Show Return Policy &amp; Warranty Terms
                          </label>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: Realistic Live Paper Roll Simulation */}
        <div className="print-editor-pane" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Preview Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={15} color="var(--honda-red)" /> Live Roll Output
              </span>

              {/* Estimated Paper Length Badge */}
              <span style={{
                background: estimatedHeightMm < 60 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: estimatedHeightMm < 60 ? '#22c55e' : '#38bdf8',
                border: `1px solid ${estimatedHeightMm < 60 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: '700'
              }}>
                📏 ~{estimatedHeightMm} mm Length {estimatedHeightMm < 60 ? '(Zero-Waste ⚡)' : ''}
              </span>
            </div>

            {/* Test Transaction Switcher & Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                className="form-select"
                style={{ fontSize: '11px', padding: '3px 6px' }}
                value={sampleDataType}
                onChange={(e) => setSampleDataType(e.target.value)}
              >
                <option value="workshop">Workshop Bill + Gate Pass</option>
                <option value="retail">Counter Retail Sale</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 5px' }}
                >
                  <ZoomOut size={12} />
                </button>
                <span style={{ fontSize: '10px', minWidth: '32px', textAlign: 'center' }}>{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 5px' }}
                >
                  <ZoomIn size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Thermal Stage Container */}
          <div className="thermal-preview-stage">
            <div
              className={`thermal-roll-slip paper-${config.paper_size}`}
              style={{
                width: config.paper_size === '58mm' ? '180px' : '280px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease'
              }}
              dangerouslySetInnerHTML={{ __html: receiptHtml }}
            />
          </div>

          {/* Footer Note */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} color="#22c55e" /> Zero margin print portal active (BC-95AC Ready)
            </span>
            <span>
              Click <strong>"Print Test Slip"</strong> above to test physical paper cut
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
