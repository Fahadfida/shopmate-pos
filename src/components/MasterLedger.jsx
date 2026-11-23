import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px/18px 1.5 stroke)
// ─────────────────────────────────────────────────────────────
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

const SearchIcon = () => (
  <svg {...iconBase}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CalendarIcon = () => (
  <svg {...iconBase}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RefreshIcon = () => (
  <svg {...iconBase}>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconBase}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
const inputStyle = {
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  fontSize: '0.82rem',
  outline: 'none',
  fontFamily: 'inherit',
};

export default function MasterLedger({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [filterStream, setFilterStream] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadMasterLedger = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-master-general-ledger');
      setEntries(data || []);
    }
  };

  useEffect(() => {
    loadMasterLedger();
  }, []);

  // Filter logic
  const filteredEntries = entries.filter((entry) => {
    const matchesStream =
      filterStream === 'ALL' || entry.stream === filterStream;
    const matchesSearch =
      (entry.entity_name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (entry.description || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (entry.user_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    const entryDate = entry.transaction_date
      ? entry.transaction_date.substring(0, 10)
      : '';
    if (startDate && entryDate < startDate) matchesDate = false;
    if (endDate && entryDate > endDate) matchesDate = false;

    return matchesStream && matchesSearch && matchesDate;
  });

  // Calculate aggregates
  const totalDebits = filteredEntries.reduce(
    (sum, e) => sum + (e.debit || 0),
    0,
  );
  const totalCredits = filteredEntries.reduce(
    (sum, e) => sum + (e.credit || 0),
    0,
  );
  const netCashImpact = totalCredits - totalDebits;

  // Stream counts
  const countSales = entries.filter((e) => e.stream === 'SALE').length;
  const countExpenses = entries.filter((e) => e.stream === 'EXPENSE').length;
  const countReceivables = entries.filter(
    (e) => e.stream === 'RECEIVABLE',
  ).length;
  const countPayables = entries.filter((e) => e.stream === 'PAYABLE').length;
  const countAudit = entries.filter((e) => e.stream === 'AUDIT').length;

  // Export PDF
  const handleExportPDF = async () => {
    const ipc = getIpc();
    if (!ipc) return;

    const rowsHtml = filteredEntries
      .map((e) => {
        const dateStr = e.transaction_date
          ? e.transaction_date.substring(0, 16).replace('T', ' ')
          : '';
        const debitStr = e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-';
        const creditStr =
          e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-';

        return `
        <tr>
          <td>${dateStr}</td>
          <td><span class="badge badge-${e.stream.toLowerCase()}">${e.stream}</span></td>
          <td class="bold">${e.entity_name || 'N/A'}</td>
          <td>${e.description || ''}</td>
          <td class="right color-red">${debitStr}</td>
          <td class="right color-green">${creditStr}</td>
          <td>${e.user_name || 'Manager'}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Master General Ledger</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #0f172a; background: #fff; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 18px; }
            .title-area h1 { margin: 0; color: var(--brand-primary); font-size: 18px; text-transform: uppercase; }
            .title-area p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .color-red { color: var(--danger); }
            .color-green { color: var(--success); }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
            .badge-sale { background: #d1fae5; color: #065f46; }
            .badge-expense { background: #fee2e2; color: #991b1b; }
            .badge-receivable { background: #e0f2fe; color: #0369a1; }
            .badge-payable { background: #fef3c7; color: #d97706; }
            .badge-audit { background: #f3e8ff; color: #6b21a8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>Master General Ledger & Audit Feed</h1>
              <p>ShopMate Enterprise Accounting Suite</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: bold; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operator: ${currentUser?.username || 'Manager'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Stream Type</th>
                <th>Entity / Party</th>
                <th>Description</th>
                <th class="right">Debit (Out)</th>
                <th class="right">Credit (In)</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const res = await ipc.invoke('export-ledger-pdf', html);
    if (res.success && !res.canceled) alert('PDF exported successfully!');
    else if (!res.canceled) alert('PDF Export failed: ' + res.error);
  };

  const unifiedGridTemplate = '1.2fr 1fr 1.2fr 2fr 1fr 1fr 1fr';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
      {/* HEADER */}
      {/* <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--ink-0)',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--ink-fg)',
              fontSize: '1.05rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Master General Ledger
          </h3>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              margin: '2px 0 0 0',
            }}
          >
            Consolidated chronological audit feed across all modules.
          </p>
        </div>
        
      </div> */}

      {/* KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--ink-0)',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--ink-danger)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Total Outflows (Debits)
            </div>
            <div
              className="monospace tabular"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '6px',
              }}
            >
              Rs.{' '}
              {totalDebits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of all debit operations
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--ink-0)',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--ink-success)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Total Inflows (Credits)
            </div>
            <div
              className="monospace tabular"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '6px',
              }}
            >
              Rs.{' '}
              {totalCredits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of all credit operations
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--ink-0)',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                color:
                  netCashImpact >= 0
                    ? 'var(--ink-success)'
                    : 'var(--ink-danger)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Net Cash Impact
            </div>
            <div
              className="monospace tabular"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color:
                  netCashImpact >= 0
                    ? 'var(--ink-success)'
                    : 'var(--ink-danger)',
                marginTop: '6px',
              }}
            >
              Rs.{' '}
              {netCashImpact.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Credits minus Debits balance
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
        style={{
          background: 'var(--ink-0)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* STREAM PILLS */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${entries.length})` },
            { id: 'SALE', label: `Revenue (${countSales})` },
            { id: 'EXPENSE', label: `Expenses (${countExpenses})` },
            { id: 'RECEIVABLE', label: `Khata (${countReceivables})` },
            { id: 'PAYABLE', label: `Payables (${countPayables})` },
            { id: 'AUDIT', label: `Audit (${countAudit})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterStream(pill.id)}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                border: '1px solid var(--ink-3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                background:
                  filterStream === pill.id
                    ? 'var(--brand-primary)'
                    : 'var(--ink-1)',
                color: filterStream === pill.id ? '#fff' : 'var(--ink-fg-2)',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* DATE & SEARCH */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--ink-1)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <CalendarIcon />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--ink-fg-2)',
              }}
            >
              From:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: 'none',
                fontSize: '0.75rem',
                background: 'transparent',
                color: 'var(--ink-fg)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--ink-fg-2)',
                marginLeft: '8px',
              }}
            >
              To:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: 'none',
                fontSize: '0.75rem',
                background: 'transparent',
                color: 'var(--ink-fg)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            />
          </div>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--ink-fg-3)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search entity, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '34px',
                width: '200px',
              }}
            />
          </div>
          {(startDate || endDate || searchQuery || filterStream !== 'ALL') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setFilterStream('ALL');
              }}
              style={{
                fontSize: '0.75rem',
                padding: '8px 12px',
                background: 'var(--ink-1)',
                color: 'var(--ink-danger)',
                border: '1px solid var(--ink-3)',
                fontWeight: 500,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ✕ Reset
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                fontSize: '0.78rem',
                padding: '7px 14px',
                background: 'var(--brand-primary)',
                color: '#fff',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={handleExportPDF}
            >
              <DownloadIcon /> Export PDF
            </button>
            <button
              style={{
                fontSize: '0.78rem',
                padding: '7px 14px',
                background: 'var(--ink-1)',
                color: 'var(--ink-fg)',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--ink-3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={loadMasterLedger}
            >
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div
        style={{
          flex: 1,
          background: 'var(--ink-0)',
          padding: '16px',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--ink-3)',
        }}
      >
        {/* TABLE HEADER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: unifiedGridTemplate,
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'var(--ink-1)',
            color: 'var(--ink-fg-2)',
            padding: '10px 12px',
            borderRadius: '6px',
            borderBottom: '1px solid var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          <span>Timestamp</span>
          <span>Stream</span>
          <span>Entity / Party</span>
          <span>Description</span>
          <span style={{ textAlign: 'right' }}>Debit (Out)</span>
          <span style={{ textAlign: 'right' }}>Credit (In)</span>
          <span style={{ textAlign: 'center' }}>Operator</span>
        </div>

        {/* TABLE ROWS */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '6px',
          }}
        >
          {filteredEntries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--ink-fg-3)',
                padding: '50px 0',
                fontSize: '0.8rem',
              }}
            >
              No master ledger transactions found matching your criteria.
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.75rem',
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  {entry.transaction_date
                    ? entry.transaction_date.replace('T', ' ').substring(0, 19)
                    : ''}
                </span>
                <div>
                  <span
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg-2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    {entry.stream}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.entity_name || 'General'}
                </span>
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.description}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color:
                      entry.debit > 0 ? 'var(--ink-danger)' : 'var(--ink-fg-3)',
                    fontWeight: entry.debit > 0 ? 600 : 'normal',
                  }}
                >
                  {entry.debit > 0
                    ? `Rs. ${entry.debit.toLocaleString()}`
                    : '—'}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color:
                      entry.credit > 0
                        ? 'var(--ink-success)'
                        : 'var(--ink-fg-3)',
                    fontWeight: entry.credit > 0 ? 600 : 'normal',
                  }}
                >
                  {entry.credit > 0
                    ? `Rs. ${entry.credit.toLocaleString()}`
                    : '—'}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--ink-fg-3)',
                    fontWeight: 500,
                  }}
                >
                  {entry.user_name || 'Manager'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--ink-3)',
            paddingTop: '12px',
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--ink-fg-3)',
            fontWeight: 500,
          }}
        >
          <span>
            Showing {filteredEntries.length} of {entries.length} audit feed
            entries
          </span>
          <div style={{ display: 'flex', gap: '15px', fontWeight: 600 }}>
            <span style={{ color: 'var(--ink-danger)' }}>
              Outflows: Rs. {totalDebits.toLocaleString()}
            </span>
            <span style={{ color: 'var(--ink-success)' }}>
              Inflows: Rs. {totalCredits.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
