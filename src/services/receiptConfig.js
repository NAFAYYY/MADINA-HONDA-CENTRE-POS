// Receipt Layout Configuration and Presets for Visual Drag-and-Drop Designer
import JsBarcode from 'jsbarcode';

export const DEFAULT_RECEIPT_CONFIG = {
  paper_size: '80mm', // '80mm' | '58mm'
  width_mm: 72, // 72 for 80mm roll, 48 for 58mm roll
  density: 'compact', // 'ultra-compact', 'compact', 'spacious'
  font_size: '10.5px', // '9.5px', '10.5px', '11.5px'
  line_spacing: '1.2',
  divider_style: 'dashed', // 'dashed', 'dotted', 'solid', 'none'
  blocks: [
    {
      id: 'header',
      name: 'Store Header & Dealership Branding',
      icon: 'Building2',
      visible: true,
      align: 'center',
      show_tagline: true,
      show_address: true,
      show_phone: true,
      show_ntn: true,
      custom_title: '',
    },
    {
      id: 'meta',
      name: 'Invoice Number & Date',
      icon: 'FileText',
      visible: true,
      show_stream: true,
      show_payment: true,
      show_date_time: true,
    },
    {
      id: 'customer',
      name: 'Customer & Motorcycle Details',
      icon: 'User',
      visible: true,
      show_name: true,
      show_bike: true,
      show_reg_number: true,
      show_mechanic: true,
      show_chassis: false,
    },
    {
      id: 'items',
      name: 'Spare Parts Items Table',
      icon: 'ShoppingBag',
      visible: true,
      show_part_numbers: true,
      show_unit_rate: true,
      compact_rows: true,
    },
    {
      id: 'labor',
      name: 'Workshop Labor Charges Line',
      icon: 'Wrench',
      visible: true,
      show_work_type: true,
    },
    {
      id: 'totals',
      name: 'Subtotal & Grand Total',
      icon: 'Calculator',
      visible: true,
      show_subtotal: true,
      show_discount: true,
      show_cash_paid: true,
      grand_total_size: 'large',
    },
    {
      id: 'gate_pass',
      name: 'Official Barcoded Gate Pass',
      icon: 'ShieldCheck',
      visible: true,
      barcode_height: 28,
      show_security_note: true,
    },
    {
      id: 'footer',
      name: 'Footer Message & Return Policy',
      icon: 'MessageSquare',
      visible: true,
      show_greeting: true,
      show_disclaimer: true,
      align: 'center',
      custom_greeting: '',
      custom_disclaimer: '',
    }
  ]
};

export const RECEIPT_PRESETS = {
  zero_waste: {
    id: 'zero_waste',
    name: '⚡ Zero-Waste Minimalist (Saves ~60% Paper)',
    desc: 'Ultra-compact font, removes part numbers & redundant text, shrinks slip from ~150mm down to ~45mm',
    config: {
      paper_size: '80mm',
      width_mm: 72,
      density: 'ultra-compact',
      font_size: '9.5px',
      line_spacing: '1.1',
      divider_style: 'dotted',
      blocks: [
        { id: 'header', name: 'Store Header & Dealership Branding', icon: 'Building2', visible: true, align: 'center', show_tagline: false, show_address: true, show_phone: true, show_ntn: false, custom_title: '' },
        { id: 'meta', name: 'Invoice Number & Date', icon: 'FileText', visible: true, show_stream: true, show_payment: true, show_date_time: true },
        { id: 'customer', name: 'Customer & Motorcycle Details', icon: 'User', visible: true, show_name: true, show_bike: true, show_reg_number: true, show_mechanic: false, show_chassis: false },
        { id: 'items', name: 'Spare Parts Items Table', icon: 'ShoppingBag', visible: true, show_part_numbers: false, show_unit_rate: false, compact_rows: true },
        { id: 'labor', name: 'Workshop Labor Charges Line', icon: 'Wrench', visible: true, show_work_type: false },
        { id: 'totals', name: 'Subtotal & Grand Total', icon: 'Calculator', visible: true, show_subtotal: false, show_discount: true, show_cash_paid: false, grand_total_size: 'standard' },
        { id: 'gate_pass', name: 'Official Barcoded Gate Pass', icon: 'ShieldCheck', visible: false, barcode_height: 22, show_security_note: false },
        { id: 'footer', name: 'Footer Message & Return Policy', icon: 'MessageSquare', visible: true, show_greeting: true, show_disclaimer: false, align: 'center', custom_greeting: '', custom_disclaimer: '' }
      ]
    }
  },
  standard_retail: {
    id: 'standard_retail',
    name: '🛒 Standard Counter Retail (80mm Roll)',
    desc: 'Balanced retail slip with item rates, part numbers, cash change breakdown',
    config: {
      paper_size: '80mm',
      width_mm: 72,
      density: 'compact',
      font_size: '10.5px',
      line_spacing: '1.2',
      divider_style: 'dashed',
      blocks: [
        { id: 'header', name: 'Store Header & Dealership Branding', icon: 'Building2', visible: true, align: 'center', show_tagline: true, show_address: true, show_phone: true, show_ntn: true, custom_title: '' },
        { id: 'meta', name: 'Invoice Number & Date', icon: 'FileText', visible: true, show_stream: true, show_payment: true, show_date_time: true },
        { id: 'customer', name: 'Customer & Motorcycle Details', icon: 'User', visible: true, show_name: true, show_bike: false, show_reg_number: false, show_mechanic: false, show_chassis: false },
        { id: 'items', name: 'Spare Parts Items Table', icon: 'ShoppingBag', visible: true, show_part_numbers: true, show_unit_rate: true, compact_rows: true },
        { id: 'labor', name: 'Workshop Labor Charges Line', icon: 'Wrench', visible: false, show_work_type: false },
        { id: 'totals', name: 'Subtotal & Grand Total', icon: 'Calculator', visible: true, show_subtotal: true, show_discount: true, show_cash_paid: true, grand_total_size: 'large' },
        { id: 'gate_pass', name: 'Official Barcoded Gate Pass', icon: 'ShieldCheck', visible: false, barcode_height: 28, show_security_note: true },
        { id: 'footer', name: 'Footer Message & Return Policy', icon: 'MessageSquare', visible: true, show_greeting: true, show_disclaimer: true, align: 'center', custom_greeting: '', custom_disclaimer: '' }
      ]
    }
  },
  workshop_full: {
    id: 'workshop_full',
    name: '🔧 Workshop Dealership + Official Gate Pass',
    desc: 'Complete bike repair bill with reg #, chassis #, mechanic accountability, dynamic labor & security gate pass barcode',
    config: {
      paper_size: '80mm',
      width_mm: 72,
      density: 'compact',
      font_size: '10.5px',
      line_spacing: '1.2',
      divider_style: 'dashed',
      blocks: [
        { id: 'header', name: 'Store Header & Dealership Branding', icon: 'Building2', visible: true, align: 'center', show_tagline: true, show_address: true, show_phone: true, show_ntn: true, custom_title: '' },
        { id: 'meta', name: 'Invoice Number & Date', icon: 'FileText', visible: true, show_stream: true, show_payment: true, show_date_time: true },
        { id: 'customer', name: 'Customer & Motorcycle Details', icon: 'User', visible: true, show_name: true, show_bike: true, show_reg_number: true, show_mechanic: true, show_chassis: true },
        { id: 'items', name: 'Spare Parts Items Table', icon: 'ShoppingBag', visible: true, show_part_numbers: true, show_unit_rate: true, compact_rows: true },
        { id: 'labor', name: 'Workshop Labor Charges Line', icon: 'Wrench', visible: true, show_work_type: true },
        { id: 'totals', name: 'Subtotal & Grand Total', icon: 'Calculator', visible: true, show_subtotal: true, show_discount: true, show_cash_paid: true, grand_total_size: 'large' },
        { id: 'gate_pass', name: 'Official Barcoded Gate Pass', icon: 'ShieldCheck', visible: true, barcode_height: 28, show_security_note: true },
        { id: 'footer', name: 'Footer Message & Return Policy', icon: 'MessageSquare', visible: true, show_greeting: true, show_disclaimer: true, align: 'center', custom_greeting: '', custom_disclaimer: '' }
      ]
    }
  },
  mini_58mm: {
    id: 'mini_58mm',
    name: '📱 58mm Mini Roll POS',
    desc: 'Ultra-narrow 48mm layout for portable Bluetooth and 58mm compact thermal printers',
    config: {
      paper_size: '58mm',
      width_mm: 48,
      density: 'ultra-compact',
      font_size: '9px',
      line_spacing: '1.15',
      divider_style: 'dashed',
      blocks: [
        { id: 'header', name: 'Store Header & Dealership Branding', icon: 'Building2', visible: true, align: 'center', show_tagline: false, show_address: true, show_phone: true, show_ntn: false, custom_title: '' },
        { id: 'meta', name: 'Invoice Number & Date', icon: 'FileText', visible: true, show_stream: true, show_payment: true, show_date_time: true },
        { id: 'customer', name: 'Customer & Motorcycle Details', icon: 'User', visible: true, show_name: true, show_bike: true, show_reg_number: true, show_mechanic: false, show_chassis: false },
        { id: 'items', name: 'Spare Parts Items Table', icon: 'ShoppingBag', visible: true, show_part_numbers: false, show_unit_rate: false, compact_rows: true },
        { id: 'labor', name: 'Workshop Labor Charges Line', icon: 'Wrench', visible: true, show_work_type: false },
        { id: 'totals', name: 'Subtotal & Grand Total', icon: 'Calculator', visible: true, show_subtotal: false, show_discount: true, show_cash_paid: false, grand_total_size: 'standard' },
        { id: 'gate_pass', name: 'Official Barcoded Gate Pass', icon: 'ShieldCheck', visible: true, barcode_height: 24, show_security_note: false },
        { id: 'footer', name: 'Footer Message & Return Policy', icon: 'MessageSquare', visible: true, show_greeting: true, show_disclaimer: false, align: 'center', custom_greeting: '', custom_disclaimer: '' }
      ]
    }
  }
};

// Generate pure SVG string for Barcode that embeds seamlessly into HTML
export function getBarcodeSvgString(value, options = {}) {
  if (!value) return '';
  try {
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgNode, String(value), {
      format: 'CODE128',
      width: options.width || 1.1,
      height: options.height || 26,
      displayValue: options.displayValue !== false,
      font: 'monospace',
      fontSize: options.fontSize || 9,
      margin: 2,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return new XMLSerializer().serializeToString(svgNode);
  } catch (err) {
    console.warn('Error generating barcode SVG:', err);
    return `<div style="font-family:monospace; font-weight:bold; letter-spacing:2px; text-align:center; padding:2px; border:1px solid #000;">*${value}*</div>`;
  }
}

// Generate complete, standalone HTML document for thermal printing
export function generateReceiptHtml(config = DEFAULT_RECEIPT_CONFIG, invoiceData = {}, systemSettings = {}) {
  const { sale = {}, items = [], jobDetails = null } = invoiceData;
  const blocks = config.blocks || DEFAULT_RECEIPT_CONFIG.blocks;
  const paperSize = config.paper_size || '80mm';
  const widthMm = paperSize === '58mm' ? 48 : (Number(config.width_mm) || 72);
  const fontSize = config.font_size || (paperSize === '58mm' ? '9.5px' : '10.5px');
  const lineSpacing = config.line_spacing || '1.2';
  const dividerStyle = config.divider_style || 'dashed';
  const fontFamily = systemSettings.print_font_family || "'Courier New', Courier, monospace";

  const dividerBorder = dividerStyle === 'none' ? 'none' : `1px ${dividerStyle} #000`;
  const dividerHtml = dividerStyle === 'none' ? '' : `<div style="border-top: ${dividerBorder}; margin: 3px 0;"></div>`;

  const dateObj = new Date(sale.created_at || Date.now());
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Render individual blocks
  const blockHtmls = [];

  for (const block of blocks) {
    if (!block.visible) continue;

    switch (block.id) {
      case 'header': {
        const storeName = block.custom_title || systemSettings.store_name || 'MADINA HONDA CENTRE';
        const tagline = systemSettings.store_tagline || 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS';
        const address = systemSettings.store_address || 'Circular Road, Near Bus Stand';
        const phone = systemSettings.store_phone || '0300-1234567';
        const ntn = systemSettings.store_ntn;
        const align = block.align || 'center';

        blockHtmls.push(`
          <div style="text-align: ${align}; margin-bottom: 4px;">
            <div style="font-size: ${paperSize === '58mm' ? '12px' : '14px'}; font-weight: 900; letter-spacing: 0.5px; line-height: 1.15;">
              ${storeName}
            </div>
            ${block.show_tagline && tagline ? `
              <div style="font-size: ${paperSize === '58mm' ? '8px' : '9px'}; font-weight: 700; margin: 1px 0;">
                ${tagline}
              </div>
            ` : ''}
            ${block.show_address && address ? `
              <div style="font-size: ${paperSize === '58mm' ? '7.5px' : '8.5px'}; color: #222;">
                ${address}
              </div>
            ` : ''}
            ${block.show_phone && phone ? `
              <div style="font-size: ${paperSize === '58mm' ? '7.5px' : '8.5px'}; font-weight: 600;">
                Tel: ${phone}
              </div>
            ` : ''}
            ${block.show_ntn && ntn ? `
              <div style="font-size: 7.5px; color: #444;">
                NTN: ${ntn}
              </div>
            ` : ''}
          </div>
        `);
        break;
      }

      case 'meta': {
        blockHtmls.push(`
          <div style="font-size: ${paperSize === '58mm' ? '8px' : '9.5px'}; margin-bottom: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>Inv #:</strong> ${sale.invoice_number || 'INV-DRAFT'}</span>
              ${block.show_date_time ? `<span>${formattedDate} ${formattedTime}</span>` : ''}
            </div>
            ${(block.show_stream || block.show_payment) ? `
              <div style="display: flex; justify-content: space-between; margin-top: 1px;">
                ${block.show_stream ? `<span>Type: ${(sale.stream || 'retail').toUpperCase()}</span>` : '<span></span>'}
                ${block.show_payment ? `<span>Pay: ${(sale.payment_method || 'cash').toUpperCase()}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `);
        break;
      }

      case 'customer': {
        const hasCustomer = sale.customer_name || (jobDetails && jobDetails.customer_name);
        const hasVehicle = jobDetails && jobDetails.reg_number;
        if (!hasCustomer && !hasVehicle) break;

        blockHtmls.push(`
          <div style="font-size: ${paperSize === '58mm' ? '8px' : '9px'}; background: #f8fafc; border: 1px dotted #999; padding: 2px 4px; margin-bottom: 4px; border-radius: 2px;">
            ${block.show_name && hasCustomer ? `
              <div><strong>Customer:</strong> ${sale.customer_name || (jobDetails && jobDetails.customer_name) || 'Walk-in'}</div>
            ` : ''}
            ${block.show_bike && jobDetails && jobDetails.vehicle_model ? `
              <div><strong>Bike:</strong> ${jobDetails.vehicle_model} ${jobDetails.reg_number ? `| <strong>Reg:</strong> ${jobDetails.reg_number}` : ''}</div>
            ` : ''}
            ${block.show_mechanic && jobDetails && jobDetails.mechanic_name ? `
              <div><strong>Mechanic:</strong> ${jobDetails.mechanic_name}</div>
            ` : ''}
            ${block.show_chassis && jobDetails && jobDetails.chassis_number ? `
              <div style="font-size: 7.5px;"><strong>Chassis:</strong> ${jobDetails.chassis_number}</div>
            ` : ''}
          </div>
        `);
        break;
      }

      case 'items': {
        const showPartNums = block.show_part_numbers !== false;
        const showRates = block.show_unit_rate !== false && paperSize !== '58mm';

        const rows = (items || []).map(it => `
          <tr style="border-bottom: 1px dotted #ccc;">
            <td style="padding: 2px 0; text-align: left;">
              <div style="font-weight: 700;">${it.name || it.part_name || 'Part'}</div>
              ${showPartNums && it.part_number ? `
                <div style="font-size: 7.5px; color: #444;">${it.part_number}</div>
              ` : ''}
            </td>
            <td style="text-align: center; padding: 2px 0;">${it.quantity || 1}</td>
            ${showRates ? `<td style="text-align: right; padding: 2px 0;">${it.unit_price || 0}</td>` : ''}
            <td style="text-align: right; padding: 2px 0; font-weight: 700;">${it.total_price || 0}</td>
          </tr>
        `).join('');

        blockHtmls.push(`
          <table style="width: 100%; font-size: ${paperSize === '58mm' ? '8.5px' : '9.5px'}; border-collapse: collapse; margin-bottom: 4px;">
            <thead>
              <tr style="border-bottom: 1px solid #000; border-top: 1px solid #000;">
                <th style="text-align: left; padding: 2px 0;">Item</th>
                <th style="text-align: center; padding: 2px 0; width: 26px;">Qty</th>
                ${showRates ? '<th style="text-align: right; padding: 2px 0; width: 40px;">Rate</th>' : ''}
                <th style="text-align: right; padding: 2px 0; width: 48px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `);
        break;
      }

      case 'labor': {
        if (jobDetails && Number(jobDetails.dynamic_labor_amount) > 0) {
          blockHtmls.push(`
            <div style="display: flex; justify-content: space-between; font-size: ${paperSize === '58mm' ? '8.5px' : '9.5px'}; font-style: italic; margin-bottom: 3px; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
              <span>Labor / Service: ${block.show_work_type && jobDetails.work_type ? jobDetails.work_type : 'Maintenance'}</span>
              <span style="font-weight: 700;">PKR ${jobDetails.dynamic_labor_amount}</span>
            </div>
          `);
        }
        break;
      }

      case 'totals': {
        const isLarge = block.grand_total_size === 'large';
        blockHtmls.push(`
          <div style="font-size: ${paperSize === '58mm' ? '9px' : '10px'}; border-top: 1px solid #000; padding-top: 3px; margin-bottom: 4px;">
            ${block.show_subtotal ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                <span>Subtotal:</span>
                <span>PKR ${sale.subtotal || 0}</span>
              </div>
            ` : ''}
            ${block.show_discount && Number(sale.discount) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                <span>Discount:</span>
                <span>- PKR ${sale.discount}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: ${isLarge ? (paperSize === '58mm' ? '11px' : '13px') : (paperSize === '58mm' ? '9.5px' : '11px')}; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
              <span>GRAND TOTAL:</span>
              <span>PKR ${sale.grand_total || 0}</span>
            </div>
            ${block.show_cash_paid && sale.payment_method === 'cash' ? `
              <div style="display: flex; justify-content: space-between; font-size: 7.5px; margin-top: 2px; color: #333;">
                <span>Cash Paid: PKR ${sale.cash_tendered || sale.grand_total || 0}</span>
                <span>Change: PKR ${sale.change_returned || 0}</span>
              </div>
            ` : ''}
          </div>
        `);
        break;
      }

      case 'gate_pass': {
        if ((sale.stream === 'inhouse' || jobDetails) && jobDetails && jobDetails.gate_pass_code) {
          const barcodeSvg = getBarcodeSvgString(jobDetails.gate_pass_code, {
            height: block.barcode_height || 26,
            width: paperSize === '58mm' ? 1.0 : 1.15
          });

          blockHtmls.push(`
            <div style="margin-top: 4px; padding-top: 4px; border-top: 2px dashed #000; text-align: center;">
              <div style="display: inline-block; background: #000; color: #fff; padding: 1px 6px; font-size: 8px; font-weight: 900; border-radius: 2px; letter-spacing: 0.5px;">
                OFFICIAL BIKE RELEASE GATE PASS
              </div>
              <div style="font-size: 9.5px; font-weight: 900; margin-top: 2px;">
                VEHICLE REG #: ${jobDetails.reg_number || 'N/A'}
              </div>
              ${block.show_security_note ? `
                <div style="font-size: 7.5px; color: #333; margin: 1px 0;">Security: Scan or verify code before motorcycle release</div>
              ` : ''}
              <div style="display: flex; justify-content: center; margin: 2px 0;">
                ${barcodeSvg}
              </div>
            </div>
          `);
        }
        break;
      }

      case 'footer': {
        const welcome = block.custom_greeting || systemSettings.receipt_welcome || 'Thank you for choosing Madina Honda Centre!';
        const disclaimer = block.custom_disclaimer || systemSettings.receipt_disclaimer || 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt';
        const align = block.align || 'center';

        blockHtmls.push(`
          <div style="text-align: ${align}; margin-top: 4px; border-top: ${dividerBorder}; padding-top: 3px; font-size: ${paperSize === '58mm' ? '7.5px' : '8.5px'};">
            ${block.show_greeting && welcome ? `
              <div style="margin: 1px 0; font-weight: 600;">${welcome}</div>
            ` : ''}
            ${block.show_disclaimer && disclaimer ? `
              <div style="margin: 1px 0; font-size: 7px; color: #444;">${disclaimer}</div>
            ` : ''}
          </div>
        `);
        break;
      }

      default:
        break;
    }
  }

  return `
    <div class="thermal-receipt-doc paper-${paperSize}" style="
      width: ${widthMm}mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 1mm 2mm;
      background: #ffffff;
      color: #000000;
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineSpacing};
      box-sizing: border-box;
    ">
      ${blockHtmls.join('\n')}
    </div>
  `;
}

export async function fetchReceiptConfig() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings && data.settings.receipt_layout_config) {
        return JSON.parse(data.settings.receipt_layout_config);
      }
    }
  } catch (err) {
    console.warn('Error loading receipt config, using default:', err);
  }
  return DEFAULT_RECEIPT_CONFIG;
}

export async function saveReceiptConfig(config) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: {
        receipt_layout_config: JSON.stringify(config),
        print_paper_size: config.paper_size,
        print_receipt_width_mm: String(config.width_mm),
        print_font_size: config.font_size,
        print_line_spacing: config.line_spacing,
      }
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save receipt layout');
  }
  return res.json();
}
