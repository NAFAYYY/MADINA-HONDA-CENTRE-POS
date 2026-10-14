import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in server/data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'madina_pos.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode (Write-Ahead Logging) for speed and crash resistance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- Users Table (RBAC)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'cashier', 'supervisor'
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Workshop Lifts & Bays
    CREATE TABLE IF NOT EXISTS lifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'available', -- 'available', 'occupied', 'waiting_parts', 'ready'
      current_job_id INTEGER,
      is_active INTEGER DEFAULT 1
    );

    -- Mechanics & Staff
    CREATE TABLE IF NOT EXISTS mechanics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      default_commission_rate REAL DEFAULT 50.0,
      retained_savings REAL DEFAULT 0.0,
      total_advances REAL DEFAULT 0.0,
      personal_parts_balance REAL DEFAULT 0.0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Mechanic Financial Ledger
    CREATE TABLE IF NOT EXISTS mechanic_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mechanic_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'earning', 'advance', 'saving_deposit', 'saving_withdrawal', 'part_charge', 'settlement_payout'
      amount REAL NOT NULL,
      reference_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mechanic_id) REFERENCES mechanics(id)
    );

    -- Spare Parts & Inventory Catalog
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      model_compat TEXT DEFAULT 'Universal',
      category TEXT DEFAULT 'Genuine Honda',
      brand TEXT DEFAULT 'Atlas Honda',
      shelf_location TEXT,
      cost_price REAL DEFAULT 0.0,
      retail_price REAL DEFAULT 0.0,
      wholesale_price REAL DEFAULT 0.0,
      stock_quantity INTEGER DEFAULT 0,
      min_stock_alert INTEGER DEFAULT 5,
      barcode TEXT,
      abc_category TEXT DEFAULT 'B', -- 'A' fast, 'B' medium, 'C' dead stock
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Quantity Wholesale Pricing Slabs (Scheme Slabs)
    CREATE TABLE IF NOT EXISTS product_pricing_slabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      part_number TEXT NOT NULL,
      min_quantity INTEGER NOT NULL,
      dealer_price REAL NOT NULL,
      retail_price REAL NOT NULL,
      ex_factory_price REAL,
      sales_tax REAL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_slabs_part ON product_pricing_slabs(part_number);
    CREATE INDEX IF NOT EXISTS idx_slabs_prod ON product_pricing_slabs(product_id);

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      address TEXT,
      credit_limit REAL DEFAULT 0.0,
      current_balance REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vehicles / Motorcycles
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      model TEXT NOT NULL,
      reg_number TEXT NOT NULL,
      chassis_number TEXT,
      engine_number TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Job Cards (Workshop Intake & Lifecycle)
    CREATE TABLE IF NOT EXISTS job_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_number TEXT UNIQUE NOT NULL,
      vehicle_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      mechanic_id INTEGER,
      lift_id INTEGER,
      odometer INTEGER DEFAULT 0,
      complaints TEXT,
      fuel_level TEXT DEFAULT 'Half',
      inspection_notes TEXT,
      old_parts_returned INTEGER DEFAULT 1,
      is_rework INTEGER DEFAULT 0,
      rework_original_job_id INTEGER,
      work_type TEXT DEFAULT 'General Service',
      dynamic_labor_amount REAL DEFAULT 0.0,
      mechanic_commission_rate REAL DEFAULT 50.0,
      mechanic_share REAL DEFAULT 0.0,
      shop_share REAL DEFAULT 0.0,
      parts_total REAL DEFAULT 0.0,
      grand_total REAL DEFAULT 0.0,
      status TEXT DEFAULT 'in_progress', -- 'in_progress', 'waiting_parts', 'ready', 'paid_delivered', 'cancelled'
      gate_pass_code TEXT,
      gate_pass_released INTEGER DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (mechanic_id) REFERENCES mechanics(id),
      FOREIGN KEY (lift_id) REFERENCES lifts(id)
    );

    -- Parts fitted to Job Cards
    CREATE TABLE IF NOT EXISTS job_card_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_card_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      part_number TEXT,
      part_name TEXT,
      quantity INTEGER DEFAULT 1,
      unit_cost REAL DEFAULT 0.0,
      unit_price REAL DEFAULT 0.0,
      total_price REAL DEFAULT 0.0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_card_id) REFERENCES job_cards(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- B2B Local Bike Shops
    CREATE TABLE IF NOT EXISTS b2b_shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      credit_limit REAL DEFAULT 50000.0,
      current_balance REAL DEFAULT 0.0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3-in-1 Sales Invoices
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      stream TEXT NOT NULL, -- 'inhouse', 'counter_retail', 'b2b_wholesale', 'after_sale'
      customer_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT,
      b2b_shop_id INTEGER,
      job_card_id INTEGER,
      subtotal REAL DEFAULT 0.0,
      discount REAL DEFAULT 0.0,
      grand_total REAL DEFAULT 0.0,
      cost_total REAL DEFAULT 0.0,
      profit_total REAL DEFAULT 0.0,
      payment_method TEXT DEFAULT 'cash',
      cash_tendered REAL DEFAULT 0.0,
      change_returned REAL DEFAULT 0.0,
      cashier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (b2b_shop_id) REFERENCES b2b_shops(id),
      FOREIGN KEY (job_card_id) REFERENCES job_cards(id)
    );

    -- Items in Sales
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      part_number TEXT,
      name TEXT,
      quantity INTEGER DEFAULT 1,
      unit_cost REAL DEFAULT 0.0,
      unit_price REAL DEFAULT 0.0,
      total_price REAL DEFAULT 0.0,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Khata Ledger (Customer & Local Shop Credit)
    CREATE TABLE IF NOT EXISTS khata_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_type TEXT NOT NULL, -- 'customer', 'b2b_shop'
      party_id INTEGER NOT NULL,
      invoice_number TEXT,
      type TEXT NOT NULL, -- 'sale_credit', 'payment_received'
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Complaints & Re-Work System
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      reg_number TEXT NOT NULL,
      chassis_number TEXT,
      original_job_id INTEGER,
      assigned_mechanic_id INTEGER,
      issue_description TEXT NOT NULL,
      is_warranty INTEGER DEFAULT 1,
      status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (original_job_id) REFERENCES job_cards(id),
      FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics(id)
    );

    -- Cashier Shifts (Blind Closing)
    CREATE TABLE IF NOT EXISTS cashier_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER NOT NULL,
      cashier_name TEXT,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      opening_cash REAL DEFAULT 0.0,
      blind_counted_cash REAL,
      expected_cash REAL,
      variance REAL,
      total_cash_sales REAL DEFAULT 0.0,
      total_khata_collected REAL DEFAULT 0.0,
      total_expenses_paid REAL DEFAULT 0.0,
      status TEXT DEFAULT 'open', -- 'open', 'closed'
      notes TEXT,
      FOREIGN KEY (cashier_id) REFERENCES users(id)
    );

    -- Shop Expenses
    CREATE TABLE IF NOT EXISTS shop_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      paid_by TEXT,
      shift_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Backup Logs
    CREATE TABLE IF NOT EXISTS backup_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_path TEXT NOT NULL,
      backup_type TEXT DEFAULT 'local',
      file_size_bytes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System Wide Settings (Store, POS, Workshop, Inventory, Khata, Hardware)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Print Scripts & Custom Receipt Templates
    CREATE TABLE IF NOT EXISTS print_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paper_size TEXT DEFAULT '80mm', -- '80mm', '58mm', 'a4'
      receipt_width_mm INTEGER DEFAULT 74,
      html_template TEXT NOT NULL,
      custom_css TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if users exist
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, full_name, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', 'admin123', 'Showroom Owner', 'admin', '0300-1234567');
    insertUser.run('cashier', 'cashier123', 'Counter Cashier', 'cashier', '0301-2345678');
    insertUser.run('supervisor', 'supervisor123', 'Workshop Supervisor', 'supervisor', '0302-3456789');
  }

  // Check if lifts exist
  const liftCheck = db.prepare('SELECT COUNT(*) as count FROM lifts').get();
  if (liftCheck.count === 0) {
    const insertLift = db.prepare('INSERT INTO lifts (name, status) VALUES (?, ?)');
    insertLift.run('Lift 1 - Quick Service', 'available');
    insertLift.run('Lift 2 - Main Repair', 'available');
    insertLift.run('Lift 3 - Engine Overhaul', 'available');
    insertLift.run('Lift 4 - Tuning & Electrical', 'available');
    insertLift.run('Bay 5 - Washing & Detailing', 'available');
  }

  // Check if mechanics exist
  const mechCheck = db.prepare('SELECT COUNT(*) as count FROM mechanics').get();
  if (mechCheck.count === 0) {
    const insertMech = db.prepare(`
      INSERT INTO mechanics (name, phone, default_commission_rate, retained_savings, total_advances)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertMech.run('Ustad Tariq Mahmood', '0300-9876543', 50.0, 1500.0, 500.0);
    insertMech.run('Master Rashid Ali', '0312-3456789', 50.0, 3200.0, 0.0);
    insertMech.run('Naveed Akhtar (Tuning)', '0321-4567890', 50.0, 800.0, 1000.0);
    insertMech.run('Muhammad Asif (Electrical)', '0333-5678901', 50.0, 0.0, 0.0);
  }

  // Check if products exist, otherwise load official Atlas Honda catalog (1,726 products + 2,220 slabs)
  const productCheck = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCheck.count === 0) {
    const catalogPath = path.join(dataDir, 'official_honda_catalog.json');
    if (fs.existsSync(catalogPath)) {
      try {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const insertProduct = db.prepare(`
          INSERT INTO products (
            part_number, name, model_compat, category, brand, shelf_location,
            cost_price, retail_price, wholesale_price, stock_quantity, min_stock_alert,
            barcode, abc_category
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertSlab = db.prepare(`
          INSERT INTO product_pricing_slabs (
            product_id, part_number, min_quantity, dealer_price, retail_price,
            ex_factory_price, sales_tax
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const partToId = {};
        for (const p of catalog.products) {
          const res = insertProduct.run(
            p.part_number,
            p.name,
            p.model_compat || 'Universal',
            p.category || 'Genuine Honda Parts',
            p.brand || 'Atlas Honda',
            p.shelf_location || 'Rack G',
            p.cost_price || 0,
            p.retail_price || 0,
            p.wholesale_price || 0,
            p.stock_quantity || 20,
            p.min_stock_alert || 5,
            p.barcode || '',
            p.abc_category || 'B'
          );
          partToId[p.part_number] = res.lastInsertRowid;
        }

        for (const s of (catalog.slabs || [])) {
          const pid = partToId[s.part_number];
          if (pid) {
            insertSlab.run(
              pid,
              s.part_number,
              s.min_quantity,
              s.dealer_price,
              s.retail_price,
              s.ex_factory_price || 0,
              s.sales_tax || 0
            );
          }
        }
        console.log(`Loaded ${catalog.products.length} genuine Atlas Honda parts and ${catalog.slabs?.length || 0} slabs into database.`);
      } catch (err) {
        console.error('Error seeding official catalog:', err.message);
      }
    }
  }

  // Check if B2B shops exist
  const b2bCheck = db.prepare('SELECT COUNT(*) as count FROM b2b_shops').get();
  if (b2bCheck.count === 0) {
    const insertB2B = db.prepare(`
      INSERT INTO b2b_shops (shop_name, owner_name, phone, address, credit_limit, current_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertB2B.run('Rehman Autos & Repair', 'Ustad Rehman', '0300-4455667', 'Circular Road, Near Bus Stand', 60000, 14500);
    insertB2B.run('Bismillah Motorcycle Workshop', 'Chaudhry Akram', '0321-7788990', 'Main Bazaar, Shop #14', 40000, 6200);
    insertB2B.run('Ali Bike Tuning Center', 'Ali Hassan', '0345-1122334', 'Railway Road', 30000, 0);
  }

  // Check if sample customer and vehicle exist
  const custCheck = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  if (custCheck.count === 0) {
    const insertCust = db.prepare(`
      INSERT INTO customers (name, phone, address, credit_limit, current_balance)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertCust.run('Malik Farhan', '0300-5551234', 'Model Town, Street 4', 15000, 0);
    insertCust.run('Haji Tanveer', '0302-7778899', 'Gulberg Colony', 20000, 3400);

    const insertVeh = db.prepare(`
      INSERT INTO vehicles (customer_id, model, reg_number, chassis_number, engine_number, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertVeh.run(1, 'Honda CD70', 'LEK-21-4521', 'HA02E-9842150', 'CD70-452140', 'Red');
    insertVeh.run(2, 'Honda CG125', 'RWP-23-8890', 'JC19E-6789123', 'CG125-889012', 'Black');
  }

  // Ensure an active shift exists for testing
  const shiftCheck = db.prepare("SELECT COUNT(*) as count FROM cashier_shifts WHERE status = 'open'").get();
  if (shiftCheck.count === 0) {
    const insertShift = db.prepare(`
      INSERT INTO cashier_shifts (cashier_id, cashier_name, opening_cash, status)
      VALUES (?, ?, ?, ?)
    `);
    insertShift.run(2, 'Counter Cashier', 5000.0, 'open');
  }

  // Seed system settings
  const settingCheck = db.prepare('SELECT COUNT(*) as count FROM system_settings').get();
  if (settingCheck.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value, category, description)
      VALUES (?, ?, ?, ?)
    `);
    
    // Store Profile
    insertSetting.run('store_name', 'MADINA HONDA CENTRE', 'store', 'Official Business Name');
    insertSetting.run('store_tagline', 'AUTHORIZED 3S SALES, SERVICE & SPARE PARTS', 'store', 'Dealership Tagline');
    insertSetting.run('store_address', 'Circular Road, Near Bus Stand', 'store', 'Store Physical Address');
    insertSetting.run('store_phone', '0300-1234567', 'store', 'Shop Telephone / Mobile');
    insertSetting.run('store_whatsapp', '0300-1234567', 'store', 'Customer Support WhatsApp');
    insertSetting.run('store_ntn', 'NTN-7860123-4', 'store', 'Tax / NTN Registration Number');
    insertSetting.run('store_dealer_code', 'AHL-DLR-4420', 'store', 'Atlas Honda Dealership Code');
    insertSetting.run('receipt_welcome', 'Thank you for choosing Madina Honda Centre!', 'store', 'Receipt Greeting Message');
    insertSetting.run('receipt_disclaimer', 'Atlas Honda Genuine Parts Guaranteed | No Return Without Receipt | Electrical Parts No Warranty', 'store', 'Warranty & Return Policy');

    // POS Terminal
    insertSetting.run('pos_default_payment', 'cash', 'pos', 'Default Selected Payment Mode');
    insertSetting.run('pos_auto_print', 'true', 'pos', 'Auto-open print dialog on payment checkout');
    insertSetting.run('pos_scanner_auto_add', 'true', 'pos', 'Auto-add item when barcode scanner sends Enter');
    insertSetting.run('pos_sound_beeps', 'true', 'pos', 'Play audio beep sound on scan and sale');
    insertSetting.run('pos_allow_negative_stock', 'warn', 'pos', 'Stock restriction: warn or block');
    insertSetting.run('pos_quick_cash_presets', '500,1000,5000', 'pos', 'Quick cash payment tender buttons');
    insertSetting.run('pos_default_stream', 'counter_retail', 'pos', 'Default checkout stream');

    // Thermal Printer & Hardware
    insertSetting.run('print_paper_size', '80mm', 'printer', 'Receipt paper size (80mm, 58mm, a4)');
    insertSetting.run('print_receipt_width_mm', '74', 'printer', 'Receipt printable width in mm');
    insertSetting.run('print_font_size', '11px', 'printer', 'Base receipt font size');
    insertSetting.run('print_line_spacing', '1.25', 'printer', 'Line spacing multiplier');
    insertSetting.run('print_font_family', "'Courier New', Courier, monospace", 'printer', 'Receipt font family');
    insertSetting.run('print_show_gate_pass', 'true', 'printer', 'Show official Gate Pass on workshop receipts');
    insertSetting.run('print_show_barcode', 'true', 'printer', 'Show Code128 barcode on receipts');
    insertSetting.run('print_show_mechanic', 'true', 'printer', 'Display mechanic name on invoice');
    insertSetting.run('print_show_part_numbers', 'true', 'printer', 'Display OEM part numbers in line items');
    insertSetting.run('print_auto_cut', 'true', 'printer', 'Trigger thermal paper cutter signal');
    insertSetting.run('print_cash_drawer_kick', 'true', 'printer', 'Trigger cash drawer kick pulse');
    insertSetting.run('print_copies', '1', 'printer', 'Default number of receipt copies');

    // Workshop & Bays
    insertSetting.run('workshop_default_mechanic_split', '50', 'workshop', 'Default mechanic commission labor split %');
    insertSetting.run('workshop_require_fuel_check', 'true', 'workshop', 'Require fuel level recording on intake');
    insertSetting.run('workshop_return_old_parts_default', 'true', 'workshop', 'Default return old parts (Kabaad) to customer');
    insertSetting.run('workshop_bays_list', 'Lift 1 - Quick Service,Lift 2 - Main Repair,Lift 3 - Engine Overhaul,Bay 4 - Electrical,Bay 5 - Washing & Detailing', 'workshop', 'Configured workshop bays');

    // Inventory & Rules
    insertSetting.run('inventory_low_stock_threshold', '5', 'inventory', 'Low stock alert threshold');
    insertSetting.run('inventory_abc_a_percent', '70', 'inventory', 'ABC Class A fast-moving threshold %');
    insertSetting.run('inventory_abc_b_percent', '20', 'inventory', 'ABC Class B medium-moving threshold %');
    insertSetting.run('inventory_wholesale_discount_default', '10', 'inventory', 'Default wholesale B2B discount %');

    // Khata & WhatsApp Messages
    insertSetting.run('khata_default_credit_limit', '50000', 'khata', 'Default B2B credit limit');
    insertSetting.run('khata_grace_period_days', '30', 'khata', 'Payment reminder grace period in days');
    insertSetting.run('whatsapp_intake_msg', 'Assalam-o-Alaikum {customer_name}! Your bike {reg_no} ({model}) is received for {work_type} at Madina Honda Centre. Job #{job_no}. Inquiries: 0300-1234567.', 'khata', 'WhatsApp Intake Message Template');
    insertSetting.run('whatsapp_ready_msg', 'Assalam-o-Alaikum {customer_name}! Your motorcycle {reg_no} is READY for delivery! Total Bill: PKR {total}. Gate Pass Code: {gate_pass}. Madina Honda Centre.', 'khata', 'WhatsApp Delivery Ready Message Template');
    insertSetting.run('whatsapp_khata_msg', 'Respected {customer_name}! This is a reminder that your outstanding Khata balance at Madina Honda Centre is PKR {balance}. Kindly arrange payment. Thank you!', 'khata', 'WhatsApp Khata Balance Reminder Template');
  }

  // Seed default print templates
  const templateCheck = db.prepare('SELECT COUNT(*) as count FROM print_templates').get();
  if (templateCheck.count === 0) {
    const insertTpl = db.prepare(`
      INSERT INTO print_templates (id, name, paper_size, receipt_width_mm, html_template, custom_css, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Standard 80mm
    insertTpl.run(
      'tpl_80mm_standard',
      'Standard 80mm Thermal Receipt (With Gate Pass)',
      '80mm',
      74,
      `<div class="thermal-ticket">
  <div class="ticket-header">
    <div class="store-title">{{store_name}}</div>
    <div class="store-subtitle">{{store_tagline}}</div>
    <div class="store-meta">{{store_address}}</div>
    <div class="store-meta">Tel: {{store_phone}} | NTN: {{store_ntn}}</div>
  </div>

  <div class="ticket-divider"></div>

  <div class="ticket-row">
    <span><strong>Inv #:</strong> {{invoice_no}}</span>
    <span>{{invoice_date}}</span>
  </div>
  <div class="ticket-row">
    <span><strong>Type:</strong> {{sale_type}}</span>
    <span><strong>Pay:</strong> {{payment_method}}</span>
  </div>

  {{customer_vehicle_block}}

  <div class="ticket-divider"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Rate</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{items_rows}}
      {{labor_row}}
    </tbody>
  </table>

  <div class="ticket-divider"></div>

  <div class="totals-block">
    <div class="ticket-row">
      <span>Subtotal:</span>
      <span>PKR {{subtotal}}</span>
    </div>
    {{discount_block}}
    <div class="ticket-row grand-total-row">
      <span>GRAND TOTAL:</span>
      <span>PKR {{grand_total}}</span>
    </div>
    {{cash_tendered_block}}
  </div>

  {{gate_pass_block}}

  <div class="ticket-footer">
    <p>{{footer_message}}</p>
    <p class="terms-text">{{return_policy}}</p>
  </div>
</div>`,
      `/* Madina Honda Centre - 80mm Standard Thermal Slip */
.thermal-ticket {
  width: 74mm;
  margin: 0 auto;
  padding: 1mm 2mm;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.25;
  color: #000000;
  background: #ffffff;
  box-sizing: border-box;
}
.ticket-header {
  text-align: center;
  margin-bottom: 4px;
}
.store-title {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.store-subtitle {
  font-size: 9px;
  font-weight: 700;
  margin-top: 2px;
}
.store-meta {
  font-size: 8.5px;
  color: #222;
}
.ticket-divider {
  border-bottom: 1px dashed #000;
  margin: 4px 0;
}
.ticket-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-bottom: 2px;
}
.customer-info-box {
  background: #f1f5f9;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 9px;
  margin: 4px 0;
  border: 1px dotted #94a3b8;
}
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin: 3px 0;
}
.items-table th {
  border-bottom: 1px solid #000;
  border-top: 1px solid #000;
  padding: 3px 0;
  font-size: 9.5px;
}
.items-table td {
  padding: 2.5px 0;
  border-bottom: 1px dotted #ccc;
}
.item-title {
  font-weight: 700;
}
.item-code {
  font-size: 8px;
  color: #555;
}
.grand-total-row {
  font-size: 13px;
  font-weight: 900;
  border-top: 1px dashed #000;
  padding-top: 4px;
  margin-top: 4px;
}
.gate-pass-box {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 2px dashed #000;
  text-align: center;
}
.gate-pass-badge {
  display: inline-block;
  background: #000;
  color: #fff;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 800;
  border-radius: 2px;
}
.ticket-footer {
  text-align: center;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dotted #888;
  font-size: 8.5px;
}
.terms-text {
  font-size: 7.5px;
  color: #333;
  margin-top: 2px;
}`,
      1
    );

    // Compact 58mm
    insertTpl.run(
      'tpl_58mm_compact',
      'Compact 58mm Mini Roll Thermal Receipt',
      '58mm',
      48,
      `<div class="thermal-ticket compact-58">
  <div class="ticket-header">
    <div class="store-title">{{store_name}}</div>
    <div class="store-subtitle">{{store_tagline}}</div>
    <div class="store-meta">Tel: {{store_phone}}</div>
  </div>

  <div class="ticket-divider"></div>

  <div class="ticket-row"><span>Inv: {{invoice_no}}</span><span>{{invoice_date}}</span></div>
  <div class="ticket-row"><span>{{sale_type}}</span><span>Pay: {{payment_method}}</span></div>

  {{customer_vehicle_block}}

  <div class="ticket-divider"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{items_rows}}
      {{labor_row}}
    </tbody>
  </table>

  <div class="ticket-divider"></div>

  <div class="ticket-row grand-total-row">
    <span>TOTAL:</span>
    <span>PKR {{grand_total}}</span>
  </div>
  {{cash_tendered_block}}

  {{gate_pass_block}}

  <div class="ticket-footer">
    <p>{{footer_message}}</p>
  </div>
</div>`,
      `/* Madina Honda Centre - 58mm Compact Mini Slip */
.thermal-ticket.compact-58 {
  width: 48mm;
  margin: 0 auto;
  padding: 1mm;
  font-family: 'Courier New', Courier, monospace;
  font-size: 9.5px;
  line-height: 1.2;
  color: #000;
  background: #fff;
  box-sizing: border-box;
}
.ticket-header { text-align: center; margin-bottom: 2px; }
.store-title { font-size: 11px; font-weight: 900; }
.store-subtitle { font-size: 7.5px; font-weight: 700; }
.store-meta { font-size: 7px; }
.ticket-divider { border-bottom: 1px dashed #000; margin: 3px 0; }
.ticket-row { display: flex; justify-content: space-between; font-size: 8.5px; margin-bottom: 1.5px; }
.items-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
.items-table th { border-bottom: 1px solid #000; border-top: 1px solid #000; padding: 2px 0; font-size: 8px; }
.items-table td { padding: 2px 0; border-bottom: 1px dotted #ccc; }
.grand-total-row { font-size: 11px; font-weight: 900; border-top: 1px dashed #000; padding-top: 3px; margin-top: 2px; }
.gate-pass-box { margin-top: 5px; padding-top: 4px; border-top: 2px dashed #000; text-align: center; }
.gate-pass-badge { background: #000; color: #fff; padding: 1px 4px; font-size: 8px; font-weight: 800; }
.ticket-footer { text-align: center; margin-top: 4px; border-top: 1px dotted #888; font-size: 7.5px; padding-top: 2px; }`,
      0
    );
  }
}

export default db;
