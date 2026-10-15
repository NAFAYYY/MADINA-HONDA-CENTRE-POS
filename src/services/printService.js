// Bulletproof Thermal Print Service for Madina Honda Centre POS
// Eliminates Windows Spooler crashes (BC-95AC, Xprinter, Epson TM-T88) and paper waste
// Uses isolated #thermal-print-target portal with body.is-printing-thermal

export function executeThermalPrint(receiptHtml, widthMm = 72) {
  return new Promise((resolve) => {
    let target = document.getElementById('thermal-print-target');
    if (!target) {
      target = document.createElement('div');
      target.id = 'thermal-print-target';
      target.setAttribute('aria-hidden', 'true');
      document.body.appendChild(target);
    }

    // 1. Populate the isolated print container with pure receipt markup
    target.innerHTML = receiptHtml;

    // 2. Mark body as printing thermal slip (hides #root completely from layout, keeps only #thermal-print-target in static flow)
    document.body.classList.add('is-printing-thermal');

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('is-printing-thermal');
      if (target) {
        target.innerHTML = '';
      }
      window.removeEventListener('afterprint', cleanup);
      resolve(true);
    };

    window.addEventListener('afterprint', cleanup);

    // 3. Trigger native print dialog once DOM layout and SVG barcodes have rendered
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Print failure:', err);
          cleanup();
        }
      }, 100);
    });

    // Fallback safety timeout in case window.afterprint is cancelled or not dispatched
    setTimeout(() => {
      if (!cleanedUp && !document.hidden) {
        cleanup();
      }
    }, 15000);
  });
}

// Print direct from an existing DOM node (extracts inner HTML)
export function printElementDirect(elementRef, options = {}) {
  if (!elementRef) {
    window.print();
    return Promise.resolve(false);
  }
  const htmlContent = elementRef.innerHTML || elementRef.outerHTML;
  return executeThermalPrint(htmlContent, options.receiptWidthMm || 72);
}

// Backward compatibility helper
export function printThermalDocument({ htmlContent, receiptWidthMm = 72 }) {
  return executeThermalPrint(htmlContent, receiptWidthMm);
}
