import React, { useState, useEffect, useRef } from 'react';
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

export default function Purchases({ currentUser }) {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('GRID');
  const [toasts, setToasts] = useState([]);

  // Form State
  const [purchaseType, setPurchaseType] = useState('REGISTERED');
  const [purchase, setPurchase] = useState({
    supplier_id: '',
    custom_supplier_name: '',
    item_id: '',
    qty_received: '',
    unit_cost: '',
    payment_type: 'CREDIT',
    invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().substring(0, 10),
  });

  // Item Lookup & New Product Modal State
  const [itemSearchText, setItemSearchText] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const formRef = useRef(null);
  const qtyInputRef = useRef(null);

  // New Product Modal State (Cloned from Inventory)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMarginType, setAddMarginType] = useState('custom');
  const [itemForm, setItemForm] = useState({
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

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      const fetchedItems = await ipc.invoke('get-items');
      const fetchedSuppliers = await ipc.invoke('get-suppliers');
      setItems(fetchedItems || []);
      setSuppliers(fetchedSuppliers || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-generate SKU for New Product
  useEffect(() => {
    const fetchSku = async () => {
      const ipc = getIpc();
      if (ipc && itemForm.name && isAddModalOpen) {
        const generatedCode = await ipc.invoke('get-next-sku', {
          category: itemForm.category,
          name: itemForm.name,
        });
        setItemForm((prev) => ({ ...prev, code: generatedCode }));
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
      return addToast('Please select an inventory item first.', 'error');
    if (!purchase.qty_received || parseFloat(purchase.qty_received) <= 0)
      return addToast('Enter a valid received quantity.', 'error');

    const ipc = getIpc();
    if (ipc) {
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
        addToast('Stock received & WAC updated successfully!', 'success');
        setPurchase({
          supplier_id: '',
          custom_supplier_name: '',
          item_id: '',
          qty_received: '',
          unit_cost: '',
          payment_type: 'CREDIT',
          invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().substring(0, 10),
        });
        setItemSearchText('');
        loadData();
      } else {
        addToast('Error: ' + res.error, 'error');
      }
    }
  };

  // NEW PRODUCT HANDLER
  const handleRegisterNewItem = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const payload = { ...itemForm, stock_qty: 0 };
      const res = await ipc.invoke('add-item', { item: payload, currentUser });
      if (res.success) {
        setIsAddModalOpen(false);
        setItemForm({
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
        setAddMarginType('custom');
        addToast(
          'New product registered successfully. You can now restock it.',
          'success',
        );

        // Refresh items and auto-select the newly created item
        const fetchedItems = await ipc.invoke('get-items');
        setItems(fetchedItems || []);

        // Note: Since the backend doesn't return the ID of the new item in this specific handler,
        // we'll just prompt the user to search for it again. (Best practice would be to return the ID).
        // For now, we just clear the search.
        setItemSearchText('');
      } else {
        addToast('Error adding item: ' + res.error, 'error');
      }
    }
  };

  const handleQuickRestock = (item) => {
    setPurchase({
      ...purchase,
      item_id: item.id,
      unit_cost: item.avg_cost || '',
    });
    setItemSearchText(
      `${item.name} (${item.code}) - Stock: ${item.stock_qty} ${item.unit}`,
    );

    // UI Magic: Scroll to form and highlight it
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      formRef.current.style.boxShadow = '0 0 0 3px var(--info)';
      setTimeout(() => {
        if (formRef.current) formRef.current.style.boxShadow = 'none';
      }, 1500);
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1, // 👈 ADD THIS
        height: '100%',
        gap: '16px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
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

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '10px 18px',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
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
          Stock Purchases & GRN Intake
        </h3>
        <button
          className="btn"
          style={{
            padding: '8px 16px',
            background: 'var(--brand-primary)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={loadData}
        >
          🔄 Refresh Catalog
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '5px',
          flex: 1,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* LEFT FORM PANEL */}
        <div
          ref={formRef}
          className="card"
          style={{
            flex: '1.1',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
            overflowY: 'auto',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: '0.95rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Log Stock Addition / GRN
          </h4>

          <form
            onSubmit={handleRecordPurchase}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* SOURCE TOGGLE */}
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
                Purchase Source
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPurchaseType('REGISTERED')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      purchaseType === 'REGISTERED' ? 'var(--info)' : '#f1f5f9',
                    color: purchaseType === 'REGISTERED' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Registered Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseType('DIRECT')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      purchaseType === 'DIRECT' ? 'var(--info)' : '#f1f5f9',
                    color: purchaseType === 'DIRECT' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Direct / Custom Buy
                </button>
              </div>
            </div>

            {purchaseType === 'REGISTERED' ? (
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Select Wholesaler
                </label>
                <select
                  className="input-field"
                  value={purchase.supplier_id}
                  onChange={(e) =>
                    setPurchase({ ...purchase, supplier_id: e.target.value })
                  }
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  required
                >
                  <option value="">-- Choose Wholesaler --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || 'Direct'})
                    </option>
                  ))}
                </select>
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
                  Custom Vendor / Market Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={purchase.custom_supplier_name}
                  onChange={(e) =>
                    setPurchase({
                      ...purchase,
                      custom_supplier_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Wholesale Market"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                />
              </div>
            )}

            {/* PAYMENT MODE */}
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
                Payment Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: 'CREDIT' })
                  }
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      purchase.payment_type === 'CREDIT'
                        ? 'var(--brand-primary)'
                        : '#f1f5f9',
                    color:
                      purchase.payment_type === 'CREDIT' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  On Credit (Payable)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: 'CASH' })
                  }
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background:
                      purchase.payment_type === 'CASH'
                        ? 'var(--success)'
                        : '#f1f5f9',
                    color:
                      purchase.payment_type === 'CASH' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Paid in Cash
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
                  Supplier Bill / Invoice No.
                </label>
                <input
                  type="text"
                  className="input-field monospace"
                  value={purchase.invoice_no}
                  onChange={(e) =>
                    setPurchase({ ...purchase, invoice_no: e.target.value })
                  }
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
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
                  Purchase Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={purchase.date}
                  onChange={(e) =>
                    setPurchase({ ...purchase, date: e.target.value })
                  }
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  required
                />
              </div>
            </div>

            {/* ITEM LOOKUP WITH CREATE NEW */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#475569',
                }}
              >
                Search Inventory Item
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="🔍 Type product name or SKU..."
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
                required
              />

              {isItemDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    marginTop: '4px',
                  }}
                >
                  {filteredLookupItems.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        No product found matching "{itemSearchText}"
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--brand-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        + Create New Product
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
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '700',
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
                          Stock: {i.stock_qty} {i.unit}
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
                  Received Qty
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  className="input-field"
                  value={purchase.qty_received}
                  onChange={(e) =>
                    setPurchase({ ...purchase, qty_received: e.target.value })
                  }
                  placeholder="50"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
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
                  Wholesale Unit Cost
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={purchase.unit_cost}
                  onChange={(e) =>
                    setPurchase({ ...purchase, unit_cost: e.target.value })
                  }
                  placeholder="1150"
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                  required
                />
              </div>
            </div>

            {/* GIANT TOTAL BANNER */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1.5px solid var(--info)',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: '#0369a1',
                  textTransform: 'uppercase',
                }}
              >
                Total Bill Amount
              </span>
              <span
                className="monospace"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '900',
                  color: '#0c4a6e',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Rs. {estimatedTotal.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '12px',
                marginTop: '4px',
                background: 'var(--brand-primary)',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              Record Purchase & Update WAC
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: CATALOG */}
        <div
          className="card"
          style={{
            flex: '2',
            background: 'var(--bg-hover)',
            borderRadius: '10px',
            padding: '18px',
            border: '1.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
              Inventory Catalog
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="input-field"
                placeholder="🔍 Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '220px',
                  margin: 0,
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--bg-hover)',
                  padding: '4px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <button
                  onClick={() => setViewMode('GRID')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    background:
                      viewMode === 'GRID'
                        ? 'var(--brand-primary)'
                        : 'transparent',
                    color: viewMode === 'GRID' ? '#fff' : '#334155',
                    border: 'none',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    background:
                      viewMode === 'LIST'
                        ? 'var(--brand-primary)'
                        : 'transparent',
                    color: viewMode === 'LIST' ? '#fff' : '#334155',
                    border: 'none',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {viewMode === 'GRID' ? (
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
                      background: 'var(--bg-card)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
                          width: '50px',
                          height: '50px',
                          background: 'var(--bg-hover)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-strong)',
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
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>📦</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          SKU: {item.code}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color:
                              item.stock_qty <= 5
                                ? 'var(--danger)'
                                : 'var(--success)',
                            fontWeight: 'bold',
                          }}
                        >
                          Stock: {item.stock_qty} {item.unit}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#475569',
                      }}
                    >
                      <span>Cost (WAC):</span>
                      <span
                        className="monospace"
                        style={{ fontWeight: 'bold' }}
                      >
                        Rs. {item.avg_cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickRestock(item)}
                      style={{
                        padding: '8px',
                        fontSize: '0.75rem',
                        background: 'var(--info)',
                        fontWeight: 'bold',
                        width: '100%',
                        borderRadius: '6px',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Quick Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>SKU</span>
                  <span>Product Name</span>
                  <span style={{ textAlign: 'right' }}>Stock</span>
                  <span style={{ textAlign: 'right' }}>WAC</span>
                  <span style={{ textAlign: 'center' }}>Action</span>
                </div>
                {filteredCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                      fontSize: '0.78rem',
                      alignItems: 'center',
                      background: 'var(--bg-card)',
                      padding: '10px',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span
                      className="monospace"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.code}
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
                      {item.name}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color:
                          item.stock_qty <= 5
                            ? 'var(--danger)'
                            : 'var(--success)',
                      }}
                    >
                      {item.stock_qty} {item.unit}
                    </span>
                    <span className="monospace" style={{ textAlign: 'right' }}>
                      Rs. {item.avg_cost?.toFixed(2) || '0.00'}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleQuickRestock(item)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          background: 'var(--info)',
                          fontWeight: 'bold',
                          borderRadius: '6px',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredCatalogItems.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  padding: '40px 0',
                  fontSize: '0.85rem',
                }}
              >
                No products found in inventory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ➕ ADD NEW PRODUCT MODAL (CLONED FROM INVENTORY) */}
      {isAddModalOpen && (
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
              width: '480px',
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
                  fontSize: '1.1rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                + Register New Product
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
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                background: 'var(--bg-hover)',
                padding: '10px',
                borderRadius: '6px',
              }}
            >
              New products start with 0 stock. Once saved, you can select them
              in the Purchase form.
            </p>
            <form
              onSubmit={handleRegisterNewItem}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
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
                      color: 'var(--text-primary)',
                    }}
                  >
                    SKU (Auto)
                  </label>
                  <input
                    type="text"
                    className="input-field monospace"
                    style={{
                      background: 'var(--bg-hover)',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      width: '100%',
                    }}
                    value={itemForm.code}
                    readOnly
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
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    placeholder="e.g. Electronics"
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                  }}
                >
                  Item Name
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
                  value={itemForm.name}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, name: e.target.value })
                  }
                  placeholder="e.g. Wireless Mouse"
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.5fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Initial Unit Cost
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
                    value={itemForm.avg_cost}
                    onChange={(e) => {
                      const newCost = parseFloat(e.target.value) || 0;
                      const newSp =
                        calculateSellingPrice(newCost, addMarginType) ||
                        itemForm.selling_price;
                      setItemForm({
                        ...itemForm,
                        avg_cost: newCost,
                        selling_price: newSp,
                      });
                    }}
                    placeholder="800"
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
                    Profit Margin
                  </label>
                  <select
                    className="input-field"
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      width: '100%',
                    }}
                    value={addMarginType}
                    onChange={(e) => {
                      const mType = e.target.value;
                      setAddMarginType(mType);
                      const newSp = calculateSellingPrice(
                        itemForm.avg_cost,
                        mType,
                      );
                      if (newSp !== null)
                        setItemForm({ ...itemForm, selling_price: newSp });
                    }}
                  >
                    <option value="custom">Manual</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Selling Price*
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
                    value={itemForm.selling_price}
                    onChange={(e) => {
                      setItemForm({
                        ...itemForm,
                        selling_price: parseFloat(e.target.value) || 0,
                      });
                      setAddMarginType('custom');
                    }}
                    placeholder="1200"
                    required
                  />
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
                      color: 'var(--text-primary)',
                    }}
                  >
                    Min Bargain Price
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
                    value={itemForm.min_price}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        min_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="1000"
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
                    Max List Price
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
                    value={itemForm.max_price}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        max_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="1500"
                  />
                </div>
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
                  Save & Register
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
                  onClick={() => setIsAddModalOpen(false)}
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
