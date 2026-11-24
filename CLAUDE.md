<!-- graphmycode:generated-start -->

# shopmate-pos
> React + Vite e-commerce application

## Stack
- JavaScript • React + Vite • npm • browser

## Commands
- install: `npm install`
- dev:     `npm run dev`
- test:    `npm run test`
- lint:    `npm run lint`
- build:   `npm run build`

## Module Map
- **Components** (22 symbols)
- **Components·2** (9 symbols)
- **Components·3** (9 symbols)
- **Components·4** (8 symbols)
- **Components·5** (7 symbols)
- **Components·6** (7 symbols)
- **Other** (74 symbols)

## Architecture
- **ui** (267 nodes): cross-deps 238 — critical: `src/components/Settings.jsx` (fan-in 10)
- **utility** (2 nodes): cross-deps 40 — critical: `src/utils/ipc.js` (fan-in 61)
- **unknown** (116 nodes): cross-deps 34 — critical: `src/App.jsx` (fan-in 7)

Top cross-layer deps (by volume):
- ui → unknown (167 edges)
- ui → utility (71 edges)
- utility → unknown (40 edges)
- unknown → ui (30 edges)
- unknown → utility (4 edges)

## Key Symbols  (signatures only — no implementations)
`src/utils/ipc.js`:
  function getIpc(...) { ... }
`src/App.jsx`:
  function showToast(...) { ... }
`src/components/Settings.jsx`:
  function notify(...) { ... }
`src/components/SupplierLedger.jsx`:
  function toast(...) { ... }
  function loadSuppliers(...) { ... }
`src/components/WholeSaleBuyersLedger.jsx`:
  function toast(...) { ... }
  function loadCustomers(...) { ... }
  function KhataLedger(...) { ... }
`src/components/Inventory.jsx`:
  function Inventory(...) { ... }
`src/components/POS.jsx`:
  function POS(...) { ... }
`src/components/Purchases.jsx`:
  function Purchases(...) { ... }
`src/components/MyLedger.jsx`:
  function FinancialLedger(...) { ... }

## Critical Edges  (top 5 call relationships)
- `ipc.getIpc` ← 60 callers across 3 modules
- `Settings.notify` ← 9 callers across `src/components/*`
- `SupplierLedger.toast` ← 7 callers across `src/components/*`
- `WholeSaleBuyersLedger.toast` ← 7 callers across `src/components/*`
- `App.showToast` ← 6 callers across `src/components/*`

## Conventions  (not enforced by linters)
<!-- add project-specific conventions here -->

## Boundaries  (DO NOT)
<!-- add project-specific boundaries here -->

<!-- graphmycode:generated-end -->