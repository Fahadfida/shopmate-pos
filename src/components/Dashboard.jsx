import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';
import '../index.css';

// ─────────────────────────────────────────────────────────────
// Icons — one set, 16px, 1.5 stroke, muted color. Skill §3.
// ─────────────────────────────────────────────────────────────
const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const RefreshIcon = () => (
  <svg {...iconProps}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const LoadingUI = () => (
  <div
    style={{
      display: 'flex',
      height: '80vh',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          width: '28px',
          height: '28px',
          border: '2px solid var(--ink-3)',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          marginTop: '12px',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--ink-fg-2)',
        }}
      >
        Loading
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div
    style={{
      background: 'var(--ink-0)',
      border: '1px solid var(--ink-3)',
      borderRadius: '12px',
      padding: '20px',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ children, accent }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.78rem',
      fontWeight: 500,
      color: 'var(--ink-fg-2)',
      marginBottom: '12px',
    }}
  >
    {accent && (
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: accent,
        }}
      />
    )}
    {children}
  </div>
);

const Figure = ({ children, size = '1.15rem', color = 'var(--ink-fg)' }) => (
  <div
    className="monospace tabular"
    style={{
      fontSize: size,
      fontWeight: 600,
      color,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    }}
  >
    {children}
  </div>
);

const Hairline = () => (
  <div
    style={{
      height: '1px',
      background: 'var(--ink-3)',
      width: '100%',
      margin: '8px 0',
    }}
  />
);

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [refundsList, setRefundsList] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const loadDashboardData = async (days, year) => {
    setIsSyncing(true);
    setError(null);
    const ipc = getIpc();
    if (!ipc) return;

    try {
      const [basicStats, advancedData, financial, refundsRepairs] =
        await Promise.all([
          ipc.invoke('get-dashboard-stats'),
          ipc.invoke('get-dashboard-analytics', days, year),
          ipc.invoke('get-financial-ledger'),
          ipc.invoke('get-refunds-repairs'),
        ]);

      setStats(basicStats);
      setAnalytics(advancedData);
      setSummary(financial?.summary || null);

      const repairs = (refundsRepairs || []).filter((r) => r.type === 'REPAIR');
      setRefundsList(repairs);
      setLastSync(new Date());
    } catch (err) {
      console.error('Dashboard load failed:', err);
      setError(err?.message || 'Could not load dashboard data.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(timeframe, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, selectedYear]);

  if (error) {
    return (
      <div
        role="alert"
        style={{
          background: 'var(--ink-danger)',
          color: '#ffffff',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        {error} —{' '}
        <button
          onClick={() => loadDashboardData(timeframe, selectedYear)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats || !analytics) return <LoadingUI />;

  // ── Data (with local date fix for UTC offset mismatch)
  // ── Data (with local date fix for UTC offset mismatch)
  const localTodayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const matchingTodayTrend = (analytics.salesTrend || []).find(
    (d) => d.sale_date === localTodayStr,
  );

  // 🛡️ Fallback to stats.dailySales if trend array lags behind local time query
  const dailyTotal = matchingTodayTrend?.total ?? stats.dailySales?.total ?? 0;
  const dailyCount = matchingTodayTrend?.count ?? stats.dailySales?.count ?? 0;

  const monthlyTotal = stats.monthlySales?.total || 0;
  const monthlyCount = stats.monthlySales?.count || 0;
  const stockValuation = stats.totalStockWorth || 0;
  const customerDues = stats.customerDues || 0;
  const supplierPayables = stats.supplierPayables || 0;

  const expensesTotal = summary?.totalExpenses ?? 0;
  const purchasesTotal = summary?.totalPurchases ?? 0;
  const refundsTotal = summary?.totalRefunds ?? 0;
  const repairsCount = refundsList.length;

  const trendData = analytics.salesTrend || [];
  const hotProducts = analytics.hotProducts || [];
  const restockItems = analytics.restockItems || [];
  const yearlyPerformance = analytics.yearlyPerformance || [];

  // ── Chart geometry
  const chartHeight = 180;
  const chartWidth = 720;
  const maxSale = Math.max(...trendData.map((d) => d.total || 0), 1000);

  const points = trendData.map((d, index) => {
    const x =
      trendData.length === 1
        ? chartWidth / 2
        : (index / (trendData.length - 1)) * (chartWidth - 80) + 40;
    const y =
      chartHeight - ((d.total || 0) / maxSale) * (chartHeight - 40) - 20;
    return { x, y, ...d };
  });

  const smoothPath = (() => {
    if (points.length < 2) return '';
    return points.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const c1x = a[i - 1].x + (p.x - a[i - 1].x) / 2;
      const c1y = a[i - 1].y;
      const c2x = a[i - 1].x + (p.x - a[i - 1].x) / 2;
      const c2y = p.y;
      return `${acc} C ${c1x},${c1y} ${c2x},${c2y} ${p.x},${p.y}`;
    }, '');
  })();

  const maxBarVal = Math.max(
    ...yearlyPerformance.map((m) => m.sales || 0),
    1000,
  );

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const syncLabel = lastSync
    ? lastSync.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '32px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
      {/* ─────────── HEADER ─────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: '4px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink-fg)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            {dateLabel}
          </h1>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.78rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            Offline · Last sync {syncLabel}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'var(--ink-2)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--ink-3)',
            }}
          >
            {[7, 30].map((t) => {
              const active = timeframe === t;
              return (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: active ? 'var(--brand-primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--ink-fg-2)',
                    transition: 'background-color 120ms ease, color 120ms ease',
                  }}
                >
                  {t}d
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadDashboardData(timeframe, selectedYear)}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--ink-2)',
              border: '1px solid var(--ink-3)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--ink-fg)',
              cursor: isSyncing ? 'default' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
              transition: 'background-color 120ms ease',
            }}
          >
            {!isSyncing && <RefreshIcon />}
            {isSyncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* ─────────── TIER 1: HERO + 4 ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: '16px',
        }}
      >
        {/* HERO — Today's Sales */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardTitle accent="var(--brand-primary)">Today's sales</CardTitle>
          <Figure size="2.25rem" color="var(--ink-fg)">
            Rs. {dailyTotal.toLocaleString()}
          </Figure>
          <div
            style={{
              height: '1px',
              width: '48px',
              background: 'var(--brand-primary)',
              margin: '10px 0 8px 0',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-fg-2)' }}>
            {dailyCount} bill{dailyCount === 1 ? '' : 's'} today
          </div>
        </Card>

        {/* Compact 1 — Monthly */}
        <Card>
          <CardTitle>This month</CardTitle>
          <Figure>Rs. {monthlyTotal.toLocaleString()}</Figure>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-fg-3)',
              marginTop: '4px',
            }}
          >
            {monthlyCount} transactions
          </div>
        </Card>

        {/* Compact 2 — Customer Dues */}
        <Card>
          <CardTitle accent="var(--ink-danger)">Customer dues</CardTitle>
          <Figure color="var(--ink-danger)">
            Rs. {customerDues.toLocaleString()}
          </Figure>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-fg-3)',
              marginTop: '4px',
            }}
          >
            Khata receivables
          </div>
        </Card>

        {/* Compact 3 — Supplier Payables */}
        <Card>
          <CardTitle accent="var(--ink-warning)">Supplier debt</CardTitle>
          <Figure color="var(--ink-warning)">
            Rs. {supplierPayables.toLocaleString()}
          </Figure>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-fg-3)',
              marginTop: '4px',
            }}
          >
            Vendor payables
          </div>
        </Card>

        {/* Compact 4 — Stock Valuation */}
        <Card>
          <CardTitle>Stock value</CardTitle>
          <Figure>Rs. {stockValuation.toLocaleString()}</Figure>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-fg-3)',
              marginTop: '4px',
            }}
          >
            WAC basis
          </div>
        </Card>
      </div>

      {/* ─────────── QUIET STRIP (ledger signature) ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0',
          background: 'var(--ink-0)',
          border: '1px solid var(--ink-3)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {[
          {
            label: 'Total expenses',
            value: expensesTotal,
            color: 'var(--ink-danger)',
          },
          {
            label: 'Total purchases',
            value: purchasesTotal,
            color: 'var(--ink-warning)',
          },
          {
            label: 'Total refunds',
            value: refundsTotal,
            color: 'var(--ink-danger)',
          },
          {
            label: 'Repairs logged',
            value: repairsCount,
            color: 'var(--ink-info)',
            isCount: true,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '14px 18px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--ink-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--ink-fg-3)',
                fontWeight: 500,
              }}
            >
              {item.label}
            </div>
            <div
              className="monospace tabular"
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: item.color,
                textAlign: 'left',
              }}
            >
              {item.isCount ? item.value : `Rs. ${item.value.toLocaleString()}`}
            </div>
          </div>
        ))}
      </div>

      {/* ─────────── TIER 2: CHARTS ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
        }}
      >
        {/* Revenue trajectory — the main moment */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div>
              <CardTitle>Revenue</CardTitle>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--ink-fg-3)',
                  marginTop: '-8px',
                  marginBottom: '8px',
                }}
              >
                Last {timeframe} days
              </div>
            </div>
            {trendData.length > 0 && (
              <div
                className="monospace tabular"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
                }}
              >
                Rs.{' '}
                {trendData
                  .reduce((s, d) => s + (d.total || 0), 0)
                  .toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            {trendData.length === 0 ? (
              <div
                style={{
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-fg-3)',
                  fontSize: '0.8rem',
                  gap: '6px',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m7 12 4-4 4 4 4-4" />
                </svg>
                No sales in this window
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: '190px', overflow: 'visible' }}
              >
                {/* grid */}
                {[20, 60, 100, 140].map((y) => (
                  <line
                    key={y}
                    x1="20"
                    y1={y}
                    x2={chartWidth - 20}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeDasharray="2 4"
                  />
                ))}

                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1="10"
                    x2={hoveredPoint.x}
                    y2={chartHeight - 20}
                    stroke="var(--ink-4)"
                    strokeDasharray="2 2"
                  />
                )}

                {points.length > 1 && (
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke="var(--brand-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {points.map((p, idx) => {
                  const active = hoveredPoint === p;
                  return (
                    <g
                      key={idx}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={active ? 4 : 2.5}
                        fill="var(--brand-primary)"
                        stroke="var(--ink-0)"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.x}
                        y={chartHeight - 6}
                        fontSize="9"
                        fill="var(--ink-fg-3)"
                        textAnchor="middle"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {p.sale_date ? p.sale_date.substring(5) : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'var(--ink-fg)',
                  color: 'var(--ink-0)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                }}
              >
                <div style={{ opacity: 0.7 }}>{hoveredPoint.sale_date}</div>
                <div>Rs. {(hoveredPoint.total || 0).toLocaleString()}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Monthly — secondary, different in kind */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <CardTitle>Monthly</CardTitle>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                borderRadius: '6px',
                border: '1px solid var(--ink-3)',
                background: 'var(--ink-1)',
                color: 'var(--ink-fg-2)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {yearlyPerformance.map((m, idx) => {
              const pct = maxBarVal > 0 ? (m.sales / maxBarVal) * 100 : 0;
              const isCurrent =
                new Date().getMonth() === idx &&
                selectedYear === new Date().getFullYear().toString();
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr auto',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: isCurrent ? 'var(--ink-fg)' : 'var(--ink-fg-3)',
                      fontWeight: isCurrent ? 600 : 500,
                    }}
                  >
                    {m.month}
                  </span>
                  <div
                    style={{
                      height: '6px',
                      background: 'var(--ink-2)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(pct, m.sales > 0 ? 2 : 0)}%`,
                        background: isCurrent
                          ? 'var(--brand-primary)'
                          : 'var(--ink-4)',
                        borderRadius: '3px',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </div>
                  <span
                    className="monospace tabular"
                    style={{
                      fontSize: '0.7rem',
                      color: isCurrent ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
                      minWidth: '52px',
                      textAlign: 'right',
                    }}
                  >
                    {m.sales > 0 ? `Rs.${(m.sales / 1000).toFixed(0)}k` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ─────────── TIER 3: LISTS ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        {/* Hot products */}
        <Card>
          <CardTitle>Top products · by revenue</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hotProducts.length === 0 ? (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--ink-fg-3)',
                  padding: '20px 0',
                  textAlign: 'center',
                }}
              >
                No product sales yet
              </div>
            ) : (
              hotProducts.slice(0, 5).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom:
                      idx === Math.min(hotProducts.length, 5) - 1
                        ? 'none'
                        : '1px solid var(--ink-3)',
                  }}
                >
                  <span
                    className="monospace"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: 'var(--ink-fg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginTop: '2px',
                      }}
                    >
                      {p.total_sold} sold
                    </div>
                  </div>
                  <div
                    className="monospace tabular"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--ink-fg)',
                    }}
                  >
                    Rs. {(p.revenue || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Restock */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <CardTitle accent="var(--ink-danger)">Restock</CardTitle>
            {restockItems.length > 0 && (
              <span
                className="monospace"
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--ink-danger)',
                }}
              >
                {restockItems.length} low
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {restockItems.length === 0 ? (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--ink-fg-3)',
                  padding: '20px 0',
                  textAlign: 'center',
                }}
              >
                Stock levels optimal
              </div>
            ) : (
              restockItems.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom:
                      idx === Math.min(restockItems.length, 5) - 1
                        ? 'none'
                        : '1px solid var(--ink-3)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: 'var(--ink-fg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginTop: '2px',
                      }}
                    >
                      Remaining:{' '}
                      <span className="monospace tabular">
                        {item.stock_qty} {item.unit || 'pcs'}
                      </span>
                    </div>
                  </div>
                  <span
                    className="monospace tabular"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--ink-danger)',
                      padding: '2px 8px',
                      border: '1px solid var(--ink-danger)',
                      borderRadius: '6px',
                      background: 'transparent',
                    }}
                  >
                    low
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Hairline />
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--ink-fg-3)',
          textAlign: 'center',
        }}
      >
        Repairs card reflects the last 20 records returned by the backend.
      </div>
    </div>
  );
}
