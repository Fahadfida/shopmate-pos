import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1, // 👈 ADD THIS
        height: '100%',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Master General Ledger
          </h3>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              margin: '2px 0 0 0',
            }}
          >
            Consolidated chronological audit feed across all modules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            style={{
              fontSize: '0.75rem',
              padding: '8px 14px',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={handleExportPDF}
          >
            📥 Export PDF
          </button>
          <button
            className="btn"
            style={{
              fontSize: '0.75rem',
              padding: '8px 14px',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              cursor: 'pointer',
            }}
            onClick={loadMasterLedger}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--danger)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--danger)',
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Total Outflows (Debits)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--danger)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs.{' '}
            {totalDebits.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--success)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--success)',
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Total Inflows (Credits)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--success)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs.{' '}
            {totalCredits.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: `1.5px solid ${netCashImpact >= 0 ? 'var(--brand-primary)' : 'var(--danger)'}`,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color:
                netCashImpact >= 0 ? 'var(--brand-primary)' : 'var(--danger)',
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Net Cash Impact
          </div>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color:
                netCashImpact >= 0 ? 'var(--brand-primary)' : 'var(--danger)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs.{' '}
            {netCashImpact.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
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
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                background:
                  filterStream === pill.id ? 'var(--brand-primary)' : '#f1f5f9',
                color: filterStream === pill.id ? '#fff' : '#64748b',
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
              gap: '6px',
              background: 'var(--bg-hover)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
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
                color: '#475569',
                outline: 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
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
                color: '#475569',
                outline: 'none',
              }}
            />
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search entity, note, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              margin: 0,
              padding: '8px 12px',
              fontSize: '0.75rem',
              width: '220px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
            }}
          />
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
                background: '#fee2e2',
                color: 'var(--danger)',
                border: 'none',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div
        className="card"
        style={{
          flex: 1,
          background: 'var(--bg-card)',
          padding: '16px',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1.5px solid var(--border-color)',
        }}
      >
        {/* TABLE HEADER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1.2fr 2fr 1fr 1fr 1fr',
            fontSize: '0.7rem',
            fontWeight: '700',
            background: 'var(--brand-primary)',
            color: '#fff',
            padding: '12px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
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
            gap: '2px',
            marginTop: '4px',
          }}
        >
          {filteredEntries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '50px 0',
                fontSize: '0.85rem',
              }}
            >
              No master ledger transactions found matching your criteria.
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              let badgeBg = '#e2e8f0',
                badgeColor = '#334155';
              if (entry.stream === 'SALE') {
                badgeBg = '#d1fae5';
                badgeColor = '#065f46';
              } else if (entry.stream === 'EXPENSE') {
                badgeBg = '#fee2e2';
                badgeColor = '#991b1b';
              } else if (entry.stream === 'RECEIVABLE') {
                badgeBg = '#e0f2fe';
                badgeColor = '#0369a1';
              } else if (entry.stream === 'PAYABLE') {
                badgeBg = '#fef3c7';
                badgeColor = '#d97706';
              } else if (entry.stream === 'AUDIT') {
                badgeBg = '#f3e8ff';
                badgeColor = '#6b21a8';
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1.2fr 2fr 1fr 1fr 1fr',
                    fontSize: '0.78rem',
                    alignItems: 'center',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {entry.transaction_date
                      ? entry.transaction_date
                          .replace('T', ' ')
                          .substring(0, 19)
                      : ''}
                  </span>
                  <div>
                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {entry.stream}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.entity_name || 'General'}
                  </span>
                  <span
                    style={{
                      color: '#475569',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.description}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: entry.debit > 0 ? 'var(--danger)' : '#94a3b8',
                      fontWeight: entry.debit > 0 ? 'bold' : 'normal',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {entry.debit > 0
                      ? `Rs. ${entry.debit.toLocaleString()}`
                      : '—'}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: entry.credit > 0 ? 'var(--success)' : '#94a3b8',
                      fontWeight: entry.credit > 0 ? 'bold' : 'normal',
                      fontFamily: "'JetBrains Mono', monospace",
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
                      color: 'var(--text-secondary)',
                      fontWeight: '600',
                    }}
                  >
                    {entry.user_name || 'Manager'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1.5px solid #e2e8f0',
            paddingTop: '12px',
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontWeight: '600',
          }}
        >
          <span>
            Showing {filteredEntries.length} of {entries.length} audit feed
            entries
          </span>
          <div style={{ display: 'flex', gap: '15px', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--danger)' }}>
              Outflows: Rs. {totalDebits.toLocaleString()}
            </span>
            <span style={{ color: 'var(--success)' }}>
              Inflows: Rs. {totalCredits.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
