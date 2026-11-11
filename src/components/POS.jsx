import React, { useState, useEffect } from 'react';

const getIpc = () =>
  window.require ? window.require('electron').ipcRenderer : null;

export default function POS({ currentUser, showToast }) {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');

  // COD Meta updated for percentage tax logic
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
    if (item.stock_qty <= 0) {
      if (showToast) showToast('Item is out of stock!', 'error');
      else alert('Item is out of stock!');
      return;
    }
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      if (existing.qty + 1 > item.stock_qty) {
        if (showToast) showToast('Exceeds stock limit.', 'error');
        else alert('Exceeds stock limit.');
        return;
      }
      setCart(
        cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)),
      );
    } else {
      setCart([...cart, { ...item, qty: 1, price: item.selling_price }]);
    }
  };

  // ⚡ QUICK CASH "SELL" HANDLER
  const handleQuickSell = async (item) => {
    if (item.stock_qty <= 0) {
      if (showToast) showToast('Item is out of stock!', 'error');
      else alert('Item is out of stock!');
      return;
    }

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
          showToast(
            `Quick sale completed successfully! (#INV-${res.saleId})`,
            'success',
          );
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
        else alert('Quick Sell Error: ' + res.error);
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
              if (showToast) showToast('Exceeds available stock.', 'error');
              else alert('Exceeds available stock.');
              return c;
            }
            return { ...c, qty: newQty };
          }
          return c;
        })
        .filter(Boolean),
    );
  };

  // ⌨️ Direct Quantity Input Handler (Allows typing large numbers like 200 directly)
  const updateCartQtyDirect = (id, val) => {
    const newQty = parseInt(val, 10);
    if (isNaN(newQty) || newQty <= 0) {
      // Allow clearing or typing intermediate values temporarily
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: val } : c)));
      return;
    }

    setCart(
      cart.map((c) => {
        if (c.id === id) {
          if (newQty > c.stock_qty) {
            if (showToast)
              showToast(
                `Exceeds available stock (${c.stock_qty} ${c.unit}).`,
                'error',
              );
            else alert(`Exceeds available stock (${c.stock_qty} ${c.unit}).`);
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

  // 🧮 CORRECTED COD CALCULATION LOGIC: % Tax applies to (Subtotal + Delivery Fee)
  const codTaxAmount =
    paymentType === 'COD' ? (subtotal + codDelivery) * (taxRate / 100) : 0;
  const finalTotal =
    paymentType === 'COD' ? subtotal + codDelivery + codTaxAmount : subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      if (showToast) showToast('Cart is empty', 'error');
      else alert('Cart is empty');
      return;
    }
    if (paymentType === 'CREDIT' && !selectedCustomer) {
      if (showToast)
        showToast('Please select a customer profile for Khata sale.', 'error');
      else alert('Please select a customer profile for Khata sale.');
      return;
    }

    const ipc = getIpc();
    const payload = {
      customer_id: selectedCustomer || null,
      items: cart,
      payment_type: paymentType,
      cod_meta:
        paymentType === 'COD'
          ? {
              ...codMeta,
              government_tax: codTaxAmount,
            }
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
          showToast(
            `Checkout completed successfully! (#INV-${res.saleId})`,
            'success',
          );

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
        else alert('Checkout Error: ' + res.error);
      }
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 80px)' }}>
      {/* 📦 PRODUCT CATALOG GRID */}
      <div
        style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3>🛒 POS Counter Billing</h3>
          <input
            type="text"
            className="input-field"
            placeholder="Search item name or code..."
            style={{ width: '280px', margin: 0 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    width: '65px',
                    height: '65px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0',
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
                      fontSize: '0.82rem',
                      fontWeight: 'bold',
                      color: '#1e293b',
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
                      color: '#64748b',
                      marginTop: '1px',
                    }}
                  >
                    SKU: {item.code}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Stock: {item.stock_qty} {item.unit}
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
                    color: '#0d5c75',
                    fontSize: '0.95rem',
                  }}
                >
                  Rs. {item.selling_price}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      background: '#0ea5e9',
                    }}
                    onClick={() => addToCart(item)}
                  >
                    + Add
                  </button>
                  <button
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      background: '#f59e0b',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                    onClick={() => handleQuickSell(item)}
                  >
                    ⚡ Sell
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛒 CART & CHECKOUT PANEL */}
      <div
        className="card"
        style={{
          flex: 1.2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f3efef',
          borderRadius: '8px',
          padding: '16px',
          color: '#000',
        }}
      >
        <div>
          <h4
            style={{
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px',
              marginBottom: '12px',
              margin: 0,
            }}
          >
            Current Cart ({cart.reduce((s, i) => s + (parseInt(i.qty) || 0), 0)}{' '}
            items)
          </h4>

          <div
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
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
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>
                      Price:
                    </span>
                    <input
                      type="number"
                      className="monospace"
                      style={{
                        width: '70px',
                        padding: '2px',
                        fontSize: '0.78rem',
                      }}
                      value={item.price}
                      onChange={(e) => updateCartPrice(item.id, e.target.value)}
                    />
                  </div>
                </div>

                {/* ⌨️ Editable Quantity Input Box */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <button
                    className="btn"
                    style={{
                      padding: '2px 6px',
                      background: '#cbd5e0',
                      fontWeight: 'bold',
                    }}
                    onClick={() => updateCartQty(item.id, -1)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="monospace input-field"
                    style={{
                      width: '55px',
                      padding: '3px',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      margin: 0,
                      fontWeight: 'bold',
                    }}
                    value={item.qty}
                    onChange={(e) =>
                      updateCartQtyDirect(item.id, e.target.value)
                    }
                  />
                  <button
                    className="btn"
                    style={{
                      padding: '2px 6px',
                      background: '#cbd5e0',
                      fontWeight: 'bold',
                    }}
                    onClick={() => updateCartQty(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  padding: '40px 0',
                  fontSize: '0.85rem',
                }}
              >
                Cart is empty. Tap products to add.
              </div>
            )}
          </div>
        </div>

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
                fontSize: '0.72rem',
                fontWeight: 'bold',
                color: '#334155',
              }}
            >
              Payment Method
            </label>
            <select
              className="input-field"
              style={{ margin: '2px 0 0 0' }}
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="CASH">Cash Sale</option>
              <option value="CREDIT">Credit (Party Khata)</option>
              <option value="COD">Cash On Delivery (COD)</option>
            </select>
          </div>

          {paymentType === 'CREDIT' && (
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: '#0d5c75',
                }}
              >
                Select Party Profile (Khata)
              </label>
              <select
                className="input-field"
                style={{ margin: '2px 0 0 0' }}
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

          {/* 📦 COD MODE: Delivery Fee & Percentage Tax Inputs */}
          {paymentType === 'COD' && (
            <div
              style={{
                background: '#f8fafc',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  color: '#e53935',
                }}
              >
                📦 COD Extra Charges Configuration
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>
                  Party / Client (Optional)
                </label>
                <select
                  className="input-field"
                  style={{
                    margin: '1px 0 0 0',
                    padding: '3px',
                    fontSize: '0.75rem',
                  }}
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>
                    Delivery Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{
                      margin: '1px 0 0 0',
                      padding: '3px',
                      fontSize: '0.75rem',
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
                  <label style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>
                    Tax Duty (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    style={{
                      margin: '1px 0 0 0',
                      padding: '3px',
                      fontSize: '0.75rem',
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
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <span>Products Subtotal:</span>
            <span className="monospace">Rs. {subtotal.toFixed(2)}</span>
          </div>

          {paymentType === 'COD' && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: '#334155',
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
                  fontSize: '0.8rem',
                  color: '#e53935',
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
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#0d5c75',
              borderTop: '1px dashed #cbd5e0',
              paddingTop: '4px',
            }}
          >
            <span>Net Total:</span>
            <span className="monospace">Rs. {finalTotal.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-success"
            style={{
              padding: '10px',
              fontSize: '0.95rem',
              marginTop: '2px',
              background: '#10b981',
              color: '#fff',
              fontWeight: 'bold',
            }}
            onClick={handleCheckout}
          >
            Complete & Print Receipt 🖨️
          </button>
        </div>
      </div>

      {/* 🖨️ THERMAL RECEIPT MODAL */}
      {lastReceipt && (
        <div className="receipt-modal-backdrop">
          <div className="receipt-paper" id="thermal-receipt-content">
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              {shopSettings.shop_logo ? (
                <img
                  src={shopSettings.shop_logo}
                  alt="Shop Logo"
                  style={{
                    maxHeight: '45px',
                    maxWidth: '160px',
                    objectFit: 'contain',
                    marginBottom: '4px',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: '#000',
                  }}
                >
                  {shopSettings.shop_name || 'SHOPMATE POS'}
                </div>
              )}
              {shopSettings.shop_address && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#333',
                    marginTop: '2px',
                  }}
                >
                  {shopSettings.shop_address}
                </div>
              )}
              {shopSettings.shop_phone && (
                <div style={{ fontSize: '0.7rem', color: '#333' }}>
                  Tel: {shopSettings.shop_phone}
                </div>
              )}
              <div
                style={{ fontSize: '0.68rem', color: '#555', marginTop: '4px' }}
              >
                {lastReceipt.date}
              </div>
            </div>

            <div className="receipt-divider" />

            <div
              style={{
                fontSize: '0.73rem',
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

            <div className="receipt-divider" />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                margin: '6px 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #000',
                  paddingBottom: '2px',
                }}
              >
                <span>QTY & ITEM</span>
                <span>TOTAL</span>
              </div>
              {lastReceipt.items.map((item, idx) => (
                <div
                  key={idx}
                  className="receipt-item-row"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <div className="receipt-item-name">{item.name}</div>
                    <div style={{ fontSize: '0.66rem', color: '#444' }}>
                      {item.qty} x Rs. {item.price.toFixed(2)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      alignSelf: 'center',
                      fontSize: '0.75rem',
                    }}
                  >
                    Rs. {(item.qty * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-divider" />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.75rem',
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
                      color: '#333',
                    }}
                  >
                    <span>Delivery Fee:</span>
                    <span>Rs. {lastReceipt.codDelivery.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#333',
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
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  borderTop: '2px solid #000',
                  borderBottom: '2px solid #000',
                  padding: '5px 0',
                  marginTop: '4px',
                }}
              >
                <span>NET TOTAL:</span>
                <span>Rs. {lastReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div
              className="receipt-actions-row"
              style={{ display: 'flex', gap: '8px', marginTop: '16px' }}
            >
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
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
                🖨️ Print 80mm Receipt
              </button>
              <button
                className="btn"
                style={{
                  background: '#e2e8f0',
                  color: '#334155',
                  padding: '10px',
                }}
                onClick={() => setLastReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
