// Production Thermal Print Service for Madina Honda Centre POS
// Uses an isolated hidden iframe to guarantee zero DOM pollution, zero margin leaks,
// and perfect auto-cutting on continuous thermal rolls (e.g. BC-95AC, Xprinter, Epson TM-T88)

export function printThermalDocument({
  htmlContent,
  customCss = '',
  paperSize = '80mm',
  receiptWidthMm = 72,
  title = 'Thermal Receipt'
}) {
  return new Promise((resolve) => {
    // 1. Get or create hidden print iframe
    let iframe = document.getElementById('pos-thermal-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'pos-thermal-print-iframe';
      iframe.name = 'pos-thermal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const widthMm = paperSize === '58mm' ? 48 : (Number(receiptWidthMm) || 72);

    // 2. Build clean, standalone printable HTML document
    const printDoc = iframe.contentWindow || iframe.contentDocument;
    const doc = printDoc.document || printDoc;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            /* Reset all margins and specify dynamic thermal length */
            @page {
              margin: 0mm !important;
              size: ${paperSize === '58mm' ? '58mm auto' : paperSize === 'a4' ? 'A4 portrait' : '80mm auto'};
            }
            *, *::before, *::after {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              max-height: fit-content !important;
              overflow: visible !important;
              font-family: 'Courier New', Courier, monospace;
            }

            /* Container sizing */
            .printable-wrapper {
              width: ${widthMm}mm;
              max-width: 100%;
              margin: 0 auto;
              padding: 1mm 2mm;
              background: #ffffff;
              color: #000000;
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            .printable-wrapper svg {
              max-width: 100%;
              height: auto;
            }

            /* User custom styles */
            ${customCss || ''}
          </style>
        </head>
        <body>
          <div class="printable-wrapper paper-${paperSize}">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 3. Wait for all assets / SVG barcodes to render, then open print dialog
    setTimeout(() => {
      try {
        const frameWindow = iframe.contentWindow;
        frameWindow.focus();
        frameWindow.print();
        resolve(true);
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
        resolve(false);
      }
    }, 250);
  });
}

// Print direct from an existing DOM node (extracts inner HTML & SVG)
export function printElementDirect(elementRef, options = {}) {
  if (!elementRef) {
    window.print();
    return;
  }
  const htmlContent = elementRef.innerHTML;
  return printThermalDocument({
    htmlContent,
    customCss: options.customCss || '',
    paperSize: options.paperSize || '80mm',
    receiptWidthMm: options.receiptWidthMm || (options.paperSize === '58mm' ? 48 : 72),
    title: options.title || 'Thermal Bill'
  });
}
