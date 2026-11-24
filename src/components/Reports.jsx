import React, { useState, useEffect, useId } from 'react';
import { getIpc } from '../utils/ipc';

const iconBase = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const TrendingUpIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const DollarIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CreditCardIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const TruckIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const RefreshIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const BoxIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const AlertIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const UsersIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const WrenchIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const sansFamily = { fontFamily: 'var(--font-sans)' };

const typeScale = {
  pageTitle: {
    ...sansFamily,
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  body: {
    ...sansFamily,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.45,
  },
  helper: {
    ...sansFamily,
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  control: {
    ...sansFamily,
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  badge: {
    ...sansFamily,
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
};

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtPct = (cur, prev) => {
  if (!prev) return null;
  const d = ((cur - prev) / prev) * 100;
  return `${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%`;
};

const toLocalDay = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return String(raw).slice(0, 10);
};

function KpiCard({ label, icon: Icon, accent, value, footer, delta }) {
  const deltaColor =
    delta == null
      ? 'var(--ink-fg-3)'
      : delta.startsWith('▲')
        ? 'var(--ink-success)'
        : 'var(--ink-danger)';

  return (
    <div
      style={{
        ...sansFamily,
        position: 'relative',
        textAlign: 'left',
        background: 'var(--ink-0)',
        border: '1px solid var(--ink-3)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: accent,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            ...typeScale.badge,
            color: 'var(--ink-fg-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: 'var(--ink-1)',
            borderRadius: '8px',
            border: '1px solid var(--ink-3)',
          }}
        >
          <Icon />
        </span>
      </div>
      <div
        className="monospace tabular"
        style={{
          ...sansFamily,
          fontSize: '1.75rem',
          fontWeight: 600,
          color: 'var(--ink-fg)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto',
        }}
      >
        <span style={{ ...typeScale.helper, color: 'var(--ink-fg-3)' }}>
          {footer}
        </span>
        {delta && (
          <span
            style={{
              ...typeScale.badge,
              color: deltaColor,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Reports({ currentUser }) {
  const [scope, setScope] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const startDateId = useId();
  const endDateId = useId();

  const rangeFor = (s) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (s === 'today') return { startDate: iso(now), endDate: iso(now) };
    if (s === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { startDate: iso(d), endDate: iso(now) };
    }
    if (s === 'month') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { startDate: iso(d), endDate: iso(now) };
    }
    return { startDate: customStart, endDate: customEnd };
  };

  const fallbackSummary = async (ipc, startDate, endDate) => {
    const [ledger, rrList, items, suppliers] = await Promise.all([
      ipc
        .invoke('get-financial-ledger', { startDate, endDate })
        .catch(() => ({})),
      ipc.invoke('get-refunds-repairs').catch(() => []),
      ipc.invoke('get-items').catch(() => []),
      ipc.invoke('get-suppliers', true).catch(() => []),
    ]);

    const inRange = (row) => {
      const day = toLocalDay(row?.date || row?.created_at);
      if (!day) return true;
      if (startDate && day < startDate) return false;
      if (endDate && day > endDate) return false;
      return true;
    };

    const sales = (ledger?.sales || []).filter(inRange);
    const expenses = (ledger?.expenses || []).filter(inRange);
    const purchases = (ledger?.purchases || []).filter(inRange);
    const rr = (Array.isArray(rrList) ? rrList : []).filter(inRange);
    const consignment = (ledger?.consignment || []).filter(inRange);

    const salesTotal = sales.reduce(
      (s, r) => s + Number(r.total_line ?? r.total_amount ?? 0),
      0,
    );
    const cashSales = sales
      .filter((r) => String(r.payment_type || '').toUpperCase() === 'CASH')
      .reduce((s, r) => s + Number(r.total_line ?? r.total_amount ?? 0), 0);
    const creditSales = sales
      .filter((r) => String(r.payment_type || '').toUpperCase() === 'CREDIT')
      .reduce((s, r) => s + Number(r.total_line ?? r.total_amount ?? 0), 0);
    const codSales = sales
      .filter((r) => String(r.payment_type || '').toUpperCase() === 'COD')
      .reduce((s, r) => s + Number(r.total_line ?? r.total_amount ?? 0), 0);

    const refundsTotal = rr
      .filter((r) => String(r.type || '').toUpperCase() === 'REFUND')
      .reduce((s, r) => s + Number(r.amount_refunded || 0), 0);
    const repairsTotal = rr
      .filter((r) => String(r.type || '').toUpperCase() === 'REPAIR')
      .reduce((s, r) => s + Number(r.amount_refunded || 0), 0);
    const repairsPending = rr.filter(
      (r) =>
        String(r.type || '').toUpperCase() === 'REPAIR' &&
        String(r.status || '').toUpperCase() === 'PENDING',
    ).length;

    const totalCommission = consignment
      .filter((c) => c.type === 'SALE')
      .reduce((sum, c) => sum + Number(c.our_commission || 0), 0);

    const expensesTotal = expenses.reduce(
      (s, r) => s + Number(r.amount || 0),
      0,
    );
    const purchasesTotal = purchases.reduce(
      (s, r) => s + Number((r.qty_received || 0) * (r.unit_cost || 0)),
      0,
    );

    const activeItems = (Array.isArray(items) ? items : []).filter(
      (i) => i.is_active !== 0,
    );
    const stockValue = activeItems.reduce(
      (s, i) => s + Number((i.stock_qty || 0) * (i.avg_cost || 0)),
      0,
    );
    const lowStock = activeItems.filter(
      (i) => Number(i.stock_qty) > 0 && Number(i.stock_qty) <= 5,
    ).length;
    const outOfStock = activeItems.filter(
      (i) => Number(i.stock_qty) <= 0,
    ).length;
    const payables = (Array.isArray(suppliers) ? suppliers : []).reduce(
      (s, sup) => s + (Number(sup.balance) > 0 ? Number(sup.balance) : 0),
      0,
    );

    return {
      sales: {
        total: salesTotal,
        count: sales.length,
        operators: new Set(sales.map((s) => s.username).filter(Boolean)).size,
        cash: cashSales,
        credit: creditSales,
        cod: codSales,
        prevTotal: 0,
      },
      cashIn: cashSales,
      netCash: cashSales + totalCommission - refundsTotal - expensesTotal,
      commission: totalCommission,
      refunds: refundsTotal,
      repairs: repairsTotal,
      repairsPending,
      expenses: { total: expensesTotal, prevTotal: 0 },
      purchases: purchasesTotal,
      stock: {
        lowStock,
        outOfStock,
        value: stockValue,
        totalSkus: activeItems.length,
      },
      payables,
      receivables: 0,
      topItem: null,
    };
  };

  const load = async () => {
    setLoading(true);
    setError('');
    const ipc = getIpc();
    if (!ipc) {
      setError('Reports require the desktop app.');
      setLoading(false);
      return;
    }
    const { startDate, endDate } = rangeFor(scope);
    if (scope === 'custom' && (!startDate || !endDate)) {
      setError('Pick both a start and end date.');
      setLoading(false);
      return;
    }

    try {
      const res = await ipc.invoke('get-reports-summary', {
        startDate,
        endDate,
      });
      if (res?.success) {
        setData(res);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      const fb = await fallbackSummary(ipc, startDate, endDate);
      setData(fb);
    } catch (err) {
      setError(err?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, customStart, customEnd]);

  const handleExportPDF = async () => {
    const ipc = getIpc();
    if (!ipc) return;

    setExporting(true);
    try {
      const { startDate, endDate } = rangeFor(scope);
      const displayScope =
        scope === 'custom' ? `${startDate} to ${endDate}` : scopeLabel;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Business Snapshot - ${displayScope}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 24px; }
              .title h1 { margin: 0; color: #0f172a; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
              .title p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
              .meta { text-align: right; font-size: 12px; color: #64748b; }
              
              .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
              .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
              .kpi-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
              .kpi-value { font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #0f172a; }

              .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 32px 0 16px 0; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
              th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: bold; color: #475569; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
              .right { text-align: right; }
              .mono { font-family: 'Courier New', monospace; }
              
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">
                <h1>Business Snapshot</h1>
                <p>ShopMate Enterprise Accounting Suite</p>
              </div>
              <div class="meta">
                <p style="margin: 0; font-weight: bold;">Period: ${displayScope}</p>
                <p style="margin: 4px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
                <p style="margin: 4px 0 0 0;">Operator: ${currentUser?.username || 'Manager'}</p>
              </div>
            </div>

            <div class="section-title">Financial Summary</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Total Sales</div>
                <div class="kpi-value">Rs. ${Number(d.sales.total).toLocaleString()}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Commission Income</div>
                <div class="kpi-value" style="color: #8b5cf6;">Rs. ${Number(d.commission).toLocaleString()}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Net Cash Flow</div>
                <div class="kpi-value" style="color: ${d.netCash >= 0 ? '#16a34a' : '#dc2626'};">Rs. ${Number(d.netCash).toLocaleString()}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th class="right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Total Retail Sales</td><td class="right mono">Rs. ${Number(d.sales.total).toLocaleString()}</td></tr>
                <tr><td>Cash Inflow</td><td class="right mono">Rs. ${Number(d.cashIn).toLocaleString()}</td></tr>
                <tr><td>Credit Sales</td><td class="right mono">Rs. ${Number(d.sales.credit).toLocaleString()}</td></tr>
                <tr><td>COD Sales</td><td class="right mono">Rs. ${Number(d.sales.cod).toLocaleString()}</td></tr>
                <tr><td>Total Consignment Commission</td><td class="right mono">Rs. ${Number(d.commission).toLocaleString()}</td></tr>
                <tr><td>Repair Revenue</td><td class="right mono">Rs. ${Number(d.repairs).toLocaleString()}</td></tr>
              </tbody>
            </table>

            <div class="section-title">Outflows & Liabilities</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th class="right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Operating Expenses</td><td class="right mono" style="color: #dc2626;">Rs. ${Number(d.expenses.total).toLocaleString()}</td></tr>
                <tr><td>Refunds</td><td class="right mono" style="color: #dc2626;">Rs. ${Number(d.refunds).toLocaleString()}</td></tr>
                <tr><td>Stock Purchases</td><td class="right mono">Rs. ${Number(d.purchases).toLocaleString()}</td></tr>
                <tr><td>Supplier Payables</td><td class="right mono">Rs. ${Number(d.payables).toLocaleString()}</td></tr>
                <tr><td>Customer Receivables</td><td class="right mono">Rs. ${Number(d.receivables).toLocaleString()}</td></tr>
              </tbody>
            </table>

            <div class="section-title">Inventory Status</div>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Total Active SKUs</td><td class="right mono">${Number(d.stock.totalSkus).toLocaleString()}</td></tr>
                <tr><td>Total Stock Valuation</td><td class="right mono">Rs. ${Number(d.stock.value).toLocaleString()}</td></tr>
                <tr><td>Low Stock Items</td><td class="right mono" style="color: ${d.stock.lowStock > 0 ? '#dc2626' : '#334155'};">${Number(d.stock.lowStock)}</td></tr>
                <tr><td>Out of Stock Items</td><td class="right mono" style="color: ${d.stock.outOfStock > 0 ? '#dc2626' : '#334155'};">${Number(d.stock.outOfStock)}</td></tr>
              </tbody>
            </table>

            <div class="footer">
              This report was automatically generated by ShopMate POS.<br/>
              Confidential - For internal use only.
            </div>
          </body>
        </html>
      `;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled) {
        // Success toast could go here if we had access to showToast
      } else if (!res.canceled) {
        alert('PDF Export failed: ' + res.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setExporting(false);
    }
  };

  const d = data || {
    sales: {
      total: 0,
      count: 0,
      operators: 0,
      cash: 0,
      credit: 0,
      cod: 0,
      prevTotal: 0,
    },
    cashIn: 0,
    netCash: 0,
    commission: 0,
    refunds: 0,
    repairs: 0,
    repairsPending: 0,
    expenses: { total: 0, prevTotal: 0 },
    purchases: 0,
    stock: { lowStock: 0, outOfStock: 0, value: 0, totalSkus: 0 },
    payables: 0,
    receivables: 0,
    topItem: null,
  };

  const scopeLabel =
    scope === 'today'
      ? 'Today'
      : scope === 'week'
        ? 'Last 7 Days'
        : 'Last 30 Days';

  return (
    <div
      style={{
        ...typeScale.body,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        height: 'calc(100vh - 96px)',
        overflow: 'hidden',
        color: 'var(--ink-fg)',
      }}
    >
      <div
        style={{
          background: 'var(--ink-0)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ ...typeScale.pageTitle, margin: 0 }}>Reports</h2>
          <p
            style={{
              ...typeScale.helper,
              margin: '4px 0 0',
              color: 'var(--ink-fg-3)',
            }}
          >
            Business snapshot — {scopeLabel.toLowerCase()}.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: '7 days' },
            { id: 'month', label: '30 days' },
            { id: 'custom', label: 'Custom' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={scope === s.id}
              onClick={() => setScope(s.id)}
              style={{
                ...typeScale.control,
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
                background:
                  scope === s.id ? 'var(--brand-primary)' : 'var(--ink-1)',
                color: scope === s.id ? 'var(--ink-0)' : 'var(--ink-fg-2)',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}

          {scope === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--ink-1)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <label htmlFor={startDateId} className="sr-only">
                Start date
              </label>
              <input
                id={startDateId}
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  ...typeScale.control,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-fg)',
                }}
              />
              <span style={{ color: 'var(--ink-fg-3)' }}>→</span>
              <label htmlFor={endDateId} className="sr-only">
                End date
              </label>
              <input
                id={endDateId}
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  ...typeScale.control,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-fg)',
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={load}
            disabled={loading}
            style={{
              ...typeScale.control,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--ink-1)',
              border: '1px solid var(--ink-3)',
              borderRadius: '8px',
              cursor: loading ? 'wait' : 'pointer',
              color: 'var(--ink-fg)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshIcon />
            <span>{loading ? 'Loading…' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting || loading || !data}
            style={{
              ...typeScale.control,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--brand-primary)',
              border: 'none',
              borderRadius: '8px',
              cursor: exporting || !data ? 'wait' : 'pointer',
              color: 'var(--ink-0)',
              opacity: exporting || !data ? 0.6 : 1,
            }}
          >
            <DownloadIcon />
            <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...typeScale.helper,
            background: 'var(--ink-1)',
            color: 'var(--ink-danger)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--ink-3)',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <KpiCard
            label="Sales"
            icon={TrendingUpIcon}
            accent="var(--brand-primary)"
            value={fmtMoney(d.sales.total)}
            footer={`${d.sales.count} invoices · ${d.sales.operators} operators`}
            delta={fmtPct(d.sales.total, d.sales.prevTotal)}
          />
          <KpiCard
            label="Commission Income"
            icon={DollarIcon}
            accent="#8b5cf6"
            value={fmtMoney(d.commission)}
            footer="From consignment sales"
          />
          <KpiCard
            label="Cash inflow"
            icon={DollarIcon}
            accent="var(--ink-success)"
            value={fmtMoney(d.cashIn)}
            footer="Cash sales only"
          />
          <KpiCard
            label="Credit sales"
            icon={CreditCardIcon}
            accent="var(--ink-fg-2)"
            value={fmtMoney(d.sales.credit)}
            footer="Owed by customers"
          />
          <KpiCard
            label="Net cash flow"
            icon={d.netCash >= 0 ? TrendingUpIcon : TrendingDownIcon}
            accent={d.netCash >= 0 ? 'var(--ink-success)' : 'var(--ink-danger)'}
            value={fmtMoney(d.netCash)}
            footer="Sales + Commission − expenses"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <KpiCard
            label="Refunds"
            icon={TrendingDownIcon}
            accent="var(--ink-danger)"
            value={fmtMoney(d.refunds)}
            footer="Returned to customers"
          />
          <KpiCard
            label="Repair revenue"
            icon={WrenchIcon}
            accent="var(--brand-primary)"
            value={fmtMoney(d.repairs)}
            footer={`${d.repairsPending} pending tickets`}
          />
          <KpiCard
            label="Operating expenses"
            icon={DollarIcon}
            accent="var(--ink-danger)"
            value={fmtMoney(d.expenses.total)}
            footer="Rent, utilities, salaries"
            delta={fmtPct(d.expenses.total, d.expenses.prevTotal)}
          />
          <KpiCard
            label="Stock purchases"
            icon={TruckIcon}
            accent="var(--ink-fg-2)"
            value={fmtMoney(d.purchases)}
            footer="GRN intake (qty × cost)"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <KpiCard
            label="Total SKUs"
            icon={BoxIcon}
            accent="var(--ink-fg-2)"
            value={Number(d.stock.totalSkus).toLocaleString()}
            footer="Active items in catalog"
          />
          <KpiCard
            label="Stock value"
            icon={BoxIcon}
            accent="var(--brand-primary)"
            value={fmtMoney(d.stock.value)}
            footer="Qty × avg cost"
          />
          <KpiCard
            label="Low stock"
            icon={AlertIcon}
            accent="var(--ink-danger)"
            value={Number(d.stock.lowStock).toLocaleString()}
            footer="≤ 5 units remaining"
          />
          <KpiCard
            label="Out of stock"
            icon={AlertIcon}
            accent="var(--ink-danger)"
            value={Number(d.stock.outOfStock).toLocaleString()}
            footer="Zero on hand"
          />
        </div>

        {isAdmin && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <KpiCard
              label="Supplier payables"
              icon={TruckIcon}
              accent="var(--ink-fg-2)"
              value={fmtMoney(d.payables)}
              footer="Outstanding to dealers"
            />
            <KpiCard
              label="Customer receivables"
              icon={UsersIcon}
              accent="var(--ink-fg-2)"
              value={fmtMoney(d.receivables)}
              footer="Outstanding khata"
            />
            {d.topItem && (
              <KpiCard
                label="Top seller"
                icon={TrendingUpIcon}
                accent="var(--brand-primary)"
                value={`${Number(d.topItem.qty_sold).toLocaleString()} pcs`}
                footer={`${d.topItem.item_name} · ${d.topItem.sku}`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
