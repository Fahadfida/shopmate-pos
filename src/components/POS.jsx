import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// Helper for product initials
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// --- SVG ICON COMPONENTS ---
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const ShoppingBagIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);
const ZapIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const MinusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const PrinterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);
const CreditCardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);
const TruckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);
const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const GridIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);
const ListIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

export default function POS({ currentUser, showToast }) {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'LIST'

  const [codMeta, setCodMeta] = useState({
    consignment_number: '',
    delivery_charges: 0,
    tax_percentage: 0,
  });
  const [lastReceipt, setLastReceipt] = useState(null);
  const [shopSettings, setShopSettings] = useState({});

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      setItems(await ipc.invoke('get-items'));
      setCustomers(await ipc.invoke('get-customers'));
      setShopSettings(await ipc.invoke('get-settings'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (item) => {
    if (item.stock_qty <= 0)
      return showToast
        ? showToast('Item is out of stock!', 'error')
        : alert('Item is out of stock!');
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      if (existing.qty + 1 > item.stock_qty)
        return showToast
          ? showToast('Exceeds stock limit.', 'error')
          : alert('Exceeds stock limit.');
      setCart(
        cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)),
      );
    } else {
      setCart([...cart, { ...item, qty: 1, price: item.selling_price }]);
    }
  };

  const handleQuickSell = async (item) => {
    if (item.stock_qty <= 0)
      return showToast
        ? showToast('Item is out of stock!', 'error')
        : alert('Item is out of stock!');
    const ipc = getIpc();
    const quickCartLine = [{ ...item, qty: 1, price: item.selling_price }];
    const payload = {
      customer_id: null,
      items: quickCartLine,
      payment_type: 'CASH',
      cod_meta: null,
      currentUser,
    };

    if (ipc) {
      const res = await ipc.invoke('create-sale', payload);
      if (res.success) {
        if (showToast)
          showToast(`Quick sale completed! (#INV-${res.saleId})`, 'success');
        setLastReceipt({
          saleId: res.saleId,
          items: quickCartLine,
          subtotal: res.productSubtotal || item.selling_price,
          codDelivery: 0,
          codTaxAmount: 0,
          taxPercentage: 0,
          total: res.totalAmount,
          paymentType: 'CASH',
          customerName: null,
          date: new Date().toLocaleString(),
        });
        loadData();
      } else {
        if (showToast) showToast('Quick Sell Error: ' + res.error, 'error');
      }
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(
      cart
        .map((c) => {
          if (c.id === id) {
            const newQty = c.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > c.stock_qty) {
              showToast('Exceeds available stock.', 'error');
              return c;
            }
            return { ...c, qty: newQty };
          }
          return c;
        })
        .filter(Boolean),
    );
  };

  const updateCartQtyDirect = (id, val) => {
    const newQty = parseInt(val, 10);
    if (isNaN(newQty) || newQty <= 0) {
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: val } : c)));
      return;
    }
    setCart(
      cart.map((c) => {
        if (c.id === id) {
          if (newQty > c.stock_qty) {
            showToast(`Exceeds stock (${c.stock_qty} ${c.unit})`, 'error');
            return { ...c, qty: c.stock_qty };
          }
          return { ...c, qty: newQty };
        }
        return c;
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

  const handleCheckout = async () => {
    if (cart.length === 0)
      return showToast
        ? showToast('Cart is empty', 'error')
        : alert('Cart is empty');
    if (paymentType === 'CREDIT' && !selectedCustomer)
      return showToast
        ? showToast('Select a customer for Khata sale.', 'error')
        : alert('Select a customer.');

    const ipc = getIpc();
    const payload = {
      customer_id: selectedCustomer || null,
      items: cart,
      payment_type: paymentType,
      cod_meta:
        paymentType === 'COD'
          ? { ...codMeta, government_tax: codTaxAmount }
          : null,
      currentUser,
    };

    if (ipc) {
      const res = await ipc.invoke('create-sale', payload);
      if (res.success) {
        const matchedCust = customers.find(
          (c) => c.id.toString() === selectedCustomer.toString(),
        );
        if (showToast)
          showToast(`Checkout completed! (#INV-${res.saleId})`, 'success');
        setLastReceipt({
          saleId: res.saleId,
          items: [...cart],
          subtotal: res.productSubtotal || subtotal,
          codDelivery,
          codTaxAmount,
          taxPercentage: taxRate,
          total: res.totalAmount,
          paymentType,
          customerName: matchedCust ? matchedCust.name : null,
          date: new Date().toLocaleString(),
        });
        setCart([]);
        setCodMeta({
          consignment_number: '',
          delivery_charges: 0,
          tax_percentage: 0,
        });
        loadData();
      } else {
        if (showToast) showToast('Checkout Error: ' + res.error, 'error');
      }
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1, // 👈 ADD THIS
        height: '100%',
        gap: '16px',
        height: 'calc(100vh - 90px)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 📦 LEFT PANEL: PRODUCT CATALOG */}
      <div
        style={{
          flex: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        {/* HEADER BAR & SEARCH */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-color)',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: '800',
                color: 'var(--text-primary)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              POS Counter Billing
            </h3>
            <span
              style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}
            >
              Select items or run 1-click cash sales
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                <SearchIcon />
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Search item or SKU..."
                style={{
                  margin: 0,
                  paddingLeft: '34px',
                  height: '36px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  border: '1px solid var(--border-strong)',
                  width: '100%',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
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
                  fontSize: '0.72rem',
                  background:
                    viewMode === 'GRID'
                      ? 'var(--brand-primary)'
                      : 'transparent',
                  color: viewMode === 'GRID' ? '#fff' : '#64748b',
                  border: 'none',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <GridIcon /> Grid
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  background:
                    viewMode === 'LIST'
                      ? 'var(--brand-primary)'
                      : 'transparent',
                  color: viewMode === 'LIST' ? '#fff' : '#64748b',
                  border: 'none',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ListIcon /> List
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCT GRID/LIST */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {viewMode === 'GRID' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                alignContent: 'start',
              }}
            >
              {filteredItems.map((item) => {
                const isOut = item.stock_qty <= 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--bg-card)',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      border: isOut
                        ? '1.5px solid #fee2e2'
                        : '1px solid #e2e8f0',
                      opacity: isOut ? 0.75 : 1,
                      minHeight: '135px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          background: 'var(--bg-hover)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)',
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
                              fontSize: '1rem',
                              fontWeight: '900',
                              color: '#94a3b8',
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
                            fontWeight: '800',
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
                            fontSize: '0.68rem',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                            fontWeight: '600',
                          }}
                        >
                          SKU:{' '}
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: '700',
                              color: '#334155',
                            }}
                          >
                            {item.code}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: isOut ? 'var(--danger)' : 'var(--success)',
                            marginTop: '2px',
                            fontWeight: '700',
                          }}
                        >
                          {isOut
                            ? 'Out of Stock'
                            : `Stock: ${item.stock_qty} ${item.unit || 'pcs'}`}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px',
                      }}
                    >
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '900',
                          color: 'var(--brand-primary)',
                          fontSize: '0.92rem',
                        }}
                      >
                        Rs. {item.selling_price?.toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn"
                          disabled={isOut}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            background: isOut ? '#cbd5e1' : 'var(--info)',
                            color: '#ffffff',
                            fontWeight: '700',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: isOut ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => addToCart(item)}
                        >
                          <PlusIcon /> Add
                        </button>
                        <button
                          className="btn"
                          disabled={isOut}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            background: isOut ? '#e2e8f0' : '#d97706',
                            color: isOut ? '#94a3b8' : '#ffffff',
                            fontWeight: '700',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: isOut ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => handleQuickSell(item)}
                        >
                          <ZapIcon /> Sell
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 2fr 1fr 1fr 1.2fr',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  padding: '10px',
                  borderRadius: '6px',
                  borderBottom: '1.5px solid #e2e8f0',
                  textTransform: 'uppercase',
                }}
              >
                <span>SKU</span>
                <span>PRODUCT NAME</span>
                <span style={{ textAlign: 'right' }}>STOCK</span>
                <span style={{ textAlign: 'right' }}>PRICE</span>
                <span style={{ textAlign: 'center' }}>ACTIONS</span>
              </div>
              {filteredItems.map((item) => {
                const isOut = item.stock_qty <= 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.8fr 2fr 1fr 1fr 1.2fr',
                      fontSize: '0.78rem',
                      alignItems: 'center',
                      background: isOut ? '#f8fafc' : '#ffffff',
                      padding: '10px',
                      borderBottom: '1px solid #f1f5f9',
                      opacity: isOut ? 0.7 : 1,
                    }}
                  >
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
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
                          width: '32px',
                          height: '32px',
                          background: 'var(--bg-hover)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)',
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
                              borderRadius: '6px',
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
                      <div
                        style={{
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        fontWeight: '700',
                        color: isOut ? 'var(--danger)' : '#1e293b',
                      }}
                    >
                      {item.stock_qty} {item.unit}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        fontWeight: '800',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      Rs. {item.selling_price?.toFixed(2)}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <button
                        className="btn"
                        disabled={isOut}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          background: isOut ? '#cbd5e1' : 'var(--info)',
                          color: '#fff',
                          fontWeight: '700',
                          borderRadius: '5px',
                          border: 'none',
                          cursor: isOut ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => addToCart(item)}
                      >
                        + Add
                      </button>
                      <button
                        className="btn"
                        disabled={isOut}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          background: isOut ? '#e2e8f0' : '#d97706',
                          color: isOut ? '#94a3b8' : '#fff',
                          fontWeight: '700',
                          borderRadius: '5px',
                          border: 'none',
                          cursor: isOut ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => handleQuickSell(item)}
                      >
                        ⚡ Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filteredItems.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '40px',
                fontSize: '0.85rem',
              }}
            >
              No items found.
            </div>
          )}
        </div>
      </div>

      {/* 🛒 RIGHT PANEL: CART & CHECKOUT SIDEBAR */}
      <div
        style={{
          flex: 0.9,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          borderRadius: '10px',
          padding: '16px',
          border: '1.5px solid var(--border-color)',
          boxSizing: 'border-box',
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
          {/* CART ITEMS FEED */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div style={{ color: 'var(--info)' }}>
                  <ShoppingBagIcon />
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                  }}
                >
                  Current Order
                </h4>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  background: 'var(--bg-hover)',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {cart.reduce((s, i) => s + (parseInt(i.qty) || 0), 0)} items
              </span>
            </div>

            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '2px',
              }}
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-hover)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                    <div
                      style={{
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
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        marginTop: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)',
                          fontWeight: '600',
                        }}
                      >
                        Price:
                      </span>
                      <input
                        type="number"
                        className="monospace input-field"
                        style={{
                          width: '70px',
                          padding: '2px 4px',
                          fontSize: '0.75rem',
                          margin: 0,
                          height: '22px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-strong)',
                        }}
                        value={item.price}
                        onChange={(e) =>
                          updateCartPrice(item.id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <button
                      style={{
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        background: '#e2e8f0',
                        color: '#334155',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => updateCartQty(item.id, -1)}
                    >
                      <MinusIcon />
                    </button>
                    <input
                      type="number"
                      className="monospace input-field"
                      style={{
                        width: '38px',
                        height: '22px',
                        padding: '2px',
                        fontSize: '0.78rem',
                        textAlign: 'center',
                        margin: 0,
                        fontWeight: '800',
                        borderRadius: '4px',
                        border: '1px solid var(--border-strong)',
                      }}
                      value={item.qty}
                      onChange={(e) =>
                        updateCartQtyDirect(item.id, e.target.value)
                      }
                    />
                    <button
                      style={{
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        background: '#e2e8f0',
                        color: '#334155',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => updateCartQty(item.id, 1)}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    padding: '30px 0',
                    fontSize: '0.78rem',
                    background: 'var(--bg-hover)',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  Cart is empty.
                  <br />
                  Click "+ Add" to build order.
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT MODES & CHECKOUT FOOTER */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#475569',
                  textTransform: 'uppercase',
                }}
              >
                Payment Method
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  marginTop: '3px',
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor:
                      paymentType === 'CASH' ? 'var(--success)' : '#cbd5e1',
                    background: paymentType === 'CASH' ? '#ecfdf5' : '#ffffff',
                    color:
                      paymentType === 'CASH' ? 'var(--success)' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onClick={() => setPaymentType('CASH')}
                >
                  <CreditCardIcon /> Cash
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor:
                      paymentType === 'CREDIT' ? 'var(--info)' : '#cbd5e1',
                    background:
                      paymentType === 'CREDIT' ? '#f0f9ff' : '#ffffff',
                    color: paymentType === 'CREDIT' ? 'var(--info)' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onClick={() => setPaymentType('CREDIT')}
                >
                  Khata
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: paymentType === 'COD' ? '#d97706' : '#cbd5e1',
                    background: paymentType === 'COD' ? '#fffbeb' : '#ffffff',
                    color: paymentType === 'COD' ? '#d97706' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onClick={() => setPaymentType('COD')}
                >
                  <TruckIcon /> COD
                </button>
              </div>
            </div>

            {paymentType === 'CREDIT' && (
              <div>
                <label
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: 'var(--info)',
                    textTransform: 'uppercase',
                  }}
                >
                  Party Profile (Khata)
                </label>
                <select
                  className="input-field"
                  style={{
                    margin: '2px 0 0 0',
                    height: '32px',
                    fontSize: '0.75rem',
                    borderRadius: '5px',
                  }}
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Debt: Rs. {c.balance})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {paymentType === 'COD' && (
              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: '#d97706',
                    textTransform: 'uppercase',
                  }}
                >
                  COD Charges Config
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: '700',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Delivery Fee
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{
                        margin: '1px 0 0 0',
                        padding: '2px 4px',
                        fontSize: '0.72rem',
                        height: '24px',
                      }}
                      value={codMeta.delivery_charges}
                      onChange={(e) =>
                        setCodMeta({
                          ...codMeta,
                          delivery_charges: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="350"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: '700',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Tax %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      style={{
                        margin: '1px 0 0 0',
                        padding: '2px 4px',
                        fontSize: '0.72rem',
                        height: '24px',
                      }}
                      value={codMeta.tax_percentage}
                      onChange={(e) =>
                        setCodMeta({
                          ...codMeta,
                          tax_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="2.5"
                    />
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-hover)',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#475569',
                }}
              >
                <span>Subtotal:</span>
                <span className="monospace" style={{ fontWeight: '700' }}>
                  Rs. {subtotal.toFixed(2)}
                </span>
              </div>
              {paymentType === 'COD' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Delivery Fee:</span>
                    <span className="monospace">
                      + Rs. {codDelivery.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--danger)',
                    }}
                  >
                    <span>Tax ({taxRate}%):</span>
                    <span className="monospace">
                      + Rs. {codTaxAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.05rem',
                  fontWeight: '900',
                  color: 'var(--success)',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '4px',
                  marginTop: '2px',
                }}
              >
                <span>Net Total:</span>
                <span className="monospace">Rs. {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn"
              style={{
                padding: '10px',
                fontSize: '0.85rem',
                background: 'var(--success)',
                color: '#ffffff',
                fontWeight: '800',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
              }}
              onClick={handleCheckout}
            >
              <PrinterIcon /> Complete & Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* 🖨️ PROFESSIONAL THERMAL RECEIPT MODAL */}
      {lastReceipt && (
        <div
          className="receipt-modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="receipt-paper"
            id="thermal-receipt-content"
            style={{
              background: 'var(--bg-card)',
              padding: '18px',
              borderRadius: '8px',
              width: '300px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-strong)',
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              {shopSettings.shop_logo ? (
                <img
                  src={shopSettings.shop_logo}
                  alt="Shop Logo"
                  style={{
                    maxHeight: '42px',
                    maxWidth: '150px',
                    objectFit: 'contain',
                    marginBottom: '4px',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: 'var(--text-primary)',
                  }}
                >
                  {shopSettings.shop_name || 'SHOPMATE POS'}
                </div>
              )}
              {shopSettings.shop_address && (
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#475569',
                    marginTop: '2px',
                  }}
                >
                  {shopSettings.shop_address}
                </div>
              )}
              {shopSettings.shop_phone && (
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                  Tel: {shopSettings.shop_phone}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.62rem',
                  color: '#94a3b8',
                  marginTop: '4px',
                }}
              >
                {lastReceipt.date}
              </div>
            </div>
            <div
              style={{ borderBottom: '1px dashed #94a3b8', margin: '6px 0' }}
            />
            <div
              style={{
                fontSize: '0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice #:</span>
                <strong>#{lastReceipt.saleId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Mode:</span>
                <strong style={{ textTransform: 'uppercase' }}>
                  {lastReceipt.paymentType}
                </strong>
              </div>
              {lastReceipt.customerName && (
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Customer:</span>
                  <strong>{lastReceipt.customerName}</strong>
                </div>
              )}
            </div>
            <div
              style={{ borderBottom: '1px dashed #94a3b8', margin: '6px 0' }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                margin: '4px 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #0f172a',
                  paddingBottom: '2px',
                }}
              >
                <span>QTY & ITEM</span>
                <span>TOTAL</span>
              </div>
              {lastReceipt.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.qty} x Rs. {item.price.toFixed(2)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      alignSelf: 'center',
                      fontSize: '0.72rem',
                    }}
                  >
                    Rs. {(item.qty * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{ borderBottom: '1px dashed #94a3b8', margin: '6px 0' }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontSize: '0.7rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Rs. {lastReceipt.subtotal.toFixed(2)}</span>
              </div>
              {lastReceipt.paymentType === 'COD' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#475569',
                    }}
                  >
                    <span>Delivery Fee:</span>
                    <span>Rs. {lastReceipt.codDelivery.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#475569',
                    }}
                  >
                    <span>Tax Duty ({lastReceipt.taxPercentage}%):</span>
                    <span>Rs. {lastReceipt.codTaxAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '900',
                  fontSize: '0.9rem',
                  borderTop: '1.5px solid #0f172a',
                  borderBottom: '1.5px solid #0f172a',
                  padding: '3px 0',
                  marginTop: '3px',
                }}
              >
                <span>NET TOTAL:</span>
                <span>Rs. {lastReceipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div
              className="receipt-actions-row"
              style={{ display: 'flex', gap: '6px', marginTop: '12px' }}
            >
              <button
                className="btn"
                style={{
                  flex: 1,
                  padding: '7px',
                  fontSize: '0.78rem',
                  background: 'var(--info)',
                  color: '#ffffff',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
                onClick={async () => {
                  const ipc = getIpc();
                  if (ipc) {
                    const receiptElement = document.getElementById(
                      'thermal-receipt-content',
                    );
                    if (receiptElement) {
                      const clone = receiptElement.cloneNode(true);
                      const actionsRow = clone.querySelector(
                        '.receipt-actions-row',
                      );
                      if (actionsRow) actionsRow.remove();
                      await ipc.invoke('print-receipt', clone.innerHTML);
                    }
                  } else {
                    window.print();
                  }
                }}
              >
                <PrinterIcon /> Print
              </button>
              <button
                className="btn"
                style={{
                  background: 'var(--bg-hover)',
                  color: '#475569',
                  padding: '7px 12px',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '5px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setLastReceipt(null)}
              >
                <XIcon /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
