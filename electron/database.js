import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

// Secure %APPDATA% path resolution for production .exe persistence
const dataPath = app ? app.getPath("userData") : ".";
const dbPath = path.join(dataPath, "shopmate_data.sqlite");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export function initDB() {
  db.exec(`
    -- 1. USERS & ACCESS CONTROLS
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER'))
    );

    -- 2. CUSTOMERS / PARTY KHATA (Includes avatar support)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      credit_limit REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      avatar TEXT DEFAULT ''
    );

    -- 3. SUPPLIERS / DEALERS
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 0,
      avatar TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    -- 4. INVENTORY / ITEMS MASTER
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      condition TEXT DEFAULT 'New',
      category TEXT,
      purchase_date TEXT,
      stock_qty REAL DEFAULT 0,
      avg_cost REAL DEFAULT 0,
      min_price REAL DEFAULT 0,
      max_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'Pcs',
      image_path TEXT,
      status TEXT DEFAULT 'Active',
      is_active INTEGER DEFAULT 1
    );

-- 5. PURCHASES (GRN) 
    CREATE TABLE IF NOT EXISTS purchase_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      item_id INTEGER,
      qty_received INTEGER,
      unit_cost REAL,
      payment_type TEXT DEFAULT 'CREDIT',
      invoice_no TEXT DEFAULT 'DIRECT-GRN',
      user_id INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(item_id) REFERENCES items(id)
    );

    -- =========================================================================
    -- ⚙️ WEIGHTED AVERAGE COST (WAC) TRIGGER
    -- This trigger automatically recalculates the true blended cost of an item
    -- whenever new stock is purchased at a different price point.
    -- Formula: ((Old_Qty * Old_Avg_Cost) + (New_Qty * New_Unit_Cost)) / (Total_New_Qty)
    -- =========================================================================
    CREATE TRIGGER IF NOT EXISTS update_wac_after_purchase
    AFTER INSERT ON purchase_lines
    BEGIN
      UPDATE items
      SET 
        avg_cost = CASE 
          -- Prevent division by zero if stock somehow went negative
          WHEN (stock_qty + NEW.qty_received) > 0 
          THEN ((stock_qty * avg_cost) + (NEW.qty_received * NEW.unit_cost)) / (stock_qty + NEW.qty_received)
          -- Fallback if this is the very first stock being added
          ELSE NEW.unit_cost 
        END,
        -- Simultaneously increment the stock quantity
        stock_qty = stock_qty + NEW.qty_received
      WHERE id = NEW.item_id;
    END;

    -- 6. SALES & TRANSACTIONS
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sale_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(item_id) REFERENCES items(id)
    );

    -- 7. COD / CONSIGNMENT METADATA
    CREATE TABLE IF NOT EXISTS sale_cod_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      consignment_number TEXT,
      delivery_charges REAL DEFAULT 0,
      government_tax REAL DEFAULT 0,
      FOREIGN KEY(sale_id) REFERENCES sales(id)
    );

    -- 8. CUSTOMER KHATA LEDGER
    CREATE TABLE IF NOT EXISTS customer_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      reference_id INTEGER,
      description TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      balance_after REAL DEFAULT 0,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- 9. BUSINESS EXPENSES
    CREATE TABLE IF NOT EXISTS business_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- 10. AUDIT LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. SETTINGS
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- 12. SUPPLIER KHATA LEDGER
    CREATE TABLE IF NOT EXISTS supplier_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL, -- 'PURCHASE', 'PAYMENT', 'ADJUSTMENT', 'OPENING'
      reference_id INTEGER,
      description TEXT,
      debit REAL DEFAULT 0,    -- Paid to supplier (reduces balance)
      credit REAL DEFAULT 0,   -- Purchased on credit (increases balance)
      balance_after REAL DEFAULT 0,
      user_id INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- 13. DAILY CASH REGISTER RECONCILIATION
    CREATE TABLE IF NOT EXISTS cash_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opening_float REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      cash_expenses REAL DEFAULT 0,
      cash_payouts REAL DEFAULT 0,
      expected_cash REAL DEFAULT 0,
      actual_cash REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    -- 14. REFUNDS & REPAIRS
    CREATE TABLE IF NOT EXISTS refunds_repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('REFUND', 'REPAIR')),
      sale_id INTEGER,
      item_id INTEGER,
      qty REAL DEFAULT 1,
      amount_refunded REAL DEFAULT 0,
      customer_name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'CANCELLED'
      description TEXT,
      user_id INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Seed Default Users if empty
  const userCount = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get().count;
  if (userCount === 0) {
    db.prepare("INSERT INTO users (username, pin, role) VALUES (?, ?, ?)").run(
      "Manager",
      "1234",
      "ADMIN",
    );
    db.prepare("INSERT INTO users (username, pin, role) VALUES (?, ?, ?)").run(
      "Cashier",
      "0000",
      "CASHIER",
    );
  }

  // Seed default shop info if not set
  const hasShopName = db
    .prepare("SELECT COUNT(*) as count FROM settings WHERE key = ?")
    .get("shop_name").count;
  if (hasShopName === 0) {
    const insert = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
    );
    insert.run("shop_name", "ShopMate POS");
    insert.run("shop_address", "Main Retail Market, Store #12");
    insert.run("shop_phone", "+92 300 0000000");
    insert.run("shop_logo", "");
    insert.run("sku_format", "CAT_SEQ");
  }

  // 🛡️ COMPREHENSIVE AUTO-MIGRATION BLOCK
  try {
    // 1. Check and patch 'items' table
    const itemTableInfo = db.prepare("PRAGMA table_info(items)").all();
    if (!itemTableInfo.some((col) => col.name === "is_active")) {
      db.exec("ALTER TABLE items ADD COLUMN is_active INTEGER DEFAULT 1");
    }

    // 2. Check and patch 'suppliers' table
    const supplierTableInfo = db.prepare("PRAGMA table_info(suppliers)").all();
    const supplierColumnsToAdd = [
      { name: "is_active", type: "INTEGER DEFAULT 1" },
      { name: "address", type: "TEXT DEFAULT ''" },
      { name: "avatar", type: "TEXT DEFAULT ''" },
      { name: "credit_limit", type: "REAL DEFAULT 0" },
    ];
    for (const col of supplierColumnsToAdd) {
      if (!supplierTableInfo.some((c) => c.name === col.name)) {
        db.exec(`ALTER TABLE suppliers ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    // 3. Check and patch 'customers' table
    const customerTableInfo = db.prepare("PRAGMA table_info(customers)").all();
    if (!customerTableInfo.some((col) => col.name === "is_active")) {
      db.exec("ALTER TABLE customers ADD COLUMN is_active INTEGER DEFAULT 1");
    }
    if (!customerTableInfo.some((col) => col.name === "address")) {
      db.exec("ALTER TABLE customers ADD COLUMN address TEXT DEFAULT ''");
    }
    if (!customerTableInfo.some((col) => col.name === "avatar")) {
      db.exec("ALTER TABLE customers ADD COLUMN avatar TEXT DEFAULT ''");
    }

    // 4. 📅 Check and patch 'purchase_lines' and 'supplier_ledger' for custom dates & payment types
    const purchaseTableInfo = db
      .prepare("PRAGMA table_info(purchase_lines)")
      .all();
    if (!purchaseTableInfo.some((col) => col.name === "date")) {
      db.exec(
        "ALTER TABLE purchase_lines ADD COLUMN date TEXT DEFAULT CURRENT_TIMESTAMP",
      );
    }
    if (!purchaseTableInfo.some((col) => col.name === "payment_type")) {
      db.exec(
        "ALTER TABLE purchase_lines ADD COLUMN payment_type TEXT DEFAULT 'CREDIT'",
      );
    }

    const supplierLedgerInfo = db
      .prepare("PRAGMA table_info(supplier_ledger)")
      .all();
    if (!supplierLedgerInfo.some((col) => col.name === "date")) {
      db.exec(
        "ALTER TABLE supplier_ledger ADD COLUMN date TEXT DEFAULT CURRENT_TIMESTAMP",
      );
    }
  } catch (err) {
    console.error("Database auto-migration patch error:", err);
  }

  // // 3. Check and patch 'customers' table
  // const customerTableInfo = db.prepare("PRAGMA table_info(customers)").all();
  // if (!customerTableInfo.some((col) => col.name === "is_active")) {
  //   db.exec("ALTER TABLE customers ADD COLUMN is_active INTEGER DEFAULT 1");
  // }
  // if (!customerTableInfo.some((col) => col.name === "address")) {
  //   db.exec("ALTER TABLE customers ADD COLUMN address TEXT DEFAULT ''");
  // }

  return db;
}

export default db;
