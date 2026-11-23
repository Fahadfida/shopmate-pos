import React, { useState, useEffect, useId } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px 1.5 stroke)
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

const UserIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CreditCardIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const CalendarIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg {...iconBase} width={14} height={14} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RefreshIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PlusIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Typography & Primitive Tokens
// ─────────────────────────────────────────────────────────────
const sansFamily = {
  fontFamily: 'var(--font-sans)',
};

const typeScale = {
  sectionTitle: {
    ...sansFamily,
    fontSize: '0.9375rem', // 15px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    ...sansFamily,
    fontSize: '0.875rem', // 14px
    fontWeight: 400,
    lineHeight: 1.45,
  },
  label: {
    ...sansFamily,
    fontSize: '0.8125rem', // 13px
    fontWeight: 500,
    lineHeight: 1.35,
  },
  helper: {
    ...sansFamily,
    fontSize: '0.8125rem', // 13px
    fontWeight: 400,
    lineHeight: 1.4,
  },
  control: {
    ...sansFamily,
    fontSize: '0.8125rem', // 13px
    fontWeight: 500,
    lineHeight: 1.3,
  },
  badge: {
    ...sansFamily,
    fontSize: '0.75rem', // 12px
    fontWeight: 600,
    lineHeight: 1.2,
  },
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div
      role="status"
      style={{
        ...typeScale.control,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--ink-0)',
        border: '1px solid var(--ink-3)',
        borderLeft: `4px solid ${isError ? 'var(--ink-danger)' : 'var(--ink-success)'}`,
        color: 'var(--ink-fg)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '280px',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-fg-2)',
          display: 'flex',
          padding: 0,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

const Field = ({ label, htmlFor, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label
      htmlFor={htmlFor}
      style={{
        ...typeScale.label,
        color: 'var(--ink-fg-2)',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  ...typeScale.body,
  minHeight: '38px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  width: '100%',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function FinancialLedger({ currentUser }) {
  const expenseCategoryId = useId();
  const expenseAmountId = useId();
  const expenseDescId = useId();

  const [ledgerData, setLedgerData] = useState({
    expenses: [],
    purchases: [],
    sales: [],
    refunds: [],
    summary: {
      totalSales: 0,
      totalExpenses: 0,
      totalPurchases: 0,
      totalRefunds: 0,
      netCashFlow: 0,
    },
  });
  const [totalSupplierPayables, setTotalSupplierPayables] = useState(0);
  const [activeTab, setActiveTab] = useState('SALES');
  const [users, setUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Rent',
    amount: '',
    description: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    total_amount: '',
    payment_type: 'CASH',
    category: '',
    amount: '',
    description: '',
    qty_received: '',
    unit_cost: '',
    qty: '',
    amount_refunded: '',
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadFinancials = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-financial-ledger', {
        startDate,
        endDate,
        user_id: selectedUser ? parseInt(selectedUser, 10) : null,
        payment_type: paymentType,
        sortBy,
      });
      const fetchedUsers = await ipc.invoke('get-users');
      const suppliers = await ipc.invoke('get-suppliers', true);
      const payablesSum = (suppliers || []).reduce(
        (acc, s) => acc + (s.balance > 0 ? s.balance : 0),
        0,
      );

      setLedgerData(
        data || {
          expenses: [],
          purchases: [],
          sales: [],
          refunds: [],
          summary: {},
        },
      );
      setUsers(fetchedUsers || []);
      setTotalSupplierPayables(payablesSum);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [startDate, endDate, selectedUser, paymentType, sortBy]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUser('');
    setPaymentType('');
    setSortBy('date_desc');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(expenseForm.amount);
    if (!amt || amt <= 0)
      return addToast('Enter a valid expense amount.', 'error');

    if (ipc) {
      const res = await ipc.invoke('add-expense', {
        expense: expenseForm,
        currentUser,
      });
      if (res.success) {
        setIsExpenseModalOpen(false);
        setExpenseForm({ category: 'Rent', amount: '', description: '' });
        loadFinancials();
        addToast('Expense recorded successfully.', 'success');
      } else {
        addToast('Error recording expense: ' + res.error, 'error');
      }
    }
  };

  const handleDeleteRecord = async (id, type) => {
    if (currentUser?.role?.toUpperCase() !== 'ADMIN')
      return addToast(
        'Access Denied: Only Manager (Admin) profiles can delete financial records.',
        'error',
      );
    if (
      !window.confirm(
        `Are you sure you want to delete this ${type.toLowerCase()} record?`,
      )
    )
      return;

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-ledger-entry', {
        type,
        id,
        currentUser,
      });
      if (res.success) {
        addToast('Record deleted successfully.', 'success');
        loadFinancials();
      } else {
        addToast('Failed to delete record: ' + res.error, 'error');
      }
    }
  };

  const openEditModal = (record, type) => {
    if (currentUser?.role?.toUpperCase() !== 'ADMIN')
      return addToast(
        'Access Denied: Only Managers (Admin) can edit ledger records.',
        'error',
      );
    setEditingRecord({ ...record, type });
    setEditForm({
      total_amount: record.total_amount || record.invoice_total || '',
      payment_type: record.payment_type || 'CASH',
      category: record.category || record.item_name || '',
      amount: record.amount || '',
      description: record.description || record.invoice_no || '',
      qty_received: record.qty_received || '',
      unit_cost: record.unit_cost || '',
      qty: record.qty || '',
      amount_refunded: record.amount_refunded || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc || !editingRecord) return;

    const res = await ipc.invoke('update-ledger-entry', {
      type: editingRecord.type,
      id: editingRecord.id || editingRecord.sale_id,
      data: editForm,
      currentUser,
    });

    if (res.success) {
      setIsEditModalOpen(false);
      setEditingRecord(null);
      loadFinancials();
      addToast('Ledger entry successfully updated.', 'success');
    } else {
      addToast('Update Failed: ' + res.error, 'error');
    }
  };

  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (ipc) {
      const rowsHtml =
        activeTab === 'SALES'
          ? sales
              .map(
                (s) =>
                  `<tr><td>${s.date}</td><td>#INV-${s.sale_id}</td><td>${s.customer_name || 'Walk-in'}</td><td>${s.payment_type}</td><td>${s.username || '—'}</td><td>${s.item_name || '—'}</td><td class="right">${s.qty_sold}</td><td class="right">Rs. ${s.unit_price?.toLocaleString()}</td><td class="right">Rs. ${s.total_line?.toLocaleString()}</td><td>Retail Sale Item</td></tr>`,
              )
              .join('')
          : activeTab === 'REFUNDS'
            ? refunds
                .map(
                  (r) =>
                    `<tr><td>${r.date}</td><td>REF-${r.id}</td><td>${r.customer_name || 'Walk-in'}</td><td>REFUND</td><td>${r.username || '—'}</td><td>${r.item_name || '—'}</td><td class="right">${r.qty}</td><td class="right">Rs. ${r.amount_refunded?.toLocaleString()}</td><td class="right">Rs. -${r.amount_refunded?.toLocaleString()}</td><td>Return: ${r.description || ''}</td></tr>`,
                )
                .join('')
            : activeTab === 'EXPENSES'
              ? expenses
                  .map(
                    (e) =>
                      `<tr><td>${e.date}</td><td>EXP-${e.id}</td><td>Store Expense</td><td>CASH</td><td>${e.username || '—'}</td><td>Overhead</td><td class="right">1</td><td class="right">Rs. ${e.amount?.toLocaleString()}</td><td class="right">Rs. ${e.amount?.toLocaleString()}</td><td>${e.category}: ${e.description || '—'}</td></tr>`,
                  )
                  .join('')
              : purchases
                  .map(
                    (p) =>
                      `<tr><td>${p.date}</td><td>${p.invoice_no || 'GRN'}</td><td>${p.supplier_name || 'Direct Stock'}</td><td>${p.payment_type || 'CREDIT'}</td><td>${p.username || 'Manager'}</td><td>${p.item_name}</td><td class="right">${p.qty_received}</td><td class="right">Rs. ${p.unit_cost?.toLocaleString()}</td><td class="right">Rs. ${(p.qty_received * p.unit_cost)?.toLocaleString()}</td><td>Stock Purchase</td></tr>`,
                  )
                  .join('');

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8" /><title>Financial Ledger Report - ${activeTab}</title>
        <style>@page { size: A4 landscape; margin: 10mm; } body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #0f172a; background: #fff; margin: 0; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 18px; } .title-area h1 { margin: 0; color: var(--brand-primary); font-size: 18px; text-transform: uppercase; } .title-area p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; } table { width: 100%; border-collapse: collapse; margin-top: 8px; } th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; } td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; } .right { text-align: right; }</style></head><body>
        <div class="header"><div class="title-area"><h1>Financial Ledger Statement (${activeTab})</h1><p>ShopMate Enterprise Accounting Suite</p></div><div style="text-align: right;"><p style="margin: 0; font-weight: bold; font-size: 12px;">Date: ${new Date().toLocaleDateString()}</p><p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operator: ${currentUser?.username || 'Manager'}</p></div></div>
        <table><thead><tr><th>Date</th><th>InvoiceID</th><th>Customer/Supplier</th><th>PaymentType</th><th>Operator</th><th>Item Name</th><th class="right">Qty</th><th class="right">Amount</th><th class="right">Total</th><th>Description</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled) {
        addToast(`Financial statement successfully exported to PDF`, 'success');
      } else if (!res.canceled) {
        addToast('PDF Export failed: ' + res.error, 'error');
      }
    }
  };

  const {
    summary,
    expenses = [],
    purchases = [],
    sales = [],
    refunds = [],
  } = ledgerData;

  const unifiedGridTemplate =
    '1.1fr 0.8fr 1.2fr 0.8fr 0.7fr 1.2fr 0.5fr 0.8fr 0.8fr 1.3fr 0.9fr';

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
      {/* TOAST CONTAINER */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* 5-COLUMN KPI SUMMARY CARDS (MOVED UP TO THE VERY TOP) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        {/* TOTAL RETAIL SALES */}
        <div
          style={{
            padding: '16px',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                ...typeScale.badge,
                margin: 0,
                color: 'var(--brand-primary)',
              }}
            >
              Total retail sales
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '10px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(summary.totalSales || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              ...typeScale.helper,
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of all sale invoices
          </div>
        </div>

        {/* OPERATING EXPENSES */}
        <div
          style={{
            padding: '16px',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                ...typeScale.badge,
                margin: 0,
                color: 'var(--ink-danger)',
              }}
            >
              Operating expenses
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '6px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(summary.totalExpenses || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              ...typeScale.helper,
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of all expenses logged
          </div>
        </div>

        {/* TOTAL PURCHASES */}
        <div
          style={{
            padding: '16px',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                ...typeScale.badge,
                margin: 0,
                color: 'var(--ink-fg-2)',
              }}
            >
              Total purchases (GRN)
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '6px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(summary.totalPurchases || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              ...typeScale.helper,
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of (Qty received × Unit cost)
          </div>
        </div>

        {/* SUPPLIER PAYABLES */}
        <div
          style={{
            padding: '16px',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                ...typeScale.badge,
                margin: 0,
                color: 'var(--ink-fg-2)',
              }}
            >
              Supplier payables
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                marginTop: '6px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(totalSupplierPayables || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              ...typeScale.helper,
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sum of supplier balances
          </div>
        </div>

        {/* NET CASH FLOW */}
        <div
          style={{
            padding: '16px',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                ...typeScale.badge,
                margin: 0,
                color:
                  summary.netCashFlow >= 0
                    ? 'var(--ink-success)'
                    : 'var(--ink-danger)',
              }}
            >
              Net cash flow
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color:
                  summary.netCashFlow >= 0
                    ? 'var(--ink-success)'
                    : 'var(--ink-danger)',
                marginTop: '6px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(summary.netCashFlow || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              ...typeScale.helper,
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
              marginTop: '8px',
            }}
          >
            Sales - Expenses
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR (INCLUDES ON DUTY & EXPORT PDF) */}
      <div
        style={{
          background: 'var(--ink-0)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Date Range Picker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--ink-1)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--ink-3)',
          }}
        >
          <CalendarIcon />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...typeScale.control, color: 'var(--ink-fg-2)' }}>
              From:
            </span>
            <input
              type="date"
              aria-label="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                ...typeScale.control,
                border: 'none',
                background: 'transparent',
                color: startDate ? 'var(--ink-fg)' : 'var(--ink-fg-3)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                ...typeScale.control,
                color: 'var(--ink-fg-2)',
                marginLeft: '4px',
              }}
            >
              To:
            </span>
            <input
              type="date"
              aria-label="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                ...typeScale.control,
                border: 'none',
                background: 'transparent',
                color: endDate ? 'var(--ink-fg)' : 'var(--ink-fg-3)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Dropdowns, Reset, On Duty & Export PDF */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Operator Select */}
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
                left: '12px',
                color: 'var(--ink-fg-2)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <UserIcon />
            </span>
            <select
              aria-label="Filter by operator"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '36px',
                paddingLeft: '36px',
                paddingRight: '32px',
                appearance: 'none',
              }}
            >
              <option value="">All operators</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                right: '10px',
                color: 'var(--ink-fg-3)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <ChevronDownIcon />
            </span>
          </div>

          {/* Payment Type Select */}
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
                left: '12px',
                color: 'var(--ink-fg-2)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <CreditCardIcon />
            </span>
            <select
              aria-label="Filter by payment type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '36px',
                paddingLeft: '36px',
                paddingRight: '32px',
                appearance: 'none',
              }}
            >
              <option value="">All payments</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="COD">COD</option>
            </select>
            <span
              style={{
                position: 'absolute',
                right: '10px',
                color: 'var(--ink-fg-3)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <ChevronDownIcon />
            </span>
          </div>

          {/* Sort By Select */}
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
                left: '12px',
                color: 'var(--ink-fg-2)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <CalendarIcon />
            </span>
            <select
              aria-label="Sort ledger records"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '36px',
                paddingLeft: '36px',
                paddingRight: '32px',
                appearance: 'none',
              }}
            >
              <option value="date_desc">Latest to oldest</option>
              <option value="date_asc">Oldest to latest</option>
              <option value="amount_desc">Highest to lowest amt</option>
              <option value="amount_asc">Lowest to highest amt</option>
            </select>
            <span
              style={{
                position: 'absolute',
                right: '10px',
                color: 'var(--ink-fg-3)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              <ChevronDownIcon />
            </span>
          </div>

          {/* Reset Filter Button */}
          {(startDate ||
            endDate ||
            selectedUser ||
            paymentType ||
            sortBy !== 'date_desc') && (
            <button
              type="button"
              style={{
                ...typeScale.control,
                padding: '8px 12px',
                background: 'var(--ink-1)',
                color: 'var(--ink-danger)',
                border: '1px solid var(--ink-3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onClick={clearFilters}
            >
              Reset
            </button>
          )}

          {/* ON DUTY BADGE (MOVED HERE) */}
          <div
            style={{
              ...typeScale.control,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--ink-1)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: 'var(--ink-fg)',
              border: '1px solid var(--ink-3)',
            }}
          >
            <UserIcon />
            <span>
              On Duty:{' '}
              <strong>
                {currentUser?.username || 'Manager'} (
                {currentUser?.role || 'ADMIN'})
              </strong>
            </span>
          </div>

          {/* EXPORT PDF BUTTON (MOVED HERE) */}
          <button
            type="button"
            onClick={handleExportA4PDF}
            style={{
              ...typeScale.control,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '36px',
              padding: '8px 16px',
              background: 'var(--brand-primary)',
              color: 'var(--ink-0)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 150ms ease, transform 120ms ease',
            }}
          >
            <DownloadIcon />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER & TABS */}
      <div
        style={{
          ...sansFamily,
          flex: 1,
          background: 'var(--ink-0)',
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--ink-3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid var(--ink-3)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'SALES', label: `Retail sales (${sales.length})` },
              {
                id: 'REFUNDS',
                label: `Refunds & returns (${refunds.length})`,
              },
              {
                id: 'EXPENSES',
                label: `Operating expenses (${expenses.length})`,
              },
              {
                id: 'PURCHASES',
                label: `Stock purchases (${purchases.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...typeScale.control,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--ink-3)',
                  background:
                    activeTab === tab.id
                      ? 'var(--brand-primary)'
                      : 'var(--ink-1)',
                  color:
                    activeTab === tab.id ? 'var(--ink-0)' : 'var(--ink-fg-2)',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={loadFinancials}
              style={{
                ...typeScale.control,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--ink-1)',
                border: '1px solid var(--ink-3)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--ink-fg)',
              }}
            >
              <RefreshIcon />
              <span>Refresh</span>
            </button>
            {activeTab === 'EXPENSES' && (
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                style={{
                  ...typeScale.control,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'var(--brand-primary)',
                  color: 'var(--ink-0)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <PlusIcon />
                <span>Log expense</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLE HEADER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: unifiedGridTemplate,
            ...typeScale.badge,
            background: 'var(--ink-1)',
            color: 'var(--ink-fg-2)',
            padding: '8px 8px',
            borderRadius: '8px',
            borderBottom: '1px solid var(--ink-3)',
          }}
        >
          <span>Date</span>
          <span>Invoice ID</span>
          <span>Customer</span>
          <span>Payment </span>
          <span>Operator</span>
          <span>Item name</span>
          <span>Qty</span>
          <span>Amount</span>
          <span>Total</span>
          <span>Description</span>
          <span>Actions</span>
        </div>

        {/* TABLES */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {activeTab === 'SALES' &&
            sales.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.8125rem', // 13px
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  #INV-{s.sale_id}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.customer_name || 'Walk-in'}
                </span>
                <span>
                  <span
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg-2)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    {s.payment_type}
                  </span>
                </span>
                <span style={{ color: 'var(--ink-fg-3)' }}>
                  {s.username || 'Cashier'}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.item_name}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.qty_sold}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs. {Number(s.unit_price || 0).toLocaleString()}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--ink-success)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs. {Number(s.total_line || 0).toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Retail sale item
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Edit sale #${s.sale_id}`}
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--ink-3)',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                    onClick={() => openEditModal(s, 'SALES')}
                  >
                    <EditIcon />
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      type="button"
                      aria-label={`Delete sale #${s.sale_id}`}
                      style={{
                        background: 'var(--ink-0)',
                        color: 'var(--ink-danger)',
                        border: '1px solid var(--ink-3)',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                      }}
                      onClick={() => handleDeleteRecord(s.sale_id, 'SALES')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

          {activeTab === 'REFUNDS' &&
            refunds.map((r, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.8125rem', // 13px
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: 600,
                    color: 'var(--ink-danger)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  REF-{r.id}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.customer_name || 'Walk-in'}
                </span>
                <span>
                  <span
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-danger)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    REFUND
                  </span>
                </span>
                <span style={{ color: 'var(--ink-fg-3)' }}>
                  {r.username || 'Manager'}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-danger)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.item_name || 'General return'}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.qty}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs. {Number(r.amount_refunded || 0).toLocaleString()}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--ink-danger)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  − Rs. {Number(r.amount_refunded || 0).toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.description || 'Item returned'}
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Edit refund #${r.id}`}
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--ink-3)',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                    onClick={() => openEditModal(r, 'REFUNDS')}
                  >
                    <EditIcon />
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      type="button"
                      aria-label={`Delete refund #${r.id}`}
                      style={{
                        background: 'var(--ink-0)',
                        color: 'var(--ink-danger)',
                        border: '1px solid var(--ink-3)',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                      }}
                      onClick={() => handleDeleteRecord(r.id, 'REFUNDS')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

          {activeTab === 'EXPENSES' &&
            expenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.8125rem', // 13px
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {exp.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: 600,
                    color: 'var(--ink-danger)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  EXP-{exp.id}
                </span>
                <span style={{ fontWeight: 500, color: 'var(--ink-fg)' }}>
                  Store overhead
                </span>
                <span>
                  <span
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg-2)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    CASH
                  </span>
                </span>
                <span style={{ color: 'var(--ink-fg-3)' }}>
                  {exp.username || 'Manager'}
                </span>
                <span style={{ fontWeight: 500, color: 'var(--ink-fg)' }}>
                  {exp.category}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  1
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs. {Number(exp.amount || 0).toLocaleString()}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--ink-danger)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  − Rs. {Number(exp.amount || 0).toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={exp.description}
                >
                  {exp.description || '—'}
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Edit expense #${exp.id}`}
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--ink-3)',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                    onClick={() => openEditModal(exp, 'EXPENSES')}
                  >
                    <EditIcon />
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      type="button"
                      aria-label={`Delete expense #${exp.id}`}
                      style={{
                        background: 'var(--ink-0)',
                        color: 'var(--ink-danger)',
                        border: '1px solid var(--ink-3)',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                      }}
                      onClick={() => handleDeleteRecord(exp.id, 'EXPENSES')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

          {activeTab === 'PURCHASES' &&
            purchases.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.8125rem', // 13px
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.invoice_no || `GRN-${p.id}`}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.supplier_name || 'Direct stock'}
                </span>
                <span>
                  <span
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg-2)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    {p.payment_type || 'CREDIT'}
                  </span>
                </span>
                <span style={{ color: 'var(--ink-fg-3)' }}>
                  {p.username || 'Manager'}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--ink-fg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.item_name}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.qty_received}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    color: 'var(--ink-fg-3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs. {Number(p.unit_cost || 0).toLocaleString()}
                </span>
                <span
                  className="monospace tabular"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--ink-fg)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Rs.{' '}
                  {Number(
                    (p.qty_received || 0) * (p.unit_cost || 0),
                  ).toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--ink-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Stock intake
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Edit purchase #${p.id}`}
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--ink-3)',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                    onClick={() => openEditModal(p, 'PURCHASES')}
                  >
                    <EditIcon />
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      type="button"
                      aria-label={`Delete purchase #${p.id}`}
                      style={{
                        background: 'var(--ink-0)',
                        color: 'var(--ink-danger)',
                        border: '1px solid var(--ink-3)',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                      }}
                      onClick={() => handleDeleteRecord(p.id, 'PURCHASES')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

          {((activeTab === 'SALES' && sales.length === 0) ||
            (activeTab === 'REFUNDS' && refunds.length === 0) ||
            (activeTab === 'EXPENSES' && expenses.length === 0) ||
            (activeTab === 'PURCHASES' && purchases.length === 0)) && (
            <div
              style={{
                ...typeScale.helper,
                textAlign: 'center',
                color: 'var(--ink-fg-3)',
                padding: '40px 0',
              }}
            >
              No records found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isExpenseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsExpenseModalOpen(false);
          }}
          style={{
            ...sansFamily,
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '400px',
              maxWidth: '100%',
              background: 'var(--ink-0)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <h3
              id="expense-modal-title"
              style={{
                ...typeScale.sectionTitle,
                marginTop: 0,
                color: 'var(--ink-fg)',
                marginBottom: '16px',
              }}
            >
              Record operating expense
            </h3>
            <form
              onSubmit={handleAddExpense}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <Field label="Category" htmlFor={expenseCategoryId}>
                <select
                  id={expenseCategoryId}
                  style={inputStyle}
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                >
                  <option value="Rent">Store rent</option>
                  <option value="Utilities">Electricity & utilities</option>
                  <option value="Travel">Travel & transport</option>
                  <option value="Salaries">Staff salaries</option>
                  <option value="Food">Food & refreshments</option>
                  <option value="Other">Miscellaneous</option>
                </select>
              </Field>

              <Field label="Amount (Rs.) *" htmlFor={expenseAmountId}>
                <input
                  id={expenseAmountId}
                  type="number"
                  step="0.01"
                  className="monospace tabular"
                  style={{
                    ...inputStyle,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </Field>

              <Field label="Description or note" htmlFor={expenseDescId}>
                <input
                  id={expenseDescId}
                  type="text"
                  style={inputStyle}
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g. October electric bill"
                />
              </Field>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--ink-3)',
                }}
              >
                <button
                  type="button"
                  style={{
                    ...typeScale.control,
                    padding: '8px 16px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...typeScale.control,
                    padding: '8px 16px',
                    background: 'var(--brand-primary)',
                    color: 'var(--ink-0)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Record expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
          style={{
            ...sansFamily,
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '420px',
              maxWidth: '100%',
              background: 'var(--ink-0)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--ink-3)',
              }}
            >
              <h3
                id="edit-modal-title"
                style={{
                  ...typeScale.sectionTitle,
                  margin: 0,
                  color: 'var(--ink-fg)',
                }}
              >
                Edit{' '}
                {editingRecord.type === 'SALES'
                  ? 'sale invoice'
                  : editingRecord.type === 'REFUNDS'
                    ? 'refund record'
                    : editingRecord.type === 'EXPENSES'
                      ? 'expense record'
                      : 'stock purchase'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  color: 'var(--ink-fg-2)',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {editingRecord.type === 'SALES' && (
                <>
                  <Field label="Total invoice amount (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.total_amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          total_amount: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Payment type">
                    <select
                      style={inputStyle}
                      value={editForm.payment_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          payment_type: e.target.value,
                        })
                      }
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                      <option value="COD">COD</option>
                    </select>
                  </Field>
                </>
              )}

              {editingRecord.type === 'REFUNDS' && (
                <>
                  <Field label="Refund amount (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.amount_refunded}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          amount_refunded: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Quantity returned">
                    <input
                      type="number"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.qty}
                      onChange={(e) =>
                        setEditForm({ ...editForm, qty: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Description or reason">
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </Field>
                </>
              )}

              {editingRecord.type === 'EXPENSES' && (
                <>
                  <Field label="Category">
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Amount (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Description or remarks">
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </Field>
                </>
              )}

              {editingRecord.type === 'PURCHASES' && (
                <>
                  <Field label="Received quantity">
                    <input
                      type="number"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.qty_received}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          qty_received: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="Unit cost (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      className="monospace tabular"
                      style={{
                        ...inputStyle,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      value={editForm.unit_cost}
                      onChange={(e) =>
                        setEditForm({ ...editForm, unit_cost: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Payment mode">
                    <select
                      style={inputStyle}
                      value={editForm.payment_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          payment_type: e.target.value,
                        })
                      }
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </Field>
                </>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--ink-3)',
                }}
              >
                <button
                  type="button"
                  style={{
                    ...typeScale.control,
                    padding: '8px 16px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...typeScale.control,
                    padding: '8px 16px',
                    background: 'var(--brand-primary)',
                    color: 'var(--ink-0)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
