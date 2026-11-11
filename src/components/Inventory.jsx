import React, { useState, useEffect } from 'react';

const getIpc = () =>
  window.require ? window.require('electron').ipcRenderer : null;

export default function Inventory({ currentUser, onAddToCart }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('active'); // 'active' | 'restock' | 'archived' | 'all'
  const [viewMode, setViewMode] = useState('GRID'); // GRID or LIST

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Margin Preset State for Add / Edit
  const [addMarginType, setAddMarginType] = useState('custom');
  const [editMarginType, setEditMarginType] = useState('custom');

  // New Item Form State (Stock locked to 0 - handled strictly via GRN Purchases)
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

  const loadItems = async () => {
    const ipc = getIpc();
    if (ipc) {
      setItems(await ipc.invoke('get-items', true));
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Auto-generate SKU preview when name changes
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

  // Dynamic Margin Calculation Function
  const calculateSellingPrice = (cost, marginVal) => {
    if (marginVal === 'custom') return null;
    const base = parseFloat(cost) || 0;
    const pct = parseFloat(marginVal) || 0;
    return Math.round((base + base * (pct / 100)) * 100) / 100;
  };

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing) {
          setEditingItem((prev) => ({ ...prev, image_path: reader.result }));
        } else {
          setItemForm((prev) => ({ ...prev, image_path: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterItem = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      // 🛡️ Stock explicitly locked to 0 to preserve accounting/ledger integrity (use GRN for stock)
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
        loadItems();
      } else {
        alert('Error adding item: ' + res.error);
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc && editingItem) {
      const payload = {
        ...editingItem,
        selling_price: editingItem.unit_price || editingItem.selling_price,
      };
      const res = await ipc.invoke('update-item', {
        id: editingItem.id,
        item: payload,
        currentUser,
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setEditingItem(null);
        loadItems();
      } else {
        alert('Update Error: ' + res.error);
      }
    }
  };

  // 📦 Archive / Reactivate Handler with Immediate UI State Sync
  const handleToggleArchive = async (item) => {
    if (currentUser?.role !== 'ADMIN') {
      return alert(
        'Access Denied: Only Manager (Admin) profiles can archive inventory items.',
      );
    }

    const actionText = item.is_active === 1 ? 'archive' : 'reactivate';
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} product "${item.name}"?`,
      )
    )
      return;

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-item', {
        itemId: item.id,
        is_active: item.is_active === 1 ? 0 : 1,
        currentUser,
      });
      if (res.success) {
        if (res.items) {
          setItems(res.items);
        } else {
          loadItems();
        }
      } else {
        alert('Archive Error: ' + res.error);
      }
    }
  };

  // Filtering & Sorting Logic
  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'active')
      return i.is_active === 1 || i.is_active === undefined;
    if (filterMode === 'archived') return i.is_active === 0;
    if (filterMode === 'restock')
      return (
        (i.is_active === 1 || i.is_active === undefined) && i.stock_qty <= 5
      );
    return true; // 'all'
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
      }}
    >
      {/* 🌟 TOP HEADER BAR WITH ADD POPUP BUTTON & SEARCH */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Inventory & Pricing</h3>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search SKU or product name..."
            style={{
              width: '260px',
              margin: 0,
              padding: '7px 10px',
              fontSize: '0.8rem',
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontWeight: 'bold',
              background: '#0d5c75',
              color: '#fff',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}
            onClick={() => {
              setAddMarginType('custom');
              setIsAddModalOpen(true);
            }}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* 🏷️ FILTER TABS BAR & VIEW MODE TOGGLE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[
            {
              id: 'active',
              label: `Active (${
                items.filter(
                  (i) => i.is_active === 1 || i.is_active === undefined,
                ).length
              })`,
            },
            {
              id: 'restock',
              label: `Restock Needed (${
                items.filter(
                  (i) =>
                    (i.is_active === 1 || i.is_active === undefined) &&
                    i.stock_qty <= 5,
                ).length
              })`,
            },
            {
              id: 'archived',
              label: `Archived (${
                items.filter((i) => i.is_active === 0).length
              })`,
            },
            { id: 'all', label: `All (${items.length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              className="btn"
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                fontWeight: filterMode === pill.id ? 'bold' : 'normal',
                background: filterMode === pill.id ? '#0d5c75' : '#fff',
                color: filterMode === pill.id ? '#fff' : '#334155',
                border: '1px solid #cbd5e0',
              }}
              onClick={() => setFilterMode(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* 🔲 VIEW TOGGLE BUTTONS (GRID vs LIST) */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '6px',
            border: '1px solid #cbd5e0',
          }}
        >
          <button
            className="btn"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              background: viewMode === 'GRID' ? '#0d5c75' : 'transparent',
              color: viewMode === 'GRID' ? '#fff' : '#334155',
              border: 'none',
              fontWeight: 'bold',
              borderRadius: '4px',
            }}
            onClick={() => setViewMode('GRID')}
            title="Switch to Grid View"
          >
            🔲 Grid View
          </button>
          <button
            className="btn"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              background: viewMode === 'LIST' ? '#0d5c75' : 'transparent',
              color: viewMode === 'LIST' ? '#fff' : '#334155',
              border: 'none',
              fontWeight: 'bold',
              borderRadius: '4px',
            }}
            onClick={() => setViewMode('LIST')}
            title="Switch to List View"
          >
            📋 List View
          </button>
        </div>
      </div>

      {/* 📦 INVENTORY DISPLAY CONTAINER (CONDITIONAL GRID VS LIST) */}
      <div
        className="card"
        style={{
          flex: 1,
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {viewMode === 'GRID' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredItems.map((item) => {
              const isArchived = item.is_active === 0;
              return (
                <div
                  key={item.id}
                  style={{
                    background: isArchived ? '#f8fafc' : '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    opacity: isArchived ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '65px',
                        height: '65px',
                        background: '#fff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #cbd5e0',
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
                        <span style={{ fontSize: '1.4rem' }}>📦</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.82rem',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textTransform: 'uppercase',
                        }}
                        title={item.name}
                      >
                        {item.name}{' '}
                        {isArchived && (
                          <span
                            style={{ fontSize: '0.65rem', color: '#d97706' }}
                          >
                            (Archived)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        SKU: {item.code}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            background:
                              item.stock_qty <= 5 ? '#fee2e2' : '#d1fae5',
                            color: item.stock_qty <= 5 ? '#dc2626' : '#065f46',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                          }}
                        >
                          Stock: {item.stock_qty} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ⚡ WAC & MINIMUM BARGAIN PRICE DISPLAY */}
                  <div
                    style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '6px',
                      fontSize: '0.72rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#050505',
                      }}
                    >
                      <span>Unit Cost (WAC):</span>
                      <span
                        className="monospace"
                        style={{ fontWeight: 'bold' }}
                      >
                        Rs. {item.avg_cost?.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#0d5c75',
                      }}
                    >
                      <span>Min Bargain Price:</span>
                      <span
                        className="monospace"
                        style={{ fontWeight: 'bold' }}
                      >
                        Rs. {item.min_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#64748b',
                      }}
                    >
                      <span>Max List Price:</span>
                      <span
                        className="monospace"
                        style={{ fontWeight: 'bold' }}
                      >
                        Rs. {item.max_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                        Selling Price
                      </div>
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '900',
                          color: '#0d5c75',
                          fontSize: '0.9rem',
                        }}
                      >
                        Rs. {item.selling_price?.toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {onAddToCart && !isArchived && (
                        <button
                          className="btn btn-primary"
                          style={{
                            fontSize: '0.7rem',
                            padding: '5px 8px',
                            background: '#10b981',
                          }}
                          onClick={() => onAddToCart(item)}
                          title="Add to POS Cart"
                        >
                          🛒
                        </button>
                      )}
                      <button
                        className="btn"
                        style={{
                          fontSize: '0.7rem',
                          padding: '5px 8px',
                          background: '#055275',
                          color: '#fff',
                        }}
                        onClick={() => {
                          setEditingItem(item);
                          setEditMarginType('custom');
                          setIsEditModalOpen(true);
                        }}
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        style={{
                          fontSize: '0.7rem',
                          padding: '5px 8px',
                          background: isArchived ? '#15803d' : '#d97706',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                        onClick={() => handleToggleArchive(item)}
                        title={
                          isArchived ? 'Reactivate Product' : 'Archive Product'
                        }
                      >
                        {isArchived ? '🔄 Reactivate' : '📦 Archive'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 📋 HIGH-DENSITY LIST / TABLE VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.8fr 1.2fr 2fr 1fr 1fr 1fr 1fr 1.2fr',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                background: '#f8fafc',
                padding: '8px',
                borderRadius: '4px',
                borderBottom: '1px solid #cbd5e0',
              }}
            >
              <span>SKU</span>
              <span>CATEGORY</span>
              <span>PRODUCT NAME</span>
              <span style={{ textAlign: 'right' }}>STOCK QTY</span>
              <span style={{ textAlign: 'right' }}>WAC / MIN</span>
              <span style={{ textAlign: 'right' }}>SELLING PRICE</span>
              <span style={{ textAlign: 'center' }}>STATUS</span>
              <span style={{ textAlign: 'center' }}>ACTIONS</span>
            </div>

            {filteredItems.map((item) => {
              const isArchived = item.is_active === 0;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '0.8fr 1.2fr 2fr 1fr 1fr 1fr 1fr 1.2fr',
                    fontSize: '0.75rem',
                    alignItems: 'center',
                    background: isArchived ? '#f8fafc' : '#fff',
                    padding: '8px',
                    borderBottom: '1px solid #f1f5f9',
                    opacity: isArchived ? 0.7 : 1,
                  }}
                >
                  <span
                    className="monospace"
                    style={{ fontSize: '0.7rem', color: '#64748b' }}
                  >
                    {item.code}
                  </span>
                  <span style={{ color: '#475569' }}>{item.category}</span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}{' '}
                    {isArchived && (
                      <span style={{ fontSize: '0.65rem', color: '#d97706' }}>
                        (Archived)
                      </span>
                    )}
                  </span>
                  <span
                    className="monospace"
                    style={{ textAlign: 'right', fontWeight: 'bold' }}
                  >
                    {item.stock_qty} {item.unit}
                  </span>
                  <div
                    style={{ textAlign: 'right', fontSize: '0.7rem' }}
                    className="monospace"
                  >
                    <div style={{ color: '#64748b' }}>
                      W: Rs.{item.avg_cost?.toFixed(0)}
                    </div>
                    <div style={{ color: '#0d5c75', fontWeight: 'bold' }}>
                      M: Rs.{item.min_price || 0}
                    </div>
                  </div>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#0d5c75',
                    }}
                  >
                    Rs. {item.selling_price?.toFixed(2)}
                  </span>

                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        background: isArchived
                          ? '#fef3c7'
                          : item.stock_qty <= 5
                            ? '#fee2e2'
                            : '#d1fae5',
                        color: isArchived
                          ? '#d97706'
                          : item.stock_qty <= 5
                            ? '#dc2626'
                            : '#065f46',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {isArchived
                        ? 'Archived'
                        : item.stock_qty <= 5
                          ? 'Low Stock'
                          : 'Optimal'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    {onAddToCart && !isArchived && (
                      <button
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.68rem',
                          padding: '3px 6px',
                          background: '#10b981',
                        }}
                        onClick={() => onAddToCart(item)}
                        title="Add to POS"
                      >
                        🛒
                      </button>
                    )}
                    <button
                      className="btn"
                      style={{
                        fontSize: '0.68rem',
                        padding: '3px 6px',
                        background: '#0ea5e9',
                        color: '#fff',
                      }}
                      onClick={() => {
                        setEditingItem(item);
                        setEditMarginType('custom');
                        setIsEditModalOpen(true);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn"
                      style={{
                        fontSize: '0.68rem',
                        padding: '3px 6px',
                        background: isArchived ? '#15803d' : '#d97706',
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleToggleArchive(item)}
                      title={isArchived ? 'Reactivate' : 'Archive'}
                    >
                      {isArchived ? '🔄' : '📦'}
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
              padding: '50px 0',
              fontSize: '0.9rem',
            }}
          >
            No inventory products found matching your filter.
          </div>
        )}
      </div>

      {/* ➕ ADD NEW PRODUCT POPUP MODAL (Stock Input Removed - Handled via Purchases / GRN) */}
      {isAddModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '480px',
              background: '#fff',
              padding: '20px',
              color: '#000',
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
              <h3 style={{ margin: 0 }}>+ Register New Catalog Product</h3>
              <button
                className="btn"
                style={{ background: '#e2e8f0', padding: '2px 8px' }}
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                marginBottom: '12px',
              }}
            >
              Note: New products are created with 0 stock. Use Purchases (GRN)
              to receive stock, record supplier debt, and track expenses.
            </p>

            <form
              onSubmit={handleRegisterItem}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    SKU (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    className="input-field monospace"
                    style={{ background: '#f1f5f9', padding: '6px' }}
                    value={itemForm.code}
                    readOnly
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Category / Department
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    placeholder="e.g. Electronics"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                  Item Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '6px' }}
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
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Initial Unit Cost (Est.)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
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
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Profit Margin
                  </label>
                  <select
                    className="input-field"
                    style={{ padding: '6px' }}
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
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Selling Price*
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
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
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Min Bargain Price
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
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
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Max List Price
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
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

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                  Product Thumbnail Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  style={{ fontSize: '0.75rem', marginTop: '4px' }}
                />
                {itemForm.image_path && (
                  <div style={{ marginTop: '6px' }}>
                    <img
                      src={itemForm.image_path}
                      alt="Preview"
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '6px',
                        objectFit: 'contain',
                        border: '1px solid #ccc',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#0d5c75', fontWeight: 'bold' }}
                >
                  Save & Register Product Catalog
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ EDIT ITEM POPUP MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '450px',
              background: '#fff',
              padding: '20px',
              color: '#000',
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
              <h3 style={{ margin: 0 }}>✏️ Edit Product & Pricing</h3>
              <button
                className="btn"
                style={{ background: '#e2e8f0', padding: '2px 8px' }}
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                marginBottom: '10px',
              }}
            >
              SKU: {editingItem.code}
            </p>

            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                  Item Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '6px' }}
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        unit: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.5fr',
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Unit Cost (WAC)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.avg_cost}
                    onChange={(e) => {
                      const newCost = parseFloat(e.target.value) || 0;
                      const newSp =
                        calculateSellingPrice(newCost, editMarginType) ||
                        editingItem.selling_price;
                      setEditingItem({
                        ...editingItem,
                        avg_cost: newCost,
                        selling_price: newSp,
                      });
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Profit Margin
                  </label>
                  <select
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editMarginType}
                    onChange={(e) => {
                      const mType = e.target.value;
                      setEditMarginType(mType);
                      const newSp = calculateSellingPrice(
                        editingItem.avg_cost,
                        mType,
                      );
                      if (newSp !== null)
                        setEditingItem({
                          ...editingItem,
                          selling_price: newSp,
                        });
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
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Selling Price*
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.selling_price}
                    onChange={(e) => {
                      setEditingItem({
                        ...editingItem,
                        selling_price: parseFloat(e.target.value) || 0,
                      });
                      setEditMarginType('custom');
                    }}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Min Bargain Price
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.min_price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        min_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    Max List Price
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ padding: '6px' }}
                    value={editingItem.max_price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        max_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                  Update Thumbnail Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  style={{ fontSize: '0.75rem', marginTop: '4px' }}
                />
                {editingItem.image_path && (
                  <div style={{ marginTop: '6px' }}>
                    <img
                      src={editingItem.image_path}
                      alt="Preview"
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '6px',
                        objectFit: 'contain',
                        border: '1px solid #ccc',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#10b981', fontWeight: 'bold' }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsEditModalOpen(false)}
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
