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
}

export default db;
