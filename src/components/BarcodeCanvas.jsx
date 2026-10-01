import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeCanvas({ value, width = 1.5, height = 45, fontSize = 12, displayValue = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, String(value), {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          font: 'monospace',
          fontSize: fontSize,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('Barcode render error:', err);
      }
    }
  }, [value, width, height, fontSize, displayValue]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />;
}
