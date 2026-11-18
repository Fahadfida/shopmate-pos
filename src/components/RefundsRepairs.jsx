import React, { useState, useEffect, useRef } from 'react';
import { getIpc } from '../utils/ipc';

// Helper for product initials
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// --- TOAST COMPONENT ---
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
  };
  const c = colors[type] || colors.success;
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
    // We will just update local state for now, in a real app you'd call an IPC handler to update the DB
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
        flex: 1, // 👈 ADD THIS
        height: '100%',
        // height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
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
          background: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Refunds & Repairs Management
          </h3>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
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
          className="card"
          style={{
            flex: 1.1,
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '20px',
            border: '1.5px solid var(--border-color)',
            overflowY: 'auto',
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
            <h4
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: '800',
                color: 'var(--text-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Log Transaction
            </h4>
            <button
              type="button"
              className="btn"
              style={{
                fontSize: '0.7rem',
                padding: '4px 8px',
                background: isManualMode ? 'var(--brand-primary)' : '#f1f5f9',
                color: isManualMode ? '#fff' : '#334155',
                fontWeight: 'bold',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
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
            <div>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                Operation Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'REFUND' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: form.type === 'REFUND' ? '#e11d48' : '#f1f5f9',
                    color: form.type === 'REFUND' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
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
                      form.type === 'REPAIR' ? 'var(--info)' : '#f1f5f9',
                    color: form.type === 'REPAIR' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🛠️ Device Repair
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Customer Name*
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Phone
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0300-0000000"
                />
              </div>
            </div>

            {!isManualMode ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Select Product (Search Name/SKU)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="🔍 Type to search..."
                  value={itemSearchText}
                  onChange={(e) => {
                    setItemSearchText(e.target.value);
                    setIsItemDropdownOpen(true);
                  }}
                  onFocus={() => setIsItemDropdownOpen(true)}
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  required={!form.item_id && !isManualMode}
                />
                {isItemDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      background: 'var(--bg-card)',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 999,
                      marginTop: '4px',
                    }}
                  >
                    {filteredLookupItems.length === 0 ? (
                      <div
                        style={{
                          padding: '10px',
                          fontSize: '0.78rem',
                          color: '#94a3b8',
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
                            padding: '10px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {i.name}{' '}
                            <span
                              style={{
                                color: 'var(--text-secondary)',
                                fontWeight: 'normal',
                              }}
                            >
                              ({i.code})
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--info)',
                              background: '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
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
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Custom Item Name*
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                    background: '#fdf8f6',
                  }}
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  placeholder="e.g. Samsung TV 42 inch"
                  required={isManualMode}
                />
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Quantity
                </label>
                <input
                  type="number"
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color:
                      form.type === 'REFUND' ? '#e11d48' : 'var(--success)',
                  }}
                >
                  {form.type === 'REFUND'
                    ? 'Amount Refunded (Rs.)'
                    : 'Repair Charge (Rs.)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                    fontWeight: 'bold',
                  }}
                  value={form.amount_refunded}
                  onChange={(e) =>
                    setForm({ ...form, amount_refunded: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            {form.type === 'REPAIR' && (
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Repair Status
                </label>
                <select
                  className="input-field"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
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
              </div>
            )}

            <div>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#475569',
                }}
              >
                Reason / Repair Details
              </label>
              <textarea
                className="input-field"
                style={{
                  padding: '10px',
                  fontSize: '0.8rem',
                  height: '70px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  width: '100%',
                }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Screen replacement / Defective return..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '12px',
                background: form.type === 'REFUND' ? '#e11d48' : 'var(--info)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                marginTop: '8px',
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
            className="card"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '10px',
              padding: '16px',
              border: '1.5px solid var(--border-color)',
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
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Recent Activity
              </h4>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
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
                    color: '#94a3b8',
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
                      background: 'var(--bg-hover)',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: '700',
                        color:
                          rec.type === 'REFUND' ? '#e11d48' : 'var(--info)',
                      }}
                    >
                      {rec.type === 'REFUND' ? 'REF' : 'REP'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rec.item_name || 'Custom Item'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {rec.customer_name} |{' '}
                        {rec.date ? rec.date.substring(0, 10) : ''}
                      </div>
                    </div>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        fontWeight: '800',
                        color:
                          rec.type === 'REFUND' ? '#e11d48' : 'var(--success)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {rec.type === 'REFUND' ? '-' : '+'} Rs.{' '}
                      {rec.amount_refunded?.toLocaleString()}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      {rec.type === 'REPAIR' ? (
                        <select
                          value={rec.status || 'PENDING'}
                          onChange={(e) =>
                            handleStatusUpdate(rec.id, e.target.value)
                          }
                          style={{
                            padding: '2px 4px',
                            fontSize: '0.65rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-strong)',
                            background:
                              rec.status === 'PENDING'
                                ? '#fef3c7'
                                : rec.status === 'COMPLETED'
                                  ? '#d1fae5'
                                  : '#e2e8f0',
                            color:
                              rec.status === 'PENDING'
                                ? '#d97706'
                                : rec.status === 'COMPLETED'
                                  ? 'var(--success)'
                                  : '#334155',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 'bold',
                          }}
                        >
                          Refunded
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        textAlign: 'right',
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        fontWeight: '600',
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
            className="card"
            style={{
              background: 'var(--bg-hover)',
              borderRadius: '10px',
              padding: '16px',
              border: '1.5px solid var(--border-color)',
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
                marginBottom: '10px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Quick Select from Catalog
              </h4>
              <input
                type="text"
                className="input-field"
                placeholder="🔍 Search..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                style={{
                  width: '200px',
                  margin: 0,
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--info)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = '#e2e8f0')
                  }
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--bg-hover)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: '#94a3b8',
                        }}
                      >
                        {getInitials(item.name)}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Rs. {item.selling_price}
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
