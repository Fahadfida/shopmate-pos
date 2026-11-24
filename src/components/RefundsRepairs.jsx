import React, { useState, useEffect, useRef, useId } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (16px 1.5 stroke)
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
  <svg {...iconBase} aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RefundIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const RepairIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

// Helper for product initials
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────
// Typography & Surface Primitives (4px grid, POS scale)
// ─────────────────────────────────────────────────────────────
const sansFamily = {
  fontFamily: 'var(--font-sans)',
};

const typeScale = {
  pageTitle: {
    ...sansFamily,
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
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
export default function RefundsRepairs({ currentUser }) {
  const customerNameId = useId();
  const phoneId = useId();
  const productSearchId = useId();
  const customItemId = useId();
  const qtyId = useId();
  const amountId = useId();
  const descriptionId = useId();
  const catalogSearchId = useId();

  const [items, setItems] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [toasts, setToasts] = useState([]);

  // Form State (Removed status entirely)
  const [form, setForm] = useState({
    type: 'REFUND', // 'REFUND' or 'REPAIR'
    sale_id: '',
    item_id: '',
    qty: 1,
    amount_refunded: '',
    customer_name: '',
    phone: '',
    description: '',
  });

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [itemSearchText, setItemSearchText] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      setItems(await ipc.invoke('get-items'));
      setRecentRecords(await ipc.invoke('get-refunds-repairs'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsItemDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id && !manualItemName.trim())
      return addToast(
        'Please select an item or enter a custom item name.',
        'error',
      );

    const ipc = getIpc();
    if (ipc) {
      const payload = {
        ...form,
        item_id: isManualMode ? null : form.item_id,
        manual_item_name: isManualMode ? manualItemName.trim() : null,
        status: 'COMPLETED', // 👈 Force complete status
        currentUser,
      };
      const res = await ipc.invoke('record-refund-repair', payload);

      if (res.success) {
        addToast(
          `${form.type === 'REFUND' ? 'Refund' : 'Repair ticket'} logged successfully.`,
          'success',
        );
        setForm({
          type: 'REFUND',
          sale_id: '',
          item_id: '',
          qty: 1,
          amount_refunded: '',
          customer_name: '',
          phone: '',
          description: '',
        });
        setItemSearchText('');
        setManualItemName('');
        setIsManualMode(false);
        loadData();
      } else {
        addToast('Error: ' + res.error, 'error');
      }
    }
  };

  const filteredLookupItems = items.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(itemSearchText.toLowerCase()) ||
      (i.code || '').toLowerCase().includes(itemSearchText.toLowerCase()),
  );
  const filteredCatalogItems = items.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (i.code || '').toLowerCase().includes(catalogSearch.toLowerCase()),
  );

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

      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--ink-0)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
        }}
      >
        <div>
          <h2
            style={{
              ...typeScale.pageTitle,
              margin: 0,
              color: 'var(--ink-fg)',
            }}
          >
            Refunds and repairs
          </h2>
          <p
            style={{
              ...typeScale.helper,
              margin: '4px 0 0 0',
              color: 'var(--ink-fg-3)',
            }}
          >
            Process customer returns or log incoming device repairs.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* LEFT PANEL: FORM */}
        <div
          style={{
            flex: 1.1,
            background: 'var(--ink-0)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--ink-3)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
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
                ...typeScale.sectionTitle,
                margin: 0,
                color: 'var(--ink-fg)',
              }}
            >
              Log transaction
            </h3>
            <button
              type="button"
              style={{
                ...typeScale.control,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: isManualMode
                  ? 'var(--brand-primary)'
                  : 'var(--ink-1)',
                color: isManualMode ? 'var(--ink-0)' : 'var(--ink-fg-2)',
                border: '1px solid var(--ink-3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
              onClick={() => {
                setIsManualMode(!isManualMode);
                setForm({ ...form, item_id: '' });
                setItemSearchText('');
              }}
            >
              {isManualMode ? (
                <>
                  <SearchIcon />
                  <span>Use catalog</span>
                </>
              ) : (
                <>
                  <PlusIcon />
                  <span>Custom item</span>
                </>
              )}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <Field label="Operation type">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  aria-pressed={form.type === 'REFUND'}
                  onClick={() => setForm({ ...form, type: 'REFUND' })}
                  style={{
                    ...typeScale.control,
                    flex: 1,
                    minHeight: '38px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background:
                      form.type === 'REFUND'
                        ? 'var(--ink-danger)'
                        : 'var(--ink-1)',
                    color:
                      form.type === 'REFUND'
                        ? 'var(--ink-0)'
                        : 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, color 150ms ease',
                  }}
                >
                  <RefundIcon />
                  <span>Item refund</span>
                </button>
                <button
                  type="button"
                  aria-pressed={form.type === 'REPAIR'}
                  onClick={() => setForm({ ...form, type: 'REPAIR' })}
                  style={{
                    ...typeScale.control,
                    flex: 1,
                    minHeight: '38px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background:
                      form.type === 'REPAIR'
                        ? 'var(--brand-primary)'
                        : 'var(--ink-1)',
                    color:
                      form.type === 'REPAIR'
                        ? 'var(--ink-0)'
                        : 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, color 150ms ease',
                  }}
                >
                  <RepairIcon />
                  <span>Device repair</span>
                </button>
              </div>
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <Field label="Customer name *" htmlFor={customerNameId}>
                <input
                  id={customerNameId}
                  type="text"
                  style={inputStyle}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Phone" htmlFor={phoneId}>
                <input
                  id={phoneId}
                  type="text"
                  style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0300-0000000"
                />
              </Field>
            </div>

            {!isManualMode ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <Field
                  label="Select product (search name or SKU)"
                  htmlFor={productSearchId}
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      id={productSearchId}
                      type="text"
                      placeholder="Type to search"
                      value={itemSearchText}
                      onChange={(e) => {
                        setItemSearchText(e.target.value);
                        setIsItemDropdownOpen(true);
                      }}
                      onFocus={() => setIsItemDropdownOpen(true)}
                      style={{ ...inputStyle, paddingRight: '36px' }}
                      required={!form.item_id && !isManualMode}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ink-fg-3)',
                        pointerEvents: 'none',
                        display: 'flex',
                      }}
                    >
                      <SearchIcon />
                    </span>
                  </div>
                </Field>

                {isItemDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '192px',
                      overflowY: 'auto',
                      background: 'var(--ink-0)',
                      border: '1px solid var(--ink-3)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      zIndex: 999,
                      marginTop: '4px',
                    }}
                  >
                    {filteredLookupItems.length === 0 ? (
                      <div
                        style={{
                          ...typeScale.helper,
                          padding: '12px',
                          color: 'var(--ink-fg-3)',
                          textAlign: 'center',
                        }}
                      >
                        No matching items found.
                      </div>
                    ) : (
                      filteredLookupItems.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              item_id: i.id,
                              amount_refunded: i.selling_price || '',
                            });
                            setItemSearchText(`${i.name} (${i.code})`);
                            setIsItemDropdownOpen(false);
                          }}
                          style={{
                            ...sansFamily,
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--ink-3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              color: 'var(--ink-fg)',
                            }}
                          >
                            {i.name}{' '}
                            <span style={{ color: 'var(--ink-fg-3)' }}>
                              ({i.code})
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--brand-primary)',
                              background: 'var(--ink-1)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              border: '1px solid var(--ink-3)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            Stock: {i.stock_qty}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Field label="Custom item name *" htmlFor={customItemId}>
                <input
                  id={customItemId}
                  type="text"
                  style={inputStyle}
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  placeholder="e.g. Samsung TV 42 inch"
                  required={isManualMode}
                />
              </Field>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <Field label="Quantity" htmlFor={qtyId}>
                <input
                  id={qtyId}
                  type="number"
                  className="monospace tabular"
                  style={{
                    ...inputStyle,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  min="1"
                  required
                />
              </Field>
              <Field
                label={
                  form.type === 'REFUND'
                    ? 'Amount refunded (Rs.)'
                    : 'Repair charge (Rs.)'
                }
                htmlFor={amountId}
              >
                <input
                  id={amountId}
                  type="number"
                  step="0.01"
                  className="monospace tabular"
                  style={{
                    ...inputStyle,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  value={form.amount_refunded}
                  onChange={(e) =>
                    setForm({ ...form, amount_refunded: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Reason or repair details" htmlFor={descriptionId}>
              <textarea
                id={descriptionId}
                style={{ ...inputStyle, minHeight: '68px', resize: 'vertical' }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Screen replacement or defective return"
              />
            </Field>

            <button
              type="submit"
              style={{
                ...sansFamily,
                minHeight: '40px',
                padding: '10px 16px',
                background:
                  form.type === 'REFUND'
                    ? 'var(--ink-danger)'
                    : 'var(--brand-primary)',
                fontWeight: 500,
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: 'none',
                color: 'var(--ink-0)',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'opacity 150ms ease, transform 120ms ease',
              }}
            >
              Submit and post to ledger
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: RECENT FEED & CATALOG */}
        <div
          style={{
            flex: 2.3,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden',
          }}
        >
          {/* RECENT LOGS */}
          <div
            style={{
              background: 'var(--ink-0)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--ink-3)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--ink-3)',
              }}
            >
              <h3
                style={{
                  ...typeScale.sectionTitle,
                  margin: 0,
                  color: 'var(--ink-fg)',
                }}
              >
                Recent activity
              </h3>
              <span
                style={{
                  ...typeScale.helper,
                  color: 'var(--ink-fg-3)',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Last 20 records
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {recentRecords.length === 0 ? (
                <div
                  style={{
                    ...typeScale.helper,
                    textAlign: 'center',
                    color: 'var(--ink-fg-3)',
                    padding: '32px 0',
                  }}
                >
                  No records found.
                </div>
              ) : (
                recentRecords.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.55fr 2fr 1.15fr 1fr 1fr',
                      fontSize: '0.8125rem',
                      alignItems: 'center',
                      background: 'var(--ink-1)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--ink-3)',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          rec.type === 'REFUND'
                            ? 'var(--ink-danger)'
                            : 'var(--brand-primary)',
                      }}
                    >
                      {rec.type === 'REFUND' ? 'REF' : 'REP'}
                    </span>
                    <div style={{ minWidth: 0, paddingRight: '8px' }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: 'var(--ink-fg)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rec.item_name || 'Custom item'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--ink-fg-3)',
                          marginTop: '2px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {rec.customer_name} |{' '}
                        {rec.date ? rec.date.substring(0, 10) : ''}
                      </div>
                    </div>
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color:
                          rec.type === 'REFUND'
                            ? 'var(--ink-danger)'
                            : 'var(--ink-success)',
                      }}
                    >
                      {rec.type === 'REFUND' ? '−' : '+'} Rs.{' '}
                      {Number(rec.amount_refunded || 0).toLocaleString()}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--ink-fg-3)',
                          fontWeight: 500,
                        }}
                      >
                        Completed
                      </span>
                    </div>
                    <span
                      style={{
                        textAlign: 'right',
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      by {rec.operator_name || 'Manager'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QUICK CATALOG SELECTOR */}
          <div
            style={{
              background: 'var(--ink-0)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--ink-3)',
              height: '220px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  ...typeScale.sectionTitle,
                  margin: 0,
                  color: 'var(--ink-fg)',
                }}
              >
                Quick select from catalog
              </h3>
              <div style={{ position: 'relative', width: '200px' }}>
                <label htmlFor={catalogSearchId} className="sr-only">
                  Search catalog
                </label>
                <input
                  id={catalogSearchId}
                  type="text"
                  placeholder="Search"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: '34px',
                    padding: '6px 32px 6px 10px',
                    fontSize: '0.8125rem',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--ink-fg-3)',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <SearchIcon />
                </span>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              {filteredCatalogItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsManualMode(false);
                    setForm({
                      ...form,
                      item_id: item.id,
                      amount_refunded: item.selling_price || '',
                    });
                    setItemSearchText(`${item.name} (${item.code})`);
                  }}
                  style={{
                    ...sansFamily,
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    transition:
                      'border-color 150ms ease, background-color 150ms ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--brand-primary)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--ink-3)')
                  }
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--ink-0)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    {item.image_path ? (
                      <img
                        src={item.image_path}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
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
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--ink-fg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      className="monospace tabular"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-3)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      Rs. {Number(item.selling_price || 0).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
