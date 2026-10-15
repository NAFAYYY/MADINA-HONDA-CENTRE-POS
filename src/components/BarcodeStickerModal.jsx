import React, { useState } from 'react';
import { Tag, Printer, X } from 'lucide-react';
import BarcodeCanvas from './BarcodeCanvas';
import { getBarcodeSvgString } from '../services/receiptConfig';
import { executeThermalPrint } from '../services/printService';

export default function BarcodeStickerModal({ product, onClose }) {
  const [printCount, setPrintCount] = useState(1);
  const [labelSize, setLabelSize] = useState('50x25'); // '50x25' or '40x30'
  const [isPrinting, setIsPrinting] = useState(false);

  if (!product) return null;

  const barcodeValue = product.barcode || product.part_number.replace(/[^a-zA-Z0-9]/g, '');

  const handlePrintLabels = async () => {
    try {
      setIsPrinting(true);
      const is50x25 = labelSize === '50x25';
      const widthMm = is50x25 ? 50 : 40;
      const heightMm = is50x25 ? 25 : 30;

      const barcodeSvg = getBarcodeSvgString(barcodeValue, {
        width: 1.0,
        height: 22,
        fontSize: 7.5
      });

      const singleStickerHtml = `
        <div style="
          width: ${widthMm}mm;
          height: ${heightMm}mm;
          box-sizing: border-box;
          padding: 1.5mm 2mm;
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, monospace;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          page-break-after: always;
          margin: 0 auto;
        ">
          <div style="font-size: 8px; font-weight: 900; letter-spacing: 0.3px; border-bottom: 1px solid #000; padding-bottom: 1px;">
            MADINA HONDA CENTRE
          </div>

          <div style="font-size: 7.5px; font-weight: 700; line-height: 1.1; margin: 1px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${product.name} (${product.model_compat || 'Honda'})
          </div>

          <div style="display: flex; justify-content: center; margin: 1px 0;">
            ${barcodeSvg}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; font-weight: 700; border-top: 1px solid #000; padding-top: 1px;">
            <span>${product.part_number}</span>
            <span style="font-size: 8.5px; font-weight: 900;">PKR ${product.retail_price}</span>
          </div>
        </div>
      `;

      const stickersArray = Array.from({ length: printCount }, () => singleStickerHtml);
      const allStickersHtml = `<div class="barcode-stickers-container">${stickersArray.join('')}</div>`;

      await executeThermalPrint(allStickersHtml, widthMm);
    } catch (err) {
      alert('Print error: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="modal-backdrop printing-active">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={18} color="var(--honda-red)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Barcode Sticker Generator</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Controls - Hidden in Print */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Sticker Size (mm)</label>
              <select
                className="form-select"
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
              >
                <option value="50x25">50mm × 25mm (Standard Roll)</option>
                <option value="40x30">40mm × 30mm (Compact Roll)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Number of Copies</label>
              <input
                type="number"
                min="1"
                max="200"
                className="form-input"
                value={printCount}
                onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
              >
              </input>
            </div>
          </div>

          {/* Sticker Preview Frame */}
          <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Thermal Sticker Live Preview
            </span>

            {/* Individual Sticker Card */}
            <div
              style={{
                width: labelSize === '50x25' ? '190px' : '160px',
                height: labelSize === '50x25' ? '100px' : '115px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '6px',
                padding: '6px 8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000000',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.3px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                MADINA HONDA CENTRE
              </div>

              <div style={{ fontSize: '8.5px', fontWeight: '700', lineHeight: 1.1, margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {product.name} ({product.model_compat || 'Honda'})
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '1px 0' }}>
                <BarcodeCanvas value={barcodeValue} width={1.1} height={25} fontSize={8} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontWeight: '700', borderTop: '1px solid #000', paddingTop: '2px' }}>
                <span>{product.part_number}</span>
                <span style={{ fontSize: '10px', fontWeight: '900' }}>PKR {product.retail_price}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
              Rack / Shelf: <strong>{product.shelf_location || 'Not Assigned'}</strong> | Category: <strong>{product.category}</strong>
            </p>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handlePrintLabels}
            disabled={isPrinting}
            className="btn btn-primary"
          >
            <Printer size={16} /> {isPrinting ? 'Spooling...' : `Print ${printCount} Sticker${printCount > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
