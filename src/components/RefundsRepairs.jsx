import React, { useState, useEffect, useRef } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px/18px 1.5 stroke)
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

const CloseIcon = () => (
  <svg {...iconBase}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Helper for product initials
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--ink-0)',
        border: '1px solid var(--ink-3)',
        borderLeft: `4px solid ${isError ? 'var(--ink-danger)' : 'var(--ink-success)'}`,
        color: 'var(--ink-fg)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '280px',
        fontWeight: 500,
        fontSize: '0.82rem',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
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

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label
      style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--ink-fg-2)',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  fontSize: '0.85rem',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RefundsRepairs({ currentUser }) {
  const [items, setItems] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [toasts, setToasts] = useState([]);

  // Form State
  const [form, setForm] = useState({
    type: 'REFUND', // 'REFUND' or 'REPAIR'
    sale_id: '',
    item_id: '',
    qty: 1,
    amount_refunded: '',
    customer_name: '',
    phone: '',
    status: 'PENDING',
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
        currentUser,
      };
      const res = await ipc.invoke('record-refund-repair', payload);

      if (res.success) {
        addToast(
          `${form.type === 'REFUND' ? 'Refund' : 'Repair ticket'} logged successfully!`,
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
          status: 'PENDING',
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

  const handleStatusUpdate = async (recordId, newStatus) => {
    addToast(`Status updated to ${newStatus}`, 'success');
    setRecentRecords(
      recentRecords.map((r) =>
        r.id === recordId ? { ...r, status: newStatus } : r,
      ),
    );
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
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
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
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--ink-fg)',
              fontSize: '1.05rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Refunds & Repairs Management
          </h3>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
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
            borderRadius: '10px',
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
              paddingBottom: '10px',
              borderBottom: '1px solid var(--ink-3)',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Log Transaction
            </h4>
            <button
              type="button"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: isManualMode
                  ? 'var(--brand-primary)'
                  : 'var(--ink-1)',
                color: isManualMode ? '#fff' : 'var(--ink-fg-2)',
                fontWeight: 500,
                border: '1px solid var(--ink-3)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsManualMode(!isManualMode);
                setForm({ ...form, item_id: '' });
                setItemSearchText('');
              }}
            >
              {isManualMode ? '🔍 Use Catalog' : '+ Custom Item'}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <Field label="Operation Type">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'REFUND' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      form.type === 'REFUND'
                        ? 'var(--ink-danger)'
                        : 'var(--ink-1)',
                    color: form.type === 'REFUND' ? '#fff' : 'var(--ink-fg-2)',
                    fontWeight: 500,
                    border: '1px solid var(--ink-3)',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Item Refund
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'REPAIR' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      form.type === 'REPAIR'
                        ? 'var(--brand-primary)'
                        : 'var(--ink-1)',
                    color: form.type === 'REPAIR' ? '#fff' : 'var(--ink-fg-2)',
                    fontWeight: 500,
                    border: '1px solid var(--ink-3)',
                    cursor: 'pointer',
                  }}
                >
                  🛠️ Device Repair
                </button>
              </div>
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Customer Name *">
                <input
                  type="text"
                  style={inputStyle}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0300-0000000"
                />
              </Field>
            </div>

            {!isManualMode ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <Field label="Select Product (Search Name/SKU)">
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={itemSearchText}
                      onChange={(e) => {
                        setItemSearchText(e.target.value);
                        setIsItemDropdownOpen(true);
                      }}
                      onFocus={() => setIsItemDropdownOpen(true)}
                      style={{ ...inputStyle, paddingRight: '32px' }}
                      required={!form.item_id && !isManualMode}
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
                </Field>

                {isItemDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '180px',
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
                          padding: '12px',
                          fontSize: '0.78rem',
                          color: 'var(--ink-fg-3)',
                          textAlign: 'center',
                        }}
                      >
                        No matching items found.
                      </div>
                    ) : (
                      filteredLookupItems.map((i) => (
                        <div
                          key={i.id}
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
                            padding: '10px 12px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--ink-3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
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
                              fontSize: '0.7rem',
                              color: 'var(--brand-primary)',
                              background: 'var(--ink-1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              border: '1px solid var(--ink-3)',
                            }}
                          >
                            Stock: {i.stock_qty}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Field label="Custom Item Name *">
                <input
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
                gap: '10px',
              }}
            >
              <Field label="Quantity">
                <input
                  type="number"
                  className="monospace tabular"
                  style={{ ...inputStyle, fontWeight: 600 }}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  min="1"
                  required
                />
              </Field>
              <Field
                label={
                  form.type === 'REFUND'
                    ? 'Amount Refunded (Rs.)'
                    : 'Repair Charge (Rs.)'
                }
              >
                <input
                  type="number"
                  step="0.01"
                  className="monospace tabular"
                  style={{ ...inputStyle, fontWeight: 600 }}
                  value={form.amount_refunded}
                  onChange={(e) =>
                    setForm({ ...form, amount_refunded: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>
            </div>

            {form.type === 'REPAIR' && (
              <Field label="Repair Status">
                <select
                  style={inputStyle}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="PENDING">Pending (In Workshop)</option>
                  <option value="COMPLETED">
                    Completed (Ready for Pickup)
                  </option>
                  <option value="DELIVERED">
                    Delivered (Handed to Customer)
                  </option>
                </select>
              </Field>
            )}

            <Field label="Reason / Repair Details">
              <textarea
                style={{ ...inputStyle, height: '64px', resize: 'vertical' }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Screen replacement / Defective return..."
              />
            </Field>

            <button
              type="submit"
              style={{
                padding: '11px 16px',
                background:
                  form.type === 'REFUND'
                    ? 'var(--ink-danger)'
                    : 'var(--brand-primary)',
                fontWeight: 500,
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Submit & Post to Ledger
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
              borderRadius: '10px',
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
                paddingBottom: '8px',
                borderBottom: '1px solid var(--ink-3)',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Recent Activity
              </h4>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--ink-fg-3)',
                  fontWeight: 500,
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
                gap: '6px',
              }}
            >
              {recentRecords.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--ink-fg-3)',
                    padding: '30px 0',
                    fontSize: '0.8rem',
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
                      gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr',
                      fontSize: '0.75rem',
                      alignItems: 'center',
                      background: 'var(--ink-1)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--ink-3)',
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
                        {rec.item_name || 'Custom Item'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--ink-fg-3)',
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
                      {rec.type === 'REPAIR' ? (
                        <select
                          value={rec.status || 'PENDING'}
                          onChange={(e) =>
                            handleStatusUpdate(rec.id, e.target.value)
                          }
                          style={{
                            padding: '3px 6px',
                            fontSize: '0.68rem',
                            borderRadius: '4px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-0)',
                            color: 'var(--ink-fg)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--ink-fg-3)',
                            fontWeight: 500,
                          }}
                        >
                          Refunded
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        textAlign: 'right',
                        fontSize: '0.68rem',
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
              borderRadius: '10px',
              padding: '16px',
              border: '1px solid var(--ink-3)',
              height: '210px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Quick Select from Catalog
              </h4>
              <div style={{ position: 'relative', width: '180px' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    padding: '6px 10px',
                    paddingRight: '28px',
                    fontSize: '0.75rem',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '8px',
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
                <div
                  key={item.id}
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
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 120ms ease',
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
                      width: '30px',
                      height: '30px',
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
                          fontSize: '0.7rem',
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
                        fontSize: '0.75rem',
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
                        fontSize: '0.68rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      Rs. {Number(item.selling_price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
