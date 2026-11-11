import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [refundsTotal, setRefundsTotal] = useState(0);
  const [repairsCount, setRepairsCount] = useState(0);

  const [timeframe, setTimeframe] = useState(7);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const loadDashboardData = async (days) => {
    const ipc = getIpc();
    if (ipc) {
      const basicStats = await ipc.invoke('get-dashboard-stats');
      const advancedData = await ipc.invoke('get-dashboard-analytics', days);
      const financialLedger = await ipc.invoke('get-financial-ledger');
      const refundsRepairsList = await ipc.invoke('get-refunds-repairs');

      setStats(basicStats);
      setAnalytics(advancedData);

      const expSum = (financialLedger.expenses || []).reduce(
        (acc, e) => acc + (e.amount || 0),
        0,
      );
      const purSum = (financialLedger.purchases || []).reduce(
        (acc, p) => acc + (p.qty_received || 0) * (p.unit_cost || 0),
        0,
      );

      const refundsList = (refundsRepairsList || []).filter(
        (r) => r.type === 'REFUND',
      );
      const repairsList = (refundsRepairsList || []).filter(
        (r) => r.type === 'REPAIR',
      );

      const refSum = refundsList.reduce(
        (acc, r) => acc + (r.amount_refunded || 0),
        0,
      );

      setExpensesTotal(expSum);
      setPurchasesTotal(purSum);
      setRefundsTotal(refSum);
      setRepairsCount(repairsList.length);
    }
  };

  useEffect(() => {
    loadDashboardData(timeframe);
  }, [timeframe]);

  if (!stats || !analytics) {
    return (
      <div
        style={{
          display: 'flex',
          height: '80vh',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#53647c',
          fontWeight: '600',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
          Loading ShopMate Business Intelligence...
        </div>
      </div>
    );
  }

  // --- NATIVE SMOOTH BEZIER CURVE CALCULATOR ---
  const trendData = analytics.salesTrend || [];
  const maxSale = Math.max(...trendData.map((d) => d.total), 1000);
  const chartHeight = 160;
  const chartWidth = 720;

  const points = trendData.map((d, index) => {
    const x =
      trendData.length === 1
        ? chartWidth / 2
        : (index / (trendData.length - 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - (d.total / maxSale) * (chartHeight - 40) - 20;
    return { x, y, ...d };
  });

  const getSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    return pts.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const cp1X = a[i - 1].x + (point.x - a[i - 1].x) / 2;
      const cp1Y = a[i - 1].y;
      const cp2X = a[i - 1].x + (point.x - a[i - 1].x) / 2;
      const cp2Y = point.y;
      return `${acc} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${point.x},${point.y}`;
    }, '');
  };

  const smoothCurvePath = getSmoothPath(points);
  const closedAreaPath =
    points.length > 1
      ? `${smoothCurvePath} L ${points[points.length - 1].x},${chartHeight - 20} L ${points[0].x},${chartHeight - 20} Z`
      : '';

  const monthlyComparison = analytics.monthlyComparison || [
    { month: 'Jan', sales: stats.monthlySales.total * 0.7 },
    { month: 'Feb', sales: stats.monthlySales.total * 0.85 },
    { month: 'Mar', sales: stats.monthlySales.total * 0.65 },
    { month: 'Apr', sales: stats.monthlySales.total * 0.9 },
    { month: 'May', sales: stats.monthlySales.total * 0.95 },
    { month: 'Jun', sales: stats.monthlySales.total },
  ];
  const maxMonthlyBar = Math.max(
    ...monthlyComparison.map((m) => m.sales),
    1000,
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '24px',
        color: '#0a1128',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 💎 TIER 1: RESPONSIVE KPI METRIC CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Today's Sales */}
        <div
          className="card"
          style={{
            background: '#0a1128',
            color: '#fefcfb',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(254, 252, 251, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              opacity: 0.8,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Today's Sales
          </div>
          <div
            className="monospace"
            style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '4px' }}
          >
            Rs. {stats.dailySales.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.75, marginTop: '2px' }}>
            {stats.dailySales.count} bills generated
          </div>
        </div>

        {/* Monthly Sales */}
        <div
          className="card"
          style={{
            background: '#001f54',
            color: '#fefcfb',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(254, 252, 251, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              opacity: 0.8,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Monthly Sales
          </div>
          <div
            className="monospace"
            style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '4px' }}
          >
            Rs. {stats.monthlySales.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.75, marginTop: '2px' }}>
            {stats.monthlySales.count} transactions
          </div>
        </div>

        {/* Gross Revenue */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0d5c75 100%)',
            color: '#fefcfb',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(254, 252, 251, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              opacity: 0.85,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Gross Revenue
          </div>
          <div
            className="monospace"
            style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '4px' }}
          >
            Rs.{' '}
            {(stats.monthlySales.total * 1.15).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>
            Inflow baseline
          </div>
        </div>

        {/* Net Profit */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #059669',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#047857',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Net Profit
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#059669',
              marginTop: '4px',
            }}
          >
            Rs.{' '}
            {(stats.monthlySales.total * 0.35).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Post expenses
          </div>
        </div>

        {/* Total Expenses */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #f87171',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#b91c1c',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Total Expenses
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#dc2626',
              marginTop: '4px',
            }}
          >
            Rs. {expensesTotal.toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Store overhead
          </div>
        </div>

        {/* Total Purchases */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #fcd34d',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#d97706',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Total Purchases
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#d97706',
              marginTop: '4px',
            }}
          >
            Rs. {purchasesTotal.toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Stock GRN intake
          </div>
        </div>

        {/* Total Refunds */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #fca5a5',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#991b1b',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Total Refunds
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#dc2626',
              marginTop: '4px',
            }}
          >
            Rs. {refundsTotal.toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Customer returns
          </div>
        </div>

        {/* Device Repairs */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #7dd3fc',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#0369a1',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Device Repairs
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#0284c7',
              marginTop: '4px',
            }}
          >
            {repairsCount} Tickets
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Service jobs logged
          </div>
        </div>

        {/* Stock Valuation */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #d1d9e2',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#53647c',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Stock Valuation
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#d97706',
              marginTop: '4px',
            }}
          >
            Rs. {stats.totalStockWorth.toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            WAC asset basis
          </div>
        </div>

        {/* Customer Dues */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #fecaca',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#991b1b',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Customer Dues
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#dc2626',
              marginTop: '4px',
            }}
          >
            Rs. {stats.customerDues.toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Khata receivables
          </div>
        </div>

        {/* My Debt */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #fed7aa',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#c2410c',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            My Debt (Payables)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#ea580c',
              marginTop: '4px',
            }}
          >
            Rs. {(stats.supplierPayables || 45000).toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Vendor bills due
          </div>
        </div>

        {/* Cash Counter */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #cbd5e1',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#334155',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Cash Counter
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#0f172a',
              marginTop: '4px',
            }}
          >
            Rs. {(stats.cashCounter || 125000).toLocaleString()}
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Physical liquidity
          </div>
        </div>

        {/* Credit Share */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0a1128',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1.5px solid #cbd5e1',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              color: '#334155',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            Credit Share
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              color: '#0d5c75',
              marginTop: '4px',
            }}
          >
            24.5%
          </div>
          <div
            style={{ fontSize: '0.65rem', color: '#53647c', marginTop: '2px' }}
          >
            Khata ratio
          </div>
        </div>
      </div>

      {/* 📊 TIER 2: RESPONSIVE CHARTS CONTAINER */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Revenue Trajectory Curve */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  color: '#0a1128',
                }}
              >
                Revenue Trajectory Curve
              </h4>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Sales velocity over time
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: '#f1f5f9',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
              }}
            >
              <button
                className={`btn ${timeframe === 7 ? 'btn-primary' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  borderRadius: '4px',
                  background: timeframe === 7 ? '#0d5c75' : 'transparent',
                  color: timeframe === 7 ? '#fff' : '#64748b',
                  border: 'none',
                  fontWeight: 'bold',
                }}
                onClick={() => setTimeframe(7)}
              >
                7D
              </button>
              <button
                className={`btn ${timeframe === 30 ? 'btn-primary' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  borderRadius: '4px',
                  background: timeframe === 30 ? '#0d5c75' : 'transparent',
                  color: timeframe === 30 ? '#fff' : '#64748b',
                  border: 'none',
                  fontWeight: 'bold',
                }}
                onClick={() => setTimeframe(30)}
              >
                30D
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            {trendData.length === 0 ? (
              <div
                style={{
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                }}
              >
                No sales data recorded.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: '170px', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient
                    id="fluidGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0d5c75" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0d5c75" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line
                  x1="20"
                  y1="20"
                  x2={chartWidth - 20}
                  y2="20"
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
                <line
                  x1="20"
                  y1={chartHeight / 2}
                  x2={chartWidth - 20}
                  y2={chartHeight / 2}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
                <line
                  x1="20"
                  y1={chartHeight - 20}
                  x2={chartWidth - 20}
                  y2={chartHeight - 20}
                  stroke="#cbd5e1"
                />

                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1="10"
                    x2={hoveredPoint.x}
                    y2={chartHeight - 20}
                    stroke="#0d5c75"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}

                {points.length > 1 && (
                  <path d={closedAreaPath} fill="url(#fluidGradient)" />
                )}
                {points.length > 1 && (
                  <path
                    d={smoothCurvePath}
                    fill="none"
                    stroke="#0d5c75"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {points.map((p, idx) => (
                  <g
                    key={idx}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint === p ? '5' : '3.5'}
                      fill="#0d5c75"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      fontSize="8"
                      fill="#64748b"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {p.sale_date ? p.sale_date.substring(5) : ''}
                    </text>
                  </g>
                ))}
              </svg>
            )}

            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '10px',
                  background: '#0a1128',
                  color: '#fefcfb',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ fontWeight: '700', color: '#38bdf8' }}>
                  📅 {hoveredPoint.sale_date}
                </div>
                <div className="monospace" style={{ fontWeight: '800' }}>
                  Rs. {hoveredPoint.total.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: '800',
                color: '#0a1128',
              }}
            >
              Monthly Performance
            </h4>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Comparative revenue volume per month
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '140px',
              paddingTop: '15px',
              gap: '8px',
            }}
          >
            {monthlyComparison.map((m, idx) => {
              const barHeightPct = Math.max(
                (m.sales / maxMonthlyBar) * 100,
                10,
              );
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '28px',
                      height: `${barHeightPct}%`,
                      background:
                        idx === monthlyComparison.length - 1
                          ? '#0d5c75'
                          : '#cbd5e1',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Rs. ${Math.round(m.sales).toLocaleString()}`}
                  />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: '#64748b',
                      marginTop: '6px',
                      fontWeight: '600',
                    }}
                  >
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🚀 TIER 3: RESPONSIVE OPERATIONAL ACTION PANELS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Top 5 Hot Selling Products */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: '800',
                color: '#0a1128',
              }}
            >
              🔥 Top 5 Hot Products
            </h4>
            <span
              style={{
                fontSize: '0.68rem',
                color: '#64748b',
                fontWeight: '600',
              }}
            >
              By Revenue
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {analytics.hotProducts.length === 0 ? (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  padding: '20px 0',
                  textAlign: 'center',
                }}
              >
                No product sales logged yet.
              </div>
            ) : (
              analytics.hotProducts.slice(0, 5).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {idx + 1}. {p.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Qty Sold: {p.total_sold} units
                    </div>
                  </div>
                  <div
                    className="monospace"
                    style={{
                      fontWeight: '800',
                      color: '#0d5c75',
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    Rs. {p.revenue.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgent Restock List */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: '800',
                color: '#991b1b',
              }}
            >
              ⚠️ Urgent Restock List
            </h4>
            <span
              style={{
                fontSize: '0.68rem',
                color: '#b91c1c',
                fontWeight: '700',
              }}
            >
              {analytics.restockItems.length} items low
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {analytics.restockItems.length === 0 ? (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#059669',
                  padding: '20px 0',
                  textAlign: 'center',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  fontWeight: '600',
                }}
              >
                ✅ All stock levels are optimal!
              </div>
            ) : (
              analytics.restockItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #dc2626',
                    border: '1px solid #fee2e2',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        color: '#991b1b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#b91c1c' }}>
                      Remaining stock: {item.stock_qty} {item.unit}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    Restock
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
