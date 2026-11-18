import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// Helper to get initials (e.g., "Wireless Mouse" -> "WM")
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export default function Inventory({ currentUser }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('active');
  const [viewMode, setViewMode] = useState('GRID');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form States
  const [addMarginType, setAddMarginType] = useState('custom');
  const [editMarginType, setEditMarginType] = useState('custom');
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
    if (ipc) setItems(await ipc.invoke('get-items', true));
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Auto-generate SKU
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

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing)
          setEditingItem((prev) => ({ ...prev, image_path: reader.result }));
        else setItemForm((prev) => ({ ...prev, image_path: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterItem = async (e) => {
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
        loadItems();
      } else alert('Error adding item: ' + res.error);
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
      } else alert('Update Error: ' + res.error);
    }
  };

  const handleToggleArchive = async (item) => {
    if (currentUser?.role !== 'ADMIN')
      return alert('Access Denied: Only Managers can archive items.');
    const actionText = item.is_active === 1 ? 'archive' : 'reactivate';
    if (
      !window.confirm(`Are you sure you want to ${actionText} "${item.name}"?`)
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
        if (res.items) setItems(res.items);
        else loadItems();
      } else alert('Archive Error: ' + res.error);
    }
  };

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
    return true;
  });

  return (
    <div
      style={{
        display: 'flex',
        flex: 1, // 👈 ADD THIS
        height: '100%',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '16px 18px',
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
            fontSize: '0.95rem',
          }}
        >
          Inventory & Pricing
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search SKU or product..."
            style={{
              width: '260px',
              margin: 0,
              padding: '8px 12px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontWeight: 'bold',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
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

      {/* MODERN FILTER PILLS & VIEW TOGGLE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            {
              id: 'active',
              label: `Active (${items.filter((i) => i.is_active === 1 || i.is_active === undefined).length})`,
              activeBg: '#d1fae5',
              activeColor: '#065f46',
            },
            {
              id: 'restock',
              label: `Restock (${items.filter((i) => (i.is_active === 1 || i.is_active === undefined) && i.stock_qty <= 5).length})`,
              activeBg: '#fee2e2',
              activeColor: '#991b1b',
            },
            {
              id: 'archived',
              label: `Archived (${items.filter((i) => i.is_active === 0).length})`,
              activeBg: '#fef3c7',
              activeColor: '#d97706',
            },
            {
              id: 'all',
              label: `All (${items.length})`,
              activeBg: '#f1f5f9',
              activeColor: '#334155',
            },
          ].map((pill) => {
            const isActive = filterMode === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFilterMode(pill.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  borderRadius: '20px',
                  fontWeight: '700',
                  background: isActive ? pill.activeBg : '#ffffff',
                  color: isActive ? pill.activeColor : '#64748b',
                  border: isActive
                    ? '1.5px solid transparent'
                    : '1.5px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
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
              padding: '4px 12px',
              fontSize: '0.72rem',
              background:
                viewMode === 'GRID' ? 'var(--brand-primary)' : 'transparent',
              color: viewMode === 'GRID' ? '#fff' : '#64748b',
              border: 'none',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            🔲 Grid
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            style={{
              padding: '4px 12px',
              fontSize: '0.72rem',
              background:
                viewMode === 'LIST' ? 'var(--brand-primary)' : 'transparent',
              color: viewMode === 'LIST' ? '#fff' : '#64748b',
              border: 'none',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div
        style={{
          flex: 1,
          background: 'var(--bg-card)',
          padding: '16px',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
          overflowY: 'auto',
        }}
      >
        {viewMode === 'GRID' ? (
          /* GRID VIEW */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredItems.map((item) => {
              const isArchived = item.is_active === 0;
              return (
                <div
                  key={item.id}
                  style={{
                    background: isArchived ? '#f8fafc' : '#ffffff',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: isArchived ? 0.7 : 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Top: Image & Title */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--bg-hover)',
                        borderRadius: '8px',
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
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: '1.2rem',
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
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textTransform: 'uppercase',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        SKU: {item.code}
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <span
                          style={{
                            background:
                              item.stock_qty <= 5 ? '#fee2e2' : '#d1fae5',
                            color:
                              item.stock_qty <= 5
                                ? 'var(--danger)'
                                : 'var(--success)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                          }}
                        >
                          Stock: {item.stock_qty} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Prices */}
                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '8px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>Cost (WAC):</span>
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '700',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Rs. {item.avg_cost?.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      <span>Min Bargain:</span>
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '700',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Rs. {item.min_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>Max List:</span>
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '700',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Rs. {item.max_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Action Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-hover)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        Selling Price
                      </div>
                      <span
                        className="monospace"
                        style={{
                          fontWeight: '900',
                          color: 'var(--brand-primary)',
                          fontSize: '1rem',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Rs. {item.selling_price?.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={{
                          fontSize: '0.72rem',
                          padding: '6px 10px',
                          background: 'var(--brand-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => {
                          setEditingItem(item);
                          setEditMarginType('custom');
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          fontSize: '0.72rem',
                          padding: '6px 10px',
                          background: isArchived ? 'var(--success)' : '#d97706',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => handleToggleArchive(item)}
                      >
                        {isArchived ? '🔄' : '📦'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* HIGH-DENSITY LIST VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '0.8fr 2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr',
                fontSize: '0.7rem',
                fontWeight: '700',
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
                padding: '12px 10px',
                borderRadius: '6px',
                borderBottom: '1.5px solid #e2e8f0',
                textTransform: 'uppercase',
              }}
            >
              <span>SKU</span>
              <span>PRODUCT NAME</span>
              <span style={{ textAlign: 'right' }}>STOCK</span>
              <span style={{ textAlign: 'right' }}>WAC COST</span>
              <span style={{ textAlign: 'right' }}>MIN BARG.</span>
              <span style={{ textAlign: 'right' }}>MAX LIST</span>
              <span style={{ textAlign: 'right' }}>SELLING</span>
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
                      '0.8fr 2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr',
                    fontSize: '0.78rem',
                    alignItems: 'center',
                    background: isArchived ? '#f8fafc' : '#ffffff',
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    opacity: isArchived ? 0.7 : 1,
                  }}
                >
                  <span
                    className="monospace"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.code}
                  </span>

                  {/* Thumbnail + Name */}
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
                        width: '36px',
                        height: '36px',
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
                            fontSize: '0.75rem',
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
                      {item.name}{' '}
                      {isArchived && (
                        <span style={{ fontSize: '0.65rem', color: '#d97706' }}>
                          (Archived)
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      fontWeight: '700',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: item.stock_qty <= 5 ? 'var(--danger)' : '#1e293b',
                    }}
                  >
                    {item.stock_qty} {item.unit}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: 'var(--text-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Rs. {item.avg_cost?.toFixed(0)}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: 'var(--brand-primary)',
                      fontWeight: '700',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Rs. {item.min_price || 0}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      color: 'var(--text-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Rs. {item.max_price || 0}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: 'right',
                      fontWeight: '800',
                      color: 'var(--brand-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
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
                      style={{
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        background: 'var(--brand-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                      onClick={() => {
                        setEditingItem(item);
                        setEditMarginType('custom');
                        setIsEditModalOpen(true);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      style={{
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        background: isArchived ? 'var(--success)' : '#d97706',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleToggleArchive(item)}
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
              fontSize: '0.85rem',
            }}
          >
            No inventory products found matching your filter.
          </div>
        )}
      </div>

      {/* --- ADD PRODUCT MODAL (2-COLUMN LAYOUT) --- */}
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
              width: '700px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
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
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
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

            <form
              onSubmit={handleRegisterItem}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* 2 Columns for Fields */}
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Left Column: Details */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
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
                      SKU (Auto-Generated)
                    </label>
                    <input
                      type="text"
                      className="input-field monospace"
                      style={{
                        background: 'var(--bg-hover)',
                        padding: '10px',
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
                        color: '#475569',
                      }}
                    >
                      Item Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
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
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
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
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={itemForm.unit}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, unit: e.target.value })
                      }
                      placeholder="Pcs"
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
                      Product Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      style={{
                        fontSize: '0.8rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    />
                    {itemForm.image_path && (
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={itemForm.image_path}
                          alt="Preview"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '6px',
                            objectFit: 'contain',
                            border: '1px solid var(--border-strong)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Pricing */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'var(--bg-hover)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: 'var(--brand-primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pricing Strategy
                  </h4>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      Initial Unit Cost (WAC)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{
                        padding: '10px',
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
                        Margin %
                      </label>
                      <select
                        className="input-field"
                        style={{
                          padding: '10px',
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
                          color: '#475569',
                        }}
                      >
                        Selling Price*
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
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
                          color: '#475569',
                        }}
                      >
                        Min Bargain Price
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
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
                          color: '#475569',
                        }}
                      >
                        Max List Price
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
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
                </div>
              </div>

              {/* Bottom: Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '10px 20px',
                    background: '#e2e8f0',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 24px',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL (2-COLUMN LAYOUT) --- */}
      {isEditModalOpen && editingItem && (
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
              width: '700px',
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
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
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
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
                ✏️ Edit Product
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
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* 2 Columns for Fields */}
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Left Column: Details */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
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
                      SKU (Locked)
                    </label>
                    <input
                      type="text"
                      className="input-field monospace"
                      style={{
                        background: 'var(--bg-hover)',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editingItem.code}
                      disabled
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
                      Item Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
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
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
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
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      Unit
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
                      value={editingItem.unit}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, unit: e.target.value })
                      }
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
                      Update Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      style={{
                        fontSize: '0.8rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    />
                    {editingItem.image_path && (
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={editingItem.image_path}
                          alt="Preview"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '6px',
                            objectFit: 'contain',
                            border: '1px solid var(--border-strong)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Pricing */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'var(--bg-hover)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: 'var(--brand-primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pricing Details
                  </h4>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      Unit Cost (WAC)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-strong)',
                        width: '100%',
                      }}
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
                        Margin %
                      </label>
                      <select
                        className="input-field"
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong)',
                          width: '100%',
                        }}
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
                      <label
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#475569',
                        }}
                      >
                        Selling Price*
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong)',
                          width: '100%',
                        }}
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
                        Min Bargain Price
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong)',
                          width: '100%',
                        }}
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
                      <label
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#475569',
                        }}
                      >
                        Max List Price
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong)',
                          width: '100%',
                        }}
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
                </div>
              </div>

              {/* Bottom: Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '10px 20px',
                    background: '#e2e8f0',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 24px',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
