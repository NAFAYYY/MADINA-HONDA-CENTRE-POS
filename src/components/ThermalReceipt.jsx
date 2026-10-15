import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, Settings, CheckCircle2, Sparkles } from 'lucide-react';
import { fetchAllSettings } from '../services/settingsService';
import {
  fetchReceiptConfig,
  generateReceiptHtml,
  DEFAULT_RECEIPT_CONFIG
} from '../services/receiptConfig';
import { executeThermalPrint } from '../services/printService';

export default function ThermalReceipt({ invoiceData, onClose, onOpenPrintEditor }) {
  const [receiptConfig, setReceiptConfig] = useState(DEFAULT_RECEIPT_CONFIG);
  const [systemSettings, setSystemSettings] = useState({});
  const [paperSize, setPaperSize] = useState('80mm');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadSettingsAndConfig();
  }, []);

  const loadSettingsAndConfig = async () => {
    try {
      const [cfg, s] = await Promise.all([
        fetchReceiptConfig(),
        fetchAllSettings()
      ]);
      const activeConfig = cfg || DEFAULT_RECEIPT_CONFIG;
      setReceiptConfig(activeConfig);
      setSystemSettings(s || {});
      if (activeConfig.paper_size) {
        setPaperSize(activeConfig.paper_size);
      }
    } catch (err) {
      console.error('Error loading receipt layout configuration:', err);
    }
  };

  // Re-generate HTML dynamically when paperSize or config changes
  const activeConfig = useMemo(() => {
    return {
      ...receiptConfig,
      paper_size: paperSize,
      width_mm: paperSize === '58mm' ? 48 : (Number(receiptConfig.width_mm) || 72)
    };
  }, [receiptConfig, paperSize]);

  const receiptHtml = useMemo(() => {
    if (!invoiceData) return '';
    return generateReceiptHtml(activeConfig, invoiceData, systemSettings);
  }, [activeConfig, invoiceData, systemSettings]);

  if (!invoiceData) return null;

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await executeThermalPrint(receiptHtml, activeConfig.width_mm || 72);
    } catch (err) {
      alert('Print error: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="modal-backdrop printing-active">
      <div className="modal-content" style={{ maxWidth: paperSize === '58mm' ? '360px' : '450px' }}>
        
        {/* Header - Hidden in Print */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} color="var(--honda-red)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Thermal Bill &amp; Gate Pass</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Paper Size Quick Toggle */}
            <div style={{ display: 'flex', background: 'var(--aronium-bg)', borderRadius: '4px', border: '1px solid var(--aronium-border)', padding: '1px' }}>
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className="btn btn-sm"
                style={{
                  fontSize: '10px',
                  padding: '2px 7px',
                  background: paperSize === '80mm' ? 'var(--honda-red)' : 'transparent',
                  color: paperSize === '80mm' ? '#fff' : 'var(--text-dim)',
                  border: 'none'
                }}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className="btn btn-sm"
                style={{
                  fontSize: '10px',
                  padding: '2px 7px',
                  background: paperSize === '58mm' ? 'var(--honda-red)' : 'transparent',
                  color: paperSize === '58mm' ? '#fff' : 'var(--text-dim)',
                  border: 'none'
                }}
              >
                58mm
              </button>
            </div>

            <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body / Paper Container */}
        <div className="modal-body" style={{ background: '#cbd5e1', padding: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          
          {/* Thermal Paper Simulation with Serrated Tear Bottom */}
          <div
            className="thermal-roll-slip"
            style={{
              width: paperSize === '58mm' ? '200px' : '290px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
            dangerouslySetInnerHTML={{ __html: receiptHtml }}
          />

        </div>

        {/* Modal Footer - Hidden in Print */}
        <div className="modal-footer no-print" style={{ justifyContent: 'space-between' }}>
          <div>
            {onOpenPrintEditor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintEditor();
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '11px', gap: '4px' }}
                title="Open Visual Drag-and-Drop Receipt Designer"
              >
                <Settings size={13} /> Visual Receipt Editor
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <Printer size={16} /> {isPrinting ? 'Printing...' : `Print Receipt (${paperSize})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
