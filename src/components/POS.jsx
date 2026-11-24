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
  `Rs. ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─────────────────────────────────────────────────────────────
// Icons — 16px, 1.5 stroke, mono color
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

const BagIcon = () => (
  <svg {...iconBase}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const PlusIcon = () => (
  <svg {...iconBase}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MinusIcon = () => (
  <svg {...iconBase}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PrinterIcon = () => (
  <svg {...iconBase}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const CardIcon = () => (
  <svg {...iconBase}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
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

const CloseIcon = () => (
  <svg {...iconBase}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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

const BagSmallIcon = () => (
  <svg {...iconBase} width="14" height="14">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────
const Chip = ({ active, onClick, children, icon }) => (
  <button
    type="button"
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
      border: '1px solid ' + (active ? 'var(--ink-3)' : 'transparent'),
      background: active ? 'var(--ink-2)' : 'transparent',
      color: active ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
      cursor: 'pointer',
      transition: 'background-color 120ms ease, color 120ms ease',
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

const QtyButton = ({ onClick, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '24px',
      height: '24px',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink-2)',
      border: '1px solid var(--ink-3)',
      color: 'var(--ink-fg)',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────
// POS
// ─────────────────────────────────────────────────────────────
export default function POS({ currentUser, showToast }) {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [viewMode, setViewMode] = useState('GRID');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopSettings, setShopSettings] = useState({});

  const [codMeta, setCodMeta] = useState({
    consignment_number: '',
    delivery_charges: 0,
    tax_percentage: 0,
  });
  const [lastReceipt, setLastReceipt] = useState(null);

  const toast = (msg, type = 'info') => {
    if (showToast) showToast(msg, type);
    else if (type === 'error') console.error(msg);
  };

  const loadCatalog = async () => {
    const ipc = getIpc();
    if (!ipc) return;
    const [nextItems, nextCustomers] = await Promise.all([
      ipc.invoke('get-items'),
      ipc.invoke('get-customers'),
    ]);
    setItems(nextItems);
    setCustomers(nextCustomers);
  };

  useEffect(() => {
    const boot = async () => {
      const ipc = getIpc();
      if (!ipc) {
        setLoading(false);
        return;
      }
      try {
        const [nextItems, nextCustomers, nextSettings] = await Promise.all([
          ipc.invoke('get-items'),
          ipc.invoke('get-customers'),
          ipc.invoke('get-settings'),
        ]);
        setItems(nextItems);
        setCustomers(nextCustomers);
        setShopSettings(nextSettings || {});
      } catch (err) {
        console.error('POS load failed:', err);
        setError(err?.message || 'Could not load POS data.');
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const addToCart = (item) => {
    if (item.stock_qty <= 0) return toast('Item is out of stock.', 'error');
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      if (existing.qty + 1 > item.stock_qty)
        return toast('Exceeds available stock.', 'error');
      setCart(
        cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)),
      );
    } else {
      setCart([...cart, { ...item, qty: 1, price: item.selling_price }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(
      cart
        .map((c) => {
          if (c.id !== id) return c;
          const next = c.qty + delta;
          if (next <= 0) return null;
          if (next > c.stock_qty) {
            toast('Exceeds available stock.', 'error');
            return c;
          }
          return { ...c, qty: next };
        })
        .filter(Boolean),
    );
  };

  const updateCartQtyDirect = (id, val) => {
    const next = parseInt(val, 10);
    if (isNaN(next) || next <= 0) {
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: val } : c)));
      return;
    }
    setCart(
      cart.map((c) => {
        if (c.id !== id) return c;
        if (next > c.stock_qty) {
          toast(`Exceeds stock (${c.stock_qty} ${c.unit || 'pcs'})`, 'error');
          return { ...c, qty: c.stock_qty };
        }
        return { ...c, qty: next };
      }),
    );
  };

  const updateCartPrice = (id, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    setCart(cart.map((c) => (c.id === id ? { ...c, price } : c)));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0) * item.price,
    0,
  );
  const codDelivery = parseFloat(codMeta.delivery_charges) || 0;
  const taxRate = parseFloat(codMeta.tax_percentage) || 0;
  const codTaxAmount =
    paymentType === 'COD' ? (subtotal + codDelivery) * (taxRate / 100) : 0;
  const finalTotal =
    paymentType === 'COD' ? subtotal + codDelivery + codTaxAmount : subtotal;

  const handleQuickSell = async (item) => {
    if (item.stock_qty <= 0) return toast('Item is out of stock.', 'error');
    const ipc = getIpc();
    if (!ipc) return;

    const line = { ...item, qty: 1, price: item.selling_price };
    const res = await ipc.invoke('create-sale', {
      customer_id: null,
      items: [line],
      payment_type: 'CASH',
      cod_meta: null,
      currentUser,
    });

    if (res.success) {
      toast(`Sale complete · INV-${res.saleId}`, 'success');
      setLastReceipt({
        saleId: res.saleId,
        items: [line],
        subtotal: res.productSubtotal || item.selling_price,
        codDelivery: 0,
        codTaxAmount: 0,
        taxPercentage: 0,
        total: res.totalAmount,
        paymentType: 'CASH',
        customerName: null,
        date: new Date().toLocaleString(),
      });
      await loadCatalog();
    } else {
      toast('Quick sale failed: ' + res.error, 'error');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast('Cart is empty.', 'error');
    if (paymentType === 'CREDIT' && !selectedCustomer)
      return toast('Select a customer for a Khata sale.', 'error');

    const ipc = getIpc();
    if (!ipc) return;

    const res = await ipc.invoke('create-sale', {
      customer_id: selectedCustomer || null,
      items: cart,
      payment_type: paymentType,
      cod_meta:
        paymentType === 'COD'
          ? { ...codMeta, government_tax: codTaxAmount }
          : null,
      currentUser,
    });

    if (res.success) {
      const matched = customers.find(
        (c) => c.id.toString() === selectedCustomer.toString(),
      );
      toast(`Sale complete · INV-${res.saleId}`, 'success');
      setLastReceipt({
        saleId: res.saleId,
        items: [...cart],
        subtotal: res.productSubtotal || subtotal,
        codDelivery,
        codTaxAmount,
        taxPercentage: taxRate,
        total: res.totalAmount,
        paymentType,
        customerName: matched ? matched.name : null,
        date: new Date().toLocaleString(),
      });
      setCart([]);
      setCodMeta({
        consignment_number: '',
        delivery_charges: 0,
        tax_percentage: 0,
      });
      await loadCatalog();
    } else {
      toast('Checkout failed: ' + res.error, 'error');
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── States
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
        Loading catalog…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          background: 'var(--ink-danger)',
          color: '#ffffff',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        {error} —{' '}
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        height: 'calc(100vh - 64px)',
        gap: '16px',
        color: 'var(--ink-fg)',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ─────────── CATALOG ─────────── */}
      <div
        style={{
          flex: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--ink-0)',
            padding: '16px',
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
              Counter
            </h2>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '0.75rem',
                color: 'var(--ink-fg-3)',
              }}
            >
              Tap a shelf item, or scan a SKU
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
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
                placeholder="Search item or SKU"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  height: '34px',
                  fontSize: '0.8rem',
                  width: '100%',
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '8px',
                  color: 'var(--ink-fg)',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '2px',
                background: 'var(--ink-1)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <Chip
                active={viewMode === 'GRID'}
                onClick={() => setViewMode('GRID')}
                icon={<GridIcon />}
              >
                Grid
              </Chip>
              <Chip
                active={viewMode === 'LIST'}
                onClick={() => setViewMode('LIST')}
                icon={<ListIcon />}
              >
                List
              </Chip>
            </div>
          </div>
        </div>

        {/* Products */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: 'var(--ink-fg-3)',
                gap: '8px',
                border: '1px dashed var(--ink-3)',
                borderRadius: '12px',
              }}
            >
              <BagIcon />
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {searchQuery
                  ? 'No matches for this search'
                  : 'No items in inventory yet'}
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                {searchQuery
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
                alignContent: 'start',
              }}
            >
              {filteredItems.map((item) => {
                const out = item.stock_qty <= 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--ink-0)',
                      borderRadius: '12px',
                      border: '1px solid var(--ink-3)',
                      minHeight: '140px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
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
                              fontSize: '0.85rem',
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
                            fontSize: '0.82rem',
                            fontWeight: 600,
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
                            marginTop: '2px',
                          }}
                        >
                          {item.code}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: out
                              ? 'var(--ink-danger)'
                              : 'var(--ink-fg-2)',
                            marginTop: '2px',
                            fontWeight: 500,
                          }}
                        >
                          {out
                            ? 'Out of stock'
                            : `${item.stock_qty} ${item.unit || 'pcs'} on hand`}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--ink-3)',
                      }}
                    >
                      <span
                        className="monospace tabular"
                        style={{
                          fontWeight: 600,
                          color: 'var(--ink-fg)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {fmt(item.selling_price)}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          disabled={out}
                          onClick={() => addToCart(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            borderRadius: '6px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-1)',
                            color: out ? 'var(--ink-fg-3)' : 'var(--ink-fg)',
                            cursor: out ? 'not-allowed' : 'pointer',
                            opacity: out ? 0.6 : 1,
                          }}
                        >
                          <PlusIcon /> Add
                        </button>
                        <button
                          disabled={out}
                          onClick={() => handleQuickSell(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            borderRadius: '6px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-1)',
                            color: out ? 'var(--ink-fg-3)' : 'var(--ink-fg)',
                            cursor: out ? 'not-allowed' : 'pointer',
                            opacity: out ? 0.6 : 1,
                          }}
                        >
                          <BagSmallIcon /> Sell
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--ink-3)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--ink-0)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 2fr 1fr 1fr 1.2fr',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  background: 'var(--ink-2)',
                  color: 'var(--ink-fg-2)',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--ink-3)',
                }}
              >
                <span>SKU</span>
                <span>Product</span>
                <span style={{ textAlign: 'right' }}>Stock</span>
                <span style={{ textAlign: 'right' }}>Price</span>
                <span style={{ textAlign: 'center' }}>Actions</span>
              </div>
              {filteredItems.map((item, idx) => {
                const out = item.stock_qty <= 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.8fr 2fr 1fr 1fr 1.2fr',
                      fontSize: '0.8rem',
                      alignItems: 'center',
                      background: 'var(--ink-0)',
                      padding: '10px 16px',
                      borderBottom:
                        idx === filteredItems.length - 1
                          ? 'none'
                          : '1px solid var(--ink-3)',
                    }}
                  >
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      {item.code}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          background: 'var(--ink-2)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--ink-3)',
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
                              borderRadius: '6px',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: 'var(--ink-fg-3)',
                            }}
                          >
                            {getInitials(item.name)}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontWeight: 500,
                          color: 'var(--ink-fg)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        color: out ? 'var(--ink-danger)' : 'var(--ink-fg-2)',
                      }}
                    >
                      {item.stock_qty} {item.unit || ''}
                    </span>
                    <span
                      className="monospace tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--ink-fg)',
                      }}
                    >
                      {fmt(item.selling_price)}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <button
                        disabled={out}
                        onClick={() => addToCart(item)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          borderRadius: '6px',
                          border: '1px solid var(--ink-3)',
                          background: 'var(--ink-1)',
                          color: out ? 'var(--ink-fg-3)' : 'var(--ink-fg)',
                          cursor: out ? 'not-allowed' : 'pointer',
                          opacity: out ? 0.6 : 1,
                        }}
                      >
                        Add
                      </button>
                      <button
                        disabled={out}
                        onClick={() => handleQuickSell(item)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          borderRadius: '6px',
                          border: '1px solid var(--ink-3)',
                          background: 'var(--ink-1)',
                          color: out ? 'var(--ink-fg-3)' : 'var(--ink-fg)',
                          cursor: out ? 'not-allowed' : 'pointer',
                          opacity: out ? 0.6 : 1,
                        }}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─────────── CART ─────────── */}
      <div
        style={{
          flex: 0.9,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--ink-0)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--ink-3)',
          boxSizing: 'border-box',
          minWidth: '320px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          {/* Cart header */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--ink-3)',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ color: 'var(--ink-fg-2)' }}>
                  <BagIcon />
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--ink-fg)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Order
                </h3>
              </div>
              <span
                className="monospace"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  background: 'var(--ink-2)',
                  color: 'var(--ink-fg-2)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {cart.reduce((s, i) => s + (parseInt(i.qty) || 0), 0)} items
              </span>
            </div>

            {/* Cart items */}
            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '2px',
              }}
            >
              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--ink-fg-3)',
                    padding: '28px 12px',
                    fontSize: '0.78rem',
                    border: '1px dashed var(--ink-3)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BagIcon />
                  <div style={{ fontWeight: 500 }}>Order is empty</div>
                  <div>Add items from the shelf.</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--ink-1)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      border: '1px solid var(--ink-3)',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
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
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          Price
                        </span>
                        <input
                          type="number"
                          className="monospace tabular"
                          value={item.price}
                          onChange={(e) =>
                            updateCartPrice(item.id, e.target.value)
                          }
                          style={{
                            width: '78px',
                            padding: '3px 6px',
                            fontSize: '0.75rem',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-0)',
                            color: 'var(--ink-fg)',
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <QtyButton onClick={() => updateCartQty(item.id, -1)}>
                        <MinusIcon />
                      </QtyButton>
                      <input
                        type="number"
                        className="monospace tabular"
                        value={item.qty}
                        onChange={(e) =>
                          updateCartQtyDirect(item.id, e.target.value)
                        }
                        style={{
                          width: '38px',
                          height: '24px',
                          padding: '2px',
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid var(--ink-3)',
                          background: 'var(--ink-0)',
                          color: 'var(--ink-fg)',
                        }}
                      />
                      <QtyButton onClick={() => updateCartQty(item.id, 1)}>
                        <PlusIcon />
                      </QtyButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment */}
          <div
            style={{
              borderTop: '1px solid var(--ink-3)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '4px',
                }}
              >
                Payment
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '2px',
                  background: 'var(--ink-1)',
                  padding: '2px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <Chip
                  active={paymentType === 'CASH'}
                  onClick={() => setPaymentType('CASH')}
                  icon={<CardIcon />}
                >
                  Cash
                </Chip>
                <Chip
                  active={paymentType === 'CREDIT'}
                  onClick={() => setPaymentType('CREDIT')}
                >
                  Khata
                </Chip>
                <Chip
                  active={paymentType === 'COD'}
                  onClick={() => setPaymentType('COD')}
                  icon={<TruckIcon />}
                >
                  COD
                </Chip>
              </div>
            </div>

            {paymentType === 'CREDIT' && (
              <div>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: 'var(--ink-fg-2)',
                    marginBottom: '4px',
                    display: 'block',
                  }}
                >
                  Party
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg)',
                    padding: '0 8px',
                  }}
                >
                  <option value="">Choose customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {fmt(c.balance)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {paymentType === 'COD' && (
              <div
                style={{
                  background: 'var(--ink-1)',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: 'var(--ink-fg-2)',
                  }}
                >
                  COD charges
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--ink-fg-3)',
                        display: 'block',
                        marginBottom: '2px',
                      }}
                    >
                      Delivery fee
                    </label>
                    <input
                      type="number"
                      className="monospace tabular"
                      value={codMeta.delivery_charges}
                      onChange={(e) =>
                        setCodMeta({
                          ...codMeta,
                          delivery_charges: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.75rem',
                        height: '26px',
                        width: '100%',
                        borderRadius: '6px',
                        border: '1px solid var(--ink-3)',
                        background: 'var(--ink-0)',
                        color: 'var(--ink-fg)',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--ink-fg-3)',
                        display: 'block',
                        marginBottom: '2px',
                      }}
                    >
                      Tax %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="monospace tabular"
                      value={codMeta.tax_percentage}
                      onChange={(e) =>
                        setCodMeta({
                          ...codMeta,
                          tax_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.75rem',
                        height: '26px',
                        width: '100%',
                        borderRadius: '6px',
                        border: '1px solid var(--ink-3)',
                        background: 'var(--ink-0)',
                        color: 'var(--ink-fg)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Totals */}
            <div
              style={{
                background: 'var(--ink-1)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--ink-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--ink-fg-2)',
                }}
              >
                <span>Subtotal</span>
                <span className="monospace tabular">{fmt(subtotal)}</span>
              </div>
              {paymentType === 'COD' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    <span>Delivery</span>
                    <span className="monospace tabular">
                      + {fmt(codDelivery)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    <span>Tax {taxRate}%</span>
                    <span className="monospace tabular">
                      + {fmt(codTaxAmount)}
                    </span>
                  </div>
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--ink-3)',
                  color: 'var(--ink-fg)',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Total
                </span>
                <span
                  className="monospace tabular"
                  style={{ fontSize: '1.05rem', fontWeight: 600 }}
                >
                  {fmt(finalTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                padding: '10px',
                fontSize: '0.85rem',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <PrinterIcon /> Complete sale
            </button>
          </div>
        </div>
      </div>

      {/* ─────────── RECEIPT MODAL ─────────── */}
      {lastReceipt && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLastReceipt(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            id="thermal-receipt-content"
            style={{
              background: 'var(--ink-1)',
              color: 'var(--ink-fg)',
              padding: '24px 22px',
              borderRadius: '10px',
              width: '320px',
              border: '1px solid var(--ink-3)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.78rem',
            }}
          >
            {/* Shop */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              {shopSettings.shop_logo ? (
                <img
                  src={shopSettings.shop_logo}
                  alt="Shop"
                  style={{
                    maxHeight: '40px',
                    maxWidth: '150px',
                    objectFit: 'contain',
                    marginBottom: '4px',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--ink-fg)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {shopSettings.shop_name || 'ShopMate'}
                </div>
              )}
              {shopSettings.shop_address && (
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--ink-fg-2)',
                    marginTop: '2px',
                  }}
                >
                  {shopSettings.shop_address}
                </div>
              )}
              {shopSettings.shop_phone && (
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-fg-2)' }}>
                  {shopSettings.shop_phone}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--ink-fg-3)',
                  marginTop: '4px',
                }}
              >
                {lastReceipt.date}
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--ink-3)',
                paddingTop: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                }}
              >
                <span style={{ color: 'var(--ink-fg-2)' }}>Invoice</span>
                <span className="tabular">#{lastReceipt.saleId}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                }}
              >
                <span style={{ color: 'var(--ink-fg-2)' }}>Payment</span>
                <span className="tabular">{lastReceipt.paymentType}</span>
              </div>
              {lastReceipt.customerName && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                  }}
                >
                  <span style={{ color: 'var(--ink-fg-2)' }}>Customer</span>
                  <span className="tabular">{lastReceipt.customerName}</span>
                </div>
              )}
            </div>

            {/* Lines */}
            <div
              style={{
                borderTop: '1px solid var(--ink-3)',
                paddingTop: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.66rem',
                  color: 'var(--ink-fg-3)',
                  paddingBottom: '4px',
                  borderBottom: '1px solid var(--ink-3)',
                  marginBottom: '6px',
                }}
              >
                <span>Item</span>
                <span>Amount</span>
              </div>
              {lastReceipt.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ color: 'var(--ink-fg)' }}>{item.name}</div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--ink-fg-3)',
                      }}
                      className="tabular"
                    >
                      {item.qty} × {fmt(item.price)}
                    </div>
                  </div>
                  <div
                    className="tabular"
                    style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {fmt(item.qty * item.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                borderTop: '1px solid var(--ink-3)',
                paddingTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-fg-2)' }}>Subtotal</span>
                <span className="tabular">{fmt(lastReceipt.subtotal)}</span>
              </div>
              {lastReceipt.paymentType === 'COD' && (
                <>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ color: 'var(--ink-fg-2)' }}>Delivery</span>
                    <span className="tabular">
                      {fmt(lastReceipt.codDelivery)}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ color: 'var(--ink-fg-2)' }}>
                      Tax ({lastReceipt.taxPercentage}%)
                    </span>
                    <span className="tabular">
                      {fmt(lastReceipt.codTaxAmount)}
                    </span>
                  </div>
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--ink-3)',
                }}
              >
                <span style={{ fontWeight: 600 }}>Total</span>
                <span
                  className="tabular"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                >
                  {fmt(lastReceipt.total)}
                </span>
              </div>
            </div>

            {/* Thermal Slip Footer Message */}
            <div
              style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px dashed var(--ink-3)',
                textAlign: 'center',
                fontSize: '0.68rem',
                color: 'var(--ink-fg-3)',
                letterSpacing: '0.02em',
              }}
            >
              Pos made by fahad
            </div>

            {/* Actions */}
            <div
              className="receipt-actions-row"
              style={{
                display: 'flex',
                gap: '6px',
                marginTop: '16px',
              }}
            >
              <button
                onClick={async () => {
                  const ipc = getIpc();
                  if (ipc) {
                    const el = document.getElementById(
                      'thermal-receipt-content',
                    );
                    if (el) {
                      const clone = el.cloneNode(true);
                      const actions = clone.querySelector(
                        '.receipt-actions-row',
                      );
                      if (actions) actions.remove();
                      await ipc.invoke('print-receipt', clone.innerHTML);
                    }
                  } else {
                    window.print();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '0.78rem',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <PrinterIcon /> Print
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                style={{
                  background: 'var(--ink-2)',
                  color: 'var(--ink-fg-2)',
                  padding: '8px 12px',
                  border: '1px solid var(--ink-3)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <CloseIcon /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
