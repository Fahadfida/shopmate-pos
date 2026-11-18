# 🏛️ ShopMate POS - Enterprise Retail & Khata Management

ShopMate is an offline-first, enterprise-grade Point of Sale (POS) and customer ledger management system built for Windows. It is designed for speed, accuracy, and reliability, allowing shopkeepers to manage inventory, process sales, track customer debts (Khata), and handle supplier payables without an internet connection.

![ShopMate POS](https://img.shields.io/badge/Version-1.1.0-blue)
![Electron](https://img.shields.io/badge/Electron-28.x-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?logo=sqlite)

---

## ✨ Key Features

*   **🛒 Lightning-Fast POS:** Dedicated counter billing with quick-sell, custom pricing, and barcode/SKU lookup.
*   **📦 Smart Inventory:** Weighted Average Cost (WAC) tracking, auto-generated SKUs, low-stock alerts, and profit margin calculations.
*   **📒 Customer Khata (Ledger):** Track customer debts (Udhaar) and payments (Jama) with a running balance, credit limits, and automated A4 PDF statement exports.
*   **🚚 Supplier Payables:** Manage vendor balances, record GRN (Goods Received Note) purchases, and track supplier payments.
*   **📊 Business Intelligence:** Real-time dashboard with revenue trajectory, top-selling products, and true Net/Gross profit calculations.
*   **🔒 Secure Licensing:** Offline hardware-locked activation using RSA cryptography.
*   **🌙 Dark Mode & Modern UI:** Built with a custom CSS variable design system for a premium enterprise look.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, Vanilla CSS (Design System)
*   **Backend:** Electron (Node.js)
*   **Database:** SQLite (Better-SQLite3) with WAL mode for high performance.
*   **Security:** ContextBridge (`preload.cjs`) with strict IPC channel whitelisting.
*   **Printing:** Native 80mm Thermal Printer support via hidden Electron windows.

---

## 🚀 Getting Started (For Developers)

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)
*   Git
