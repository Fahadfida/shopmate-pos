import React, { useState, useEffect, useRef } from 'react';
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

const fmt2 = (n) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const emptyItemForm = () => ({
  code: '',
  name: '',
  category: 'General',
  stock_qty: 0,
  avg_cost: 0,
  min_price: 0,
  max_price: 0,
  selling_price: 0,
  unit: 'Pcs',
  image_path: '',
});

const emptyPurchase = () => ({
  supplier_id: '',
  custom_supplier_name: '',
  item_id: '',
  qty_received: '',
  unit_cost: '',
  payment_type: 'CREDIT',
  invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  date: new Date().toISOString().substring(0, 10),
});

// ─────────────────────────────────────────────────────────────
// Icons — 16px, 1.5 stroke
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
const RefreshIcon = () => (
  <svg {...iconBase}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const CloseIcon = () => (
  <svg {...iconBase}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BoxIcon = () => (
  <svg {...iconBase} width="24" height="24">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const GridIcon = () => (
  <svg {...iconBase} width="14" height="14">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
const ListIcon = () => (
  <svg {...iconBase} width="14" height="14">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const TruckIcon = () => (
  <svg {...iconBase}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────
const SegmentChip = ({ active, onClick, icon, children, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '7px 10px',
      fontSize: '0.75rem',
      fontWeight: 500,
      borderRadius: '6px',
      border: 'none',
      background: active ? 'var(--ink-0)' : 'transparent',
      color: active ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
      boxShadow: active ? '0 0 0 1px var(--ink-3)' : 'none',
      cursor: 'pointer',
      transition: 'background-color 120ms ease, color 120ms ease',
      flex: 1,
    }}
  >
    {active && (
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          bottom: 6,
          width: '3px',
          borderRadius: '2px',
          background: 'var(--brand-primary)',
        }}
      />
    )}
    {icon}
    <span>{children}</span>
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

// ─────────────────────────────────────────────────────────────
// Purchases
// ─────────────────────────────────────────────────────────────
export default function Purchases({ currentUser, showToast }) {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('GRID');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form
  const [purchaseType, setPurchaseType] = useState('REGISTERED');
  const [purchase, setPurchase] = useState(emptyPurchase());

  // Item lookup
  const [itemSearchText, setItemSearchText] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const formRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Add item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMarginType, setAddMarginType] = useState('custom');
  const [itemForm, setItemForm] = useState(emptyItemForm());

  const toast = (msg, type = 'info') => {
    if (showToast) showToast(msg, type);
    else if (type === 'error') console.error(msg);
  };

  const loadData = async () => {
    const ipc = getIpc();
    if (!ipc) return;
    try {
      const [fetchedItems, fetchedSuppliers] = await Promise.all([
        ipc.invoke('get-items'),
        ipc.invoke('get-suppliers'),
      ]);
      setItems(fetchedItems || []);
      setSuppliers(fetchedSuppliers || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Could not load purchases data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Click outside closes dropdown
  useEffect(() => {
    const onDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Auto-SKU for new item
  useEffect(() => {
    const fetchSku = async () => {
      const ipc = getIpc();
      if (ipc && itemForm.name && isAddModalOpen) {
        try {
          const code = await ipc.invoke('get-next-sku', {
            category: itemForm.category,
            name: itemForm.name,
          });
          setItemForm((prev) => ({ ...prev, code }));
        } catch (err) {
          console.error('SKU gen failed:', err);
        }
      }
    };
    fetchSku();
  }, [itemForm.category, itemForm.name, isAddModalOpen]);

  const calculateSellingPrice = (cost, marginVal) => {
    if (marginVal === 'custom') return null;
    const base = parseFloat(cost) || 0;
    const pct = parseFloat(marginVal) || 0;
    return Math.round((base + base * (pct / 100)) * 100) / 100;
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    if (!purchase.item_id)
      return toast('Select an inventory item first.', 'error');
    if (!purchase.qty_received || parseFloat(purchase.qty_received) <= 0)
      return toast('Enter a valid received quantity.', 'error');

    const ipc = getIpc();
    if (!ipc) return;

    try {
      const finalInvoiceNo =
        purchaseType === 'DIRECT' && purchase.custom_supplier_name
          ? `${purchase.invoice_no} [Vendor: ${purchase.custom_supplier_name}]`
          : purchase.invoice_no;

      const res = await ipc.invoke('record-purchase', {
        supplier_id:
          purchaseType === 'REGISTERED' ? purchase.supplier_id : null,
        item_id: purchase.item_id,
        qty_received: parseFloat(purchase.qty_received),
        unit_cost: parseFloat(purchase.unit_cost),
        payment_type: purchase.payment_type,
        invoice_no: finalInvoiceNo,
        date: purchase.date,
        currentUser,
      });

      if (res.success) {
        toast('Stock received · WAC updated', 'success');
        setPurchase(emptyPurchase());
        setItemSearchText('');
        await loadData();
      } else {
        toast('Error: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  };

  const handleRegisterNewItem = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc) return;
    try {
      const payload = { ...itemForm, stock_qty: 0 };
      const res = await ipc.invoke('add-item', {
        item: payload,
        currentUser,
      });
      if (res.success) {
        setIsAddModalOpen(false);
        setItemForm(emptyItemForm());
        setAddMarginType('custom');
        toast('Product registered — search for it to restock.', 'success');
        await loadData();
        setItemSearchText('');
      } else {
        toast('Error: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  };

  const handleQuickRestock = (item) => {
    setPurchase((p) => ({
      ...p,
      item_id: item.id,
      unit_cost: item.avg_cost || '',
    }));
    setItemSearchText(
      `${item.name} (${item.code}) — ${item.stock_qty} ${item.unit || 'pcs'} on hand`,
    );
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (qtyInputRef.current) qtyInputRef.current.focus();
  };

  const filteredLookupItems = items.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(itemSearchText.toLowerCase()) ||
      (i.code || '').toLowerCase().includes(itemSearchText.toLowerCase()),
  );
  const filteredCatalogItems = items.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.code || '').toLowerCase().includes(search.toLowerCase()),
  );

  const estimatedTotal =
    (parseFloat(purchase.qty_received) || 0) *
    (parseFloat(purchase.unit_cost) || 0);

  // ─── Loading
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
        Loading purchases…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: '16px',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
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
          background: 'var(--ink-0)',
          padding: '14px 16px',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
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
            Purchases
          </h2>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            Log stock intake and GRNs
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 500,
            background: 'var(--ink-1)',
            color: 'var(--ink-fg)',
            border: '1px solid var(--ink-3)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.8fr',
          gap: '16px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ─────────── LEFT: FORM ─────────── */}
        <div
          ref={formRef}
          style={{
            background: 'var(--ink-0)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--ink-3)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--ink-3)',
            }}
          >
            <span style={{ color: 'var(--ink-fg-2)' }}>
              <TruckIcon />
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              New intake
            </h3>
          </div>

          <form
            onSubmit={handleRecordPurchase}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* Source */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '4px',
                }}
              >
                Source
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '2px',
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '8px',
                }}
              >
                <SegmentChip
                  active={purchaseType === 'REGISTERED'}
                  onClick={() => setPurchaseType('REGISTERED')}
                >
                  Registered supplier
                </SegmentChip>
                <SegmentChip
                  active={purchaseType === 'DIRECT'}
                  onClick={() => setPurchaseType('DIRECT')}
                >
                  Direct purchase
                </SegmentChip>
              </div>
            </div>

            {purchaseType === 'REGISTERED' ? (
              <Field label="Wholesaler">
                <select
                  style={inputStyle}
                  value={purchase.supplier_id}
                  onChange={(e) =>
                    setPurchase({ ...purchase, supplier_id: e.target.value })
                  }
                  required
                >
                  <option value="">Choose wholesaler</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || 'Direct'})
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Custom vendor / market">
                <input
                  type="text"
                  style={inputStyle}
                  value={purchase.custom_supplier_name}
                  onChange={(e) =>
                    setPurchase({
                      ...purchase,
                      custom_supplier_name: e.target.value,
                    })
                  }
                  placeholder="Wholesale market"
                />
              </Field>
            )}

            {/* Payment mode */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '4px',
                }}
              >
                Payment
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '2px',
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '8px',
                }}
              >
                <SegmentChip
                  active={purchase.payment_type === 'CREDIT'}
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: 'CREDIT' })
                  }
                >
                  On credit
                </SegmentChip>
                <SegmentChip
                  active={purchase.payment_type === 'CASH'}
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: 'CASH' })
                  }
                >
                  Paid in cash
                </SegmentChip>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Invoice #">
                <input
                  type="text"
                  className="monospace"
                  style={inputStyle}
                  value={purchase.invoice_no}
                  onChange={(e) =>
                    setPurchase({ ...purchase, invoice_no: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  style={inputStyle}
                  value={purchase.date}
                  onChange={(e) =>
                    setPurchase({ ...purchase, date: e.target.value })
                  }
                  required
                />
              </Field>
            </div>

            {/* Item lookup */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <Field label="Inventory item">
                <div style={{ position: 'relative' }}>
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
                    placeholder="Search name or SKU"
                    value={itemSearchText}
                    onChange={(e) => {
                      setItemSearchText(e.target.value);
                      setIsItemDropdownOpen(true);
                    }}
                    onFocus={() => setIsItemDropdownOpen(true)}
                    style={{
                      ...inputStyle,
                      paddingLeft: '32px',
                      background: 'var(--ink-1)',
                    }}
                    required
                  />
                </div>
              </Field>

              {isItemDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'var(--ink-0)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    zIndex: 999,
                  }}
                >
                  {filteredLookupItems.length === 0 ? (
                    <div
                      style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--ink-fg-3)',
                          marginBottom: '10px',
                        }}
                      >
                        No match for "{itemSearchText}"
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'var(--brand-primary)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <PlusIcon /> Create product
                      </button>
                    </div>
                  ) : (
                    filteredLookupItems.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setPurchase({
                            ...purchase,
                            item_id: i.id,
                            unit_cost: i.avg_cost || '',
                          });
                          setItemSearchText(`${i.name} (${i.code})`);
                          setIsItemDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--ink-3)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 500,
                            color: 'var(--ink-fg)',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {i.name}{' '}
                          <span
                            className="monospace"
                            style={{
                              color: 'var(--ink-fg-3)',
                              fontSize: '0.72rem',
                            }}
                          >
                            {i.code}
                          </span>
                        </span>
                        <span
                          className="monospace tabular"
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--ink-fg-3)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {i.stock_qty} {i.unit || 'pcs'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Received qty">
                <input
                  ref={qtyInputRef}
                  type="number"
                  className="monospace tabular"
                  style={inputStyle}
                  value={purchase.qty_received}
                  onChange={(e) =>
                    setPurchase({ ...purchase, qty_received: e.target.value })
                  }
                  placeholder="50"
                  required
                />
              </Field>
              <Field label="Unit cost">
                <input
                  type="number"
                  className="monospace tabular"
                  style={inputStyle}
                  value={purchase.unit_cost}
                  onChange={(e) =>
                    setPurchase({ ...purchase, unit_cost: e.target.value })
                  }
                  placeholder="1150"
                  required
                />
              </Field>
            </div>

            {/* TOTAL — quiet paper surface */}
            <div
              style={{
                marginTop: '4px',
                padding: '14px 0',
                borderTop: '1px solid var(--ink-3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                }}
              >
                Total
              </span>
              <span
                className="monospace tabular"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
                }}
              >
                {fmt(estimatedTotal)}
              </span>
            </div>

            <button
              type="submit"
              style={{
                padding: '10px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Record intake
            </button>
          </form>
        </div>

        {/* ─────────── RIGHT: CATALOG ─────────── */}
        <div
          style={{
            background: 'var(--ink-0)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Catalog
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ position: 'relative', width: '220px' }}>
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
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: '32px',
                    height: '32px',
                    background: 'var(--ink-1)',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '2px',
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '8px',
                }}
              >
                <SegmentChip
                  active={viewMode === 'GRID'}
                  onClick={() => setViewMode('GRID')}
                  icon={<GridIcon />}
                >
                  Grid
                </SegmentChip>
                <SegmentChip
                  active={viewMode === 'LIST'}
                  onClick={() => setViewMode('LIST')}
                  icon={<ListIcon />}
                >
                  List
                </SegmentChip>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {filteredCatalogItems.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '50px 20px',
                  color: 'var(--ink-fg-3)',
                  gap: '8px',
                }}
              >
                <BoxIcon />
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {search ? 'No matches' : 'No products yet'}
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  {search
                    ? 'Try a different name or SKU.'
                    : 'Add your first product from Inventory.'}
                </div>
              </div>
            ) : viewMode === 'GRID' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--ink-1)',
                      border: '1px solid var(--ink-3)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--ink-2)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--ink-3)',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {item.image_path ? (
                          <img
                            src={item.image_path}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--ink-fg-3)',
                            }}
                          >
                            {getInitials(item.name)}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: 'var(--ink-fg)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div
                          className="monospace"
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          {item.code}
                        </div>
                        <div
                          className="monospace tabular"
                          style={{
                            fontSize: '0.7rem',
                            color:
                              item.stock_qty <= 5
                                ? 'var(--ink-danger)'
                                : 'var(--ink-fg-2)',
                            marginTop: '2px',
                          }}
                        >
                          {item.stock_qty} {item.unit || 'pcs'}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid var(--ink-3)',
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      <span>WAC</span>
                      <span className="monospace tabular">
                        {fmt2(item.avg_cost)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickRestock(item)}
                      style={{
                        padding: '7px',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        background: 'var(--ink-0)',
                        color: 'var(--ink-fg)',
                        border: '1px solid var(--ink-3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--ink-3)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: 'var(--ink-2)',
                    color: 'var(--ink-fg-2)',
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--ink-3)',
                  }}
                >
                  <span>SKU</span>
                  <span>Product</span>
                  <span style={{ textAlign: 'right' }}>Stock</span>
                  <span style={{ textAlign: 'right' }}>WAC</span>
                  <span style={{ textAlign: 'center' }}>Action</span>
                </div>
                {filteredCatalogItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                      fontSize: '0.8rem',
                      alignItems: 'center',
                      background: 'var(--ink-0)',
                      padding: '10px 12px',
                      borderBottom:
                        idx === filteredCatalogItems.length - 1
                          ? 'none'
                          : '1px solid var(--ink-3)',
                    }}
                  >
                    <span
                      className="monospace"
                      style={{
                        color: 'var(--ink-fg-3)',
                        fontSize: '0.72rem',
                      }}
                    >
                      {item.code}
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
                      {item.name}
                    </span>
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        color:
                          item.stock_qty <= 5
                            ? 'var(--ink-danger)'
                            : 'var(--ink-fg-2)',
                      }}
                    >
                      {item.stock_qty} {item.unit || ''}
                    </span>
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      {fmt2(item.avg_cost)}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleQuickRestock(item)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: 'var(--ink-1)',
                          color: 'var(--ink-fg)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────── ADD PRODUCT MODAL ─────────── */}
      {isAddModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
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
              width: '720px',
              maxWidth: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--ink-0)',
              padding: '20px',
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
                style={{
                  margin: 0,
                  color: 'var(--ink-fg)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Add product
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-fg-3)',
                marginBottom: '16px',
                background: 'var(--ink-1)',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--ink-3)',
              }}
            >
              New products start at 0 stock. After saving, you can select them
              in the intake form to receive stock.
            </p>

            <form
              onSubmit={handleRegisterNewItem}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <Field label="SKU (auto)">
                  <input
                    type="text"
                    className="monospace"
                    style={{
                      ...inputStyle,
                      background: 'var(--ink-1)',
                      color: 'var(--ink-fg-2)',
                    }}
                    value={itemForm.code}
                    readOnly
                  />
                </Field>
                <Field label="Category">
                  <input
                    type="text"
                    style={inputStyle}
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    placeholder="Electronics"
                  />
                </Field>
              </div>
              <Field label="Item name">
                <input
                  type="text"
                  style={inputStyle}
                  value={itemForm.name}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, name: e.target.value })
                  }
                  placeholder="Wireless mouse"
                  required
                />
              </Field>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.5fr',
                  gap: '10px',
                }}
              >
                <Field label="Unit cost">
                  <input
                    type="number"
                    className="monospace tabular"
                    style={inputStyle}
                    value={itemForm.avg_cost}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      const sp =
                        calculateSellingPrice(cost, addMarginType) ??
                        itemForm.selling_price;
                      setItemForm({
                        ...itemForm,
                        avg_cost: cost,
                        selling_price: sp,
                      });
                    }}
                    placeholder="800"
                  />
                </Field>
                <Field label="Margin">
                  <select
                    style={inputStyle}
                    value={addMarginType}
                    onChange={(e) => {
                      const m = e.target.value;
                      setAddMarginType(m);
                      const sp = calculateSellingPrice(itemForm.avg_cost, m);
                      if (sp !== null)
                        setItemForm({ ...itemForm, selling_price: sp });
                    }}
                  >
                    <option value="custom">Manual</option>
                    {[10, 15, 20, 25, 50, 100].map((p) => (
                      <option key={p} value={p}>
                        {p}%
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Selling price *">
                  <input
                    type="number"
                    className="monospace tabular"
                    style={inputStyle}
                    value={itemForm.selling_price}
                    onChange={(e) => {
                      setItemForm({
                        ...itemForm,
                        selling_price: parseFloat(e.target.value) || 0,
                      });
                      setAddMarginType('custom');
                    }}
                    required
                  />
                </Field>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <Field label="Min price">
                  <input
                    type="number"
                    className="monospace tabular"
                    style={inputStyle}
                    value={itemForm.min_price}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        min_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="Max price">
                  <input
                    type="number"
                    className="monospace tabular"
                    style={inputStyle}
                    value={itemForm.max_price}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        max_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid var(--ink-3)',
                  paddingTop: '14px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid var(--ink-3)',
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
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Save product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
