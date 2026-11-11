// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

const validInvokeChannels = [
  // License & Auth
  'get-machine-id',
  'activate-license',
  'check-license-status',
  'login',
  'get-users',
  'update-user-password',
  // Dashboard
  'get-dashboard-stats',
  'get-dashboard-analytics',
  // Inventory
  'get-items',
  'add-item',
  'update-item',
  'get-next-sku',
  'toggle-archive-item',
  // POS & Sales
  'create-sale',
  'print-receipt',
  'export-ledger-pdf',
  // Customers
  'get-customers',
  'add-customer',
  'update-customer',
  'get-customer-ledger',
  'record-customer-payment',
  'record-customer-debt',
  'update-ledger-note',
  'print-customer-statement',
  'toggle-archive-customer', // 👈 Added this
  // Suppliers
  'get-suppliers',
  'add-supplier',
  'update-supplier',
  'delete-supplier',
  'toggle-archive-supplier',
  'get-supplier-ledger',
  'record-supplier-payment',
  'record-purchase',
  // Ledger & Expenses
  'get-financial-ledger',
  'get-master-general-ledger',
  'add-expense',
  'delete-expense',
  'update-ledger-entry',
  'delete-ledger-entry',
  // Refunds & Repairs
  'get-refunds-repairs',
  'record-refund-repair',
  // Settings & DB
  'get-settings',
  'get-setting',
  'save-settings',
  'export-database-backup',
  'restore-database-backup',
  'link-cloud-account',
];

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    console.error(`🚨 Blocked IPC channel: ${channel}`); // Logs to the renderer console
    return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
  },
});
