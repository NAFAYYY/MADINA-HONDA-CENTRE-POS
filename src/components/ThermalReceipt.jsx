import React from 'react';
import { Printer, CheckCircle, X, ShieldCheck } from 'lucide-react';
import BarcodeCanvas from './BarcodeCanvas';

export default function ThermalReceipt({ invoiceData, onClose }) {
  if (!invoiceData) return null;

  const { sale, items, jobDetails } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} color="var(--honda-red)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Thermal Bill & Gate Pass</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc', color: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
          {/* Thermal Paper Representation */}
          <div className="printable-receipt-area" style={{ background: '#ffffff', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '4px' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', margin: 0 }}>MADINA HONDA CENTRE</h2>
              <p style={{ fontSize: '10px', fontWeight: '700', margin: '2px 0' }}>AUTHORIZED 3S SALES, SERVICE & SPARE PARTS</p>
              <p style={{ fontSize: '9px', margin: 0 }}>Circular Road, Near Bus Stand | Tel: 0300-1234567</p>
            </div>

            {/* Invoice Meta */}
            <div style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span><strong>Inv #:</strong> {sale.invoice_number}</span>
              <span>{new Date(sale.created_at || Date.now()).toLocaleDateString()} {new Date(sale.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span><strong>Type:</strong> {sale.stream ? sale.stream.toUpperCase() : 'RETAIL'}</span>
              <span><strong>Pay:</strong> {(sale.payment_method || 'CASH').toUpperCase()}</span>
            </div>

            {/* Customer & Vehicle Info (If In-House or Registered) */}
            {(sale.customer_name || jobDetails) && (
              <div style={{ fontSize: '9px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '3px', marginBottom: '8px' }}>
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
            <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '3px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '3px 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '3px 0' }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '3px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items && items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                    <td style={{ padding: '3px 0' }}>
                      <div style={{ fontWeight: '600' }}>{it.name || it.part_name}</div>
                      <div style={{ fontSize: '8px', color: '#555' }}>{it.part_number}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{it.unit_price}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: '600' }}>{it.total_price}</td>
                  </tr>
                ))}

                {/* If Workshop, display Labor Line */}
                {jobDetails && jobDetails.dynamic_labor_amount > 0 && (
                  <tr style={{ borderBottom: '1px dotted #ccc', fontStyle: 'italic' }}>
                    <td style={{ padding: '3px 0' }}>
                      <div style={{ fontWeight: '600' }}>Work & Labor Charges</div>
                      <div style={{ fontSize: '8px', color: '#555' }}>{jobDetails.work_type || 'Service'}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>1</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{jobDetails.dynamic_labor_amount}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: '600' }}>{jobDetails.dynamic_labor_amount}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div style={{ fontSize: '11px', borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '8px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '13px', marginTop: '4px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
                <span>GRAND TOTAL:</span>
                <span>PKR {sale.grand_total}</span>
              </div>
              {sale.payment_method === 'cash' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '3px' }}>
                  <span>Cash Paid: PKR {sale.cash_tendered || sale.grand_total}</span>
                  <span>Change: PKR {sale.change_returned || 0}</span>
                </div>
              )}
            </div>

            {/* Gate Pass Slip for Workshop Releases */}
            {(sale.stream === 'inhouse' || jobDetails) && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '2px dashed #000', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontWeight: '800' }}>
                  <ShieldCheck size={12} /> OFFICIAL BIKE RELEASE GATE PASS
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '4px' }}>
                  VEHICLE REG #: {jobDetails ? jobDetails.reg_number : 'N/A'}
                </div>
                <div style={{ fontSize: '8px', margin: '2px 0' }}>Security: Verify code before releasing motorcycle</div>
                
                {jobDetails && jobDetails.gate_pass_code && (
                  <div style={{ margin: '4px 0' }}>
                    <BarcodeCanvas value={jobDetails.gate_pass_code} height={35} width={1.3} fontSize={10} />
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '8px', borderTop: '1px dotted #ccc', paddingTop: '6px', fontSize: '8px' }}>
              <p>Thank you for choosing Madina Honda Centre!</p>
              <p>Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt</p>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Print Thermal Slip (80mm)
          </button>
        </div>
      </div>
    </div>
  );
}
