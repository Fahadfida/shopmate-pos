import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Helpers & Initials
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
const EyeIcon = () => (
  <svg {...iconBase} width={14} height={14}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const BookIcon = () => (
  <svg {...iconBase} width="28" height="28">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const TruckIcon = () => (
  <svg {...iconBase} width="28" height="28">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
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
  boxSizing: 'border-box',
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
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
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
        borderRadius: '14px',
        border: '1px solid var(--ink-3)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
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
// SupplierLedger Component
// ─────────────────────────────────────────────────────────────
export default function SupplierLedger({ currentUser, showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals State
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isRecordEditMode, setIsRecordEditMode] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const toast = (message, type = 'info') => {
    if (showToast) showToast(message, type);
    else {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3500);
    }
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

      const fetchedItems = await ipc.invoke('get-items');
      setInventoryItems(fetchedItems || []);

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

  // Close record detail modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedRecord) {
        closeRecordModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  const openRecordModal = (entry) => {
    setSelectedRecord(entry);
    setEntryData({
      date: entry.created_at
        ? entry.created_at.substring(0, 10)
        : entry.date
          ? entry.date.substring(0, 10)
          : '',
      notes: entry.description || '',
      amount: entry.debit || entry.credit || '',
      ref: entry.invoice_no || '',
      item_id: '',
      qty: entry.qty || 1,
      method: 'CASH',
    });
    setIsRecordEditMode(false);
    setConfirmDelete(null);
  };

  const closeRecordModal = () => {
    setSelectedRecord(null);
    setIsRecordEditMode(false);
    setConfirmDelete(null);
  };

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
        toast(
          editingSupplier
            ? 'Supplier updated successfully'
            : 'Supplier registered successfully',
          'success',
        );
      } else {
        toast('Error saving supplier: ' + res.error, 'error');
      }
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

    if (ipc) {
      let res;
      if (entryType === 'DEBIT') {
        res = await ipc.invoke('record-purchase', {
          supplier_id: selectedSupplier.id,
          item_id: selectedItem ? selectedItem.id : null,
          qty_received: selectedItem ? parseInt(entryData.qty) : 1,
          unit_cost: selectedItem ? amt / parseInt(entryData.qty) : amt,
          payment_type: 'CREDIT',
          invoice_no: entryData.ref || 'MANUAL-DEBIT',
          date: entryData.date,
          currentUser,
        });
      } else {
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
          item_id: '',
          qty: 1,
        });
        loadSuppliers();
        loadLedger(selectedSupplier.id);
        toast('Entry recorded successfully', 'success');
      } else {
        toast('Error recording entry: ' + res.error, 'error');
      }
    }
    setIsSaving(false);
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc && selectedRecord) {
      setIsSaving(true);
      try {
        const res = await ipc.invoke('update-ledger-entry', {
          ledgerId: selectedRecord.id,
          newDate: entryData.date,
          newNotes: entryData.notes,
          currentUser,
        });
        if (res.success) {
          setSelectedRecord({
            ...selectedRecord,
            created_at: entryData.date,
            date: entryData.date,
            description: entryData.notes,
          });
          setIsRecordEditMode(false);
          loadLedger(selectedSupplier.id);
          toast('Record updated successfully', 'success');
        } else {
          toast('Error updating record: ' + res.error, 'error');
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const ipc = getIpc();
    if (ipc) {
      setIsSaving(true);
      try {
        const res = await ipc.invoke('delete-ledger-entry', {
          ledgerId: recordId,
          customerId: selectedSupplier.id,
          isSupplier: true,
          currentUser,
        });
        if (res.success) {
          closeRecordModal();
          loadSuppliers();
          loadLedger(selectedSupplier.id);
          toast('Record deleted successfully', 'success');
        } else {
          toast('Error deleting record: ' + res.error, 'error');
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteSupplier = async () => {
    if (ledgerEntries.length > 0)
      return toast(
        'Cannot delete supplier with existing records. Archive them instead.',
        'error',
      );
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('delete-supplier', {
        supplierId: selectedSupplier.id,
        currentUser,
      });
      if (res.success) {
        toast('Supplier deleted successfully', 'success');
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        toast('Delete Error: ' + res.error, 'error');
      }
    }
    setConfirmDelete(null);
  };

  const handleToggleArchive = async () => {
    if (selectedSupplier.balance > 0)
      return toast(
        'Cannot archive vendor with outstanding payable balance.',
        'error',
      );
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-supplier', {
        supplierId: selectedSupplier.id,
        is_active: 0,
        currentUser,
      });
      if (res.success) {
        toast('Supplier archived successfully', 'success');
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        toast('Archive Error: ' + res.error, 'error');
      }
    }
    setConfirmDelete(null);
  };

  const handleExportPDF = async () => {
    const ipc = getIpc();
    if (ipc && selectedSupplier) {
      const rowsHtml = filteredLedger
        .map(
          (e) => `
        <tr>
          <td>${e.date || (e.created_at ? e.created_at.substring(0, 10) : '')}</td>
          <td>${e.item_name || '—'}</td>
          <td>${e.description || ''}</td>
          <td class="r color-green">${e.credit > 0 ? fmt(e.credit) : '—'}</td>
          <td class="r color-red">${e.debit > 0 ? fmt(e.debit) : '—'}</td>
          <td class="r b">${fmt(e.balance_after)}</td>
        </tr>
      `,
        )
        .join('');

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8" />
        <title>Supplier Statement — ${selectedSupplier.name}</title>
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
          .color-red { color: #9b3a32; }
          .color-green { color: #3f7a52; }
          .total { margin-top: 24px; text-align: right; font-size: 13px; }
          .total .label { font-size: 10px; color: #5c5a52; text-transform: uppercase; letter-spacing: 0.04em; }
          .total .amount { font-size: 20px; font-weight: 600; color: #9b3a32; }
        </style></head><body>
        <div class="header">
          <div>
            <h1>Supplier Statement</h1>
            <p class="meta">Issued ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="meta" style="text-align: right;">
            <strong>${selectedSupplier.name}</strong> (${selectedSupplier.company || 'N/A'})<br/>
            ${selectedSupplier.phone || 'No phone'}<br/>
            Operator: ${currentUser?.username || 'Manager'}
          </div>
        </div>
        <div class="info">
          <div><strong>Credit limit:</strong> ${fmt(selectedSupplier.credit_limit)}</div>
          <div><strong>Account:</strong> #${selectedSupplier.id}</div>
          <div><strong>Range:</strong> ${filterStartDate || 'Start'} → ${filterEndDate || 'Now'}</div>
          <div><strong>Payable Balance:</strong> ${fmt(selectedSupplier.balance)}</div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Item</th><th>Description</th><th class="r">Paid (−)</th><th class="r">Billed (+)</th><th class="r">Balance</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="total">
          <div class="label">Total outstanding payable</div>
          <div class="amount">${fmt(selectedSupplier.balance)}</div>
        </div>
        </body></html>`;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled) toast('PDF exported.', 'success');
      else if (!res.canceled) toast('Export failed: ' + res.error, 'error');
    }
  };

  // Filtering
  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredLedger = ledgerEntries
    .filter((entry) => {
      const q = ledgerSearch.toLowerCase();
      const matchesSearch =
        (entry.description || '').toLowerCase().includes(q) ||
        (entry.item_name || '').toLowerCase().includes(q) ||
        (entry.invoice_no || '').toLowerCase().includes(q);
      let matchesDate = true;
      const entryDate = entry.created_at
        ? entry.created_at.substring(0, 10)
        : entry.date
          ? entry.date.substring(0, 10)
          : '';
      if (filterStartDate && entryDate < filterStartDate) matchesDate = false;
      if (filterEndDate && entryDate > filterEndDate) matchesDate = false;
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const totalBilled = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const currentBalance = selectedSupplier?.balance || 0;

  const ledgerGridTemplate = '0.9fr 2.7fr 0.85fr 1fr 1fr 1fr 0.4fr';

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
      {/* Toast notifications container */}
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
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--ink-0)',
              border: '1px solid var(--ink-3)',
              borderLeft: `4px solid ${t.type === 'error' ? 'var(--ink-danger)' : 'var(--ink-success)'}`,
              color: 'var(--ink-fg)',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '280px',
              fontWeight: 500,
              fontSize: '0.82rem',
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-fg-2)',
                display: 'flex',
              }}
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>

      {/* HEADER WITH SEARCH + REGISTER SUPPLIER */}
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
            Supplier Payables Ledger
          </h2>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            Manage vendor bills and payment schedules
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', width: '240px' }}>
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
              placeholder="Search suppliers or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '32px',
                height: '34px',
              }}
            />
          </div>

          <button
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              height: '34px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <PlusIcon /> Register supplier
          </button>
        </div>
      </div>

      {/* SUPPLIERS GRID */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredSuppliers.length === 0 ? (
          <div
            style={{
              background: 'var(--ink-0)',
              border: '1px dashed var(--ink-3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--ink-fg-3)',
              fontSize: '0.82rem',
            }}
          >
            No suppliers found.
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
            {filteredSuppliers.map((supp) => {
              const selected = selectedSupplier?.id === supp.id;
              const hasPayable = supp.balance > 0;
              return (
                <button
                  key={supp.id}
                  onClick={() => setSelectedSupplier(supp)}
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
                    width: '230px',
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
                  {supp.avatar ? (
                    <img
                      src={supp.avatar}
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
                      {getInitials(supp.name)}
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
                      {supp.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-fg-3)',
                        marginTop: '2px',
                      }}
                    >
                      {supp.company || supp.phone || 'No details'}
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '0.72rem',
                        marginTop: '4px',
                        color: hasPayable
                          ? 'var(--ink-danger)'
                          : 'var(--ink-success)',
                      }}
                    >
                      {hasPayable ? `${fmt(supp.balance)}` : 'Account Clear'}
                    </div>
                  </div>
                </button>
              );
            })}
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
            background: 'var(--ink-0)',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* KPI + Actions Bar */}
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
                  label: 'Total Billed',
                  value: totalBilled,
                  color: 'var(--ink-danger)',
                },
                {
                  label: 'Total Paid',
                  value: totalPaid,
                  color: 'var(--ink-success)',
                },
                {
                  label: 'Payable Balance',
                  value: currentBalance,
                  color:
                    currentBalance > 0
                      ? 'var(--ink-danger)'
                      : 'var(--ink-success)',
                },
              ].map((k, i) => (
                <div
                  key={k.label}
                  style={{
                    padding: '0 16px',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--ink-3)',
                    minWidth: '130px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--ink-fg-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
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
                  setEntryData({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                    method: 'CASH',
                    ref: '',
                    item_id: '',
                    qty: 1,
                  });
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
                Pay supplier
              </button>
              <button
                onClick={() => {
                  setEntryType('DEBIT');
                  setEntryData({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                    method: 'CASH',
                    ref: '',
                    item_id: '',
                    qty: 1,
                  });
                  setIsAddEntryModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
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
                <PlusIcon /> Add bill
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
                  setEditingSupplier(selectedSupplier);
                  setSupplierForm({ ...selectedSupplier });
                  setIsSupplierModalOpen(true);
                }}
                aria-label="Edit supplier"
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
                  confirmDelete === 'supplier' ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleDeleteSupplier}
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
                      onClick={() => setConfirmDelete('supplier')}
                      aria-label="Delete supplier"
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
                ) : confirmDelete === 'supplier' ? (
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
                    onClick={() => setConfirmDelete('supplier')}
                    aria-label="Archive supplier"
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

          {/* Filters Bar */}
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
                placeholder="Search item, invoice #, or description"
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

          {/* Ledger Table */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 14px',
              gap: '6px',
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: ledgerGridTemplate,
                gap: '12px',
                background: 'var(--ink-1)',
                color: 'var(--ink-fg-2)',
                padding: '10px 14px',
                borderRadius: '6px',
                borderBottom: '1px solid var(--ink-3)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <span>Date</span>
              <span>Transaction / Bill Particulars</span>
              <span>Type</span>
              <span style={{ textAlign: 'right' }}>Paid (−)</span>
              <span style={{ textAlign: 'right' }}>Billed (+)</span>
              <span style={{ textAlign: 'right' }}>Balance</span>
              <span style={{ textAlign: 'center' }}></span>
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
                  No ledger records found
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  Use "Add bill" or "Pay supplier" to create entries.
                </div>
              </div>
            ) : (
              filteredLedger.map((entry, idx) => {
                const isHovered = hoveredRow === idx;
                const isBill = (entry.debit || 0) > 0;
                const primaryTitle = entry.item_name
                  ? `${entry.item_name}${entry.qty ? ` (×${entry.qty})` : ''}`
                  : entry.description ||
                    (isBill ? 'Supplier Bill' : 'Supplier Payment');
                const subNote =
                  entry.item_name && entry.description
                    ? entry.description
                    : entry.invoice_no
                      ? `Invoice / Ref: ${entry.invoice_no}`
                      : null;

                return (
                  <div
                    key={entry.id || idx}
                    onClick={() => openRecordModal(entry)}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openRecordModal(entry);
                      }
                    }}
                    title="Click to inspect, edit, or delete record"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: ledgerGridTemplate,
                      gap: '12px',
                      alignItems: 'center',
                      padding: '11px 14px',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      border: isHovered
                        ? '1px solid var(--brand-primary)'
                        : '1px solid var(--ink-3)',
                      cursor: 'pointer',
                      background: isHovered ? 'var(--ink-2)' : 'var(--ink-1)',
                      transition: 'all 0.14s ease',
                      transform: isHovered ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    {/* Date */}
                    <span
                      className="monospace"
                      style={{
                        color: 'var(--ink-fg)',
                        fontSize: '0.73rem',
                        fontWeight: 500,
                      }}
                    >
                      {entry.created_at
                        ? entry.created_at.substring(0, 10)
                        : entry.date || '—'}
                    </span>

                    {/* Prominent Transaction / Item Name & Subtitle */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--ink-fg)',
                          fontWeight: 600,
                          fontSize: '0.83rem',
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
                            fontSize: '0.71rem',
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

                    {/* Type Badge */}
                    <div>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          display: 'inline-block',
                          background: isBill
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                          color: isBill
                            ? 'var(--ink-danger, #ef4444)'
                            : 'var(--ink-success, #10b981)',
                          border: isBill
                            ? '1px solid rgba(239, 68, 68, 0.28)'
                            : '1px solid rgba(16, 185, 129, 0.28)',
                        }}
                      >
                        {isBill ? 'BILLED' : 'PAID'}
                      </span>
                    </div>

                    {/* Paid (-) */}
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: entry.credit > 0 ? 600 : 'normal',
                        color:
                          entry.credit > 0
                            ? 'var(--ink-success)'
                            : 'var(--ink-fg-3)',
                      }}
                    >
                      {entry.credit > 0 ? fmt(entry.credit) : '—'}
                    </span>

                    {/* Billed (+) */}
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: entry.debit > 0 ? 600 : 'normal',
                        color:
                          entry.debit > 0
                            ? 'var(--ink-danger)'
                            : 'var(--ink-fg-3)',
                      }}
                    >
                      {entry.debit > 0 ? fmt(entry.debit) : '—'}
                    </span>

                    {/* Running Balance */}
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

                    {/* Inspect Cue */}
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

          {/* Footer hint */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              borderTop: '1px solid var(--ink-3)',
              background: 'var(--ink-1)',
              fontSize: '0.73rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            <span>
              Showing {filteredLedger.length} of {ledgerEntries.length} records
              • Click any row to view details, edit, or delete
            </span>
            <span className="monospace tabular" style={{ fontWeight: 600 }}>
              Payable Balance: {fmt(currentBalance)}
            </span>
          </div>
        </div>
      ) : (
        suppliers.length > 0 && (
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
            <TruckIcon />
            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Select a supplier
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              Choose a vendor above to view their payable statement.
            </div>
          </div>
        )
      )}

      {/* ────────── ADD ENTRY MODAL ────────── */}
      {isAddEntryModalOpen && (
        <Modal onClose={() => setIsAddEntryModalOpen(false)} width={480}>
          <ModalHeader
            title={entryType === 'DEBIT' ? 'Add manual bill' : 'Pay supplier'}
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
              Debit (Bill / We owe)
            </SegmentChip>
            <SegmentChip
              active={entryType === 'CREDIT'}
              onClick={() => setEntryType('CREDIT')}
            >
              Credit (Payment)
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
                      const newAmount = sel
                        ? sel.avg_cost * entryData.qty
                        : entryData.amount;
                      setEntryData({
                        ...entryData,
                        item_id: e.target.value,
                        amount: newAmount,
                      });
                    }}
                  >
                    <option value="">Manual entry</option>
                    {inventoryItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — Cost: {fmt(i.avg_cost)}
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
                      const newAmount = sel
                        ? sel.avg_cost * qty
                        : entryData.amount;
                      setEntryData({ ...entryData, qty, amount: newAmount });
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
            <Field label="Invoice # / Reference (optional)">
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

      {/* ────────── SUPPLIER TRANSACTION DETAIL / EDIT / DELETE MODAL ────────── */}
      {selectedRecord && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeRecordModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
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
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background:
                        (selectedRecord.debit || 0) > 0
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(16, 185, 129, 0.12)',
                      color:
                        (selectedRecord.debit || 0) > 0
                          ? 'var(--ink-danger, #ef4444)'
                          : 'var(--ink-success, #10b981)',
                      border:
                        (selectedRecord.debit || 0) > 0
                          ? '1px solid rgba(239, 68, 68, 0.28)'
                          : '1px solid rgba(16, 185, 129, 0.28)',
                    }}
                  >
                    {(selectedRecord.debit || 0) > 0
                      ? 'SUPPLIER BILL (+)'
                      : 'PAYMENT MADE (−)'}
                  </span>
                  {selectedRecord.id && (
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      #{selectedRecord.id}
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.06rem',
                    fontWeight: 600,
                    color: 'var(--ink-fg)',
                    lineHeight: 1.35,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {isRecordEditMode
                    ? 'Edit Supplier Record'
                    : selectedRecord.item_name
                      ? `${selectedRecord.item_name} (×${selectedRecord.qty || 1})`
                      : selectedRecord.description || 'Supplier Entry Details'}
                </h3>
              </div>

              <button
                onClick={closeRecordModal}
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

            {/* VIEW MODE VS EDIT MODE */}
            {!isRecordEditMode ? (
              <div
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* AMOUNT & BALANCE BANNER */}
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
                      {(selectedRecord.debit || 0) > 0
                        ? 'Billed Amount (+)'
                        : 'Paid Amount (−)'}
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        color:
                          (selectedRecord.debit || 0) > 0
                            ? 'var(--ink-danger)'
                            : 'var(--ink-success)',
                      }}
                    >
                      {fmt(selectedRecord.debit || selectedRecord.credit || 0)}
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
                      Payable Balance After
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        color: 'var(--ink-fg)',
                      }}
                    >
                      {fmt(selectedRecord.balance_after)}
                    </div>
                  </div>
                </div>

                {/* METADATA GRID */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    padding: '14px 16px',
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
                      Supplier / Vendor
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-fg)' }}>
                      {selectedSupplier?.name || 'N/A'}
                      {selectedSupplier?.company
                        ? ` (${selectedSupplier.company})`
                        : ''}
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
                      Date Recorded
                    </div>
                    <div
                      className="monospace"
                      style={{ fontWeight: 500, color: 'var(--ink-fg)' }}
                    >
                      {selectedRecord.created_at
                        ? selectedRecord.created_at
                            .replace('T', ' ')
                            .substring(0, 19)
                        : selectedRecord.date || 'N/A'}
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
                      Inventory Item & Qty
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--ink-fg)' }}>
                      {selectedRecord.item_name
                        ? `${selectedRecord.item_name} — Qty: ${selectedRecord.qty || 1}`
                        : 'Manual / Cash Entry'}
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
                      Invoice / Reference
                    </div>
                    <div
                      className="monospace"
                      style={{ fontWeight: 500, color: 'var(--ink-fg)' }}
                    >
                      {selectedRecord.invoice_no || '—'}
                    </div>
                  </div>
                </div>

                {/* FULL PARTICULARS */}
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
                    Particulars / Description
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
                    {selectedRecord.description ||
                      'No additional notes recorded.'}
                  </p>
                </div>

                {/* INLINE DELETE CONFIRMATION */}
                {confirmDelete === selectedRecord.id && (
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
                      Delete this record and recalculate supplier balance?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
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
                        onClick={() => handleDeleteRecord(selectedRecord.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--ink-danger)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isSaving ? 'Deleting…' : 'Confirm delete'}
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
                    paddingTop: '10px',
                    borderTop: '1px solid var(--ink-3)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(selectedRecord.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '7px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--ink-danger)',
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
                      onClick={closeRecordModal}
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
                      onClick={() => setIsRecordEditMode(true)}
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
                      <EditIcon /> Edit Record
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE FORM */
              <form
                onSubmit={handleEditRecord}
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
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
                  <textarea
                    rows={3}
                    required
                    style={{ ...inputStyle, resize: 'vertical' }}
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
                    onClick={() => setIsRecordEditMode(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--ink-1)',
                      color: 'var(--ink-fg)',
                      border: '1px solid var(--ink-3)',
                      borderRadius: '7px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
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
                      borderRadius: '7px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ────────── SUPPLIER PROFILE MODAL ────────── */}
      {isSupplierModalOpen && (
        <Modal onClose={() => setIsSupplierModalOpen(false)} width={460}>
          <ModalHeader
            title={
              editingSupplier ? 'Edit supplier profile' : 'Register supplier'
            }
            onClose={() => setIsSupplierModalOpen(false)}
          />
          <form
            onSubmit={handleSaveSupplier}
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
              {supplierForm.avatar ? (
                <img
                  src={supplierForm.avatar}
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
                    setSupplierForm((prev) => ({
                      ...prev,
                      avatar: reader.result,
                    }));
                  reader.readAsDataURL(file);
                }}
                style={{ fontSize: '0.75rem', color: 'var(--ink-fg-2)' }}
              />
            </div>
            <Field label="Supplier / Vendor name *">
              <input
                type="text"
                required
                style={inputStyle}
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
              />
            </Field>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Company / Agency">
                <input
                  type="text"
                  style={inputStyle}
                  value={supplierForm.company}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      company: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  style={inputStyle}
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      phone: sanitizePhone(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Address">
              <input
                type="text"
                style={inputStyle}
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
              />
            </Field>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: editingSupplier ? '1fr' : '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Credit limit (Rs.)">
                <input
                  type="number"
                  className="monospace tabular"
                  style={inputStyle}
                  value={supplierForm.credit_limit}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              {!editingSupplier && (
                <Field label="Opening debt (Rs.)">
                  <input
                    type="number"
                    className="monospace tabular"
                    style={inputStyle}
                    value={supplierForm.opening_balance}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        opening_balance: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
              )}
            </div>

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
                onClick={() => setIsSupplierModalOpen(false)}
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
                {editingSupplier ? 'Save changes' : 'Save supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
