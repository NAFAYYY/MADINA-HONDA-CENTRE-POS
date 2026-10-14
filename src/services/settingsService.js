// Settings and Print Template Service

export const DEFAULT_SETTINGS = {
  store_name: 'MADINA HONDA CENTRE',
  store_tagline: 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS',
  store_address: 'Circular Road, Near Bus Stand',
  store_phone: '0300-1234567',
  store_whatsapp: '0300-1234567',
  store_ntn: 'NTN-7860123-4',
  store_dealer_code: 'AHL-DLR-4420',
  receipt_welcome: 'Thank you for choosing Madina Honda Centre!',
  receipt_disclaimer: 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt | Electrical Parts No Warranty',
  
  pos_default_payment: 'cash',
  pos_auto_print: 'true',
  pos_scanner_auto_add: 'true',
  pos_sound_beeps: 'true',
  pos_allow_negative_stock: 'warn',
  pos_quick_cash_presets: '500,1000,5000',
  pos_default_stream: 'counter_retail',
  
  print_paper_size: '80mm',
  print_receipt_width_mm: '72',
  print_font_size: '11px',
  print_line_spacing: '1.25',
  print_font_family: "'Courier New', Courier, monospace",
  print_show_gate_pass: 'true',
  print_show_barcode: 'true',
  print_show_mechanic: 'true',
  print_show_part_numbers: 'true',
  print_auto_cut: 'true',
  print_cash_drawer_kick: 'true',
  print_copies: '1',
  
  workshop_default_mechanic_split: '50',
  workshop_require_fuel_check: 'true',
  workshop_return_old_parts_default: 'true',
  workshop_bays_list: 'Lift 1 - Quick Service,Lift 2 - Main Repair,Lift 3 - Engine Overhaul,Bay 4 - Electrical,Bay 5 - Washing & Detailing',
  
  inventory_low_stock_threshold: '5',
  inventory_abc_a_percent: '70',
  inventory_abc_b_percent: '20',
  inventory_wholesale_discount_default: '10',
  
  khata_default_credit_limit: '50000',
  khata_grace_period_days: '30',
  whatsapp_intake_msg: 'Assalam-o-Alaikum {customer_name}! Your bike {reg_no} ({model}) is received for {work_type} at Madina Honda Centre. Job #{job_no}. Inquiries: 0300-1234567.',
  whatsapp_ready_msg: 'Assalam-o-Alaikum {customer_name}! Your motorcycle {reg_no} is READY for delivery! Total Bill: PKR {total}. Gate Pass Code: {gate_pass}. Madina Honda Centre.',
  whatsapp_khata_msg: 'Respected {customer_name}! This is a reminder that your outstanding Khata balance at Madina Honda Centre is PKR {balance}. Kindly arrange payment. Thank you!'
};

export async function fetchAllSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    const data = await res.json();
    return { ...DEFAULT_SETTINGS, ...data.settings };
  } catch (err) {
    console.warn('Using default settings fallback:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveAllSettings(settingsObj) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: settingsObj })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save settings');
  }
  return res.json();
}

export async function fetchPrintTemplates() {
  try {
    const res = await fetch('/api/print-templates');
    if (!res.ok) throw new Error('Failed to load templates');
    return await res.json();
  } catch (err) {
    console.error('Error fetching print templates:', err);
    return { templates: [], active: null };
  }
}

export async function fetchActivePrintTemplate() {
  try {
    const res = await fetch('/api/print-templates/active');
    if (!res.ok) throw new Error('Failed to load active template');
    return await res.json();
  } catch (err) {
    console.error('Error fetching active template:', err);
    return null;
  }
}

export async function savePrintTemplate(templateData) {
  const res = await fetch('/api/print-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save template');
  }
  return res.json();
}

export async function activateTemplate(id) {
  const res = await fetch(`/api/print-templates/${id}/activate`, {
    method: 'PUT'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to activate template');
  }
  return res.json();
}

export async function resetSystemDefaults() {
  const res = await fetch('/api/print-templates/reset', {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to reset');
  }
  return res.json();
}
