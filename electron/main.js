import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDB } from './database.js';
import fs from 'fs';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import crypto from 'crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// Initialize SQLite Tables & Auto-migrations
initDB();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'ShopMate POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // 👈 ADD THIS
      contextIsolation: true, // 👈 CHANGE TO TRUE
      nodeIntegration: false, // 👈 CHANGE TO FALSE
      sandbox: false, // Keep false for now if better-sqlite3 acts up
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 🔒 Load the public key safely from disk (Place 'public_key.pem' in your app/project root)
let PUBLIC_KEY = '';
try {
  const keyPath = path.join(app.getAppPath(), 'public_key.pem');
  PUBLIC_KEY = fs.readFileSync(keyPath, 'utf8');
} catch (err) {
  console.error(
    "❌ Critical Error: 'public_key.pem' not found in app path!",
    err.message,
  );
}

// 1. Get this PC's unique hardware ID
ipcMain.handle('get-machine-id', () => {
  try {
    return { success: true, machineId: machineIdSync({ original: true }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 2. Validate and activate license key
ipcMain.handle('activate-license', (event, activationKey) => {
  try {
    if (!PUBLIC_KEY) {
      return {
        success: false,
        error: 'Server error: Public verification key is missing.',
      };
    }

    if (!activationKey || !activationKey.includes('.')) {
      return { success: false, error: 'Invalid license key format.' };
    }

    const [payloadBase64, signature] = activationKey.split('.');

    // Verify cryptographic signature
    const verify = crypto.createVerify('SHA256');
    verify.update(payloadBase64);
    verify.end();

    const isValid = verify.verify(PUBLIC_KEY, signature, 'base64url');
    if (!isValid) {
      return { success: false, error: 'Invalid or tampered activation key.' };
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );

    // Check expiration date
    if (new Date(payload.exp) < new Date()) {
      return { success: false, error: 'This license key has expired.' };
    }

    // Check hardware ID binding (Ensures key isn't shared with another PC)
    const currentMachineId = machineIdSync({ original: true });
    if (payload.mid && payload.mid !== currentMachineId) {
      return {
        success: false,
        error: 'This license key belongs to a different computer.',
      };
    }

    // Save active license securely in SQLite settings table
    db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    ).run('shopmate_license', activationKey);

    return { success: true, payload };
  } catch (err) {
    return { success: false, error: 'Activation error: ' + err.message };
  }
});

// 3. Helper to check license on app boot
ipcMain.handle('check-license-status', () => {
  try {
    if (!PUBLIC_KEY)
      return { active: false, error: 'Missing public key file.' };

    const row = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('shopmate_license');
    if (!row) return { active: false, error: 'No license found.' };

    // Run the same validation check silently on startup
    const [payloadBase64, signature] = row.value.split('.');
    const verify = crypto.createVerify('SHA256');
    verify.update(payloadBase64);
    verify.end();

    if (!verify.verify(PUBLIC_KEY, signature, 'base64url'))
      return { active: false, error: 'Tampered license.' };

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );
    if (new Date(payload.exp) < new Date())
      return { active: false, error: 'License expired.' };

    return { active: true, payload };
  } catch (err) {
    return { active: false, error: err.message };
  }
});
// ==========================================
// IPC BACKEND API HANDLERS FOR SHOPMATE
// ==========================================

// 1. AUTHENTICATION & USERS
ipcMain.handle('login', (event, { username, pin }) => {
  const user = db
    .prepare(
      'SELECT id, username, role FROM users WHERE username = ? AND pin = ?',
    )
    .get(username, pin);
  if (user) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    ).run(user.id, user.username, 'LOGIN', 'User logged in successfully');
    return { success: true, user };
  }
  return { success: false, error: 'Invalid Username or PIN' };
});

// ipcMain.handle("get-users", () => {
//   return db.prepare("SELECT id, username, role FROM users").all();
// });
ipcMain.handle('get-users', async () => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    return users;
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
});

// 1. DASHBOARD STATS HANDLER
ipcMain.handle('get-dashboard-stats', () => {
  try {
    // 🛡️ Get local YYYY-MM-DD and YYYY-MM using local time instead of UTC to fix timezone drift
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA'); // Always yields local YYYY-MM-DD
    const currentMonth = localDate.substring(0, 7);

    const dailySales = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE date LIKE ?`,
      )
      .get(`${localDate}%`);

    const monthlySales = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE strftime('%Y-%m', date) = ?`,
      )
      .get(currentMonth);

    const totalStockWorth = db
      .prepare(
        `SELECT COALESCE(SUM(stock_qty * avg_cost), 0) as total FROM items`,
      )
      .get().total;

    const lowStockCount = db
      .prepare(`SELECT COUNT(*) as count FROM items WHERE stock_qty <= 5`)
      .get().count;

    const customerDues = db
      .prepare(
        `SELECT COALESCE(SUM(balance), 0) as total FROM customers WHERE balance > 0`,
      )
      .get().total;

    const supplierPayables = db
      .prepare(
        `SELECT COALESCE(SUM(balance), 0) as total FROM suppliers WHERE balance > 0`,
      )
      .get().total;

    return {
      dailySales,
      monthlySales,
      totalStockWorth,
      lowStockCount,
      customerDues,
      supplierPayables,
    };
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    return {
      dailySales: { total: 0, count: 0 },
      monthlySales: { total: 0, count: 0 },
      totalStockWorth: 0,
      lowStockCount: 0,
      customerDues: 0,
      supplierPayables: 0,
    };
  }
});

// 2. DASHBOARD ANALYTICS HANDLER
ipcMain.handle('get-dashboard-analytics', (event, timeframe = 7) => {
  try {
    const salesTrend = db
      .prepare(
        `
      SELECT date(date) as sale_date, SUM(total_amount) as total, COUNT(*) as count
      FROM sales
      WHERE date >= date('now', '-' || ? || ' days', 'localtime')
      GROUP BY date(date)
      ORDER BY sale_date ASC
    `,
      )
      .all(timeframe);

    const paymentFlow = db
      .prepare(
        `
      SELECT payment_type, SUM(total_amount) as total 
      FROM sales 
      WHERE date >= date('now', '-30 days', 'localtime')
      GROUP BY payment_type
    `,
      )
      .all();

    const hotProducts = db
      .prepare(
        `
      SELECT i.name, SUM(l.qty) as total_sold, SUM(l.qty * l.price) as revenue
      FROM sale_lines l
      JOIN items i ON l.item_id = i.id
      GROUP BY l.item_id
      ORDER BY total_sold DESC
      LIMIT 5
    `,
      )
      .all();

    const restockItems = db
      .prepare(
        `
      SELECT name, stock_qty, unit, min_price FROM items WHERE stock_qty <= 5 ORDER BY stock_qty ASC LIMIT 5
    `,
      )
      .all();

    const topCustomers = db
      .prepare(
        `
      SELECT c.name, c.phone, SUM(s.total_amount) as total_spent
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      GROUP BY s.customer_id
      ORDER BY total_spent DESC
      LIMIT 5
    `,
      )
      .all();

    const topCreditHolders = db
      .prepare(
        `
      SELECT name, phone, balance FROM customers WHERE balance > 0 ORDER BY balance DESC LIMIT 5
    `,
      )
      .all();

    return {
      salesTrend,
      paymentFlow,
      hotProducts,
      restockItems,
      topCustomers,
      topCreditHolders,
    };
  } catch (err) {
    console.error('Dashboard Analytics Error:', err);
    return {
      salesTrend: [],
      paymentFlow: [],
      hotProducts: [],
      restockItems: [],
      topCustomers: [],
      topCreditHolders: [],
    };
  }
});
// 3. INVENTORY & ITEMS MASTER
ipcMain.handle('get-items', (event, showAll = true) => {
  if (showAll) {
    return db.prepare('SELECT * FROM items ORDER BY id DESC').all();
  }
  return db
    .prepare(
      'SELECT * FROM items WHERE is_active = 1 OR is_active IS NULL ORDER BY id DESC',
    )
    .all();
});
function generateNextSku(category, name) {
  const setting = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('sku_format') || { value: 'CAT_SEQ' };
  const countRow = db.prepare('SELECT COUNT(*) as count FROM items').get();
  const nextId = (countRow.count + 1).toString().padStart(4, '0');
  const catPrefix = (category ? category.substring(0, 3) : 'GEN').toUpperCase();
  return `${catPrefix}-${nextId}`;
}

ipcMain.handle('add-item', (event, { item, currentUser }) => {
  try {
    const autoCode = item.code || generateNextSku(item.category, item.name);
    db.prepare(
      `
      INSERT INTO items (code, name, description, condition, category, stock_qty, avg_cost, min_price, max_price, selling_price, unit, image_path)
      VALUES (@code, @name, @description, @condition, @category, @stock_qty, @avg_cost, @min_price, @max_price, @selling_price, @unit, @image_path)
    `,
    ).run({
      code: autoCode,
      description: '',
      condition: 'New',
      category: 'General',
      image_path: '',
      ...item,
    });

    db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    ).run(
      currentUser.id,
      currentUser.username,
      'ADD_ITEM',
      `Added item ${item.name} (${autoCode})`,
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 2. UPDATE ITEM PRICING & DETAILS (Supports manual cost, selling price, max price & WAC override)
ipcMain.handle('update-item', (event, { id, item, currentUser }) => {
  try {
    db.prepare(
      `
      UPDATE items 
      SET name = ?, description = ?, category = ?, selling_price = ?, min_price = ?, max_price = ?, stock_qty = ?, unit = ?, image_path = ?
      WHERE id = ?
    `,
    ).run(
      item.name,
      item.description || '',
      item.category || 'General',
      item.selling_price || item.unit_price, // Fallback safety for property name
      item.min_price || 0,
      item.max_price || 0,
      item.stock_qty || 0,
      item.unit || 'Pcs',
      item.image_path || '',
      id, // <-- This variable is now correctly defined and passed from the payload
    );

    db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    ).run(
      currentUser.id,
      currentUser.username,
      'UPDATE_ITEM',
      `Updated item ID #${id} (${item.name})`,
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. POS SALES & CHECKOUT
ipcMain.handle(
  'create-sale',
  (event, { customer_id, items, payment_type, cod_meta, currentUser }) => {
    try {
      const processSale = db.transaction(() => {
        let productSubtotal = items.reduce(
          (sum, item) => sum + item.qty * item.price,
          0,
        );
        let deliveryFee = 0;
        let govtTax = 0;
        let customerGrandTotal = productSubtotal;

        if (payment_type === 'COD' && cod_meta) {
          deliveryFee = parseFloat(cod_meta.delivery_charges) || 0;
          govtTax = parseFloat(cod_meta.government_tax) || 0;
          customerGrandTotal = productSubtotal + deliveryFee + govtTax;
        }

        const saleStmt = db.prepare(
          'INSERT INTO sales (customer_id, total_amount, payment_type, user_id) VALUES (?, ?, ?, ?)',
        );
        const saleInfo = saleStmt.run(
          customer_id || null,
          productSubtotal,
          payment_type,
          currentUser.id,
        );
        const saleId = saleInfo.lastInsertRowid;

        const lineStmt = db.prepare(
          'INSERT INTO sale_lines (sale_id, item_id, qty, price) VALUES (?, ?, ?, ?)',
        );
        const deductStock = db.prepare(
          'UPDATE items SET stock_qty = stock_qty - ? WHERE id = ?',
        );

        for (const line of items) {
          lineStmt.run(saleId, line.id, line.qty, line.price);
          deductStock.run(line.qty, line.id);
        }

        if (payment_type === 'COD' && cod_meta) {
          db.prepare(
            `
          INSERT INTO sale_cod_meta (sale_id, consignment_number, delivery_charges, government_tax)
          VALUES (?, ?, ?, ?)
        `,
          ).run(saleId, cod_meta.consignment_number, deliveryFee, govtTax);
        }

        if (payment_type === 'CREDIT' && customer_id) {
          const cust = db
            .prepare('SELECT balance FROM customers WHERE id = ?')
            .get(customer_id);
          const newBal = (cust ? cust.balance : 0) + productSubtotal;

          db.prepare('UPDATE customers SET balance = ? WHERE id = ?').run(
            newBal,
            customer_id,
          );
          db.prepare(
            `
          INSERT INTO customer_ledger (customer_id, transaction_type, reference_id, description, debit, balance_after, user_id)
          VALUES (?, 'SALE', ?, ?, ?, ?, ?)
        `,
          ).run(
            customer_id,
            saleId,
            `Invoice #${saleId} (Credit Sale)`,
            productSubtotal,
            newBal,
            currentUser.id,
          );
        }

        return {
          success: true,
          saleId,
          totalAmount: customerGrandTotal,
          productSubtotal,
        };
      });

      return processSale();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle('print-receipt', async (event, htmlContent) => {
  try {
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true },
    });

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto; /* Sets exact thermal roll width */
              margin: 0;
            }
            body { 
              font-family: 'Courier New', monospace; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 4mm 2mm; 
              color: #000; 
              background: #fff; 
            }
            .receipt-divider { border-bottom: 1px dashed #000; margin: 6px 0; }
            .receipt-item-row { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <!-- 🛑 REMOVED the <script> tag here to prevent double printing -->
        </body>
      </html>
    `;

    await printWin.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(printableHtml)}`,
    );

    // Electron's native print function is more reliable than window.print()
    printWin.webContents.print(
      {
        silent: false, // Set to true if you want to skip the Windows print dialog
        printBackground: true,
        margins: { marginType: 'none' }, // Optional: helps with thermal printers
      },
      (success, failureReason) => {
        if (!success) console.error('Print failed:', failureReason);
        if (!printWin.isDestroyed()) printWin.close();
      },
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('export-ledger-pdf', async (event, htmlContent) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Statement as PDF',
      defaultPath: `statement_${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { canceled: true };

    const pdfWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true },
    });

    await pdfWin.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );

    // Wait a brief moment for styles to settle, then generate PDF
    setTimeout(async () => {
      try {
        const pdfData = await pdfWin.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
        });
        fs.writeFileSync(filePath, pdfData);
        if (!pdfWin.isDestroyed()) pdfWin.close();
      } catch (err) {
        console.error('PDF generation sub-error:', err);
      }
    }, 400);

    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
// 5. CUSTOMER KHATA & PAYMENTS
ipcMain.handle('get-customers', () =>
  db.prepare('SELECT * FROM customers ORDER BY id DESC').all(),
);

ipcMain.handle('add-customer', (event, { name, phone, credit_limit }) => {
  try {
    const stmt = db.prepare(
      'INSERT INTO customers (name, phone, credit_limit, balance) VALUES (?, ?, ?, 0)',
    );
    const res = stmt.run(name, phone, credit_limit || 0);
    return { success: true, customerId: res.lastInsertRowid };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle(
  'update-customer',
  (event, { id, name, phone, credit_limit, avatar }) => {
    try {
      db.prepare(
        'UPDATE customers SET name = ?, phone = ?, credit_limit = ?, avatar = ? WHERE id = ?',
      ).run(name, phone, credit_limit || 0, avatar || '', id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle('get-customer-ledger', (event, customerId) => {
  return db
    .prepare(
      `
    SELECT l.*, u.username as user_name 
    FROM customer_ledger l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.customer_id = ? 
    ORDER BY l.id ASC
  `,
    )
    .all(customerId);
});

ipcMain.handle(
  'record-customer-payment',
  (event, { customer_id, amount, payment_method, notes, currentUser }) => {
    try {
      const cust = db
        .prepare('SELECT balance, name FROM customers WHERE id = ?')
        .get(customer_id);
      if (!cust) throw new Error('Customer not found');

      const newBal = cust.balance - amount;
      db.prepare('UPDATE customers SET balance = ? WHERE id = ?').run(
        newBal,
        customer_id,
      );

      db.prepare(
        `
      INSERT INTO customer_ledger (customer_id, transaction_type, description, credit, balance_after, user_id)
      VALUES (?, 'PAYMENT', ?, ?, ?, ?)
    `,
      ).run(
        customer_id,
        `Payment Received (${payment_method}) - ${notes || 'Debt Settlement'}`,
        amount,
        newBal,
        currentUser.id,
      );

      return { success: true, newBal };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle(
  'record-customer-debt',
  (event, { customer_id, amount, notes, currentUser }) => {
    try {
      const cust = db
        .prepare('SELECT balance FROM customers WHERE id = ?')
        .get(customer_id);
      if (!cust) throw new Error('Customer not found');

      const newBal = (cust.balance || 0) + amount;
      db.prepare('UPDATE customers SET balance = ? WHERE id = ?').run(
        newBal,
        customer_id,
      );

      db.prepare(
        `
      INSERT INTO customer_ledger (customer_id, transaction_type, description, debit, balance_after, user_id)
      VALUES (?, 'MANUAL_DEBT', ?, ?, ?, ?)
    `,
      ).run(
        customer_id,
        `Manual Debt Added: ${notes || 'Direct Khata Adjustment'}`,
        amount,
        newBal,
        currentUser.id,
      );

      return { success: true, newBal };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle('update-ledger-note', (event, { ledgerId, description }) => {
  try {
    db.prepare('UPDATE customer_ledger SET description = ? WHERE id = ?').run(
      description,
      ledgerId,
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle(
  'print-customer-statement',
  async (event, { customer, entries }) => {
    try {
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: true },
      });
      const rowsHtml = entries
        .map(
          (e) => `
      <tr>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; font-size: 11px;">${e.created_at || e.date}</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; font-size: 11px;">${e.description}</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; font-size: 11px; color: red;">${e.debit > 0 ? e.debit.toLocaleString() : '-'}</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; font-size: 11px; color: green;">${e.credit > 0 ? e.credit.toLocaleString() : '-'}</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; font-size: 11px; font-weight: bold;">${e.balance_after?.toLocaleString()}</td>
      </tr>
    `,
        )
        .join('');

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; padding: 15px; color: #000; }
            h2, h4 { margin: 0 0 5px 0; text-align: center; }
            .info { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #eee; font-size: 11px; padding: 5px; text-align: left; border-bottom: 2px solid #000; }
            .total { margin-top: 15px; font-size: 14px; font-weight: bold; text-align: right; border-top: 1px solid #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <h2>CUSTOMER LEDGER STATEMENT</h2>
          <h4>ShopMate POS</h4>
          <div class="info">
            <strong>Client:</strong> ${customer.name}<br/>
            <strong>Phone:</strong> ${customer.phone || 'N/A'}<br/>
            <strong>Statement Date:</strong> ${new Date().toLocaleString()}
          </div>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="total">Net Balance Due: Rs. ${customer.balance?.toLocaleString()}</div>
          <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
        </body>
      </html>
    `;
      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );
      printWin.webContents.print(
        { silent: false, printBackground: true },
        () => {
          if (!printWin.isDestroyed()) printWin.close();
        },
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

// 6. BUSINESS & TRIP EXPENSES (Manager-Only Delete Guard)
ipcMain.handle('get-expenses', () => {
  return db
    .prepare(
      `
    SELECT e.*, u.username 
    FROM business_expenses e 
    LEFT JOIN users u ON e.user_id = u.id 
    ORDER BY e.id DESC
  `,
    )
    .all();
});

ipcMain.handle('add-expense', (event, { expense, currentUser }) => {
  try {
    db.prepare(
      'INSERT INTO business_expenses (category, amount, description, user_id) VALUES (?, ?, ?, ?)',
    ).run(
      expense.category,
      expense.amount,
      expense.description,
      currentUser.id,
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-expense', (event, { expenseId, currentUser }) => {
  try {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error(
        'Unauthorized: Only Managers/Admins can delete financial records.',
      );
    }
    db.prepare('DELETE FROM business_expenses WHERE id = ?').run(expenseId);
    db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    ).run(
      currentUser.id,
      currentUser.username,
      'DELETE_EXPENSE',
      `Deleted expense ID #${expenseId}`,
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Add or update these IPC handlers in main.js:

// 1. Get Suppliers (Supports filter for active/archived)
ipcMain.handle('get-suppliers', (event, showAll = true) => {
  if (showAll) {
    return db.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
  }
  return db
    .prepare(
      'SELECT * FROM suppliers WHERE is_active = 1 OR is_active IS NULL ORDER BY id DESC',
    )
    .all();
});

// 2. Add Supplier with Opening Balance Ledger Safeguard
ipcMain.handle('add-supplier', (event, { supplier, currentUser }) => {
  try {
    const info = db
      .prepare(
        `
      INSERT INTO suppliers (name, company, phone, address, avatar, credit_limit, balance, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
      )
      .run(
        supplier.name,
        supplier.company || '',
        supplier.phone || '',
        supplier.address || '',
        supplier.avatar || '',
        supplier.credit_limit || 0,
        supplier.opening_balance || 0,
      );

    const supplierId = info.lastInsertRowid;

    // CRUCIAL SAFEGUARD: Simultaneously inject entry into supplier_ledger
    if (supplier.opening_balance > 0) {
      db.prepare(
        `
        INSERT INTO supplier_ledger (supplier_id, transaction_type, description, credit, balance_after, user_id)
        VALUES (?, 'OPENING', 'Opening Balance Debt', ?, ?, ?)
      `,
      ).run(
        supplierId,
        supplier.opening_balance,
        supplier.opening_balance,
        currentUser.id,
      );
    }

    return { success: true, id: supplierId };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 3. Update Supplier Profile
ipcMain.handle('update-supplier', (event, { supplier, currentUser }) => {
  try {
    db.prepare(
      `
      UPDATE suppliers
      SET name = ?, company = ?, phone = ?, address = ?, avatar = ?, credit_limit = ?
      WHERE id = ?
    `,
    ).run(
      supplier.name,
      supplier.company || '',
      supplier.phone || '',
      supplier.address || '',
      supplier.avatar || '',
      supplier.credit_limit || 0,
      supplier.id,
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. Archive / Reactivate Supplier Guard
ipcMain.handle(
  'toggle-archive-supplier',
  (event, { supplierId, is_active, currentUser }) => {
    try {
      if (currentUser?.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Access Denied: Only Managers can archive vendors.',
        };
      }

      db.prepare(`UPDATE suppliers SET is_active = ? WHERE id = ?`).run(
        is_active,
        supplierId,
      );

      db.prepare(
        'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
      ).run(
        currentUser.id,
        currentUser.username,
        is_active === 0 ? 'ARCHIVE_SUPPLIER' : 'REACTIVATE_SUPPLIER',
        `${is_active === 0 ? 'Archived' : 'Reactivated'} supplier ID #${supplierId}`,
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle('get-supplier-ledger', (event, supplierId) => {
  return db
    .prepare(
      `
    SELECT l.*, u.username as user_name FROM supplier_ledger l LEFT JOIN users u ON l.user_id = u.id WHERE l.supplier_id = ? ORDER BY l.id ASC
  `,
    )
    .all(supplierId);
});

ipcMain.handle(
  'record-supplier-payment',
  (event, { supplier_id, amount, payment_method, notes, currentUser }) => {
    try {
      const supp = db
        .prepare('SELECT balance FROM suppliers WHERE id = ?')
        .get(supplier_id);
      if (!supp) throw new Error('Supplier not found');

      const newBal = (supp.balance || 0) - amount;
      db.prepare('UPDATE suppliers SET balance = ? WHERE id = ?').run(
        newBal,
        supplier_id,
      );

      db.prepare(
        `
      INSERT INTO supplier_ledger (supplier_id, transaction_type, description, debit, balance_after, user_id)
      VALUES (?, 'PAYMENT', ?, ?, ?, ?)
    `,
      ).run(
        supplier_id,
        `Payment Paid (${payment_method}) - ${notes || 'Vendor Settlement'}`,
        amount,
        newBal,
        currentUser.id,
      );

      return { success: true, newBal };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle(
  'record-purchase',
  (
    event,
    {
      supplier_id,
      item_id,
      qty_received,
      unit_cost,
      payment_type,
      invoice_no,
      date,
      currentUser,
    },
  ) => {
    const transaction = db.transaction(() => {
      const purchaseDate = date
        ? `${date} 00:00:00`
        : new Date().toISOString().replace('T', ' ').substring(0, 19);
      const mode = payment_type || 'CREDIT';

      // 1. Insert into purchase_lines with the correct payment_type mode ('CASH' or 'CREDIT')
      db.prepare(
        `
        INSERT INTO purchase_lines (supplier_id, item_id, qty_received, unit_cost, payment_type, invoice_no, user_id, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        supplier_id || null,
        item_id,
        qty_received,
        unit_cost,
        mode,
        invoice_no || 'DIRECT-GRN',
        currentUser.id,
        purchaseDate,
      );

      // 2. Only update supplier balance and ledger if it's a CREDIT purchase
      if (supplier_id && mode === 'CREDIT') {
        const supp = db
          .prepare('SELECT balance FROM suppliers WHERE id = ?')
          .get(supplier_id);
        const billTotal = qty_received * unit_cost;
        const newSuppBal = (supp.balance || 0) + billTotal;

        db.prepare('UPDATE suppliers SET balance = ? WHERE id = ?').run(
          newSuppBal,
          supplier_id,
        );

        db.prepare(
          `
          INSERT INTO supplier_ledger (supplier_id, transaction_type, description, credit, balance_after, user_id, date)
          VALUES (?, 'PURCHASE', ?, ?, ?, ?, ?)
        `,
        ).run(
          supplier_id,
          `GRN Credit Purchase (Invoice: ${invoice_no})`,
          billTotal,
          newSuppBal,
          currentUser.id,
          purchaseDate,
        );
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);
// 8. P&L FINANCIAL LEDGER WITH SMART FILTERS & SORTING
// ipcMain.handle("get-financial-ledger", (event, filters = {}) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       user_id,
//       payment_type,
//       sortBy = "date_desc",
//     } = filters;

//     let expenseQuery = `SELECT e.*, u.username FROM business_expenses e LEFT JOIN users u ON e.user_id = u.id WHERE 1=1`;
//     let purchaseQuery = `
//   SELECT pl.*, pl.qty_received, pl.unit_cost, pl.payment_type,
//          s.name as supplier_name, i.name as item_name
//   FROM purchase_lines pl
//   LEFT JOIN suppliers s ON pl.supplier_id = s.id
//   LEFT JOIN items i ON pl.item_id = i.id
//   WHERE 1=1
// `;
//     let salesQuery = `
//       SELECT s.id as sale_id, s.date, s.payment_type, s.total_amount as invoice_total,
//              c.name as customer_name, u.username,
//              i.name as item_name, sl.qty as qty_sold, sl.price as unit_price, (sl.qty * sl.price) as total_line
//       FROM sales s
//       LEFT JOIN sale_lines sl ON s.id = sl.sale_id
//       LEFT JOIN items i ON sl.item_id = i.id
//       LEFT JOIN customers c ON s.customer_id = c.id
//       LEFT JOIN users u ON s.user_id = u.id
//       WHERE 1=1
//     `;

//     let expParams = [],
//       purParams = [],
//       salParams = [];

//     if (startDate && endDate) {
//       expenseQuery += ` AND date(e.date) >= date(?) AND date(e.date) <= date(?)`;
//       purchaseQuery += ` AND date(pl.date) >= date(?) AND date(pl.date) <= date(?)`;
//       salesQuery += ` AND date(s.date) >= date(?) AND date(s.date) <= date(?)`;
//       expParams.push(startDate, endDate);
//       purParams.push(startDate, endDate);
//       salParams.push(startDate, endDate);
//     }

//     if (user_id) {
//       expenseQuery += ` AND e.user_id = ?`;
//       expParams.push(user_id);
//       salesQuery += ` AND s.user_id = ?`;
//       salParams.push(user_id);
//     }

//     if (payment_type) {
//       salesQuery += ` AND s.payment_type = ?`;
//       salParams.push(payment_type);
//     }

//     let expenses = db.prepare(expenseQuery).all(...expParams);
//     let purchases = db.prepare(purchaseQuery).all(...purParams);
//     let sales = db.prepare(salesQuery).all(...salParams);

//     const sortFn = (a, b) => {
//       const dateA = new Date(a.date || 0);
//       const dateB = new Date(b.date || 0);
//       if (sortBy === "date_asc") {
//         return dateA - dateB;
//       } else if (sortBy === "amount_desc") {
//         return (
//           (b.amount || b.total_amount || b.qty_received * b.unit_cost || 0) -
//           (a.amount || a.total_amount || a.qty_received * a.unit_cost || 0)
//         );
//       } else if (sortBy === "amount_asc") {
//         return (
//           (a.amount || a.total_amount || a.qty_received * a.unit_cost || 0) -
//           (b.amount || b.total_amount || b.qty_received * b.unit_cost || 0)
//         );
//       } else {
//         return dateB - dateA;
//       }
//     };

//     expenses.sort(sortFn);
//     purchases.sort(sortFn);
//     sales.sort(sortFn);

//     const totalSales = db
//       .prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales")
//       .get().total;
//     const totalExpenses = db
//       .prepare(
//         "SELECT COALESCE(SUM(amount), 0) as total FROM business_expenses",
//       )
//       .get().total;
//     const totalPurchases = db
//       .prepare(
//         "SELECT COALESCE(SUM(qty_received * unit_cost), 0) as total FROM purchase_lines",
//       )
//       .get().total;

//     return {
//       expenses,
//       purchases,
//       sales,
//       summary: {
//         totalSales,
//         totalExpenses,
//         totalPurchases,
//         netProfit: totalSales - (totalExpenses + totalPurchases),
//       },
//     };
//   } catch (err) {
//     console.error("Financial Ledger Error:", err);
//     return {
//       expenses: [],
//       purchases: [],
//       sales: [],
//       summary: {
//         totalSales: 0,
//         totalExpenses: 0,
//         totalPurchases: 0,
//         netProfit: 0,
//       },
//     };
//   }
// });
// Upgraded get-master-general-ledger handler in main.js
ipcMain.handle('get-master-general-ledger', () => {
  try {
    const customerEntries = db
      .prepare(
        `
      SELECT cl.id, COALESCE(c.name, 'Customer') as entity_name, COALESCE(cl.description, 'Khata') as description, COALESCE(cl.debit, 0) as debit, COALESCE(cl.credit, 0) as credit, COALESCE(cl.balance_after, 0) as balance_after, COALESCE(cl.created_at, datetime('now')) as date, 'CUSTOMER_KHATA' as stream, COALESCE(u.username, 'Manager') as user_name
      FROM customer_ledger cl LEFT JOIN customers c ON cl.customer_id = c.id LEFT JOIN users u ON cl.user_id = u.id
    `,
      )
      .all();

    const expenseEntries = db
      .prepare(
        `
      SELECT e.id, COALESCE(e.category, 'Expense') as entity_name, COALESCE(e.description, 'Cost') as description, COALESCE(e.amount, 0) as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(e.date, datetime('now')) as date, 'EXPENSE' as stream, COALESCE(u.username, 'Manager') as user_name
      FROM business_expenses e LEFT JOIN users u ON e.user_id = u.id
    `,
      )
      .all();

    const salesEntries = db
      .prepare(
        `
      SELECT s.id, COALESCE(c.name, 'Walk-in') as entity_name, ('Invoice #' || s.id || ' (' || s.payment_type || ')') as description, 0.0 as debit, COALESCE(s.total_amount, 0) as credit, 0.0 as balance_after, COALESCE(s.date, datetime('now')) as date, 'SALE' as stream, COALESCE(u.username, 'Manager') as user_name
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id LEFT JOIN users u ON s.user_id = u.id
    `,
      )
      .all();

    // 🛡️ Safe wrapper for optional inventory shrinkage table
    let shrinkageEntries = [];
    try {
      shrinkageEntries = db
        .prepare(
          `
        SELECT id, 'Inventory Write-Off' as entity_name, COALESCE(reason, 'Damaged / Expired Stock') as description, COALESCE(total_loss, 0) as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(date, datetime('now')) as date, 'SHRINKAGE' as stream, COALESCE(username, 'Manager') as user_name
        FROM inventory_shrinkage
      `,
        )
        .all();
    } catch (e) {
      shrinkageEntries = [];
    }

    const auditEntries = db
      .prepare(
        `
      SELECT id, 'Security Event' as entity_name, COALESCE(details, action) as description, 0.0 as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(timestamp, datetime('now')) as date, 'AUDIT_LOG' as stream, COALESCE(username, 'System') as user_name
      FROM audit_logs
    `,
      )
      .all();

    return [
      ...customerEntries,
      ...expenseEntries,
      ...salesEntries,
      ...shrinkageEntries,
      ...auditEntries,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('Master Ledger Error:', err);
    return [];
  }
});
// ipcMain.handle("get-master-general-ledger", () => {
//   try {
//     const customerEntries = db
//       .prepare(
//         `
//       SELECT cl.id, COALESCE(c.name, 'Customer') as entity_name, COALESCE(cl.description, 'Khata') as description, COALESCE(cl.debit, 0) as debit, COALESCE(cl.credit, 0) as credit, COALESCE(cl.balance_after, 0) as balance_after, COALESCE(cl.date, datetime('now')) as date, 'CUSTOMER_KHATA' as stream, COALESCE(u.username, 'Manager') as user_name
//       FROM customer_ledger cl LEFT JOIN customers c ON cl.customer_id = c.id LEFT JOIN users u ON cl.user_id = u.id
//     `,
//       )
//       .all();

//     const expenseEntries = db
//       .prepare(
//         `
//       SELECT e.id, COALESCE(e.category, 'Expense') as entity_name, COALESCE(e.description, 'Cost') as description, COALESCE(e.amount, 0) as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(e.date, datetime('now')) as date, 'EXPENSE' as stream, COALESCE(u.username, 'Manager') as user_name
//       FROM business_expenses e LEFT JOIN users u ON e.user_id = u.id
//     `,
//       )
//       .all();

//     const salesEntries = db
//       .prepare(
//         `
//       SELECT s.id, COALESCE(c.name, 'Walk-in') as entity_name, ('Invoice #' || s.id || ' (' || s.payment_type || ')') as description, 0.0 as debit, COALESCE(s.total_amount, 0) as credit, 0.0 as balance_after, COALESCE(s.date, datetime('now')) as date, 'SALE' as stream, COALESCE(u.username, 'Manager') as user_name
//       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id LEFT JOIN users u ON s.user_id = u.id
//     `,
//       )
//       .all();

//     let shrinkageEntries = [];
//     try {
//       shrinkageEntries = db
//         .prepare(
//           `
//         SELECT id, 'Inventory Write-Off' as entity_name, COALESCE(reason, 'Damaged / Expired Stock') as description, COALESCE(total_loss, 0) as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(date, datetime('now')) as date, 'SHRINKAGE' as stream, COALESCE(username, 'Manager') as user_name
//         FROM inventory_shrinkage
//       `,
//         )
//         .all();
//     } catch (e) {
//       shrinkageEntries = [];
//     }

//     const auditEntries = db
//       .prepare(
//         `
//       SELECT id, 'Security Event' as entity_name, COALESCE(details, action) as description, 0.0 as debit, 0.0 as credit, 0.0 as balance_after, COALESCE(timestamp, datetime('now')) as date, 'AUDIT_LOG' as stream, COALESCE(username, 'System') as user_name
//       FROM audit_logs
//     `,
//       )
//       .all();

//     return [
//       ...customerEntries,
//       ...expenseEntries,
//       ...salesEntries,
//       ...shrinkageEntries,
//       ...auditEntries,
//     ].sort((a, b) => new Date(b.date) - new Date(a.date));
//   } catch (err) {
//     console.error("Master Ledger Error:", err);
//     return [];
//   }
// });

// 10. SETTINGS & CASH REGISTER RECONCILIATION
ipcMain.handle('get-settings', () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  try {
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, value || '');
      }
    });
    transaction(newSettings);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('get-next-sku', (event, { category, name }) => {
  return generateNextSku(category, name);
});
// ==========================================
// DATABASE BACKUP & RESTORE IPC HANDLERS
// ==========================================

// 1. Export Database Backup
ipcMain.handle('export-database-backup', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const sourceDbPath = path.join(userDataPath, 'shopmate_data.sqlite');

    // Also copy WAL files if they exist to ensure data integrity
    const sourceWalPath = `${sourceDbPath}-wal`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Database Backup',
      defaultPath: `shopmate_backup_${new Date().toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
    });

    if (canceled || !filePath) return { canceled: true };

    fs.copyFileSync(sourceDbPath, filePath);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 2. Restore Database Backup
// 2. Restore Database Backup (Upgraded for absolute persistence)
ipcMain.handle('restore-database-backup', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Database Backup File',
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return { canceled: true };

    const selectedBackup = filePaths[0];
    const userDataPath = app.getPath('userData');
    const targetDbPath = path.join(userDataPath, 'shopmate_data.sqlite');
    const targetWalPath = `${targetDbPath}-wal`;
    const targetShmPath = `${targetDbPath}-shm`;

    // 1. Close active database connection to release file locks
    try {
      db.close();
    } catch (e) {
      console.error('Error closing db during restore:', e);
    }

    // 2. Overwrite target database with the backup file
    fs.copyFileSync(selectedBackup, targetDbPath);

    // 3. CRUCIAL: Delete old WAL/SHM journal files so they don't override data
    if (fs.existsSync(targetWalPath)) fs.unlinkSync(targetWalPath);
    if (fs.existsSync(targetShmPath)) fs.unlinkSync(targetShmPath);

    // 4. Force a true application relaunch so better-sqlite3 binds to the fresh data
    app.relaunch();
    app.exit(0);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('link-cloud-account', async (event, provider) => {
  try {
    const authUrl =
      provider === 'GOOGLE'
        ? 'https://accounts.google.com'
        : 'https://login.microsoftonline.com';
    await shell.openExternal(authUrl);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
// 1. SAFE DELETE SUPPLIER (With foreign key validation)
ipcMain.handle('delete-supplier', (event, { supplierId, currentUser }) => {
  try {
    if (currentUser?.role !== 'ADMIN') {
      return {
        success: false,
        error:
          'Access Denied: Only Manager (Admin) profiles can delete supplier profiles.',
      };
    }

    // Check if supplier has active purchase lines or ledger records
    const purchaseCheck = db
      .prepare(
        `SELECT COUNT(*) as count FROM purchase_lines WHERE supplier_id = ?`,
      )
      .get(supplierId);
    if (purchaseCheck && purchaseCheck.count > 0) {
      return {
        success: false,
        error: `Cannot delete supplier: There are ${purchaseCheck.count} purchase invoice(s) linked to this supplier. P&L history must be preserved.`,
      };
    }

    // Safe to delete if no constraints block it
    db.prepare(`DELETE FROM suppliers WHERE id = ?`).run(supplierId);
    return { success: true };
  } catch (err) {
    console.error('Delete Supplier Error:', err);
    return {
      success: false,
      error:
        'Database constraint error: Cannot delete record linked to historical transactions.',
    };
  }
});

// 2. SAFE ARCHIVE INVENTORY ITEM (Replaces hard deletion)
ipcMain.handle(
  'toggle-archive-item',
  (event, { itemId, is_active, currentUser }) => {
    try {
      if (currentUser?.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Access Denied: Only Managers can archive inventory products.',
        };
      }

      db.prepare(`UPDATE items SET is_active = ? WHERE id = ?`).run(
        is_active,
        itemId,
      );

      db.prepare(
        'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
      ).run(
        currentUser.id,
        currentUser.username,
        is_active === 0 ? 'ARCHIVE_ITEM' : 'REACTIVATE_ITEM',
        `${is_active === 0 ? 'Archived' : 'Reactivated'} product ID #${itemId}`,
      );

      return { success: true };
    } catch (err) {
      console.error('Archive Item Error:', err);
      return { success: false, error: err.message };
    }
  },
);
// 📄 PROFESSIONAL CORPORATE A4 PDF STATEMENT EXPORT
const handleExportA4PDF = async () => {
  const ipc = getIpc();
  if (ipc && selectedCustomer) {
    const rowsHtml = filteredLedger
      .map(
        (e) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.date}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.description}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #dc2626; text-align: right;">${e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #059669; text-align: right;">${e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0f172a; text-align: right;">Rs. ${e.balance_after?.toLocaleString()}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Customer Statement - ${selectedCustomer.name}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; margin: 0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d5c75; padding-bottom: 16px; margin-bottom: 24px; }
              .title-area h1 { margin: 0; color: #0d5c75; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
              .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
              .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
              .right { text-align: right; }
              .total-card { margin-top: 24px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: right; float: right; width: 280px; }
              .total-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
              .total-card .amount { font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>Customer Khata Statement</h1>
                <p>ShopMate Enterprise Business Intelligence & Accounting</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold; font-size: 13px;">Issued Date: ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Status: ${selectedCustomer.is_active === 0 ? 'Archived Party' : 'Active Account'}</p>
              </div>
            </div>

            <div class="meta-box">
              <div>
                <strong>Party Name:</strong> ${selectedCustomer.name}<br/>
                <strong>Phone Number:</strong> ${selectedCustomer.phone || 'N/A'}<br/>
                <strong>Credit Limit:</strong> Rs. ${selectedCustomer.credit_limit?.toLocaleString()}
              </div>
              <div>
                <strong>Account ID:</strong> #${selectedCustomer.id}<br/>
                <strong>Operator:</strong> ${currentUser?.username || 'Manager'}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description / Reference</th>
                  <th class="right">Debit (+)</th>
                  <th class="right">Credit (-)</th>
                  <th class="right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="total-card">
              <div class="label">Net Outstanding Balance Due</div>
              <div class="amount">Rs. ${selectedCustomer.balance?.toLocaleString()}</div>
            </div>
          </body>
        </html>
      `;

    const res = await ipc.invoke('export-ledger-pdf', html);
    if (res.success && !res.canceled) {
      alert(
        `✅ Corporate A4 Customer statement exported successfully:\n${res.filePath}`,
      );
    } else if (!res.canceled) {
      alert(`PDF Export failed: ${res.error}`);
    }
  }
};
ipcMain.handle(
  'update-user-password',
  async (event, { userId, newPassword, currentUser }) => {
    try {
      if (!currentUser || currentUser.role?.toUpperCase() !== 'ADMIN') {
        return {
          success: false,
          error: 'Unauthorized: Admin privileges required.',
        };
      }

      if (!newPassword || newPassword.length < 4) {
        return {
          success: false,
          error: 'Password must be at least 4 characters long.',
        };
      }

      // 🛠️ FIX: Change 'password = ?' to 'pin = ?' to match your SQLite schema
      const stmt = db.prepare('UPDATE users SET pin = ? WHERE id = ?');
      const result = stmt.run(newPassword, userId);

      if (result.changes === 0) {
        return { success: false, error: 'User ID not found in database.' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);
// Get Shop/Thermal Printer Logo from SQLite settings
// ipcMain.handle("get-setting", (event, key) => {
//   try {
//     const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
//     if (!row) return { success: false, error: "Setting not found" };
//     return { success: true, value: row.value };
//   } catch (err) {
//     return { success: false, error: err.message };
//   }
// });

// ✏️ Universal Ledger Entry Update Handler
ipcMain.handle(
  'update-ledger-entry',
  (event, { type, id, data, currentUser }) => {
    try {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        throw new Error(
          'Unauthorized: Only Managers/Admins can edit financial records.',
        );
      }

      const transaction = db.transaction(() => {
        if (type === 'SALES') {
          db.prepare(
            `UPDATE sales SET total_amount = ?, payment_type = ? WHERE id = ?`,
          ).run(data.total_amount, data.payment_type, id);
        } else if (type === 'EXPENSES') {
          db.prepare(
            `UPDATE business_expenses SET category = ?, amount = ?, description = ? WHERE id = ?`,
          ).run(data.category, data.amount, data.description, id);
        } else if (type === 'PURCHASES') {
          db.prepare(
            `UPDATE purchase_lines SET qty_received = ?, unit_cost = ?, payment_type = ? WHERE id = ?`,
          ).run(
            parseFloat(data.qty_received) || 0,
            parseFloat(data.unit_cost) || 0,
            data.payment_type || 'CREDIT',
            id,
          );
        }
      });

      transaction();

      db.prepare(
        'INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
      ).run(
        currentUser.id,
        currentUser.username,
        'EDIT_LEDGER',
        `Updated ${type} record ID #${id}`,
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);
// ==========================================
// REFUNDS & REPAIRS IPC HANDLERS
// ==========================================

ipcMain.handle('get-refunds-repairs', () => {
  try {
    return db
      .prepare(
        `
      SELECT r.*, i.name as item_name, u.username as operator_name
      FROM refunds_repairs r
      LEFT JOIN items i ON r.item_id = i.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.id DESC
    `,
      )
      .all();
  } catch (err) {
    console.error('Error fetching refunds/repairs:', err);
    return [];
  }
});

// 1. Remove expense logging from record-refund-repair
ipcMain.handle(
  'record-refund-repair',
  (
    event,
    {
      type,
      sale_id,
      item_id,
      qty,
      amount_refunded,
      customer_name,
      phone,
      description,
      currentUser,
    },
  ) => {
    try {
      const processTransaction = db.transaction(() => {
        const parsedQty = parseFloat(qty) || 1;
        const parsedRefund = parseFloat(amount_refunded) || 0;

        // Insert into refunds_repairs
        db.prepare(
          `
        INSERT INTO refunds_repairs (type, sale_id, item_id, qty, amount_refunded, customer_name, phone, status, description, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
      `,
        ).run(
          type,
          sale_id ? parseInt(sale_id) : null,
          item_id ? parseInt(item_id) : null,
          parsedQty,
          parsedRefund,
          customer_name || 'Walk-in Customer',
          phone || '',
          description || '',
          currentUser.id,
        );

        // If REFUND, restore stock (Do NOT add to business_expenses)
        if (type === 'REFUND' && item_id) {
          db.prepare(
            `UPDATE items SET stock_qty = stock_qty + ? WHERE id = ?`,
          ).run(parsedQty, item_id);
        }
      });

      processTransaction();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
);

// 2. Update get-financial-ledger to subtract refunds and include them in sales tab
ipcMain.handle('get-financial-ledger', (event, filters = {}) => {
  try {
    const {
      startDate,
      endDate,
      user_id,
      payment_type,
      sortBy = 'date_desc',
    } = filters;

    let expenseQuery = `SELECT e.*, u.username FROM business_expenses e LEFT JOIN users u ON e.user_id = u.id WHERE 1=1`;
    let purchaseQuery = `SELECT pl.*, pl.qty_received, pl.unit_cost, pl.payment_type, s.name as supplier_name, i.name as item_name FROM purchase_lines pl LEFT JOIN suppliers s ON pl.supplier_id = s.id LEFT JOIN items i ON pl.item_id = i.id WHERE 1=1`;

    let salesQuery = `
      SELECT s.id as sale_id, s.date, s.payment_type, s.total_amount as invoice_total,
             c.name as customer_name, u.username,
             i.name as item_name, sl.qty as qty_sold, sl.price as unit_price, (sl.qty * sl.price) as total_line
      FROM sales s
      LEFT JOIN sale_lines sl ON s.id = sl.sale_id
      LEFT JOIN items i ON sl.item_id = i.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;

    // 🔄 Dedicated Refund Query (Independent of operating expenses)
    let refundQuery = `
      SELECT r.id, r.date, r.amount_refunded, r.qty, r.customer_name, r.description,
             i.name as item_name, u.username
      FROM refunds_repairs r
      LEFT JOIN items i ON r.item_id = i.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.type = 'REFUND'
    `;

    let expParams = [],
      purParams = [],
      salParams = [],
      refParams = [];

    if (startDate && endDate) {
      expenseQuery += ` AND date(e.date) >= date(?) AND date(e.date) <= date(?)`;
      purchaseQuery += ` AND date(pl.date) >= date(?) AND date(pl.date) <= date(?)`;
      salesQuery += ` AND date(s.date) >= date(?) AND date(s.date) <= date(?)`;
      refundQuery += ` AND date(r.date) >= date(?) AND date(r.date) <= date(?)`;
      expParams.push(startDate, endDate);
      purParams.push(startDate, endDate);
      salParams.push(startDate, endDate);
      refParams.push(startDate, endDate);
    }

    if (user_id) {
      expenseQuery += ` AND e.user_id = ?`;
      expParams.push(user_id);
      salesQuery += ` AND s.user_id = ?`;
      salParams.push(user_id);
      refundQuery += ` AND r.user_id = ?`;
      refParams.push(user_id);
    }

    if (payment_type && payment_type !== 'REFUND') {
      salesQuery += ` AND s.payment_type = ?`;
      salParams.push(payment_type);
    }

    let expenses = db.prepare(expenseQuery).all(...expParams);
    let purchases = db.prepare(purchaseQuery).all(...purParams);
    let sales = db.prepare(salesQuery).all(...salParams);
    let refunds = db.prepare(refundQuery).all(...refParams);

    const sortFn = (a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      if (sortBy === 'date_asc') return dateA - dateB;
      return dateB - dateA;
    };

    expenses.sort(sortFn);
    purchases.sort(sortFn);
    sales.sort(sortFn);
    refunds.sort(sortFn);

    const grossSales = db
      .prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales')
      .get().total;
    const totalRefunds = db
      .prepare(
        "SELECT COALESCE(SUM(amount_refunded), 0) as total FROM refunds_repairs WHERE type='REFUND'",
      )
      .get().total;
    const totalSales = grossSales - totalRefunds;

    const totalExpenses = db
      .prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM business_expenses',
      )
      .get().total;
    const totalPurchases = db
      .prepare(
        'SELECT COALESCE(SUM(qty_received * unit_cost), 0) as total FROM purchase_lines',
      )
      .get().total;

    return {
      expenses,
      purchases,
      sales,
      refunds,
      summary: {
        totalSales,
        totalExpenses,
        totalPurchases,
        totalRefunds,
        netProfit: totalSales - (totalExpenses + totalPurchases),
      },
    };
  } catch (err) {
    console.error('Financial Ledger Error:', err);
    return {
      expenses: [],
      purchases: [],
      sales: [],
      refunds: [],
      summary: {
        totalSales: 0,
        totalExpenses: 0,
        totalPurchases: 0,
        totalRefunds: 0,
        netProfit: 0,
      },
    };
  }
});

ipcMain.handle('delete-ledger-entry', (event, { type, id, currentUser }) => {
  try {
    if (!currentUser || currentUser.role?.toUpperCase() !== 'ADMIN') {
      throw new Error(
        'Unauthorized: Only Manager/Admin accounts can delete ledger entries.',
      );
    }

    const transaction = db.transaction(() => {
      if (type === 'SALES') {
        db.prepare(`DELETE FROM sale_lines WHERE sale_id = ?`).run(id);
        db.prepare(`DELETE FROM sales WHERE id = ?`).run(id);
      } else if (type === 'REFUNDS') {
        db.prepare(`DELETE FROM refunds_repairs WHERE id = ?`).run(id);
      } else if (type === 'EXPENSES') {
        db.prepare(`DELETE FROM business_expenses WHERE id = ?`).run(id);
      } else if (type === 'PURCHASES') {
        db.prepare(`DELETE FROM purchase_lines WHERE id = ?`).run(id);
      }
    });

    transaction();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
