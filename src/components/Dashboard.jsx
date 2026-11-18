import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';
import '../index.css';

// --- CLEAN SVG ICONS ---
const RefreshIcon = ({ spinning }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.5s ease',
      transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
    }}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);
const TrendingUpIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);
const WalletIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="M6 8h12"></path>
    <path d="M16 12h2"></path>
  </svg>
);
const ReceiptIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"></path>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="8" y1="10" x2="16" y2="10"></line>
    <line x1="8" y1="14" x2="12" y2="14"></line>
  </svg>
);
const UsersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const TruckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);
const PackageIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);
const FlameIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"></path>
  </svg>
);
const AlertIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const ToolIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);
const CoinsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="6"></circle>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
    <path d="M7 6h1v4"></path>
    <path d="m16.71 13.88.7.71-2.82 2.82"></path>
  </svg>
);

const LoadingUI = () => (
  <div
    style={{
      display: 'flex',
      height: '80vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-hover)',
    }}
  >
    <div
      style={{
        textAlign: 'center',
        background: 'var(--bg-card)',
        padding: '32px 44px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          marginTop: '14px',
          fontSize: '0.9rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        ShopMate Command Center
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginTop: '4px',
        }}
      >
        Loading business intelligence streams...
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [shopLogo, setShopLogo] = useState('');
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [refundsTotal, setRefundsTotal] = useState(0);
  const [lifetimeNetSales, setLifetimeNetSales] = useState(0);
  const [repairsCount, setRepairsCount] = useState(0);

  const [timeframe, setTimeframe] = useState(7);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDashboardData = async (days, year) => {
    setIsSyncing(true);
    const ipc = getIpc();
    if (ipc) {
      try {
        const basicStats = await ipc.invoke('get-dashboard-stats');
        const advancedData = await ipc.invoke(
          'get-dashboard-analytics',
          days,
          year,
        );
        const financialLedger = await ipc.invoke('get-financial-ledger');
        const refundsRepairsList = await ipc.invoke('get-refunds-repairs');
        const settingsList = await ipc.invoke('get-settings');

        if (Array.isArray(settingsList)) {
          const logoSetting = settingsList.find((s) => s.key === 'shop_logo');
          if (logoSetting) setShopLogo(logoSetting.value);
        } else if (settingsList?.shop_logo) {
          setShopLogo(settingsList.shop_logo);
        }

        setStats(basicStats);
        setAnalytics(advancedData);

        const expSum = (financialLedger?.expenses || []).reduce(
          (acc, e) => acc + (parseFloat(e.amount) || 0),
          0,
        );
        const purSum = (financialLedger?.purchases || []).reduce(
          (acc, p) =>
            acc +
            parseFloat(p.qty_received || 0) * parseFloat(p.unit_cost || 0),
          0,
        );
        const refundsList = (refundsRepairsList || []).filter(
          (r) => r.type === 'REFUND',
        );
        const repairsList = (refundsRepairsList || []).filter(
          (r) => r.type === 'REPAIR',
        );
        const refSum = refundsList.reduce(
          (acc, r) => acc + (parseFloat(r.amount_refunded) || 0),
          0,
        );

        const grossLifetime =
          basicStats?.lifetimeSales || basicStats?.monthlySales?.total || 0;

        setLifetimeNetSales(grossLifetime - refSum);
        setExpensesTotal(expSum);
        setPurchasesTotal(purSum);
        setRefundsTotal(refSum);
        setRepairsCount(repairsList.length);
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  };

  useEffect(() => {
    loadDashboardData(timeframe, selectedYear);
  }, [timeframe, selectedYear]);

  if (!stats || !analytics) return <LoadingUI />;

  const dailyTotal = stats.dailySales?.total || 0;
  const dailyCount = stats.dailySales?.count || 0;
  const monthlyTotal = stats.monthlySales?.total || 0;
  const monthlyCount = stats.monthlySales?.count || 0;
  const stockValuation = stats.totalStockWorth || 0;
  const customerDues = stats.customerDues || 0;
  const supplierPayables = stats.supplierPayables || 0;

  // Calculate Cash Counter (Approximation based on current month sales vs expenses)
  const cashCounter =
    (stats.dailySales?.total || 0) - expensesTotal * 0.1 + 50000; // Example formula

  const trendData = analytics.salesTrend || [];
  const hotProducts = analytics.hotProducts || [];
  const restockItems = analytics.restockItems || [];
  const yearlyPerformance = analytics.yearlyPerformance || [];

  // --- REVENUE TRAJECTORY CHART ---
  const chartHeight = 160;
  const chartWidth = 700;
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

  // --- YEARLY BAR CHART LOGIC ---
  const maxBarVal = Math.max(...yearlyPerformance.map((m) => m.sales), 1000);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '30px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 1. HEADER BANNER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {shopLogo ? (
            <img
              src={shopLogo}
              alt="Shop Logo"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-hover)',
              }}
            />
          ) : (
            <div
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--brand-primary)',
                color: '#fff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.2rem',
              }}
            >
              S
            </div>
          )}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '800',
                color: 'var(--text-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Business Intelligence Dashboard
            </h3>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                margin: '2px 0 0 0',
              }}
            >
              Real-time synchronization across POS, Khata, and Inventory
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'var(--bg-hover)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            {[7, 30].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background:
                    timeframe === t ? 'var(--brand-primary)' : 'transparent',
                  color: timeframe === t ? '#ffffff' : '#64748b',
                }}
              >
                {t}D
              </button>
            ))}
          </div>
          <button
            onClick={() => loadDashboardData(timeframe, selectedYear)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-card)',
              border: '1.5px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <RefreshIcon spinning={isSyncing} /> Sync Data
          </button>
        </div>
      </div>

      {/* 2. TIER 1: BENTO BOX KPI GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        {/* Hero Cards (Span 2) */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1.5px solid var(--brand-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            // gridColumn: 'span 2',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                textTransform: 'uppercase',
              }}
            >
              Today's Sales
            </span>
            <div style={{ color: 'var(--brand-primary)' }}>
              <TrendingUpIcon />
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: 'var(--brand-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {dailyTotal.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
                fontWeight: '500',
              }}
            >
              {dailyCount} bills generated today
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1.5px solid var(--brand-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            // gridColumn: 'span 2',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                textTransform: 'uppercase',
              }}
            >
              Lifetime Net Sales
            </span>
            <div style={{ color: 'var(--brand-primary)' }}>
              <TrendingUpIcon />
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: 'var(--brand-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {lifetimeNetSales.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
                fontWeight: '500',
              }}
            >
              Gross sales minus total refunds
            </div>
          </div>
        </div>

        {/* Standard Cards (Span 1) */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--danger)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--danger)',
                textTransform: 'uppercase',
              }}
            >
              Total Expenses
            </span>
            <div style={{ color: 'var(--danger)' }}>
              <ReceiptIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {expensesTotal.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Operating overhead
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid #d97706',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#d97706',
                textTransform: 'uppercase',
              }}
            >
              Total Purchases
            </span>
            <div style={{ color: '#d97706' }}>
              <TruckIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {purchasesTotal.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Stock GRN intake
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--danger)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--danger)',
                textTransform: 'uppercase',
              }}
            >
              Total Refunds
            </span>
            <div style={{ color: 'var(--danger)' }}>
              <ReceiptIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {refundsTotal.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Customer returns
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid #d97706',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#d97706',
                textTransform: 'uppercase',
              }}
            >
              Stock Valuation
            </span>
            <div style={{ color: '#d97706' }}>
              <PackageIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {stockValuation.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              WAC asset basis
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--info)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--info)',
                textTransform: 'uppercase',
              }}
            >
              Device Repairs
            </span>
            <div style={{ color: 'var(--info)' }}>
              <ToolIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {repairsCount} Jobs
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Active tickets
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--danger)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--danger)',
                textTransform: 'uppercase',
              }}
            >
              Customer Dues
            </span>
            <div style={{ color: 'var(--danger)' }}>
              <UsersIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {customerDues.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Khata receivables
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid #d97706',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#d97706',
                textTransform: 'uppercase',
              }}
            >
              Supplier Debt
            </span>
            <div style={{ color: '#d97706' }}>
              <TruckIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {supplierPayables.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Vendor payables
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--brand-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                textTransform: 'uppercase',
              }}
            >
              Credit Share
            </span>
            <div style={{ color: 'var(--brand-primary)' }}>
              <UsersIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {customerDues.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Total credit owed
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--success)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--success)',
                textTransform: 'uppercase',
              }}
            >
              Cash Counter
            </span>
            <div style={{ color: 'var(--success)' }}>
              <WalletIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {cashCounter.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Estimated physical cash
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1.5px solid var(--brand-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                textTransform: 'uppercase',
              }}
            >
              Monthly Sales
            </span>
            <div style={{ color: 'var(--brand-primary)' }}>
              <TrendingUpIcon />
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div
              className="monospace"
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {monthlyTotal.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              {monthlyCount} transactions
            </div>
          </div>
        </div>
      </div>

      {/* 3. TIER 2: CHARTS */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
      >
        {/* Revenue Chart */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
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
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                Revenue Trajectory
              </h4>
              <span
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
              >
                Sales velocity over time
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--brand-primary)',
                background: '#f0fdf4',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
              }}
            >
              {timeframe} Days
            </span>
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
                  fontSize: '0.85rem',
                }}
              >
                No sales telemetry recorded.
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
                    <stop
                      offset="0%"
                      stopColor="var(--brand-primary)"
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--brand-primary)"
                      stopOpacity="0.0"
                    />
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
                    stroke="var(--brand-primary)"
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
                    stroke="var(--brand-primary)"
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
                      fill="var(--brand-primary)"
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
                  background: '#1e293b',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <div style={{ fontWeight: '700', color: '#38bdf8' }}>
                  {hoveredPoint.sale_date}
                </div>
                <div style={{ fontWeight: '800' }}>
                  Rs. {(hoveredPoint.total || 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Yearly Performance Bar Chart */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            // color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                Monthly Financial Overview
              </h4>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Revenue vs operating costs vs net profit
              </span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-hover)',
                fontWeight: 'bold',
                color: '#334155',
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
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: '160px',
              paddingTop: '20px',
              gap: '8px',
            }}
          >
            {yearlyPerformance.map((m, idx) => {
              const barHeightPct = Math.max((m.sales / maxBarVal) * 100, 2);
              const isCurrentMonth =
                new Date().getMonth() === idx &&
                selectedYear === new Date().getFullYear().toString();
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    className="monospace"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: isCurrentMonth
                        ? 'var(--brand-primary)'
                        : '#64748b',
                      marginBottom: '4px',
                    }}
                  >
                    {m.sales > 0 ? `Rs. ${(m.sales / 1000).toFixed(0)}k` : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${barHeightPct}%`,
                      background: isCurrentMonth
                        ? 'var(--brand-primary)'
                        : '#cbd5e1',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Rs. ${m.sales.toLocaleString()}`}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: isCurrentMonth
                        ? 'var(--brand-primary)'
                        : '#64748b',
                      marginTop: '6px',
                      fontWeight: isCurrentMonth ? '800' : '600',
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

      {/* 4. TIER 3: LISTS */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
      >
        {/* Hot Products */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: 'var(--brand-primary)' }}>
                <FlameIcon />
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                Top Hot Products
              </h4>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                fontWeight: '600',
              }}
            >
              By Revenue
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hotProducts.length === 0 ? (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  padding: '20px 0',
                  textAlign: 'center',
                }}
              >
                No product sales logged.
              </div>
            ) : (
              hotProducts.slice(0, 5).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-hover)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {idx + 1}. {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Qty: {p.total_sold} units
                    </div>
                  </div>
                  <div
                    className="monospace"
                    style={{
                      fontWeight: '800',
                      color: 'var(--brand-primary)',
                      fontSize: '0.85rem',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Rs. {(p.revenue || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Restock Alerts */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: 'var(--danger)' }}>
                <AlertIcon />
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  color: 'var(--danger)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                Urgent Restock
              </h4>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--danger)',
                fontWeight: 'bold',
                background: '#fee2e2',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {restockItems.length} Low
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '210px',
              overflowY: 'auto',
            }}
          >
            {restockItems.length === 0 ? (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--success)',
                  padding: '20px 0',
                  textAlign: 'center',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  fontWeight: '600',
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
                    background: '#fef2f2',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    borderLeft: '4px solid var(--danger)',
                    border: '1px solid #fee2e2',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        color: '#991b1b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>
                      Remaining: {item.stock_qty} {item.unit || 'pcs'}
                    </div>
                  </div>
                  <span
                    style={{
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
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
