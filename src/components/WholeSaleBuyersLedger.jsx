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
        position: 'relative',
        overflow: 'hidden',
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
    </div>
  );
};

export default function KhataLedger({ currentUser }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 👈 NEW: 'desc' | 'asc'

  // Modals State
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Form States
  const [entryType, setEntryType] = useState('DEBIT');
  const [entryData, setEntryData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    method: 'CASH',
    ref: '',
    item_id: '',
    qty: 1,
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    credit_limit: 0,
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadCustomers = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-customers');
      const activeCustomers = (data || []).filter(
        (c) => c.is_active === 1 || c.is_active === undefined,
      );
      setCustomers(activeCustomers);

      const fetchedItems = await ipc.invoke('get-items');
      setInventoryItems(fetchedItems || []);

      if (selectedCustomer) {
        const refreshed = activeCustomers.find(
          (c) => c.id === selectedCustomer.id,
        );
        if (refreshed) setSelectedCustomer(refreshed);
        else setSelectedCustomer(null);
      }
    }
  };

  const loadLedger = async (customerId) => {
    const ipc = getIpc();
    if (ipc) {
      const entries = await ipc.invoke('get-customer-ledger', customerId);
      setLedgerEntries(entries || []);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);
  useEffect(() => {
    if (selectedCustomer) loadLedger(selectedCustomer.id);
  }, [selectedCustomer]);

  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  // --- HANDLERS ---

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      let res;
      if (editingCustomer) {
        res = await ipc.invoke('update-customer', {
          id: editingCustomer.id,
          name: customerForm.name,
          phone: customerForm.phone,
          credit_limit: customerForm.credit_limit,
          avatar: customerForm.avatar,
        });
      } else {
        res = await ipc.invoke('add-customer', customerForm);
      }
      if (res.success) {
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        setCustomerForm({ name: '', phone: '', credit_limit: 0, avatar: '' });
        loadCustomers();
        addToast(
          editingCustomer
            ? 'Party updated successfully'
            : 'Party registered successfully',
          'success',
        );
      } else {
        addToast('Error saving customer: ' + res.error, 'error');
      }
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const ipc = getIpc();
    const amt = parseFloat(entryData.amount);
    if (!amt || amt <= 0) return addToast('Enter a valid amount.', 'error');

    setIsSaving(true);
    const fullNotes = entryData.ref
      ? `${entryData.notes} (Ref: ${entryData.ref})`
      : entryData.notes;
    const selectedItem = inventoryItems.find(
      (i) => i.id === parseInt(entryData.item_id),
    );

    if (ipc) {
      let res;
      if (entryType === 'DEBIT') {
        if (selectedItem) {
          res = await ipc.invoke('create-sale', {
            customer_id: selectedCustomer.id,
            items: [
              {
                ...selectedItem,
                qty: parseInt(entryData.qty),
                price: selectedItem.selling_price,
              },
            ],
            payment_type: 'CREDIT',
            cod_meta: null,
            currentUser,
          });
        } else {
          res = await ipc.invoke('record-customer-debt', {
            customer_id: selectedCustomer.id,
            amount: amt,
            notes: fullNotes,
            currentUser,
          });
        }
      } else {
        res = await ipc.invoke('record-customer-payment', {
          customer_id: selectedCustomer.id,
          amount: amt,
          payment_method: entryData.method,
          notes: fullNotes,
          currentUser,
          date: entryData.date,
        });
      }

      if (res.success) {
        setIsAddEntryModalOpen(false);
        setEntryData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          method: 'CASH',
          ref: '',
          item_id: '',
          qty: 1,
        });
        loadCustomers();
        loadLedger(selectedCustomer.id);
        addToast('Entry recorded successfully', 'success');
      } else {
        addToast('Error recording entry: ' + res.error, 'error');
      }
    }
    setIsSaving(false);
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc && editingRecord) {
      const res = await ipc.invoke('update-ledger-entry', {
        ledgerId: editingRecord.id,
        newDate: entryData.date,
        newNotes: entryData.notes,
        currentUser,
      });
      if (res.success) {
        setIsEditRecordModalOpen(false);
        setEditingRecord(null);
        loadLedger(selectedCustomer.id);
        addToast('Record updated successfully', 'success');
      } else {
        addToast('Error updating record: ' + res.error, 'error');
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this ledger entry? This will recalculate the customer balance.',
      )
    )
      return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-ledger-entry', {
        ledgerId: recordId,
        customerId: selectedCustomer.id,
        currentUser,
      });
      if (res.success) {
        setIsEditRecordModalOpen(false);
        setEditingRecord(null);
        loadCustomers();
        loadLedger(selectedCustomer.id);
        addToast('Record deleted successfully', 'success');
      } else {
        addToast('Error deleting record: ' + res.error, 'error');
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (ledgerEntries.length > 0)
      return addToast(
        'Cannot delete customer with existing records. Please Archive them instead.',
        'error',
      );
    if (
      !window.confirm(
        `Are you sure you want to permanently DELETE "${selectedCustomer.name}"?`,
      )
    )
      return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-customer', {
        customerId: selectedCustomer.id,
        currentUser,
      });
      if (res.success) {
        addToast('Customer deleted successfully', 'success');
        setSelectedCustomer(null);
        loadCustomers();
      } else {
        addToast('Delete Error: ' + res.error, 'error');
      }
    }
  };

  const handleToggleArchive = async () => {
    if (selectedCustomer.balance > 0)
      return addToast('Cannot archive party with outstanding debt.', 'error');
    if (!window.confirm(`Archive "${selectedCustomer.name}"?`)) return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-customer', {
        customerId: selectedCustomer.id,
        is_active: 0,
        currentUser,
      });
      if (res.success) {
        addToast('Customer archived successfully', 'success');
        setSelectedCustomer(null);
        loadCustomers();
      } else {
        addToast('Archive Error: ' + res.error, 'error');
      }
    }
  };

  // 📄 EXPORT LEDGER TO PROFESSIONAL A4 PDF
  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (!ipc || !selectedCustomer) return;

    const rowsHtml = filteredLedger
      .map((e) => {
        const dateStr = e.created_at ? e.created_at.substring(0, 10) : '';
        const debitStr = e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-';
        const creditStr =
          e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-';
        const balStr = `Rs. ${e.balance_after?.toLocaleString()}`;

        return `
        <tr>
          <td>${dateStr}</td>
          <td>${e.description || ''}</td>
          <td class="right color-red">${debitStr}</td>
          <td class="right color-green">${creditStr}</td>
          <td class="right bold color-navy">${balStr}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Khata Statement - ${selectedCustomer.name}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--brand-primary); padding-bottom: 16px; margin-bottom: 24px; }
            .title-area h1 { margin: 0; color: var(--brand-primary); font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
            .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: var(--brand-primary); color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .color-red { color: var(--danger); }
            .color-green { color: var(--success); }
            .color-navy { color: #1e293b; }
            .total-card { margin-top: 24px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: right; float: right; width: 280px; }
            .total-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .total-card .amount { font-size: 20px; font-weight: 900; color: ${selectedCustomer.balance > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 4px; }
            .clearfix::after { content: ""; clear: both; display: table; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>Khata Statement</h1>
              <p>ShopMate Enterprise Business Intelligence</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: bold; font-size: 13px;">Issued Date: ${new Date().toLocaleDateString()}</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Operator: ${currentUser?.username || 'Manager'}</p>
            </div>
          </div>

          <div class="meta-box">
            <div>
              <strong>Party Name:</strong> ${selectedCustomer.name}<br/>
              <strong>Phone Number:</strong> ${selectedCustomer.phone || 'N/A'}<br/>
              <strong>Credit Limit:</strong> Rs. ${selectedCustomer.credit_limit?.toLocaleString() || 0}
            </div>
            <div>
              <strong>Account ID:</strong> #${selectedCustomer.id}<br/>
              <strong>Report Range:</strong> ${filterStartDate || 'Start'} to ${filterEndDate || 'Present'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars / Notes</th>
                <th class="right">Udhaar (Debit +)</th>
                <th class="right">Jama (Credit -)</th>
                <th class="right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="clearfix">
            <div class="total-card">
              <div class="label">Net Outstanding Balance</div>
              <div class="amount">Rs. ${selectedCustomer.balance?.toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await ipc.invoke('export-ledger-pdf', html);
    if (res.success && !res.canceled)
      addToast('Khata statement exported to PDF successfully', 'success');
    else if (!res.canceled)
      addToast('PDF Export failed: ' + res.error, 'error');
  };

  // 🔄 FIXED SORTING LOGIC
  const filteredLedger = ledgerEntries
    .filter((entry) => {
      const matchesSearch = (entry.description || '')
        .toLowerCase()
        .includes(ledgerSearch.toLowerCase());
      let matchesDate = true;
      const entryDate = entry.created_at
        ? entry.created_at.substring(0, 10)
        : '';
      if (filterStartDate && entryDate < filterStartDate) matchesDate = false;
      if (filterEndDate && entryDate > filterEndDate) matchesDate = false;
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      // If sortOrder is 'desc' (newest first), we want b - a
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const totalSales = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalReceived = ledgerEntries.reduce(
    (sum, e) => sum + (e.credit || 0),
    0,
  );
  const currentBalance = selectedCustomer?.balance || 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
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

      {/* TOP BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          Wholesale Buyers Khata
        </h3>
        <button
          className="btn btn-primary"
          style={{
            padding: '8px 16px',
            background: 'var(--brand-primary)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => {
            setEditingCustomer(null);
            setCustomerForm({
              name: '',
              phone: '',
              credit_limit: 0,
              avatar: '',
            });
            setIsCustomerModalOpen(true);
          }}
        >
          + Add New Party
        </button>
      </div>

      {/* PROFILE CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
          maxHeight: '200px',
          overflowY: 'auto',
          paddingBottom: '4px',
        }}
      >
        {customers.map((cust) => {
          const isSelected = selectedCustomer?.id === cust.id;
          const hasDebt = cust.balance > 0;
          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              style={{
                background: isSelected ? 'var(--info-bg)' : 'var(--bg-card)',
                border: isSelected
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: isSelected
                  ? '0 4px 6px -1px rgba(13, 92, 117, 0.1)'
                  : '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {cust.avatar ? (
                <img
                  src={cust.avatar}
                  alt={cust.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  {cust.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cust.name}
                </div>
                <div
                  style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                >
                  {cust.phone || 'No phone'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      background: hasDebt
                        ? 'var(--danger-bg)'
                        : 'var(--success-bg)',
                      color: hasDebt ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {hasDebt
                      ? `Owes Rs. ${cust.balance.toLocaleString()}`
                      : 'Clear'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {customers.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            No active parties found. Add one to get started.
          </div>
        )}
      </div>

      {/* MAIN LEDGER AREA */}
      {selectedCustomer ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          {/* KPI ROW & ACTIONS */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  minWidth: '150px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  Total Udhaar (Debit)
                </div>
                <div
                  className="monospace"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    color: 'var(--danger)',
                    marginTop: '2px',
                  }}
                >
                  Rs. {totalSales.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  minWidth: '150px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  Cash Received (Credit)
                </div>
                <div
                  className="monospace"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    color: 'var(--success)',
                    marginTop: '2px',
                  }}
                >
                  Rs. {totalReceived.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${currentBalance > 0 ? 'var(--danger)' : 'var(--success)'}`,
                  minWidth: '150px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  A/C Receivable (Balance)
                </div>
                <div
                  className="monospace"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    color:
                      currentBalance > 0 ? 'var(--danger)' : 'var(--success)',
                    marginTop: '2px',
                  }}
                >
                  Rs. {currentBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: 'var(--info-bg)',
                  color: 'var(--info)',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setEntryType('CREDIT');
                  setEntryData({
                    ...entryData,
                    amount: '',
                    notes: '',
                    ref: '',
                    item_id: '',
                    qty: 1,
                  });
                  setIsAddEntryModalOpen(true);
                }}
              >
                Receive Payment
              </button>
              <button
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={handleExportA4PDF}
              >
                PDF
              </button>
              <button
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setEntryType('DEBIT');
                  setEntryData({
                    ...entryData,
                    amount: '',
                    notes: '',
                    ref: '',
                    item_id: '',
                    qty: 1,
                  });
                  setIsAddEntryModalOpen(true);
                }}
              >
                + Add Udhaar
              </button>
              <button
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setEditingCustomer(selectedCustomer);
                  setCustomerForm({ ...selectedCustomer });
                  setIsCustomerModalOpen(true);
                }}
              >
                ✏️ Edit
              </button>
              {currentUser?.role === 'ADMIN' && (
                <>
                  {ledgerEntries.length === 0 ? (
                    <button
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        fontWeight: 'bold',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={handleDeleteCustomer}
                    >
                      🗑️ Delete
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        background: 'var(--warning-bg)',
                        color: 'var(--warning)',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={handleToggleArchive}
                    >
                      📦 Archive
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--bg-hover)',
              borderBottom: '1px solid var(--border-color)',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search transaction details..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="input-field"
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
              }}
            >
              <span>From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.72rem' }}
              />
              <span>To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.72rem' }}
              />
            </div>

            {/* 👇 NEW SORT TOGGLE 👇 */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--bg-card)',
                padding: '4px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
              }}
            >
              <button
                onClick={() => setSortOrder('desc')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background:
                    sortOrder === 'desc'
                      ? 'var(--brand-primary)'
                      : 'transparent',
                  color:
                    sortOrder === 'desc' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Newest
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background:
                    sortOrder === 'asc'
                      ? 'var(--brand-primary)'
                      : 'transparent',
                  color: sortOrder === 'asc' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Oldest
              </button>
            </div>
            {/* 👆 END NEW 👆 */}
          </div>

          {/* TABLE */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 1.5fr 0.5fr 1fr 1fr 1fr',
                background: 'var(--brand-primary)',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <span>Date</span>
              <span>Inventory Item</span>
              <span>Particulars / Notes</span>
              <span style={{ textAlign: 'center' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Udhaar (Debit +)</span>
              <span style={{ textAlign: 'right' }}>Jama (Credit -)</span>
              <span style={{ textAlign: 'right' }}>Balance</span>
            </div>

            {filteredLedger.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              >
                No ledger records found.
              </div>
            ) : (
              filteredLedger.map((entry, idx) => (
                <div
                  key={entry.id}
                  onClick={() => {
                    setEditingRecord(entry);
                    setEntryData({
                      date: entry.created_at
                        ? entry.created_at.substring(0, 10)
                        : '',
                      notes: entry.description,
                      amount: entry.debit || entry.credit,
                      ref: '',
                      item_id: '',
                      qty: 1,
                    });
                    setIsEditRecordModalOpen(true);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr 1.5fr 0.5fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background:
                      idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                  }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {entry.created_at ? entry.created_at.substring(0, 10) : ''}
                  </span>
                  <span
                    style={{ color: 'var(--text-primary)', fontWeight: '500' }}
                  >
                    {entry.item_name || '—'}
                  </span>
                  <span
                    style={{ color: 'var(--text-primary)', fontWeight: '500' }}
                  >
                    {entry.description}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {entry.qty || 1}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: entry.debit > 0 ? 'var(--danger)' : '#cbd5e1',
                      fontWeight: entry.debit > 0 ? 'bold' : 'normal',
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
                      color: entry.credit > 0 ? 'var(--success)' : '#cbd5e1',
                      fontWeight: entry.credit > 0 ? 'bold' : 'normal',
                    }}
                  >
                    {entry.credit > 0
                      ? `Rs. ${entry.credit.toLocaleString()}`
                      : '—'}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color:
                        entry.balance_after === 0
                          ? 'var(--success)'
                          : 'var(--text-primary)',
                    }}
                  >
                    Rs. {entry.balance_after?.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--border-color)',
            color: '#94a3b8',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📒</div>
            <h3>Select a party from above to view their Khata</h3>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* ADD ENTRY MODAL */}
      {isAddEntryModalOpen && (
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
            className="card"
            style={{
              width: '450px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '10px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                color: 'var(--text-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {entryType === 'DEBIT'
                ? '➕ Add New Udhaar'
                : '💵 Receive Payment'}
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                background: 'var(--bg-hover)',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  background:
                    entryType === 'DEBIT' ? 'var(--danger)' : 'transparent',
                  color:
                    entryType === 'DEBIT' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => setEntryType('DEBIT')}
              >
                Debit (Udhaar)
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  background:
                    entryType === 'CREDIT' ? 'var(--success)' : 'transparent',
                  color:
                    entryType === 'CREDIT' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => setEntryType('CREDIT')}
              >
                Credit (Jama)
              </button>
            </div>

            <form
              onSubmit={handleAddEntry}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {entryType === 'DEBIT' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Inventory Item (Optional)
                    </label>
                    <select
                      className="input-field"
                      value={entryData.item_id}
                      onChange={(e) => {
                        const selected = inventoryItems.find(
                          (i) => i.id === parseInt(e.target.value),
                        );
                        const newAmount = selected
                          ? selected.selling_price * entryData.qty
                          : entryData.amount;
                        setEntryData({
                          ...entryData,
                          item_id: e.target.value,
                          amount: newAmount,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      <option value="">-- Manual Entry --</option>
                      {inventoryItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (Rs. {i.selling_price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={entryData.qty}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const selected = inventoryItems.find(
                          (i) => i.id === parseInt(entryData.item_id),
                        );
                        const newAmount = selected
                          ? selected.selling_price * qty
                          : entryData.amount;
                        setEntryData({ ...entryData, qty, amount: newAmount });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Amount (Rs.)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={entryData.amount}
                  onChange={(e) =>
                    setEntryData({ ...entryData, amount: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={entryData.date}
                  onChange={(e) =>
                    setEntryData({ ...entryData, date: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>

              {entryType === 'CREDIT' && (
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Payment Method
                  </label>
                  <select
                    value={entryData.method}
                    onChange={(e) =>
                      setEntryData({ ...entryData, method: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="DISCOUNT">Discount / Return</option>
                  </select>
                </div>
              )}

              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Invoice # / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={entryData.ref}
                  onChange={(e) =>
                    setEntryData({ ...entryData, ref: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Notes / Particulars*
                </label>
                <input
                  type="text"
                  required
                  value={entryData.notes}
                  onChange={(e) =>
                    setEntryData({ ...entryData, notes: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background:
                      entryType === 'DEBIT'
                        ? 'var(--danger)'
                        : 'var(--success)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddEntryModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {isEditRecordModalOpen && editingRecord && (
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
            className="card"
            style={{
              width: '400px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '10px',
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
                ✏️ Edit Record
              </h3>
              <button
                onClick={() => setIsEditRecordModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleEditRecord}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Amount (Locked)
                </label>
                <input
                  type="text"
                  disabled
                  value={`Rs. ${parseFloat(entryData.amount).toLocaleString()}`}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-secondary)',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={entryData.date}
                  onChange={(e) =>
                    setEntryData({ ...entryData, date: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Notes / Particulars
                </label>
                <input
                  type="text"
                  required
                  value={entryData.notes}
                  onChange={(e) =>
                    setEntryData({ ...entryData, notes: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Update Record
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(editingRecord.id)}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isCustomerModalOpen && (
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
            className="card"
            style={{
              width: '400px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '10px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                color: 'var(--brand-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {editingCustomer
                ? '✏️ Edit Party Profile'
                : '+ Register New Party'}
            </h3>
            <form
              onSubmit={handleSaveCustomer}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--bg-hover)',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                {customerForm.avatar ? (
                  <img
                    src={customerForm.avatar}
                    alt="Preview"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    No Pic
                  </div>
                )}
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            avatar: reader.result,
                          }));
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ fontSize: '0.7rem', marginTop: '2px' }}
                  />
                </div>
              </div>
              <input
                type="text"
                className="input-field"
                required
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                placeholder="Party Full Name"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <input
                type="text"
                className="input-field"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: sanitizePhone(e.target.value),
                  })
                }
                placeholder="Phone Number"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                  }}
                >
                  Credit Limit (Rs.) [0 for unlimited]
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={customerForm.credit_limit}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                />
              </div>
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
                  {editingCustomer ? 'Save Changes' : 'Save Party'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsCustomerModalOpen(false)}
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
