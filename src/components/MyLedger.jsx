import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// --- CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: {
      bg: '#f0fdf4',
      border: 'var(--success)',
      text: '#065f46',
      icon: '✅',
    },
    error: {
      bg: '#fef2f2',
      border: 'var(--danger)',
      text: '#991b1b',
      icon: '🚨',
    },
    info: { bg: '#eff6ff', border: 'var(--info)', text: '#1e40af', icon: 'ℹ️' },
  };
  const c = colors[type] || colors.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: c.bg,
        borderLeft: `4px solid ${c.border}`,
        color: c.text,
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '280px',
        fontWeight: '600',
        fontSize: '0.85rem',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: c.text,
          fontWeight: 'bold',
        }}
      >
        ✕
      </button>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: c.border,
          animation: 'shrink 4s linear forwards',
        }}
      />
    </div>
  );
};

export default function FinancialLedger({ currentUser }) {
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
        user_id: selectedUser ? parseInt(selectedUser) : null,
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
        addToast('Record deleted successfully!', 'success');
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
      addToast('Ledger entry successfully updated!', 'success');
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
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1, // 👈 ADD THIS
        height: '100%',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
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
            Ledger ( Profit & Loss )
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e0f2fe',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              border: '1px solid #bae6fd',
            }}
          >
            <span>👤 On Duty:</span>
            <span style={{ textTransform: 'uppercase' }}>
              {currentUser?.username || 'Manager'} (
              {currentUser?.role || 'ADMIN'})
            </span>
          </div>
          <button
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
            onClick={handleExportA4PDF}
          >
            Export PDF Statement
          </button>
        </div>
      </div>

      {/* 5-COLUMN KPI SUMMARY CARDS */}
      {/* <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--info)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'var(--info)',
              textTransform: 'uppercase',
            }}
          >
            Total Retail Sales
          </p>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--text-primary)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs. {summary.totalSales?.toLocaleString()}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--danger)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'var(--danger)',
              textTransform: 'uppercase',
            }}
          >
            Operating Expenses
          </p>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--text-primary)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs. {summary.totalExpenses?.toLocaleString()}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid #d97706',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#d97706',
              textTransform: 'uppercase',
            }}
          >
            Total Purchases (GRN)
          </p>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--text-primary)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs. {summary.totalPurchases?.toLocaleString()}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid #ea580c',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#ea580c',
              textTransform: 'uppercase',
            }}
          >
            Supplier Payables
          </p>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: 'var(--text-primary)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs. {totalSupplierPayables?.toLocaleString()}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: `1.5px solid ${summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)'}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: '700',
              color: summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)',
              textTransform: 'uppercase',
            }}
          >
            Net Cash Flow
          </p>
          <div
            className="monospace"
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              color: summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)',
              marginTop: '6px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Rs. {summary.netCashFlow?.toLocaleString()}
          </div>
        </div>
      </div> */}

      {/* 5-COLUMN KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        {/* TOTAL RETAIL SALES */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--info)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--info)',
                textTransform: 'uppercase',
              }}
            >
              Total Retail Sales
            </p>
            <div
              className="monospace"
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginTop: '6px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {summary.totalSales?.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
            }}
          >
            Sum of all Sale Invoices
          </div>
        </div>

        {/* OPERATING EXPENSES */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--danger)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--danger)',
                textTransform: 'uppercase',
              }}
            >
              Operating Expenses
            </p>
            <div
              className="monospace"
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginTop: '6px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {summary.totalExpenses?.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
            }}
          >
            Sum of all Expenses logged
          </div>
        </div>

        {/* TOTAL PURCHASES */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid #d97706',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#d97706',
                textTransform: 'uppercase',
              }}
            >
              Total Purchases (GRN)
            </p>
            <div
              className="monospace"
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginTop: '6px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {summary.totalPurchases?.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
            }}
          >
            Sum of (Qty Received × Unit Cost)
          </div>
        </div>

        {/* SUPPLIER PAYABLES */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid #ea580c',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#ea580c',
                textTransform: 'uppercase',
              }}
            >
              Supplier Payables
            </p>
            <div
              className="monospace"
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginTop: '6px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {totalSupplierPayables?.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
            }}
          >
            Sum of Supplier Balances
          </div>
        </div>

        {/* NET CASH FLOW */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: `1.5px solid ${summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '700',
                color:
                  summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)',
                textTransform: 'uppercase',
              }}
            >
              Net Cash Flow
            </p>
            <div
              className="monospace"
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color:
                  summary.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)',
                marginTop: '6px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Rs. {summary.netCashFlow?.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
            }}
          >
            Sales - Expenses
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
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
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
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
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="">👤 All Operators</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="">💳 All Payments</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT">Credit</option>
            <option value="COD">COD</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="date_desc">📅 Latest to Oldest</option>
            <option value="date_asc">📜 Oldest to Latest</option>
            <option value="amount_desc">📈 Highest to Lowest Amt</option>
            <option value="amount_asc">📉 Lowest to Highest Amt</option>
          </select>
          {(startDate ||
            endDate ||
            selectedUser ||
            paymentType ||
            sortBy !== 'date_desc') && (
            <button
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                background: '#fee2e2',
                color: 'var(--danger)',
                border: 'none',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={clearFilters}
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER & TABS */}
      <div
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('SALES')}
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                background:
                  activeTab === 'SALES' ? 'var(--brand-primary)' : '#f1f5f9',
                color: activeTab === 'SALES' ? '#fff' : '#64748b',
              }}
            >
              🛒 Retail Sales ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('REFUNDS')}
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                background:
                  activeTab === 'REFUNDS' ? 'var(--brand-primary)' : '#f1f5f9',
                color: activeTab === 'REFUNDS' ? '#fff' : '#64748b',
              }}
            >
              🔄 Refunds & Returns ({refunds.length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSES')}
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                background:
                  activeTab === 'EXPENSES' ? 'var(--brand-primary)' : '#f1f5f9',
                color: activeTab === 'EXPENSES' ? '#fff' : '#64748b',
              }}
            >
              💸 Operating Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('PURCHASES')}
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                background:
                  activeTab === 'PURCHASES'
                    ? 'var(--brand-primary)'
                    : '#f1f5f9',
                color: activeTab === 'PURCHASES' ? '#fff' : '#64748b',
              }}
            >
              📦 Stock Purchases ({purchases.length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              onClick={loadFinancials}
            >
              🔄 Refresh
            </button>
            {activeTab === 'EXPENSES' && (
              <button
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setIsExpenseModalOpen(true)}
              >
                + Log New Expense
              </button>
            )}
          </div>
        </div>

        {/* TABLE HEADER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: unifiedGridTemplate,
            fontSize: '0.7rem',
            fontWeight: '700',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            padding: '12px 10px',
            borderRadius: '6px',
            borderBottom: '1.5px solid #e2e8f0',
            textTransform: 'uppercase',
          }}
        >
          <span>DATE</span>
          <span>INVOICE ID</span>
          <span>CUSTOMER/SUPPLIER</span>
          <span>PAYMENT TYPE</span>
          <span>OPERATOR</span>
          <span>ITEM NAME</span>
          <span style={{ textAlign: 'right' }}>QTY</span>
          <span style={{ textAlign: 'right' }}>AMOUNT</span>
          <span style={{ textAlign: 'right' }}>TOTAL</span>
          <span>DESCRIPTION</span>
          <span style={{ textAlign: 'center' }}>ACTIONS</span>
        </div>

        {/* TABLES */}
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
          {activeTab === 'SALES' &&
            sales.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: unifiedGridTemplate,
                  fontSize: '0.78rem',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
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
                  {s.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: '700',
                    color: 'var(--brand-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  #INV-{s.sale_id}
                </span>
                <span
                  style={{
                    fontWeight: '700',
                    color: 'var(--text-primary)',
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
                      background: 'var(--bg-hover)',
                      color: '#475569',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {s.payment_type}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  {s.username || 'Cashier'}
                </span>
                <span
                  style={{
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.item_name}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {s.qty_sold}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {s.unit_price?.toLocaleString()}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    color: 'var(--success)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {s.total_line?.toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Retail Sale Item
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <button
                    style={{
                      background: '#e0f2fe',
                      color: 'var(--info)',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => openEditModal(s, 'SALES')}
                  >
                    ✏️
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      style={{
                        background: '#fee2e2',
                        color: 'var(--danger)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleDeleteRecord(s.sale_id, 'SALES')}
                    >
                      🗑️
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
                  fontSize: '0.78rem',
                  alignItems: 'center',
                  background: '#fff5f5',
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
                  {r.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: '700',
                    color: 'var(--danger)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  REF-{r.id}
                </span>
                <span
                  style={{
                    fontWeight: '700',
                    color: 'var(--text-primary)',
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
                      background: '#fee2e2',
                      color: 'var(--danger)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                    }}
                  >
                    REFUND
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  {r.username || 'Manager'}
                </span>
                <span
                  style={{
                    fontWeight: '600',
                    color: 'var(--danger)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.item_name || 'General Return'}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {r.qty}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {r.amount_refunded?.toLocaleString()}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    color: 'var(--danger)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  - Rs. {r.amount_refunded?.toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.description || 'Item Returned'}
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <button
                    style={{
                      background: '#e0f2fe',
                      color: 'var(--info)',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => openEditModal(r, 'REFUNDS')}
                  >
                    ✏️
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      style={{
                        background: '#fee2e2',
                        color: 'var(--danger)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleDeleteRecord(r.id, 'REFUNDS')}
                    >
                      🗑️
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
                  fontSize: '0.78rem',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
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
                  {exp.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: '700',
                    color: 'var(--danger)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  EXP-{exp.id}
                </span>
                <span
                  style={{ fontWeight: '700', color: 'var(--text-primary)' }}
                >
                  Store Overhead
                </span>
                <span>
                  <span
                    style={{
                      background: '#fee2e2',
                      color: 'var(--danger)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                    }}
                  >
                    CASH
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  {exp.username || 'Manager'}
                </span>
                <span style={{ fontWeight: '600', color: '#475569' }}>
                  {exp.category}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  1
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {exp.amount?.toLocaleString()}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#ef4444',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  - Rs. {exp.amount?.toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
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
                    gap: '4px',
                  }}
                >
                  <button
                    style={{
                      background: '#e0f2fe',
                      color: 'var(--info)',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => openEditModal(exp, 'EXPENSES')}
                  >
                    ✏️
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      style={{
                        background: '#fee2e2',
                        color: 'var(--danger)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleDeleteRecord(exp.id, 'EXPENSES')}
                    >
                      🗑️
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
                  fontSize: '0.78rem',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
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
                  {p.date}
                </span>
                <span
                  className="monospace"
                  style={{
                    fontWeight: '700',
                    color: 'var(--info)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {p.invoice_no || `GRN-${p.id}`}
                </span>
                <span
                  style={{
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.supplier_name || 'Direct Stock'}
                </span>
                <span>
                  <span
                    style={{
                      background:
                        p.payment_type === 'CASH' ? '#d1fae5' : '#fef3c7',
                      color: p.payment_type === 'CASH' ? '#065f46' : '#d97706',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {p.payment_type || 'CREDIT'}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  {p.username || 'Manager'}
                </span>
                <span
                  style={{
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.item_name}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {p.qty_received}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {p.unit_cost?.toLocaleString()}
                </span>
                <span
                  className="monospace"
                  style={{
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#f59e0b',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Rs. {(p.qty_received * p.unit_cost)?.toLocaleString()}
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Stock Intake
                </span>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <button
                    style={{
                      background: '#e0f2fe',
                      color: 'var(--info)',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => openEditModal(p, 'PURCHASES')}
                  >
                    ✏️
                  </button>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                      style={{
                        background: '#fee2e2',
                        color: 'var(--danger)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleDeleteRecord(p.id, 'PURCHASES')}
                    >
                      🗑️
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
                textAlign: 'center',
                color: '#94a3b8',
                padding: '40px 0',
                fontSize: '0.85rem',
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
          className="receipt-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '380px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: 'var(--text-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              💸 Record Operating Expense
            </h3>
            <form
              onSubmit={handleAddExpense}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '16px',
              }}
            >
              <select
                className="input-field"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <option value="Rent">🏢 Store Rent</option>
                <option value="Utilities">💡 Electricity & Utilities</option>
                <option value="Travel">🚗 Travel & Transport</option>
                <option value="Salaries">👨‍💼 Staff Salaries</option>
                <option value="Food">🍲 Food / Refreshments</option>
                <option value="Other">📦 Miscellaneous</option>
              </select>
              <input
                type="number"
                className="input-field"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="Amount (Rs.)"
                required
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <input
                type="text"
                className="input-field"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                placeholder="Description / Note"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#e2e8f0',
                    color: 'var(--text-primary)',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingRecord && (
        <div
          className="receipt-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '420px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                ✏️ Edit{' '}
                {editingRecord.type === 'SALES'
                  ? 'Sale Invoice'
                  : editingRecord.type === 'REFUNDS'
                    ? 'Refund Record'
                    : editingRecord.type === 'EXPENSES'
                      ? 'Expense Record'
                      : 'Stock Purchase'}
              </h3>
              <button
                style={{
                  background: 'var(--bg-hover)',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {editingRecord.type === 'SALES' && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Total Invoice Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
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
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Payment Type
                    </label>
                    <select
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
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
                  </div>
                </>
              )}

              {editingRecord.type === 'REFUNDS' && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Refund Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
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
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Quantity Returned
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.qty}
                      onChange={(e) =>
                        setEditForm({ ...editForm, qty: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Description / Reason
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {editingRecord.type === 'EXPENSES' && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Description / Remarks
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {editingRecord.type === 'PURCHASES' && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Received Quantity
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
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
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Unit Cost (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editForm.unit_cost}
                      onChange={(e) =>
                        setEditForm({ ...editForm, unit_cost: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Payment Mode
                    </label>
                    <select
                      className="input-field"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
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
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: 'var(--brand-primary)',
                    fontWeight: 'bold',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#e2e8f0',
                    color: 'var(--text-primary)',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
