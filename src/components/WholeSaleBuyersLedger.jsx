import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const fmt = (n) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

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

const SearchIcon = () => (
  <svg {...iconBase}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PlusIcon = () => (
  <svg {...iconBase}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const ArchiveIcon = () => (
  <svg {...iconBase}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);
const CloseIcon = () => (
  <svg {...iconBase}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BookIcon = () => (
  <svg {...iconBase} width="28" height="28">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const UserIcon = () => (
  <svg {...iconBase} width="28" height="28">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
const SegmentChip = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '6px 10px',
      fontSize: '0.75rem',
      fontWeight: 500,
      borderRadius: '6px',
      border: 'none',
      background: active ? 'var(--ink-0)' : 'transparent',
      color: active ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
      boxShadow: active ? '0 0 0 1px var(--ink-3)' : 'none',
      cursor: 'pointer',
      transition: 'background-color 120ms ease, color 120ms ease',
    }}
  >
    {icon}
    {children}
  </button>
);

const Field = ({ label, children }) => (
  <div>
    <label
      style={{
        fontSize: '0.72rem',
        fontWeight: 500,
        color: 'var(--ink-fg-2)',
        display: 'block',
        marginBottom: '4px',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  fontSize: '0.82rem',
  width: '100%',
  outline: 'none',
};

const Modal = ({ children, onClose, width = 480 }) => (
  <div
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}
  >
    <div
      style={{
        width: `${width}px`,
        maxWidth: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--ink-0)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--ink-3)',
      }}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }) => (
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
      style={{
        margin: 0,
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--ink-fg)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {title}
    </h3>
    <button
      onClick={onClose}
      aria-label="Close"
      style={{
        background: 'var(--ink-1)',
        border: '1px solid var(--ink-3)',
        color: 'var(--ink-fg-2)',
        padding: '6px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <CloseIcon />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// KhataLedger (Wholesale)
// ─────────────────────────────────────────────────────────────
export default function KhataLedger({ currentUser, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Forms
  const [entryType, setEntryType] = useState('DEBIT');
  const [entryData, setEntryData] = useState(emptyEntryData());
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm());
  const [isSaving, setIsSaving] = useState(false);

  function emptyEntryData() {
    return {
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      method: 'CASH',
      ref: '',
      item_id: '',
      qty: 1,
    };
  }
  function emptyCustomerForm() {
    return { name: '', phone: '', credit_limit: 0, avatar: '' };
  }

  const toast = (msg, type = 'info') => {
    if (showToast) showToast(msg, type);
    else if (type === 'error') console.error(msg);
  };

  const loadCustomers = async () => {
    const ipc = getIpc();
    if (!ipc) return;
    try {
      const data = await ipc.invoke('get-customers');
      const active = (data || []).filter(
        (c) => c.is_active === 1 || c.is_active === undefined,
      );
      setCustomers(active);

      const fetchedItems = await ipc.invoke('get-items');
      setInventoryItems(fetchedItems || []);

      if (selectedCustomer) {
        const refreshed = active.find((c) => c.id === selectedCustomer.id);
        if (refreshed) setSelectedCustomer(refreshed);
        else setSelectedCustomer(null);
      }
      setError(null);
    } catch (err) {
      setError(err?.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (customerId) => {
    const ipc = getIpc();
    if (!ipc) return;
    try {
      const entries = await ipc.invoke('get-customer-ledger', customerId);
      setLedgerEntries(entries || []);
    } catch (err) {
      setError(err?.message || 'Could not load ledger.');
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);
  useEffect(() => {
    if (selectedCustomer) loadLedger(selectedCustomer.id);
  }, [selectedCustomer]);

  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  // ── Handlers
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc) return;
    const res = editingCustomer
      ? await ipc.invoke('update-customer', {
          id: editingCustomer.id,
          ...customerForm,
        })
      : await ipc.invoke('add-customer', customerForm);

    if (res.success) {
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      setCustomerForm(emptyCustomerForm());
      await loadCustomers();
      toast(
        editingCustomer ? 'Party updated.' : 'Party registered.',
        'success',
      );
    } else {
      toast('Save failed: ' + res.error, 'error');
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const ipc = getIpc();
    const amt = parseFloat(entryData.amount);
    if (!amt || amt <= 0) return toast('Enter a valid amount.', 'error');

    setIsSaving(true);
    const fullNotes = entryData.ref
      ? `${entryData.notes} (Ref: ${entryData.ref})`
      : entryData.notes;
    const selectedItem = inventoryItems.find(
      (i) => i.id === parseInt(entryData.item_id),
    );

    let res;
    try {
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
        setEntryData(emptyEntryData());
        await loadCustomers();
        await loadLedger(selectedCustomer.id);
        toast('Entry recorded.', 'success');
      } else {
        toast('Error: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc || !editingRecord) return;
    const res = await ipc.invoke('update-ledger-entry', {
      ledgerId: editingRecord.id,
      newDate: entryData.date,
      newNotes: entryData.notes,
      currentUser,
    });
    if (res.success) {
      setIsEditRecordModalOpen(false);
      setEditingRecord(null);
      await loadLedger(selectedCustomer.id);
      toast('Record updated.', 'success');
    } else {
      toast('Error: ' + res.error, 'error');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const ipc = getIpc();
    if (!ipc) return;
    const res = await ipc.invoke('delete-ledger-entry', {
      ledgerId: recordId,
      customerId: selectedCustomer.id,
      currentUser,
    });
    if (res.success) {
      setIsEditRecordModalOpen(false);
      setEditingRecord(null);
      await loadCustomers();
      await loadLedger(selectedCustomer.id);
      toast('Record deleted.', 'success');
    } else {
      toast('Error: ' + res.error, 'error');
    }
    setConfirmDelete(null);
  };

  const handleDeleteCustomer = async () => {
    if (ledgerEntries.length > 0)
      return toast('Has records. Archive instead of delete.', 'error');
    const ipc = getIpc();
    if (!ipc) return;
    const res = await ipc.invoke('delete-customer', {
      customerId: selectedCustomer.id,
      currentUser,
    });
    if (res.success) {
      toast('Party deleted.', 'success');
      setSelectedCustomer(null);
      await loadCustomers();
    } else {
      toast('Error: ' + res.error, 'error');
    }
    setConfirmDelete(null);
  };

  const handleToggleArchive = async () => {
    if (selectedCustomer.balance > 0)
      return toast('Cannot archive with outstanding debt.', 'error');
    const ipc = getIpc();
    if (!ipc) return;
    const res = await ipc.invoke('toggle-archive-customer', {
      customerId: selectedCustomer.id,
      is_active: 0,
      currentUser,
    });
    if (res.success) {
      toast('Party archived.', 'success');
      setSelectedCustomer(null);
      await loadCustomers();
    } else {
      toast('Error: ' + res.error, 'error');
    }
    setConfirmDelete(null);
  };

  const handleExportPDF = async () => {
    const ipc = getIpc();
    if (!ipc || !selectedCustomer) return;

    const rowsHtml = filteredLedger
      .map((e) => {
        const dateStr = e.created_at ? e.created_at.substring(0, 10) : '';
        return `
          <tr>
            <td>${dateStr}</td>
            <td>${e.description || ''}</td>
            <td class="r">${e.debit > 0 ? fmt(e.debit) : '—'}</td>
            <td class="r">${e.credit > 0 ? fmt(e.credit) : '—'}</td>
            <td class="r b">${fmt(e.balance_after)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>Khata — ${selectedCustomer.name}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1c1b17; background: #fff; margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d5c75; padding-bottom: 16px; margin-bottom: 24px; }
        h1 { margin: 0; color: #0d5c75; font-size: 20px; letter-spacing: -0.01em; }
        .meta { font-size: 12px; color: #5c5a52; }
        .info { background: #faf9f6; border: 1px solid #e7e4db; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f4f2ec; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px; text-align: left; color: #5c5a52; border-bottom: 1px solid #e7e4db; }
        td { padding: 9px 10px; border-bottom: 1px solid #e7e4db; font-size: 11px; }
        .r { text-align: right; font-variant-numeric: tabular-nums; }
        .b { font-weight: 600; color: #1c1b17; }
        .total { margin-top: 24px; text-align: right; font-size: 13px; }
        .total .label { font-size: 10px; color: #5c5a52; text-transform: uppercase; letter-spacing: 0.04em; }
        .total .amount { font-size: 20px; font-weight: 600; color: #9b3a32; }
      </style></head><body>
      <div class="header">
        <div>
          <h1>Khata Statement</h1>
          <p class="meta">Issued ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="meta" style="text-align: right;">
          <strong>${selectedCustomer.name}</strong><br/>
          ${selectedCustomer.phone || 'No phone'}<br/>
          Operator: ${currentUser?.username || 'Manager'}
        </div>
      </div>
      <div class="info">
        <div><strong>Credit limit:</strong> ${fmt(selectedCustomer.credit_limit)}</div>
        <div><strong>Account:</strong> #${selectedCustomer.id}</div>
        <div><strong>Range:</strong> ${filterStartDate || 'Start'} → ${filterEndDate || 'Now'}</div>
        <div><strong>Balance:</strong> ${fmt(selectedCustomer.balance)}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Particulars</th><th class="r">Debit +</th><th class="r">Credit −</th><th class="r">Balance</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="total">
        <div class="label">Net outstanding</div>
        <div class="amount">${fmt(selectedCustomer.balance)}</div>
      </div>
      </body></html>`;

    const res = await ipc.invoke('export-ledger-pdf', html);
    if (res.success && !res.canceled) toast('PDF exported.', 'success');
    else if (!res.canceled) toast('Export failed: ' + res.error, 'error');
  };

  // Filtering
  const filteredLedger = ledgerEntries
    .filter((entry) => {
      const matchesSearch = (entry.description || '')
        .toLowerCase()
        .includes(ledgerSearch.toLowerCase());
      const entryDate = entry.created_at
        ? entry.created_at.substring(0, 10)
        : '';
      const matchesStart = !filterStartDate || entryDate >= filterStartDate;
      const matchesEnd = !filterEndDate || entryDate <= filterEndDate;
      return matchesSearch && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const aT = new Date(a.created_at || 0).getTime();
      const bT = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? bT - aT : aT - bT;
    });

  const totalDebit = ledgerEntries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = ledgerEntries.reduce((s, e) => s + (e.credit || 0), 0);
  const currentBalance = selectedCustomer?.balance || 0;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: 'var(--ink-fg-3)',
          fontSize: '0.85rem',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading khata…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--ink-danger)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--ink-fg)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Wholesale Ledger
          </h2>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            Khata for wholesale buyers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setCustomerForm(emptyCustomerForm());
            setIsCustomerModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 500,
            background: 'var(--brand-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <PlusIcon /> Add party
        </button>
      </div>

      {/* Party grid */}
      {customers.length === 0 ? (
        <div
          style={{
            background: 'var(--ink-0)',
            border: '1px dashed var(--ink-3)',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--ink-fg-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <UserIcon />
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            No parties yet
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
            Add your first wholesale buyer to start tracking their khata.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
            maxHeight: '190px',
            overflowY: 'auto',
          }}
        >
          {customers.map((c) => {
            const selected = selectedCustomer?.id === c.id;
            const owes = c.balance > 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                style={{
                  position: 'relative',
                  textAlign: 'left',
                  background: selected ? 'var(--ink-1)' : 'var(--ink-0)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: 'inherit',
                }}
              >
                {selected && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 10,
                      bottom: 10,
                      width: '3px',
                      borderRadius: '2px',
                      background: 'var(--brand-primary)',
                    }}
                  />
                )}
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt=""
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--ink-2)',
                      color: 'var(--ink-fg-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      flexShrink: 0,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    {getInitials(c.name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--ink-fg)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--ink-fg-3)',
                      marginTop: '2px',
                    }}
                  >
                    {c.phone || 'No phone'}
                  </div>
                  <div
                    className="monospace tabular"
                    style={{
                      fontSize: '0.72rem',
                      marginTop: '4px',
                      color: owes ? 'var(--ink-danger)' : 'var(--ink-fg-2)',
                    }}
                  >
                    {owes ? fmt(c.balance) : 'Clear'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN LEDGER */}
      {selectedCustomer ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* KPI + actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid var(--ink-3)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '0' }}>
              {[
                {
                  label: 'Debit',
                  value: totalDebit,
                  color: 'var(--ink-fg)',
                },
                {
                  label: 'Credit',
                  value: totalCredit,
                  color: 'var(--ink-fg)',
                },
                {
                  label: 'Balance',
                  value: currentBalance,
                  color:
                    currentBalance > 0 ? 'var(--ink-danger)' : 'var(--ink-fg)',
                },
              ].map((k, i) => (
                <div
                  key={k.label}
                  style={{
                    padding: '0 16px',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--ink-3)',
                    minWidth: '120px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    {k.label}
                  </div>
                  <div
                    className="monospace tabular"
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: k.color,
                      marginTop: '2px',
                    }}
                  >
                    {fmt(k.value)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setEntryType('CREDIT');
                  setEntryData(emptyEntryData());
                  setIsAddEntryModalOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Receive payment
              </button>
              <button
                onClick={() => {
                  setEntryType('DEBIT');
                  setEntryData(emptyEntryData());
                  setIsAddEntryModalOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <PlusIcon /> Add udhaar
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  setEditingCustomer(selectedCustomer);
                  setCustomerForm({ ...selectedCustomer });
                  setIsCustomerModalOpen(true);
                }}
                aria-label="Edit party"
                style={{
                  padding: '7px 10px',
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg-2)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <EditIcon />
              </button>
              {currentUser?.role === 'ADMIN' &&
                (ledgerEntries.length === 0 ? (
                  confirmDelete === 'customer' ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleDeleteCustomer}
                        style={{
                          padding: '7px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          background: 'var(--ink-danger)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: '7px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          background: 'var(--ink-1)',
                          color: 'var(--ink-fg-2)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete('customer')}
                      aria-label="Delete party"
                      style={{
                        padding: '7px 10px',
                        background: 'var(--ink-1)',
                        color: 'var(--ink-fg-2)',
                        border: '1px solid var(--ink-3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <TrashIcon />
                    </button>
                  )
                ) : confirmDelete === 'customer' ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={handleToggleArchive}
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        background: 'var(--ink-danger)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Confirm archive
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        background: 'var(--ink-1)',
                        color: 'var(--ink-fg-2)',
                        border: '1px solid var(--ink-3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete('customer')}
                    aria-label="Archive party"
                    style={{
                      padding: '7px 10px',
                      background: 'var(--ink-1)',
                      color: 'var(--ink-fg-2)',
                      border: '1px solid var(--ink-3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ArchiveIcon />
                  </button>
                ))}
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--ink-1)',
              borderBottom: '1px solid var(--ink-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-fg-3)',
                  display: 'flex',
                }}
              >
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search particulars"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: '32px',
                  height: '32px',
                  background: 'var(--ink-0)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--ink-fg-2)',
                background: 'var(--ink-0)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.72rem',
                  background: 'transparent',
                  color: 'var(--ink-fg)',
                }}
              />
              <span style={{ color: 'var(--ink-fg-3)' }}>→</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.72rem',
                  background: 'transparent',
                  color: 'var(--ink-fg)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '2px',
                background: 'var(--ink-0)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <SegmentChip
                active={sortOrder === 'desc'}
                onClick={() => setSortOrder('desc')}
              >
                Newest
              </SegmentChip>
              <SegmentChip
                active={sortOrder === 'asc'}
                onClick={() => setSortOrder('asc')}
              >
                Oldest
              </SegmentChip>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 2.5fr 1fr 1fr 1fr',
                background: 'var(--ink-2)',
                color: 'var(--ink-fg-2)',
                padding: '10px 16px',
                fontSize: '0.7rem',
                fontWeight: 500,
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <span>Date</span>
              <span>Particulars</span>
              <span style={{ textAlign: 'right' }}>Debit +</span>
              <span style={{ textAlign: 'right' }}>Credit −</span>
              <span style={{ textAlign: 'right' }}>Balance</span>
            </div>

            {filteredLedger.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-fg-3)',
                  gap: '8px',
                  padding: '40px 20px',
                }}
              >
                <BookIcon />
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  No entries
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  Use "Add udhaar" to create the first entry.
                </div>
              </div>
            ) : (
              filteredLedger.map((entry, idx) => (
                <div
                  key={entry.id}
                  onClick={() => {
                    setEditingRecord(entry);
                    setEntryData({
                      ...emptyEntryData(),
                      date: entry.created_at
                        ? entry.created_at.substring(0, 10)
                        : '',
                      notes: entry.description || '',
                      amount: entry.debit || entry.credit || '',
                    });
                    setIsEditRecordModalOpen(true);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.9fr 2.5fr 1fr 1fr 1fr',
                    padding: '10px 16px',
                    fontSize: '0.8rem',
                    borderBottom:
                      idx === filteredLedger.length - 1
                        ? 'none'
                        : '1px solid var(--ink-3)',
                    cursor: 'pointer',
                    background: 'var(--ink-0)',
                  }}
                >
                  <span
                    className="monospace"
                    style={{
                      color: 'var(--ink-fg-3)',
                      fontSize: '0.72rem',
                    }}
                  >
                    {entry.created_at ? entry.created_at.substring(0, 10) : ''}
                  </span>
                  <span style={{ color: 'var(--ink-fg)', fontWeight: 500 }}>
                    {entry.description || '—'}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      color:
                        entry.debit > 0
                          ? 'var(--ink-danger)'
                          : 'var(--ink-fg-3)',
                    }}
                  >
                    {entry.debit > 0 ? fmt(entry.debit) : '—'}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      color:
                        entry.credit > 0
                          ? 'var(--ink-success)'
                          : 'var(--ink-fg-3)',
                    }}
                  >
                    {entry.credit > 0 ? fmt(entry.credit) : '—'}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: 'var(--ink-fg)',
                    }}
                  >
                    {fmt(entry.balance_after)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        customers.length > 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ink-0)',
              borderRadius: '12px',
              border: '1px solid var(--ink-3)',
              color: 'var(--ink-fg-3)',
              gap: '8px',
            }}
          >
            <BookIcon />
            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Select a party
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              Choose a wholesale buyer above to view their khata.
            </div>
          </div>
        )
      )}

      {/* ────────── ADD ENTRY MODAL ────────── */}
      {isAddEntryModalOpen && (
        <Modal onClose={() => setIsAddEntryModalOpen(false)} width={480}>
          <ModalHeader
            title={entryType === 'DEBIT' ? 'Add udhaar' : 'Receive payment'}
            onClose={() => setIsAddEntryModalOpen(false)}
          />
          <div
            style={{
              display: 'flex',
              gap: '2px',
              marginBottom: '16px',
              background: 'var(--ink-1)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <SegmentChip
              active={entryType === 'DEBIT'}
              onClick={() => setEntryType('DEBIT')}
            >
              Debit (udhaar)
            </SegmentChip>
            <SegmentChip
              active={entryType === 'CREDIT'}
              onClick={() => setEntryType('CREDIT')}
            >
              Credit (jama)
            </SegmentChip>
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
                  gap: '10px',
                }}
              >
                <Field label="Inventory item (optional)">
                  <select
                    style={inputStyle}
                    value={entryData.item_id}
                    onChange={(e) => {
                      const sel = inventoryItems.find(
                        (i) => i.id === parseInt(e.target.value),
                      );
                      setEntryData({
                        ...entryData,
                        item_id: e.target.value,
                        amount: sel
                          ? sel.selling_price * entryData.qty
                          : entryData.amount,
                      });
                    }}
                  >
                    <option value="">Manual entry</option>
                    {inventoryItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — {fmt(i.selling_price)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    className="monospace tabular"
                    style={inputStyle}
                    value={entryData.qty}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      const sel = inventoryItems.find(
                        (i) => i.id === parseInt(entryData.item_id),
                      );
                      setEntryData({
                        ...entryData,
                        qty,
                        amount: sel
                          ? sel.selling_price * qty
                          : entryData.amount,
                      });
                    }}
                  />
                </Field>
              </div>
            )}
            <Field label="Amount (Rs.) *">
              <input
                type="number"
                step="0.01"
                required
                className="monospace tabular"
                style={inputStyle}
                value={entryData.amount}
                onChange={(e) =>
                  setEntryData({ ...entryData, amount: e.target.value })
                }
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                style={inputStyle}
                value={entryData.date}
                onChange={(e) =>
                  setEntryData({ ...entryData, date: e.target.value })
                }
              />
            </Field>
            {entryType === 'CREDIT' && (
              <Field label="Payment method">
                <select
                  style={inputStyle}
                  value={entryData.method}
                  onChange={(e) =>
                    setEntryData({ ...entryData, method: e.target.value })
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="DISCOUNT">Discount / return</option>
                </select>
              </Field>
            )}
            <Field label="Reference (optional)">
              <input
                type="text"
                style={inputStyle}
                value={entryData.ref}
                onChange={(e) =>
                  setEntryData({ ...entryData, ref: e.target.value })
                }
              />
            </Field>
            <Field label="Notes / particulars *">
              <input
                type="text"
                required
                style={inputStyle}
                value={entryData.notes}
                onChange={(e) =>
                  setEntryData({ ...entryData, notes: e.target.value })
                }
              />
            </Field>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                paddingTop: '12px',
                borderTop: '1px solid var(--ink-3)',
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsAddEntryModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg-2)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '8px 20px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ────────── EDIT RECORD MODAL ────────── */}
      {isEditRecordModalOpen && editingRecord && (
        <Modal onClose={() => setIsEditRecordModalOpen(false)} width={440}>
          <ModalHeader
            title="Edit record"
            onClose={() => setIsEditRecordModalOpen(false)}
          />
          <form
            onSubmit={handleEditRecord}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <Field label="Amount (locked)">
              <input
                type="text"
                disabled
                className="monospace tabular"
                value={fmt(entryData.amount)}
                style={{
                  ...inputStyle,
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg-2)',
                  cursor: 'not-allowed',
                }}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                style={inputStyle}
                value={entryData.date}
                onChange={(e) =>
                  setEntryData({ ...entryData, date: e.target.value })
                }
              />
            </Field>
            <Field label="Notes / particulars">
              <input
                type="text"
                required
                style={inputStyle}
                value={entryData.notes}
                onChange={(e) =>
                  setEntryData({ ...entryData, notes: e.target.value })
                }
              />
            </Field>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--ink-3)',
                marginTop: '4px',
              }}
            >
              {confirmDelete === editingRecord.id ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(editingRecord.id)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--ink-danger)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--ink-1)',
                      color: 'var(--ink-fg-2)',
                      border: '1px solid var(--ink-3)',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(editingRecord.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-danger)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Update
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ────────── CUSTOMER PROFILE MODAL ────────── */}
      {isCustomerModalOpen && (
        <Modal onClose={() => setIsCustomerModalOpen(false)} width={460}>
          <ModalHeader
            title={editingCustomer ? 'Edit party' : 'Add party'}
            onClose={() => setIsCustomerModalOpen(false)}
          />
          <form
            onSubmit={handleSaveCustomer}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--ink-1)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
              }}
            >
              {customerForm.avatar ? (
                <img
                  src={customerForm.avatar}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--ink-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-fg-3)',
                    fontSize: '0.68rem',
                    border: '1px solid var(--ink-3)',
                  }}
                >
                  No pic
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      avatar: reader.result,
                    }));
                  reader.readAsDataURL(file);
                }}
                style={{ fontSize: '0.75rem', color: 'var(--ink-fg-2)' }}
              />
            </div>
            <Field label="Name *">
              <input
                type="text"
                required
                style={inputStyle}
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                style={inputStyle}
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: sanitizePhone(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Credit limit (0 = unlimited)">
              <input
                type="number"
                className="monospace tabular"
                style={inputStyle}
                value={customerForm.credit_limit}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    credit_limit: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Field>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                paddingTop: '12px',
                borderTop: '1px solid var(--ink-3)',
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--ink-1)',
                  color: 'var(--ink-fg-2)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {editingCustomer ? 'Save changes' : 'Save party'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
