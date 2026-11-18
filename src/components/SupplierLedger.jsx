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

export default function SupplierLedger({ currentUser }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals State
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Form States
  const [entryType, setEntryType] = useState('DEBIT'); // 'DEBIT' (Billed) | 'CREDIT' (Paid)
  const [entryData, setEntryData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    method: 'CASH',
    ref: '',
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    avatar: '',
    credit_limit: 0,
    opening_balance: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadSuppliers = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-suppliers', true);
      const activeSuppliers = (data || []).filter(
        (s) => s.is_active === 1 || s.is_active === undefined,
      );
      setSuppliers(activeSuppliers);

      if (selectedSupplier) {
        const refreshed = activeSuppliers.find(
          (s) => s.id === selectedSupplier.id,
        );
        if (refreshed) setSelectedSupplier(refreshed);
        else setSelectedSupplier(null);
      }
    }
  };

  const loadLedger = async (supplierId) => {
    const ipc = getIpc();
    if (ipc) {
      const entries = await ipc.invoke('get-supplier-ledger', supplierId);
      setLedgerEntries(entries || []);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);
  useEffect(() => {
    if (selectedSupplier) loadLedger(selectedSupplier.id);
  }, [selectedSupplier]);

  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  // --- HANDLERS ---

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const handlerName = editingSupplier ? 'update-supplier' : 'add-supplier';
      const res = await ipc.invoke(handlerName, {
        supplier: { ...supplierForm, id: editingSupplier?.id },
        currentUser,
      });

      if (res.success) {
        setIsSupplierModalOpen(false);
        setEditingSupplier(null);
        setSupplierForm({
          name: '',
          company: '',
          phone: '',
          address: '',
          avatar: '',
          credit_limit: 0,
          opening_balance: 0,
        });
        loadSuppliers();
        addToast(
          editingSupplier
            ? 'Supplier updated successfully'
            : 'Supplier registered successfully',
          'success',
        );
      } else {
        addToast('Error saving supplier: ' + res.error, 'error');
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

    if (ipc) {
      let res;
      if (entryType === 'DEBIT') {
        // In Supplier Ledger, Debit = We owe them more (Purchase)
        res = await ipc.invoke('record-purchase', {
          supplier_id: selectedSupplier.id,
          item_id: null,
          qty_received: 1,
          unit_cost: amt,
          payment_type: 'CREDIT',
          invoice_no: entryData.ref || 'MANUAL-DEBIT',
          date: entryData.date,
          currentUser,
        });
      } else {
        // Credit = We paid them
        res = await ipc.invoke('record-supplier-payment', {
          supplier_id: selectedSupplier.id,
          amount: amt,
          payment_method: entryData.method,
          notes: fullNotes,
          currentUser,
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
        });
        loadSuppliers();
        loadLedger(selectedSupplier.id);
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
        loadLedger(selectedSupplier.id);
        addToast('Record updated successfully', 'success');
      } else {
        addToast('Error updating record: ' + res.error, 'error');
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (
      !window.confirm(
        'Delete this ledger entry? This will recalculate the balance.',
      )
    )
      return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-ledger-entry', {
        ledgerId: recordId,
        customerId: selectedSupplier.id,
        isSupplier: true,
        currentUser,
      });
      if (res.success) {
        setIsEditRecordModalOpen(false);
        setEditingRecord(null);
        loadSuppliers();
        loadLedger(selectedSupplier.id);
        addToast('Record deleted successfully', 'success');
      } else {
        addToast('Error deleting record: ' + res.error, 'error');
      }
    }
  };
  const handleDeleteSupplier = async () => {
    if (ledgerEntries.length > 0)
      return addToast(
        'Cannot delete supplier with existing records. Archive them instead.',
        'error',
      );
    if (!window.confirm(`Permanently DELETE "${selectedSupplier.name}"?`))
      return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-supplier', {
        supplierId: selectedSupplier.id,
        currentUser,
      });
      if (res.success) {
        addToast('Supplier deleted successfully', 'success');
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        addToast('Delete Error: ' + res.error, 'error');
      }
    }
  };

  const handleToggleArchive = async () => {
    if (selectedSupplier.balance > 0)
      return addToast(
        'Cannot archive vendor with outstanding payable balance.',
        'error',
      );
    if (!window.confirm(`Archive "${selectedSupplier.name}"?`)) return;
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-supplier', {
        supplierId: selectedSupplier.id,
        is_active: 0,
        currentUser,
      });
      if (res.success) {
        addToast('Supplier archived successfully', 'success');
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        addToast('Archive Error: ' + res.error, 'error');
      }
    }
  };

  // Export PDF (Built natively)
  const handleExportPDF = async () => {
    const ipc = getIpc();
    if (ipc && selectedSupplier) {
      const rowsHtml = ledgerEntries
        .map(
          (e) => `
        <tr>
          <td>${e.date}</td>
          <td>${e.description}</td>
          <td class="right color-green">${e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-'}</td>
          <td class="right color-red">${e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-'}</td>
          <td class="right bold">Rs. ${e.balance_after?.toLocaleString()}</td>
        </tr>
      `,
        )
        .join('');

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8" /><title>Supplier Statement - ${selectedSupplier.name}</title>
        <style>@page { size: A4 portrait; margin: 15mm; } body { font-family: 'Helvetica Neue', sans-serif; padding: 20px; color: #0f172a; background: #fff; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--brand-primary); padding-bottom: 16px; margin-bottom: 24px; } .title-area h1 { margin: 0; color: var(--brand-primary); font-size: 22px; text-transform: uppercase; } .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; } .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } table { width: 100%; border-collapse: collapse; margin-top: 8px; } th { background: var(--brand-primary); color: white; font-size: 11px; text-transform: uppercase; padding: 12px 10px; text-align: left; } td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; } .right { text-align: right; } .bold { font-weight: bold; } .color-red { color: var(--danger); } .color-green { color: var(--success); } .total-card { margin-top: 24px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: right; float: right; width: 280px; } .total-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; } .total-card .amount { font-size: 20px; font-weight: 900; color: var(--danger); margin-top: 4px; } .clearfix::after { content: ""; clear: both; display: table; }</style></head><body>
        <div class="header"><div class="title-area"><h1>Supplier Statement</h1><p>ShopMate Enterprise</p></div><div style="text-align: right;"><p style="margin: 0; font-weight: bold; font-size: 13px;">Issued Date: ${new Date().toLocaleDateString()}</p></div></div>
        <div class="meta-box"><div><strong>Vendor Name:</strong> ${selectedSupplier.name}<br/><strong>Company:</strong> ${selectedSupplier.company || 'N/A'}<br/><strong>Phone:</strong> ${selectedSupplier.phone || 'N/A'}</div><div><strong>Account ID:</strong> #${selectedSupplier.id}<br/><strong>Operator:</strong> ${currentUser?.username || 'Manager'}</div></div>
        <table><thead><tr><th>Date</th><th>Description</th><th class="right">Paid (-)</th><th class="right">Billed (+)</th><th class="right">Balance</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <div class="clearfix"><div class="total-card"><div class="label">Total Outstanding Payable</div><div class="amount">Rs. ${selectedSupplier.balance?.toLocaleString()}</div></div></div>
        </body></html>`;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled)
        addToast('PDF exported successfully', 'success');
      else if (!res.canceled)
        addToast('PDF Export failed: ' + res.error, 'error');
    }
  };

  // Filtering
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company &&
        s.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredLedger = ledgerEntries.filter((entry) => {
    const matchesSearch = (entry.description || '')
      .toLowerCase()
      .includes(ledgerSearch.toLowerCase());
    let matchesDate = true;
    const entryDate = entry.created_at
      ? entry.created_at.substring(0, 10)
      : entry.date
        ? entry.date.substring(0, 10)
        : '';
    if (filterStartDate && entryDate < filterStartDate) matchesDate = false;
    if (filterEndDate && entryDate > filterEndDate) matchesDate = false;
    return matchesSearch && matchesDate;
  });

  // KPI Calculations
  const totalBilled = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const currentBalance = selectedSupplier?.balance || 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1, // 👈 ADD THIS
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
          Supplier Payables Ledger
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
            setEditingSupplier(null);
            setSupplierForm({
              name: '',
              company: '',
              phone: '',
              address: '',
              avatar: '',
              credit_limit: 0,
              opening_balance: 0,
            });
            setIsSupplierModalOpen(true);
          }}
        >
          + Register Supplier
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
        {filteredSuppliers.map((supp) => {
          const isSelected = selectedSupplier?.id === supp.id;
          const hasPayable = supp.balance > 0;
          return (
            <div
              key={supp.id}
              onClick={() => setSelectedSupplier(supp)}
              style={{
                background: isSelected ? '#f0f9ff' : '#ffffff',
                border: isSelected
                  ? '2px solid var(--brand-primary)'
                  : '1px solid #e2e8f0',
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
              {supp.avatar ? (
                <img
                  src={supp.avatar}
                  alt={supp.name}
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
                    background: '#f59e0b',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  {supp.name.substring(0, 2).toUpperCase()}
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
                  {supp.name}
                </div>
                <div
                  style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                >
                  {supp.company || supp.phone || 'No Agency Info'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      background: hasPayable ? '#fee2e2' : '#d1fae5',
                      color: hasPayable ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {hasPayable
                      ? `Payable: Rs. ${supp.balance.toLocaleString()}`
                      : 'Clear'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredSuppliers.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            No suppliers found.
          </div>
        )}
      </div>

      {/* MAIN LEDGER AREA */}
      {selectedSupplier ? (
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
              borderBottom: '1px solid #e2e8f0',
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
                  Total Billed (Credit)
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
                  Rs. {totalBilled.toLocaleString()}
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
                  Total Paid (Debit)
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
                  Rs. {totalPaid.toLocaleString()}
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
                  Current Payable
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
                  background: '#e0f2fe',
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
                  });
                  setIsAddEntryModalOpen(true);
                }}
              >
                Pay Supplier
              </button>
              <button
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: '#fee2e2',
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
                  });
                  setIsAddEntryModalOpen(true);
                }}
              >
                + Add Bill
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
                  setEditingSupplier(selectedSupplier);
                  setSupplierForm({ ...selectedSupplier });
                  setIsSupplierModalOpen(true);
                }}
              >
                Edit
              </button>

              <button
                className="btn btn-primary"
                style={{
                  padding: '8px 12px',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={handleExportPDF}
              >
                Export PDF
              </button>

              {currentUser?.role === 'ADMIN' && (
                <>
                  {ledgerEntries.length === 0 ? (
                    <button
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        background: '#fef2f2',
                        color: 'var(--danger)',
                        fontWeight: 'bold',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={handleDeleteSupplier}
                    >
                      🗑️ Delete
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        background: '#fef3c7',
                        color: '#d97706',
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
              borderBottom: '1px solid #e2e8f0',
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
                gridTemplateColumns: '1fr 2.5fr 1fr 1fr 1fr',
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
              <span>Description / Reference</span>
              <span style={{ textAlign: 'right' }}>Paid (Debit -)</span>
              <span style={{ textAlign: 'right' }}>Billed (Credit +)</span>
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
                    // If it's a GRN/Purchase, the entry might have a different ID structure.
                    // We pass the whole entry so the modal knows what to do.
                    setEntryData({
                      date: entry.created_at
                        ? entry.created_at.substring(0, 10)
                        : entry.date
                          ? entry.date.substring(0, 10)
                          : '',
                      notes: entry.description,
                      amount: entry.debit || entry.credit,
                      ref: entry.invoice_no || '',
                    });
                    setIsEditRecordModalOpen(true);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2.5fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                  }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {entry.created_at
                      ? entry.created_at.substring(0, 10)
                      : entry.date}
                  </span>
                  <span
                    style={{ color: 'var(--text-primary)', fontWeight: '500' }}
                  >
                    {entry.description}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: entry.debit > 0 ? 'var(--success)' : '#cbd5e1',
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
                      color: entry.credit > 0 ? 'var(--danger)' : '#cbd5e1',
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
                          : '#1e293b',
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
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚚</div>
            <h3>
              Select a supplier from above to view their payable statement
            </h3>
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
              width: '400px',
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
                ? '➕ Add Manual Bill (We Owe)'
                : '💵 Pay Supplier'}
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
                  color: entryType === 'DEBIT' ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => setEntryType('DEBIT')}
              >
                Debit (Bill)
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  background:
                    entryType === 'CREDIT' ? 'var(--success)' : 'transparent',
                  color: entryType === 'CREDIT' ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => setEntryType('CREDIT')}
              >
                Credit (Payment)
              </button>
            </div>

            <form
              onSubmit={handleAddEntry}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: '#475569',
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
                    color: '#475569',
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
                      color: '#475569',
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
                    color: '#475569',
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
                    color: '#475569',
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
                    background: '#e2e8f0',
                    border: 'none',
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
                    color: '#475569',
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
                    color: '#94a3b8',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: '#475569',
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
                    color: '#475569',
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
                    background: '#fee2e2',
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

      {/* SUPPLIER PROFILE MODAL */}
      {isSupplierModalOpen && (
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
              width: '420px',
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
              {editingSupplier
                ? '✏️ Edit Supplier Profile'
                : '+ Register New Supplier'}
            </h3>
            <form
              onSubmit={handleSaveSupplier}
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
                {supplierForm.avatar ? (
                  <img
                    src={supplierForm.avatar}
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
                      background: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: '#475569',
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
                      color: '#475569',
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
                          setSupplierForm((prev) => ({
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
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
                placeholder="Supplier / Vendor Name*"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  className="input-field"
                  value={supplierForm.company}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      company: e.target.value,
                    })
                  }
                  placeholder="Company / Agency"
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
                <input
                  type="text"
                  className="input-field"
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      phone: sanitizePhone(e.target.value),
                    })
                  }
                  placeholder="Phone"
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                  }}
                />
              </div>
              <input
                type="text"
                className="input-field"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
                placeholder="Address"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 'bold',
                    }}
                  >
                    Credit Limit (Rs.)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={supplierForm.credit_limit}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
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
                {!editingSupplier && (
                  <div>
                    <label
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 'bold',
                      }}
                    >
                      Opening Debt (Rs.)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={supplierForm.opening_balance}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          opening_balance: parseFloat(e.target.value) || 0,
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
                )}
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
                  {editingSupplier ? 'Save Changes' : 'Save Supplier'}
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
                  onClick={() => setIsSupplierModalOpen(false)}
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
