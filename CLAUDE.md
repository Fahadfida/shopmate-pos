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
- **Components** (11 symbols)
- **Components·2** (10 symbols)
- **Components·3** (8 symbols)
- **Components·4** (8 symbols)
- **Components·5** (6 symbols)
- **Components·6** (5 symbols)
- **Other** (37 symbols)

## Architecture
- **ui** (106 nodes): cross-deps 219 — critical: `src/components/WholeSaleBuyersLedger.jsx` (fan-in 9)
- **unknown** (115 nodes): cross-deps 31 — critical: `src/App.jsx` (fan-in 6)

Top cross-layer deps (by volume):
- ui → unknown (219 edges)
- unknown → ui (31 edges)

## Key Symbols  (signatures only — no implementations)
`src/components/WholeSaleBuyersLedger.jsx`:
  function getIpc(...) { ... }
  function loadCustomers(...) { ... }
  function loadLedger(...) { ... }
`src/components/SupplierLedger.jsx`:
  function getIpc(...) { ... }
  function loadSuppliers(...) { ... }
  function SupplierLedger(...) { ... }
`src/components/Inventory.jsx`:
  function getIpc(...) { ... }
  function Inventory(...) { ... }
  function loadItems(...) { ... }
`src/components/MyLedger.jsx`:
  function getIpc(...) { ... }
  function loadFinancials(...) { ... }
`src/components/POS.jsx`:
  function POS(...) { ... }

## Critical Edges  (top 5 call relationships)
- `WholeSaleBuyersLedger.getIpc` ← 8 callers across `src/components/*`
- `Settings.getIpc` ← 6 callers across `src/components/*`
- `SupplierLedger.getIpc` ← 6 callers across `src/components/*`
- `WholeSaleBuyersLedger.loadCustomers` ← 6 callers across `src/components/*`
- `Inventory.getIpc` ← 5 callers across `src/components/*`

## Conventions  (not enforced by linters)
<!-- add project-specific conventions here -->

## Boundaries  (DO NOT)
<!-- add project-specific boundaries here -->

<!-- graphmycode:generated-end -->