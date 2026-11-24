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

const EditIcon = () => (
  <svg {...iconBase}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg {...iconBase}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconBase} width={18} height={18}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = () => (
  <svg {...iconBase} width={14} height={14}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Primitives & Stream Styling Helpers
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
  width: '100%',
  boxSizing: 'border-box',
};

const getStreamBadgeStyle = (stream) => {
  switch (stream) {
    case 'SALE':
      return {
        background: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--ink-success, #10b981)',
        border: '1px solid rgba(16, 185, 129, 0.28)',
      };
    case 'EXPENSE':
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        color: 'var(--ink-danger, #ef4444)',
        border: '1px solid rgba(239, 68, 68, 0.28)',
      };
    case 'RECEIVABLE':
      return {
        background: 'rgba(14, 165, 233, 0.12)',
        color: '#0ea5e9',
        border: '1px solid rgba(14, 165, 233, 0.28)',
      };
    case 'PAYABLE':
      return {
        background: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.28)',
      };
    case 'AUDIT':
      return {
        background: 'rgba(168, 85, 247, 0.12)',
        color: '#a855f7',
        border: '1px solid rgba(168, 85, 247, 0.28)',
      };
    default:
      return {
        background: 'var(--ink-0)',
        color: 'var(--ink-fg-2)',
        border: '1px solid var(--ink-3)',
      };
  }
};

export default function MasterLedger({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [filterStream, setFilterStream] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  // Modal & Transaction Card States
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    entity_name: '',
    description: '',
    stream: 'EXPENSE',
    debit: 0,
    credit: 0,
    transaction_date: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMasterLedger = async () => {
    try {
      const ipc = getIpc();
      if (ipc) {
        const data = await ipc.invoke('get-master-general-ledger');
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Failed to load master ledger:', err);
      showToast('Failed to refresh ledger entries.', 'error');
    }
  };

  useEffect(() => {
    loadMasterLedger();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedEntry) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntry]);

  // Filter logic
  const filteredEntries = entries.filter((entry) => {
    const matchesStream =
      filterStream === 'ALL' || entry.stream === filterStream;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(q) ||
      (entry.entity_name || '').toLowerCase().includes(q) ||
      (entry.description || '').toLowerCase().includes(q) ||
      (entry.user_name || '').toLowerCase().includes(q);

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
    (sum, e) => sum + (Number(e.debit) || 0),
    0,
  );
  const totalCredits = filteredEntries.reduce(
    (sum, e) => sum + (Number(e.credit) || 0),
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

  // Open Detail Card Modal
  const openEntryModal = (entry, idx) => {
    const resolvedTitle =
      entry.title ||
      entry.description ||
      entry.entity_name ||
      `${entry.stream} Transaction`;

    setSelectedEntry({ ...entry, _rowIndex: idx, resolvedTitle });
    setEditForm({
      title: entry.title || entry.description || '',
      entity_name: entry.entity_name || '',
      description: entry.description || '',
      stream: entry.stream || 'EXPENSE',
      debit: Number(entry.debit) || 0,
      credit: Number(entry.credit) || 0,
      transaction_date: entry.transaction_date
        ? entry.transaction_date.substring(0, 16)
        : '',
    });
    setIsEditing(false);
    setConfirmDelete(false);
  };

  const closeModal = () => {
    setSelectedEntry(null);
    setIsEditing(false);
    setConfirmDelete(false);
  };

  // Save Edited Transaction
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedEntry) return;
    setIsSaving(true);

    const updatedPayload = {
      ...selectedEntry,
      title: editForm.title.trim(),
      entity_name: editForm.entity_name.trim() || 'General',
      description: editForm.description.trim() || editForm.title.trim(),
      stream: editForm.stream,
      debit: parseFloat(editForm.debit) || 0,
      credit: parseFloat(editForm.credit) || 0,
      transaction_date: editForm.transaction_date
        ? editForm.transaction_date.replace('T', ' ')
        : selectedEntry.transaction_date,
    };

    try {
      const ipc = getIpc();
      if (ipc) {
        try {
          await ipc.invoke('update-master-ledger-entry', updatedPayload);
        } catch (ipcErr) {
          console.warn(
            'IPC update-master-ledger-entry fallback to local state:',
            ipcErr,
          );
        }
      }

      setEntries((prev) =>
        prev.map((item, i) =>
          (selectedEntry.id && item.id === selectedEntry.id) ||
          i === selectedEntry._rowIndex
            ? updatedPayload
            : item,
        ),
      );

      setSelectedEntry({
        ...updatedPayload,
        resolvedTitle:
          updatedPayload.title ||
          updatedPayload.description ||
          updatedPayload.entity_name,
      });
      setIsEditing(false);
      showToast('Transaction updated successfully.');
    } catch (err) {
      showToast('Could not update transaction: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Transaction
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    setIsSaving(true);

    try {
      const ipc = getIpc();
      if (ipc) {
        try {
          await ipc.invoke('delete-master-ledger-entry', {
            id: selectedEntry.id,
            stream: selectedEntry.stream,
            reference_id: selectedEntry.reference_id,
          });
        } catch (ipcErr) {
          console.warn(
            'IPC delete-master-ledger-entry fallback to local state:',
            ipcErr,
          );
        }
      }

      setEntries((prev) =>
        prev.filter((item, i) =>
          selectedEntry.id
            ? item.id !== selectedEntry.id
            : i !== selectedEntry._rowIndex,
        ),
      );
      closeModal();
      showToast('Transaction deleted from ledger.');
    } catch (err) {
      showToast('Failed to delete transaction: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      const ipc = getIpc();
      if (!ipc) return;

      const rowsHtml = filteredEntries
        .map((e) => {
          const dateStr = e.transaction_date
            ? e.transaction_date.substring(0, 16).replace('T', ' ')
            : '';
          const debitStr =
            e.debit > 0 ? `Rs. ${Number(e.debit).toLocaleString()}` : '-';
          const creditStr =
            e.credit > 0 ? `Rs. ${Number(e.credit).toLocaleString()}` : '-';
          const txTitle = e.title || e.description || '—';

          return `
          <tr>
            <td>${dateStr}</td>
            <td><span class="badge badge-${(e.stream || '').toLowerCase()}">${e.stream}</span></td>
            <td class="bold">${e.entity_name || 'N/A'}</td>
            <td>${txTitle}</td>
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
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; }
              .title-area h1 { margin: 0; color: #1e3a8a; font-size: 18px; text-transform: uppercase; }
              .title-area p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
              td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .color-red { color: #dc2626; }
              .color-green { color: #16a34a; }
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
                  <th>Transaction / Description</th>
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
      if (res.success && !res.canceled) {
        showToast('PDF exported successfully!');
      } else if (!res.canceled) {
        showToast('PDF Export failed: ' + res.error, 'error');
      }
    } catch (err) {
      showToast('PDF Export failed: ' + err.message, 'error');
    }
  };

  // Wider, cleaner column template emphasizing Transaction Title & Party readability
  const unifiedGridTemplate = '1.15fr 0.85fr 2.4fr 1.15fr 1fr 1fr 0.4fr';

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
        position: 'relative',
      }}
    >
      {/* NON-BLOCKING TOAST NOTIFICATION */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            padding: '10px 16px',
            borderRadius: '8px',
            background:
              toast.type === 'error'
                ? 'var(--ink-danger, #ef4444)'
                : 'var(--ink-success, #10b981)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

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
              placeholder="Search title, party, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '34px',
                width: '215px',
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
            gap: '12px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'var(--ink-1)',
            color: 'var(--ink-fg-2)',
            padding: '10px 14px',
            borderRadius: '6px',
            borderBottom: '1px solid var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          <span>Date & Operator</span>
          <span>Stream</span>
          <span>Transaction Name / Details</span>
          <span>Entity / Party</span>
          <span style={{ textAlign: 'right' }}>Debit (Out)</span>
          <span style={{ textAlign: 'right' }}>Credit (In)</span>
          <span style={{ textAlign: 'center' }}></span>
        </div>

        {/* TABLE ROWS */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '8px',
            paddingRight: '2px',
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
            filteredEntries.map((entry, idx) => {
              const isHovered = hoveredRow === idx;
              const primaryTitle =
                entry.title ||
                entry.description ||
                entry.entity_name ||
                `${entry.stream} Entry`;
              const subNote =
                entry.title &&
                entry.description &&
                entry.title !== entry.description
                  ? entry.description
                  : null;

              const dateFormatted = entry.transaction_date
                ? entry.transaction_date.replace('T', ' ').substring(0, 16)
                : '—';

              return (
                <div
                  key={entry.id || idx}
                  onClick={() => openEntryModal(entry, idx)}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEntryModal(entry, idx);
                    }
                  }}
                  title="Click to inspect, edit, or delete transaction"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: unifiedGridTemplate,
                    gap: '12px',
                    fontSize: '0.78rem',
                    alignItems: 'center',
                    background: isHovered
                      ? 'var(--ink-2, var(--ink-0))'
                      : 'var(--ink-1)',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: isHovered
                      ? '1px solid var(--brand-primary)'
                      : '1px solid var(--ink-3)',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    transform: isHovered ? 'translateY(-1px)' : 'none',
                  }}
                >
                  {/* Timestamp & Operator */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.73rem',
                        color: 'var(--ink-fg)',
                        fontWeight: 500,
                      }}
                    >
                      {dateFormatted}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      by {entry.user_name || 'Manager'}
                    </span>
                  </div>

                  {/* Stream Pill */}
                  <div>
                    <span
                      style={{
                        ...getStreamBadgeStyle(entry.stream),
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        display: 'inline-block',
                      }}
                    >
                      {entry.stream}
                    </span>
                  </div>

                  {/* Prominent Transaction Name & Subtitle */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        color: 'var(--ink-fg)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                    >
                      {primaryTitle}
                    </span>
                    {subNote && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--ink-fg-3)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {subNote}
                      </span>
                    )}
                  </div>

                  {/* Entity / Party */}
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '0.76rem',
                      color: 'var(--ink-fg-2)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.entity_name || 'General'}
                  </span>

                  {/* Debit */}
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      color:
                        entry.debit > 0
                          ? 'var(--ink-danger)'
                          : 'var(--ink-fg-3)',
                      fontWeight: entry.debit > 0 ? 600 : 'normal',
                      fontSize: '0.8rem',
                    }}
                  >
                    {entry.debit > 0
                      ? `Rs. ${Number(entry.debit).toLocaleString()}`
                      : '—'}
                  </span>

                  {/* Credit */}
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      color:
                        entry.credit > 0
                          ? 'var(--ink-success)'
                          : 'var(--ink-fg-3)',
                      fontWeight: entry.credit > 0 ? 600 : 'normal',
                      fontSize: '0.8rem',
                    }}
                  >
                    {entry.credit > 0
                      ? `Rs. ${Number(entry.credit).toLocaleString()}`
                      : '—'}
                  </span>

                  {/* Subtle Inspect Cue */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: isHovered
                        ? 'var(--brand-primary)'
                        : 'var(--ink-fg-3)',
                      opacity: isHovered ? 1 : 0.55,
                    }}
                  >
                    <EyeIcon />
                  </div>
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
            entries • Click any row to view details, edit, or delete
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

      {/* ─────────────────────────────────────────────────────────────
          TRANSACTION DETAIL / EDIT / DELETE MODAL CARD
      ───────────────────────────────────────────────────────────── */}
      {selectedEntry && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1500,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'var(--ink-0)',
              borderRadius: '14px',
              border: '1px solid var(--ink-3)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* CARD HEADER */}
            <div
              style={{
                padding: '18px 22px',
                background: 'var(--ink-1)',
                borderBottom: '1px solid var(--ink-3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    style={{
                      ...getStreamBadgeStyle(selectedEntry.stream),
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    {selectedEntry.stream}
                  </span>
                  {selectedEntry.id && (
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      #{selectedEntry.id}
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    fontWeight: 600,
                    color: 'var(--ink-fg)',
                    lineHeight: 1.35,
                  }}
                >
                  {isEditing ? 'Edit Transaction' : selectedEntry.resolvedTitle}
                </h3>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
                style={{
                  background: 'var(--ink-0)',
                  border: '1px solid var(--ink-3)',
                  color: 'var(--ink-fg-2)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* CARD BODY: VIEW MODE VS EDIT MODE */}
            {!isEditing ? (
              <div
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                {/* AMOUNT HIGHLIGHT BANNER */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: 'var(--ink-1)',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'var(--ink-fg-3)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Debit (Outflow)
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        color:
                          selectedEntry.debit > 0
                            ? 'var(--ink-danger)'
                            : 'var(--ink-fg-3)',
                      }}
                    >
                      {selectedEntry.debit > 0
                        ? `Rs. ${Number(selectedEntry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : 'Rs. 0.00'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: 'var(--ink-1)',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'var(--ink-fg-3)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Credit (Inflow)
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        color:
                          selectedEntry.credit > 0
                            ? 'var(--ink-success)'
                            : 'var(--ink-fg-3)',
                      }}
                    >
                      {selectedEntry.credit > 0
                        ? `Rs. ${Number(selectedEntry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : 'Rs. 0.00'}
                    </div>
                  </div>
                </div>

                {/* METADATA DETAILS GRID */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginBottom: '3px',
                      }}
                    >
                      Entity / Party
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-fg)' }}>
                      {selectedEntry.entity_name || 'General'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginBottom: '3px',
                      }}
                    >
                      Recorded By
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--ink-fg)' }}>
                      {selectedEntry.user_name || 'Manager'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginBottom: '3px',
                      }}
                    >
                      Date & Time
                    </div>
                    <div
                      className="monospace"
                      style={{ fontWeight: 500, color: 'var(--ink-fg)' }}
                    >
                      {selectedEntry.transaction_date
                        ? selectedEntry.transaction_date
                            .replace('T', ' ')
                            .substring(0, 19)
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginBottom: '3px',
                      }}
                    >
                      Reference / Module
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--ink-fg)' }}>
                      {selectedEntry.reference_id || selectedEntry.stream}
                    </div>
                  </div>
                </div>

                {/* FULL DESCRIPTION / NOTES */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--ink-fg-3)',
                      marginBottom: '6px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Full Description / Notes
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      color: 'var(--ink-fg)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {selectedEntry.description ||
                      selectedEntry.title ||
                      'No additional notes recorded for this transaction.'}
                  </p>
                </div>

                {/* INLINE DELETE CONFIRMATION BAR */}
                {confirmDelete && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--ink-danger)',
                        fontWeight: 500,
                      }}
                    >
                      Permanently delete this transaction?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--ink-3)',
                          background: 'var(--ink-0)',
                          color: 'var(--ink-fg)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleDeleteEntry}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--ink-danger, #ef4444)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isSaving ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}

                {/* CARD FOOTER ACTIONS */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--ink-3)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '7px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--ink-danger, #ef4444)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <TrashIcon /> Delete
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '7px',
                        border: '1px solid var(--ink-3)',
                        background: 'var(--ink-1)',
                        color: 'var(--ink-fg)',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '7px',
                        border: 'none',
                        background: 'var(--brand-primary)',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <EditIcon /> Edit Transaction
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE FORM */
              <form
                onSubmit={handleSaveEdit}
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      color: 'var(--ink-fg-2)',
                      marginBottom: '5px',
                    }}
                  >
                    Transaction Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="e.g. Shop Electricity Bill, Wholesale Stock Purchase"
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        color: 'var(--ink-fg-2)',
                        marginBottom: '5px',
                      }}
                    >
                      Entity / Party
                    </label>
                    <input
                      type="text"
                      value={editForm.entity_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          entity_name: e.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        color: 'var(--ink-fg-2)',
                        marginBottom: '5px',
                      }}
                    >
                      Stream Type
                    </label>
                    <select
                      value={editForm.stream}
                      onChange={(e) =>
                        setEditForm({ ...editForm, stream: e.target.value })
                      }
                      style={inputStyle}
                    >
                      <option value="SALE">SALE</option>
                      <option value="EXPENSE">EXPENSE</option>
                      <option value="RECEIVABLE">RECEIVABLE</option>
                      <option value="PAYABLE">PAYABLE</option>
                      <option value="AUDIT">AUDIT</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        color: 'var(--ink-danger)',
                        marginBottom: '5px',
                      }}
                    >
                      Debit (Outflow Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.debit}
                      onChange={(e) =>
                        setEditForm({ ...editForm, debit: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        color: 'var(--ink-success)',
                        marginBottom: '5px',
                      }}
                    >
                      Credit (Inflow Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.credit}
                      onChange={(e) =>
                        setEditForm({ ...editForm, credit: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      color: 'var(--ink-fg-2)',
                      marginBottom: '5px',
                    }}
                  >
                    Detailed Notes / Description
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--ink-3)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '7px',
                      border: '1px solid var(--ink-3)',
                      background: 'var(--ink-1)',
                      color: 'var(--ink-fg)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '7px',
                      border: 'none',
                      background: 'var(--brand-primary)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
