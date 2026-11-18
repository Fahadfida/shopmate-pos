# ShopMate Enterprise — Design System & Architecture Specification

> **CRITICAL INSTRUCTION FOR AI AGENTS & DEVELOPERS:** You must read and follow these rules before writing or modifying any code, templates, or components for this project. Do not invent new colors, spacing, or arbitrary styling. Stick strictly to the tokens and specifications defined below.

## 1. Brand Identity & Color Tokens

Our palette is engineered for high-density enterprise software, emphasizing clarity, contrast, and precise semantic meaning. **NEVER use pure black (`#000000`) for text.**

### Core Brand & Surface Tokens

* **Primary Brand (Dark Teal):** `#0d5c75` (Used for primary buttons, active states, key brand touchpoints)

* **Primary Hover:** `#09485c` (\~10% darker variant for interactive hover states)

* **Background App:** `#f1f5f9` (Light Slate base for application viewports)

* **Background Card:** `#ffffff` (Pure White container surface)

* **Text Primary:** `#1e293b` (Dark Slate for headings and primary body copy)

* **Text Secondary:** `#64748b` (Muted Slate for subtext, metadata, and descriptions)

* **Borders & Dividers:** `#e2e8f0` (Crisp structural separator lines)

### Semantic & Status Colors

* **Success (Profit / Inflow / Optimal):** `#059669` (Emerald Green)

* **Danger (Expenses / Loss / Backorder):** `#dc2626` (Red)

* **Warning (Low Stock / Caution):** `#d97706` (Amber)

* **Info (Credit / COD / Settlement):** `#0284c7` (Light Blue)

## 2. Typography & Hierarchy

We utilize clean system font stacks paired with Google Fonts (`Plus Jakarta Sans` for display/headings, `Inter` for body, and `JetBrains Mono` for numeric/code data).

* **Font Families:**

  * Display/Headings: `'Plus Jakarta Sans', sans-serif`

  * Body Copy: `'Inter', sans-serif`

  * Numeric Data (Prices, Qty, SKUs, IDs): ALWAYS use `.monospace` class (`'JetBrains Mono', monospace`).

* **Type Scale & Hierarchy:**

  * **Page Titles:** `1.25rem` (`20px`), `bold` (`font-bold`)

  * **Card / Section Titles:** `0.95rem` (`15.2px`), `bold`, `Uppercase`

  * **Primary Data / KPI Metrics:** `1.3rem` (`20.8px`), `900` weight (`font-black`)

  * **Subtext & Labels:** `0.75rem` (`12px`), `normal` weight

## 3. Spacing & Layout (The 8px Grid)

Maintain strict consistency across all component padding, gaps, and border radiuses.

* **Gap between cards:** `16px` (`1rem`)

* **Padding inside cards:** `16px` to `18px`

* **Button Padding:** `8px` top/bottom, `16px` left/right

* **Border Radius Standards:**

  * Cards & Containers: `10px` (`rounded-[10px]`)

  * Buttons, Inputs, & Badges: `6px` (`rounded-[6px]`)

## 4. Component Rules (Anti-Slop Standards)

### KPI Cards

* Must feature a `0.5px solid` border matching the semantic color of the metric (e.g., Profit card has a `#059669` border).

* Background must be pure white (`#ffffff`) or a very faint tint of the semantic color.

* Title must be uppercase, small (`0.75rem`), and colored with the semantic token.

* Value must be large (`1.3rem`), monospace, and bold.

### Tables & Lists

* **Headers:** Background `#f8fafc`, font size `0.7rem`, uppercase, bold, text color `#64748b`.

* **Rows:** Must alternate background colors (Zebra striping) OR have a `1px solid #f1f5f9` bottom border.

* **Hover State:** When hovering over a table row, background transitions instantly to `#f8fafc`.

* **Cell Content:** Prices, quantities, and SKU codes must use monospace font formatting.

### Buttons & Actions

* **Primary Button:** Background `#0d5c75`, Text `#ffffff`. Hover: `#09485c`.

* **Danger Button:** Background `#dc2626`, Text `#ffffff`. Hover: darker red variant.

* **Secondary / Cancel Button:** Background `#e2e8f0`, Text `#1e293b`. Hover: `#cbd5e1`.

* **Strict Rule:** **No Emojis as Buttons.** Use clear text labels or clean SVG icons.

### Toast Notifications (System Alerts)
* **Position & Stacking:** Fixed position in the bottom-right viewport (z-index 50), stacking vertically with 8px gaps.
* **Styling & Structure:** White background (`#ffffff`), 10px border radius, subtle drop shadow, and a 3px accent left-border matching the semantic color (Success `#059669`, Danger `#dc2626`, Info `#0284c7`).
* **Behavior:** Must include a thin animated countdown progress bar at the bottom matching the dismiss duration (default 4 seconds), along with an explicit manual close (`X`) SVG button.

## 5. Data Visualization & Charts

* **SVG Line Charts:**

  * Stroke color must be `#0d5c75`.

  * Stroke width must be `2.5`.

  * Area below the line must feature a gradient fill (Teal `#0d5c75` fading to transparent).

* **Bar Charts:**

  * Use semantic colors strictly (e.g., Emerald Green for Profit/North, Blue for Distribution, Amber for Central, Red for Outpost).

* **Bar Height Math:**

  * ALWAYS calculate the max value among all bars so the tallest bar is scaled to `100%` height, eliminating layout overflow.

## 6. UX States (Mandatory Implementation)

Every screen and component module must gracefully support three core UX states alongside normal telemetry view:

1. **Loading State:** Display centered skeleton loaders or animated pulse blocks. Never flash a blank white screen during data fetching.

2. **Empty State:** If a list or table returns zero records, display a friendly explanatory message accompanied by an outline icon and a clear call-to-action button (e.g., "No items found. Add your first product!").

3. **Error State:** Display a prominent red banner (`#dc2626` background with white text) at the top of the component or view detailing the error code and recovery action.