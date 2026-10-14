import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, ShieldCheck, Settings, ExternalLink } from 'lucide-react';
import BarcodeCanvas from './BarcodeCanvas';
import { fetchAllSettings, fetchActivePrintTemplate } from '../services/settingsService';
import { printElementDirect } from '../services/printService';

export default function ThermalReceipt({ invoiceData, onClose, onOpenPrintEditor }) {
  const [paperSize, setPaperSize] = useState('80mm');
  const [systemSettings, setSystemSettings] = useState({});
  const [activeTemplate, setActiveTemplate] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    loadSettingsAndTemplate();
  }, []);

  const loadSettingsAndTemplate = async () => {
    try {
      const [s, t] = await Promise.all([
        fetchAllSettings(),
        fetchActivePrintTemplate()
      ]);
      setSystemSettings(s);
      setActiveTemplate(t);
      if (s && s.print_paper_size) {
        setPaperSize(s.print_paper_size);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!invoiceData) return null;

  const { sale, items, jobDetails } = invoiceData;

  const handlePrint = () => {
    // Direct native browser print: Uses @media print to render printable-receipt-area at (0,0)
    window.print();
  };

  const storeName = systemSettings.store_name || 'MADINA HONDA CENTRE';
  const storeTagline = systemSettings.store_tagline || 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS';
  const storeAddress = systemSettings.store_address || 'Circular Road, Near Bus Stand';
  const storePhone = systemSettings.store_phone || '0300-1234567';
  const storeNtn = systemSettings.store_ntn || 'NTN-7860123-4';
  const welcomeMsg = systemSettings.receipt_welcome || 'Thank you for choosing Madina Honda Centre!';
  const returnPolicy = systemSettings.receipt_disclaimer || 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt';

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
        <div className="modal-body" style={{ background: '#cbd5e1', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          
          {/* Printable Receipt Area - Tight zero margins in print */}
          <div
            ref={receiptRef}
            className={`printable-receipt-area paper-${paperSize}`}
            style={{
              background: '#ffffff',
              color: '#000000',
              padding: paperSize === '58mm' ? '6px 8px' : '10px 14px',
              borderRadius: '2px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontFamily: systemSettings.print_font_family || "'Courier New', Courier, monospace",
              fontSize: paperSize === '58mm' ? '9.5px' : (systemSettings.print_font_size || '11px'),
              lineHeight: systemSettings.print_line_spacing || '1.25',
              boxSizing: 'border-box'
            }}
          >
            
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: paperSize === '58mm' ? '12px' : '15px', fontWeight: '900', letterSpacing: '0.5px', margin: 0 }}>
                {storeName}
              </h2>
              <p style={{ fontSize: paperSize === '58mm' ? '8px' : '9.5px', fontWeight: '700', margin: '2px 0' }}>
                {storeTagline}
              </p>
              <p style={{ fontSize: paperSize === '58mm' ? '7.5px' : '8.5px', margin: 0, color: '#222' }}>
                {storeAddress} | Tel: {storePhone}
              </p>
              {storeNtn && (
                <p style={{ fontSize: '8px', margin: '1px 0 0', color: '#444' }}>
                  NTN: {storeNtn}
                </p>
              )}
            </div>

            {/* Invoice Meta */}
            <div style={{ fontSize: paperSize === '58mm' ? '8.5px' : '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span><strong>Inv #:</strong> {sale.invoice_number}</span>
              <span>{new Date(sale.created_at || Date.now()).toLocaleDateString()} {new Date(sale.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div style={{ fontSize: paperSize === '58mm' ? '8.5px' : '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span><strong>Type:</strong> {sale.stream ? sale.stream.toUpperCase() : 'RETAIL'}</span>
              <span><strong>Pay:</strong> {(sale.payment_method || 'CASH').toUpperCase()}</span>
            </div>

            {/* Customer & Vehicle Info (If In-House or Registered) */}
            {(sale.customer_name || jobDetails) && (
              <div style={{ fontSize: paperSize === '58mm' ? '8px' : '9px', background: '#f8fafc', border: '1px dotted #cbd5e1', padding: '4px 6px', borderRadius: '3px', marginBottom: '6px' }}>
                <div><strong>Customer:</strong> {sale.customer_name || (jobDetails && jobDetails.customer_name) || 'Walk-in'}</div>
                {jobDetails && (
                  <>
                    <div><strong>Bike:</strong> {jobDetails.vehicle_model} | <strong>Reg #:</strong> {jobDetails.reg_number}</div>
                    {jobDetails.chassis_number && <div><strong>Chassis #:</strong> {jobDetails.chassis_number}</div>}
                    {jobDetails.mechanic_name && <div><strong>Mechanic:</strong> {jobDetails.mechanic_name}</div>}
                  </>
                )}
              </div>
            )}

            {/* Line Items Table */}
            <table style={{ width: '100%', fontSize: paperSize === '58mm' ? '8.5px' : '10px', borderCollapse: 'collapse', marginBottom: '6px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '3px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '3px 0' }}>Qty</th>
                  {paperSize !== '58mm' && <th style={{ textAlign: 'right', padding: '3px 0' }}>Rate</th>}
                  <th style={{ textAlign: 'right', padding: '3px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items && items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                    <td style={{ padding: '2.5px 0' }}>
                      <div style={{ fontWeight: '700' }}>{it.name || it.part_name}</div>
                      {it.part_number && systemSettings.print_show_part_numbers !== 'false' && (
                        <div style={{ fontSize: '7.5px', color: '#555' }}>{it.part_number}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '2.5px 0' }}>{it.quantity}</td>
                    {paperSize !== '58mm' && <td style={{ textAlign: 'right', padding: '2.5px 0' }}>{it.unit_price}</td>}
                    <td style={{ textAlign: 'right', padding: '2.5px 0', fontWeight: '700' }}>{it.total_price}</td>
                  </tr>
                ))}

                {/* If Workshop, display Labor Line */}
                {jobDetails && jobDetails.dynamic_labor_amount > 0 && (
                  <tr style={{ borderBottom: '1px dotted #ccc', fontStyle: 'italic' }}>
                    <td style={{ padding: '2.5px 0' }}>
                      <div style={{ fontWeight: '700' }}>Work &amp; Labor Charges</div>
                      <div style={{ fontSize: '7.5px', color: '#555' }}>{jobDetails.work_type || 'Service'}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '2.5px 0' }}>1</td>
                    {paperSize !== '58mm' && <td style={{ textAlign: 'right', padding: '2.5px 0' }}>{jobDetails.dynamic_labor_amount}</td>}
                    <td style={{ textAlign: 'right', padding: '2.5px 0', fontWeight: '700' }}>{jobDetails.dynamic_labor_amount}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div style={{ fontSize: paperSize === '58mm' ? '9px' : '10.5px', borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>PKR {sale.subtotal}</span>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                  <span>Discount:</span>
                  <span>- PKR {sale.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: paperSize === '58mm' ? '11px' : '13px', marginTop: '3px', borderTop: '1px dashed #000', paddingTop: '3px' }}>
                <span>GRAND TOTAL:</span>
                <span>PKR {sale.grand_total}</span>
              </div>
              {sale.payment_method === 'cash' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginTop: '2px', color: '#333' }}>
                  <span>Cash Paid: PKR {sale.cash_tendered || sale.grand_total}</span>
                  <span>Change: PKR {sale.change_returned || 0}</span>
                </div>
              )}
            </div>

            {/* Gate Pass Slip for Workshop Releases */}
            {(sale.stream === 'inhouse' || jobDetails) && systemSettings.print_show_gate_pass !== 'false' && (
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '2px dashed #000', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '2px', fontSize: '8.5px', fontWeight: '800' }}>
                  <ShieldCheck size={11} /> OFFICIAL BIKE RELEASE GATE PASS
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: '800', marginTop: '3px' }}>
                  VEHICLE REG #: {jobDetails ? jobDetails.reg_number : 'N/A'}
                </div>
                <div style={{ fontSize: '7.5px', margin: '1px 0', color: '#333' }}>Security: Verify code before releasing motorcycle</div>
                
                {jobDetails && jobDetails.gate_pass_code && (
                  <div style={{ margin: '3px 0' }}>
                    <BarcodeCanvas value={jobDetails.gate_pass_code} height={28} width={paperSize === '58mm' ? 1.0 : 1.2} fontSize={9} />
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '6px', borderTop: '1px dotted #888', paddingTop: '4px', fontSize: paperSize === '58mm' ? '7.5px' : '8.5px' }}>
              <p style={{ margin: '1px 0' }}>{welcomeMsg}</p>
              <p style={{ margin: '1px 0', fontSize: '7.5px', color: '#444' }}>{returnPolicy}</p>
            </div>

          </div>
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
                title="Customize receipt HTML, CSS & fonts"
              >
                <Settings size={13} /> Edit Print Script
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ gap: '6px' }}>
              <Printer size={16} /> Print Receipt ({paperSize})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
