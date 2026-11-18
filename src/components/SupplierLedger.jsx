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
// SupplierLedger Component
// ─────────────────────────────────────────────────────────────
export default function SupplierLedger({ currentUser, showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals State
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
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

  const toast = (message, type = 'info') => {
    if (showToast) showToast(message, type);
    else {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
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
        toast('Record updated successfully', 'success');
      } else {
        toast('Error updating record: ' + res.error, 'error');
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
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
        toast('Record deleted successfully', 'success');
      } else {
        toast('Error deleting record: ' + res.error, 'error');
      }
    }
    setConfirmDelete(null);
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
      const rowsHtml = ledgerEntries
        .map(
          (e) => `
        <tr>
          <td>${e.date || (e.created_at ? e.created_at.substring(0, 10) : '')}</td>
          <td>${e.description}</td>
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
          <thead><tr><th>Date</th><th>Description</th><th class="r">Paid (−)</th><th class="r">Billed (+)</th><th class="r">Balance</th></tr></thead>
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
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const totalBilled = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const currentBalance = selectedSupplier?.balance || 0;

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
            fontSize: '0.8rem',
            fontWeight: 500,
            background: 'var(--brand-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <PlusIcon /> Register supplier
        </button>
      </div>

      {/* SEARCH & SUPPLIERS GRID */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
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
              height: '32px',
            }}
          />
        </div>

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
                      {hasPayable
                        ? `Payable: ${fmt(supp.balance)}`
                        : 'Account Clear'}
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
                placeholder="Search transaction details"
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
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.5fr 2fr 0.5fr 1fr 1fr 1fr',
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
              <span>Inventory Item</span>
              <span>Description / Reference</span>
              <span style={{ textAlign: 'center' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Paid (−)</span>
              <span style={{ textAlign: 'right' }}>Billed (+)</span>
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
                  No ledger records found
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  Use "Add bill" or "Pay supplier" to create entries.
                </div>
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
                        : entry.date
                          ? entry.date.substring(0, 10)
                          : '',
                      notes: entry.description || '',
                      amount: entry.debit || entry.credit || '',
                      ref: entry.invoice_no || '',
                      item_id: '',
                      qty: 1,
                    });
                    setIsEditRecordModalOpen(true);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.9fr 1.5fr 2fr 0.5fr 1fr 1fr 1fr',
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
                    {entry.created_at
                      ? entry.created_at.substring(0, 10)
                      : entry.date}
                  </span>
                  <span style={{ color: 'var(--ink-fg)', fontWeight: 500 }}>
                    {entry.item_name || '—'}
                  </span>
                  <span style={{ color: 'var(--ink-fg)' }}>
                    {entry.description || '—'}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'center',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    {entry.qty || 1}
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
                  Delete record
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
