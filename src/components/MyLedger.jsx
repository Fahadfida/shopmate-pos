import React, { useState, useEffect, useId, useMemo } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons
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
  <svg {...iconBase}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CreditCardIcon = () => (
  <svg {...iconBase}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
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
const ChevronDownIcon = () => (
  <svg {...iconBase} width={14} height={14}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CloseIcon = () => (
  <svg {...iconBase}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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
  </svg>
);
const DownloadIcon = () => (
  <svg {...iconBase}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const RefreshIcon = () => (
  <svg {...iconBase}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const PlusIcon = () => (
  <svg {...iconBase}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Tokens & Styles
// ─────────────────────────────────────────────────────────────
const sansFamily = { fontFamily: 'var(--font-sans)' };

const ROW_TINTS = {
  REFUND: {
    bg: 'color-mix(in srgb, var(--ink-danger) 8%, var(--ink-1))',
    accent: 'var(--ink-danger)',
  },
  CREDIT: {
    bg: 'color-mix(in srgb, #d97706 10%, var(--ink-1))',
    accent: '#b45309',
  },
  CASH: {
    bg: 'color-mix(in srgb, var(--ink-success) 8%, var(--ink-1))',
    accent: 'var(--ink-success)',
  },
  COD: {
    bg: 'color-mix(in srgb, var(--brand-primary) 8%, var(--ink-1))',
    accent: 'var(--brand-primary)',
  },
  CONSIGNMENT: {
    bg: 'color-mix(in srgb, #8b5cf6 8%, var(--ink-1))',
    accent: '#8b5cf6',
  }, // Purple for Consignment
};

function getRowTint(paymentOrType) {
  const key = String(paymentOrType || '').toUpperCase();
  if (key.includes('REFUND') || key.includes('PAYOUT')) return ROW_TINTS.REFUND;
  if (key.includes('CREDIT')) return ROW_TINTS.CREDIT;
  if (key.includes('COD')) return ROW_TINTS.COD;
  if (key.includes('CASH')) return ROW_TINTS.CASH;
  if (key.includes('CONSIGNMENT') || key.includes('COMMISSION'))
    return ROW_TINTS.CONSIGNMENT;
  return null;
}

const typeScale = {
  sectionTitle: {
    ...sansFamily,
    fontSize: '0.9375rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    ...sansFamily,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.45,
  },
  label: {
    ...sansFamily,
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.35,
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
      style={{ ...typeScale.label, color: 'var(--ink-fg-2)' }}
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

const PaymentPill = ({ label }) => {
  const tint = getRowTint(label);
  return (
    <span
      style={{
        background: 'var(--ink-0)',
        color: tint ? tint.accent : 'var(--ink-fg-2)',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        border: `1px solid ${tint ? tint.accent : 'var(--ink-3)'}`,
      }}
    >
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function FinancialLedger({ currentUser }) {
  const expenseCategoryId = useId();
  const expenseAmountId = useId();
  const expenseDescId = useId();
  const searchInputId = useId();

  const [ledgerData, setLedgerData] = useState({
    expenses: [],
    purchases: [],
    sales: [],
    refunds: [],
    consignment: [],
    summary: {
      totalSales: 0,
      totalExpenses: 0,
      totalPurchases: 0,
      totalRefunds: 0,
      netCashFlow: 0,
      totalCommission: 0,
    },
  });
  const [totalSupplierPayables, setTotalSupplierPayables] = useState(0);
  const [activeTab, setActiveTab] = useState('SALES');
  const [users, setUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const [selectedDetail, setSelectedDetail] = useState(null);
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

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadFinancials = async () => {
    const ipc = getIpc();
    if (!ipc) return;

    const [data, fetchedUsers, suppliers, rrList, itemsList] =
      await Promise.all([
        ipc.invoke('get-financial-ledger', {
          startDate,
          endDate,
          user_id: selectedUser ? parseInt(selectedUser, 10) : null,
          payment_type: paymentType,
          sortBy,
        }),
        ipc.invoke('get-users').catch(() => []),
        ipc.invoke('get-suppliers', true).catch(() => []),
        ipc.invoke('get-refunds-repairs').catch(() => []),
        ipc.invoke('get-items').catch(() => []),
      ]);

    const skuById = {};
    const skuByName = {};
    for (const item of Array.isArray(itemsList) ? itemsList : []) {
      if (item?.id != null && item?.code) skuById[item.id] = item.code;
      if (item?.name && item?.code)
        skuByName[String(item.name).trim().toLowerCase()] = item.code;
    }

    const resolveSku = (row) => {
      if (row?.sku || row?.code) return row.sku || row.code;
      if (row?.item_id != null && skuById[row.item_id])
        return skuById[row.item_id];
      if (Array.isArray(row?.items)) {
        const codes = row.items
          .map((line) => line.sku || line.code || skuById[line.item_id])
          .filter(Boolean);
        if (codes.length) return [...new Set(codes)].join(', ');
      }
      const byName = row?.item_name
        ? skuByName[String(row.item_name).trim().toLowerCase()]
        : '';
      return byName || '—';
    };

    const base = data || {
      expenses: [],
      purchases: [],
      sales: [],
      refunds: [],
      consignment: [],
      summary: {},
    };
    const existingRefunds = Array.isArray(base.refunds) ? base.refunds : [];
    // In MyLedger.jsx -> loadFinancials()

    // 1. Get the refunds directly from the ledger backend
    const baseRefunds = Array.isArray(base.refunds) ? base.refunds : [];

    // 2. Map them into the UI format, ensuring Type is always present
    const formattedRefunds = baseRefunds.map((r) => ({
      ...r,
      type: String(r.type || 'REFUND').toUpperCase(), // Fallback to REFUND if type is missing
      item_name: r.item_name || r.manual_item_name || 'General return',
      sku: resolveSku(r),
    }));

    setLedgerData({
      ...base,
      sales: (base.sales || []).map((s) => ({ ...s, sku: resolveSku(s) })),
      purchases: (base.purchases || []).map((p) => ({
        ...p,
        sku: resolveSku(p),
      })),
      expenses: (base.expenses || []).map((e) => ({
        ...e,
        sku: resolveSku(e),
      })),
      refunds: formattedRefunds, // 👈 Use the formatted list directly
      consignment: (base.consignment || []).map((c) => ({
        ...c,
        sku: c.sku || '—',
      })),
      summary: {
        ...base.summary,
        totalRefunds: base.summary?.totalRefunds ?? 0,
        totalCommission: base.summary?.totalCommission ?? 0,
      },
    });
    const refundsSumFromRr = rrRefunds.reduce(
      (acc, r) => acc + (parseFloat(r.amount_refunded) || 0),
      0,
    );
    const payablesSum = (suppliers || []).reduce(
      (acc, s) => acc + (s.balance > 0 ? s.balance : 0),
      0,
    );

    // Calculate Total Commission from Consignment
    const consignmentData = base.consignment || [];
    const totalCommission = consignmentData
      .filter((c) => c.type === 'SALE')
      .reduce((sum, c) => sum + Number(c.our_commission || 0), 0);

    setLedgerData({
      ...base,
      sales: (base.sales || []).map((s) => ({ ...s, sku: resolveSku(s) })),
      purchases: (base.purchases || []).map((p) => ({
        ...p,
        sku: resolveSku(p),
      })),
      expenses: (base.expenses || []).map((e) => ({
        ...e,
        sku: resolveSku(e),
      })),
      refunds: rrRefunds.map((r) => ({ ...r, sku: resolveSku(r) })),
      consignment: consignmentData.map((c) => ({ ...c, sku: c.sku || '—' })),
      summary: {
        ...base.summary,
        totalRefunds: base.summary?.totalRefunds ?? refundsSumFromRr,
        totalCommission: totalCommission,
      },
    });
    setUsers(fetchedUsers || []);
    setTotalSupplierPayables(payablesSum);
  };

  useEffect(() => {
    loadFinancials();
  }, [startDate, endDate, selectedUser, paymentType, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
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
    if (!isAdmin)
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
        setSelectedDetail(null);
        addToast('Record deleted successfully.', 'success');
        loadFinancials();
      } else {
        addToast('Failed to delete record: ' + res.error, 'error');
      }
    }
  };

  const openEditModal = (record, type) => {
    if (!isAdmin)
      return addToast(
        'Access Denied: Only Managers (Admin) can edit ledger records.',
        'error',
      );
    setSelectedDetail(null);
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

  const {
    summary,
    expenses = [],
    purchases = [],
    sales = [],
    refunds = [],
    consignment = [],
  } = ledgerData;

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      if (
        paymentType &&
        String(s.payment_type || '').toUpperCase() !== paymentType
      )
        return false;
      if (!q) return true;
      return [
        s.date,
        `inv-${s.sale_id}`,
        s.customer_name,
        s.payment_type,
        s.username,
        s.sku,
        s.item_name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [sales, searchQuery, paymentType]);

  const filteredRefunds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return refunds.filter((r) => {
      // Show both Refunds and Repairs in this tab
      const isRefundOrRepair =
        String(r.type || '').toUpperCase() === 'REFUND' ||
        String(r.type || '').toUpperCase() === 'REPAIR';
      if (!isRefundOrRepair) return false;

      if (paymentType && paymentType !== 'REFUND') return false;
      if (!q) return true;
      return [
        r.date,
        `ref-${r.id}`,
        r.customer_name,
        r.username,
        r.sku,
        r.item_name,
        r.description,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [refunds, searchQuery, paymentType]);
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (paymentType && paymentType !== 'CASH') return false;
      if (!q) return true;
      return [
        exp.date,
        `exp-${exp.id}`,
        exp.username,
        exp.sku,
        exp.category,
        exp.description,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [expenses, searchQuery, paymentType]);

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return purchases.filter((p) => {
      const pType = String(p.payment_type || 'CREDIT').toUpperCase();
      if (paymentType && pType !== paymentType) return false;
      if (!q) return true;
      return [
        p.date,
        p.invoice_no,
        p.supplier_name,
        pType,
        p.username,
        p.sku,
        p.item_name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [purchases, searchQuery, paymentType]);

  const filteredConsignment = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return consignment.filter((c) => {
      if (paymentType && paymentType !== 'CONSIGNMENT') return false;
      if (!q) return true;
      return [c.date, c.party, c.item_name, c.sku, c.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [consignment, searchQuery, paymentType]);

  const displayRows = useMemo(() => {
    if (activeTab === 'SALES') {
      return filteredSales.map((s, idx) => ({
        key: s.id ?? `${s.sale_id}-${idx}`,
        recordId: s.sale_id,
        type: 'SALES',
        title: s.item_name || 'Retail sale item',
        date: s.date,
        sku: s.sku,
        ref: `#INV-${s.sale_id}`,
        party: s.customer_name || 'Walk-in',
        payment: s.payment_type || 'CASH',
        operator: s.username || 'Cashier',
        qty: s.qty_sold ?? 1,
        unitAmount: Number(s.unit_price || 0),
        totalAmount: Number(s.total_line || 0),
        totalLabel: `Rs. ${Number(s.total_line || 0).toLocaleString()}`,
        totalColor: 'var(--ink-success)',
        description: 'Retail sale item',
        raw: s,
      }));
    }
    if (activeTab === 'REFUNDS') {
      return filteredRefunds.map((r, idx) => ({
        key: r.id ?? idx,
        recordId: r.id,
        type: 'REFUNDS',
        title: r.item_name || 'General return',
        date: r.date,
        sku: r.sku,
        ref: `REF-${r.id}`,
        party: r.customer_name || 'Walk-in',
        payment: 'REFUND',
        operator: r.username || 'Manager',
        qty: r.qty ?? 1,
        unitAmount: Number(r.amount_refunded || 0),
        totalAmount: -Math.abs(Number(r.amount_refunded || 0)),
        totalLabel: `− Rs. ${Number(r.amount_refunded || 0).toLocaleString()}`,
        totalColor: 'var(--ink-danger)',
        description: r.description || 'Item returned',
        raw: r,
      }));
    }
    if (activeTab === 'EXPENSES') {
      return filteredExpenses.map((exp) => ({
        key: exp.id,
        recordId: exp.id,
        type: 'EXPENSES',
        title: exp.category || 'Operating expense',
        date: exp.date,
        sku: exp.sku,
        ref: `EXP-${exp.id}`,
        party: 'Store overhead',
        payment: 'CASH',
        operator: exp.username || 'Manager',
        qty: 1,
        unitAmount: Number(exp.amount || 0),
        totalAmount: -Math.abs(Number(exp.amount || 0)),
        totalLabel: `− Rs. ${Number(exp.amount || 0).toLocaleString()}`,
        totalColor: 'var(--ink-danger)',
        description: exp.description || '—',
        raw: exp,
      }));
    }
    if (activeTab === 'CONSIGNMENT') {
      return filteredConsignment.map((c) => ({
        key: `${c.type}-${c.id}`,
        recordId: c.id,
        type: 'CONSIGNMENT',
        title: c.type === 'SALE' ? c.item_name : 'Payout to Partner',
        date: c.date,
        sku: c.sku,
        ref: c.type === 'SALE' ? `CON-${c.id}` : `PAY-${c.id}`,
        party: c.party,
        payment: c.type === 'SALE' ? 'COMMISSION' : 'PAYOUT',
        operator: c.username || 'Manager',
        qty: c.qty || 1,
        unitAmount: Number(c.amount || 0),
        totalAmount:
          c.type === 'SALE'
            ? Number(c.our_commission || 0)
            : -Math.abs(Number(c.partner_share || 0)),
        totalLabel:
          c.type === 'SALE'
            ? `+ Rs. ${Number(c.our_commission || 0).toLocaleString()}`
            : `− Rs. ${Number(c.partner_share || 0).toLocaleString()}`,
        totalColor:
          c.type === 'SALE' ? 'var(--ink-success)' : 'var(--ink-danger)',
        description:
          c.type === 'SALE'
            ? `Sale split (${c.commission_rate}% comm)`
            : 'Partner settlement',
        raw: c,
      }));
    }
    return filteredPurchases.map((p) => {
      const lineTotal = Number((p.qty_received || 0) * (p.unit_cost || 0));
      return {
        key: p.id,
        recordId: p.id,
        type: 'PURCHASES',
        title: p.item_name || 'Stock intake',
        date: p.date,
        sku: p.sku,
        ref: p.invoice_no || `GRN-${p.id}`,
        party: p.supplier_name || 'Direct stock',
        payment: p.payment_type || 'CREDIT',
        operator: p.username || 'Manager',
        qty: p.qty_received ?? 0,
        unitAmount: Number(p.unit_cost || 0),
        totalAmount: lineTotal,
        totalLabel: `Rs. ${lineTotal.toLocaleString()}`,
        totalColor: 'var(--ink-fg)',
        description: p.description || 'Stock intake',
        raw: p,
      };
    });
  }, [
    activeTab,
    filteredSales,
    filteredRefunds,
    filteredExpenses,
    filteredPurchases,
    filteredConsignment,
  ]);

  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (ipc) {
      const rowsHtml = displayRows
        .map(
          (row) =>
            `<tr><td>${row.date}</td><td>${row.sku}</td><td>${row.ref}</td><td>${row.party}</td><td>${row.payment}</td><td>${row.operator}</td><td>${row.title}</td><td class="right">${row.qty}</td><td class="right">Rs. ${row.unitAmount.toLocaleString()}</td><td class="right">${row.totalLabel}</td><td>${row.description}</td></tr>`,
        )
        .join('');

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8" /><title>Financial Ledger Report - ${activeTab}</title>
        <style>@page { size: A4 landscape; margin: 10mm; } body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #0f172a; background: #fff; margin: 0; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 18px; } .title-area h1 { margin: 0; color: var(--brand-primary); font-size: 18px; text-transform: uppercase; } .title-area p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; } table { width: 100%; border-collapse: collapse; margin-top: 8px; } th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; } td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; } .right { text-align: right; }</style></head><body>
        <div class="header"><div class="title-area"><h1>Financial Ledger Statement (${activeTab})</h1><p>ShopMate Enterprise Accounting Suite</p></div><div style="text-align: right;"><p style="margin: 0; font-weight: bold; font-size: 12px;">Date: ${new Date().toLocaleDateString()}</p><p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operator: ${currentUser?.username || 'Manager'}</p></div></div>
        <table><thead><tr><th>Date</th><th>SKU</th><th>InvoiceID</th><th>Customer/Supplier</th><th>PaymentType</th><th>Operator</th><th>Title / Item</th><th class="right">Qty</th><th class="right">Amount</th><th class="right">Total</th><th>Description</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled)
        addToast(`Financial statement successfully exported to PDF`, 'success');
      else if (!res.canceled)
        addToast('PDF Export failed: ' + res.error, 'error');
    }
  };

  const ledgerGridTemplate =
    'minmax(0, 1.05fr) minmax(0, 0.85fr) minmax(0, 0.95fr) minmax(0, 1.85fr) minmax(0, 0.8fr) minmax(0, 0.55fr) minmax(0, 0.9fr)';

  const rowStyle = (payment) => {
    const tint = getRowTint(payment);
    return {
      display: 'grid',
      gridTemplateColumns: ledgerGridTemplate,
      fontSize: '0.8125rem',
      alignItems: 'center',
      background: tint ? tint.bg : 'var(--ink-1)',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--ink-3)',
      borderLeft: tint ? `3px solid ${tint.accent}` : '1px solid var(--ink-3)',
      cursor: 'pointer',
    };
  };

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
      {/* TOASTS */}
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

      {/* KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px',
        }}
      >
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
            <p style={{ ...typeScale.badge, margin: 0, color: '#8b5cf6' }}>
              Commission income
            </p>
            <div
              className="monospace tabular"
              style={{
                ...sansFamily,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#8b5cf6',
                marginTop: '10px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs. {Number(summary.totalCommission || 0).toLocaleString()}
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
            Earned from consignment
          </div>
        </div>

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
            Sales + Commission - Expenses
          </div>
        </div>
      </div>

      {/* FILTERS */}
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

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            id={searchInputId}
            type="search"
            aria-label="Search transactions"
            placeholder="Search SKU, invoice, title, party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...inputStyle,
              width: '220px',
              minHeight: '36px',
              padding: '6px 12px',
            }}
          />

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
              <option value="REFUND">Refund</option>
              <option value="CONSIGNMENT">Consignment</option>
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

          {(searchQuery ||
            startDate ||
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
              }}
              onClick={clearFilters}
            >
              Reset
            </button>
          )}

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
              { id: 'SALES', label: `Retail sales (${filteredSales.length})` },
              {
                id: 'REFUNDS',
                label: `Refunds & returns (${filteredRefunds.length})`,
              },
              {
                id: 'EXPENSES',
                label: `Operating expenses (${filteredExpenses.length})`,
              },
              {
                id: 'PURCHASES',
                label: `Stock purchases (${filteredPurchases.length})`,
              },
              {
                id: 'CONSIGNMENT',
                label: `Consignment (${filteredConsignment.length})`,
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
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ ...typeScale.helper, color: 'var(--ink-fg-3)' }}>
              Click a row for details & actions
            </span>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: ledgerGridTemplate,
            ...typeScale.badge,
            background: 'var(--ink-1)',
            color: 'var(--ink-fg-2)',
            padding: '8px 12px',
            borderRadius: '8px',
            borderBottom: '1px solid var(--ink-3)',
          }}
        >
          <span>Date</span>
          <span>SKU</span>
          <span>Invoice ID</span>
          <span>Title / Item</span>
          <span>Payment</span>
          <span style={{ textAlign: 'right' }}>Qty</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>

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
          {displayRows.map((row) => (
            <div
              key={row.key}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDetail(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDetail(row);
                }
              }}
              style={rowStyle(row.payment)}
            >
              <span
                style={{
                  color: 'var(--ink-fg-3)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.75rem',
                }}
              >
                {row.date}
              </span>
              <span
                className="monospace"
                style={{ fontWeight: 600, color: 'var(--ink-fg-2)' }}
              >
                {row.sku}
              </span>
              <span
                className="monospace"
                style={{
                  fontWeight: 600,
                  color:
                    row.type === 'REFUNDS' || row.type === 'EXPENSES'
                      ? 'var(--ink-danger)'
                      : row.type === 'CONSIGNMENT'
                        ? '#8b5cf6'
                        : 'var(--brand-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.ref}
              </span>
              <span
                style={{
                  minWidth: 0,
                  fontWeight: 500,
                  color:
                    row.type === 'REFUNDS'
                      ? 'var(--ink-danger)'
                      : row.type === 'CONSIGNMENT'
                        ? '#8b5cf6'
                        : 'var(--ink-fg)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingRight: '8px',
                }}
              >
                {row.title}
              </span>
              <span>
                <PaymentPill label={row.payment} />
              </span>
              <span
                className="monospace tabular"
                style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.qty}
              </span>
              <span
                className="monospace tabular"
                style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  color: row.totalColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.totalLabel}
              </span>
            </div>
          ))}
          {displayRows.length === 0 && (
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

      {/* DETAIL MODAL (Unchanged logic, just matching the flow) */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedDetail(null);
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
              width: '480px',
              maxWidth: '100%',
              background: 'var(--ink-0)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--ink-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--ink-3)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    className="monospace"
                    style={{ ...typeScale.badge, color: 'var(--ink-fg-2)' }}
                  >
                    {selectedDetail.ref}
                  </span>
                  <PaymentPill label={selectedDetail.payment} />
                </div>
                <h3
                  style={{
                    ...typeScale.sectionTitle,
                    margin: '6px 0 0 0',
                    color: 'var(--ink-fg)',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                aria-label="Close detail card"
                style={{
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  color: 'var(--ink-fg-2)',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: 'var(--ink-1)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  SKU
                </div>
                <div
                  className="monospace"
                  style={{ fontWeight: 600, marginTop: '4px' }}
                >
                  {selectedDetail.sku}
                </div>
              </div>
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Date
                </div>
                <div className="monospace" style={{ marginTop: '4px' }}>
                  {selectedDetail.date}
                </div>
              </div>
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Customer / Supplier
                </div>
                <div style={{ fontWeight: 500, marginTop: '4px' }}>
                  {selectedDetail.party}
                </div>
              </div>
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Operator
                </div>
                <div style={{ marginTop: '4px' }}>
                  {selectedDetail.operator}
                </div>
              </div>
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Quantity
                </div>
                <div
                  className="monospace tabular"
                  style={{ fontWeight: 600, marginTop: '4px' }}
                >
                  {selectedDetail.qty}
                </div>
              </div>
              <div>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Unit Amount
                </div>
                <div className="monospace tabular" style={{ marginTop: '4px' }}>
                  Rs. {selectedDetail.unitAmount.toLocaleString()}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Total
                </div>
                <div
                  className="monospace tabular"
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: selectedDetail.totalColor,
                    marginTop: '4px',
                  }}
                >
                  {selectedDetail.totalLabel}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ ...typeScale.badge, color: 'var(--ink-fg-3)' }}>
                  Description
                </div>
                <div
                  style={{
                    color: 'var(--ink-fg-2)',
                    marginTop: '4px',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedDetail.description}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid var(--ink-3)',
                gap: '8px',
              }}
            >
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteRecord(
                      selectedDetail.recordId,
                      selectedDetail.type,
                    )
                  }
                  style={{
                    ...typeScale.control,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-danger)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  style={{
                    ...typeScale.control,
                    padding: '8px 14px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openEditModal(selectedDetail.raw, selectedDetail.type)
                  }
                  style={{
                    ...typeScale.control,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'var(--brand-primary)',
                    color: 'var(--ink-0)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <EditIcon />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE & EDIT MODALS (Kept identical to existing to save space, but wrapped properly) */}
      {/* Add your existing Expense and Edit modals here */}
    </div>
  );
}
