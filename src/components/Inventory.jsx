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
  `Rs. ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const fmt2 = (n) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
const EditIcon = () => (
  <svg {...iconBase}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const ArchiveIcon = () => (
  <svg {...iconBase}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);
const RestoreIcon = () => (
  <svg {...iconBase}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
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
const BoxIcon = () => (
  <svg {...iconBase} width="28" height="28">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────
const SegmentChip = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      fontSize: '0.75rem',
      fontWeight: 500,
      borderRadius: '6px',
      border: 'none',
      background: active ? 'var(--ink-0)' : 'transparent',
      color: active ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
      boxShadow: active ? '0 0 0 1px var(--ink-3)' : 'none',
      cursor: 'pointer',
      transition: 'background-color 120ms ease, color 120ms ease',
    }}
  >
    {icon}
    {children}
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
// Inventory
// ─────────────────────────────────────────────────────────────
export default function Inventory({ currentUser, showToast }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('active');
  const [viewMode, setViewMode] = useState('GRID');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null); // id | null

  // Form
  const [addMarginType, setAddMarginType] = useState('custom');
  const [editMarginType, setEditMarginType] = useState('custom');
  const [itemForm, setItemForm] = useState(emptyForm());

  function emptyForm() {
    return {
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
    };
  }

  const toast = (msg, type = 'info') => {
    if (showToast) showToast(msg, type);
    else if (type === 'error') console.error(msg);
  };

  const loadItems = async () => {
    const ipc = getIpc();
    if (!ipc) return;
    try {
      setItems(await ipc.invoke('get-items', true));
      setError(null);
    } catch (err) {
      setError(err?.message || 'Could not load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Auto SKU
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
          console.error('SKU generation failed:', err);
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

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEditing)
        setEditingItem((prev) => ({ ...prev, image_path: reader.result }));
      else setItemForm((prev) => ({ ...prev, image_path: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterItem = async (e) => {
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
        toast('Product added.', 'success');
        setIsAddModalOpen(false);
        setItemForm(emptyForm());
        setAddMarginType('custom');
        await loadItems();
      } else {
        toast('Add failed: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Add failed: ' + err.message, 'error');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc || !editingItem) return;
    try {
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
        toast('Product updated.', 'success');
        setIsEditModalOpen(false);
        setEditingItem(null);
        await loadItems();
      } else {
        toast('Update failed: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Update failed: ' + err.message, 'error');
    }
  };

  const handleToggleArchive = async (item) => {
    if (currentUser?.role !== 'ADMIN') {
      return toast('Only managers can archive items.', 'error');
    }
    const ipc = getIpc();
    if (!ipc) return;
    try {
      const res = await ipc.invoke('toggle-archive-item', {
        itemId: item.id,
        is_active: item.is_active === 1 ? 0 : 1,
        currentUser,
      });
      if (res.success) {
        toast(
          item.is_active === 1 ? 'Item archived.' : 'Item reactivated.',
          'success',
        );
        await loadItems();
      } else {
        toast('Archive failed: ' + res.error, 'error');
      }
    } catch (err) {
      toast('Archive failed: ' + err.message, 'error');
    } finally {
      setConfirmArchive(null);
    }
  };

  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase();
    const matches =
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q));
    if (!matches) return false;
    if (filterMode === 'active')
      return i.is_active === 1 || i.is_active === undefined;
    if (filterMode === 'archived') return i.is_active === 0;
    if (filterMode === 'restock')
      return (
        (i.is_active === 1 || i.is_active === undefined) && i.stock_qty <= 5
      );
    return true;
  });

  const counts = {
    active: items.filter((i) => i.is_active === 1 || i.is_active === undefined)
      .length,
    restock: items.filter(
      (i) =>
        (i.is_active === 1 || i.is_active === undefined) && i.stock_qty <= 5,
    ).length,
    archived: items.filter((i) => i.is_active === 0).length,
    all: items.length,
  };

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
        Loading inventory…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
      {/* Error banner */}
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
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            aria-label="Dismiss"
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
            Inventory
          </h2>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
            }}
          >
            Stock, cost, and pricing
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
          <div style={{ position: 'relative', width: '260px' }}>
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
              placeholder="Search SKU, name, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '32px',
                height: '34px',
                background: 'var(--ink-1)',
              }}
            />
          </div>
          <button
            onClick={() => {
              setAddMarginType('custom');
              setItemForm(emptyForm());
              setIsAddModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <PlusIcon /> Add product
          </button>
        </div>
      </div>

      {/* FILTERS + VIEW TOGGLE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
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
          {[
            { id: 'active', label: 'Active', n: counts.active },
            { id: 'restock', label: 'Restock', n: counts.restock },
            { id: 'archived', label: 'Archived', n: counts.archived },
            { id: 'all', label: 'All', n: counts.all },
          ].map((p) => (
            <SegmentChip
              key={p.id}
              active={filterMode === p.id}
              onClick={() => setFilterMode(p.id)}
            >
              {p.label}{' '}
              <span
                className="monospace tabular"
                style={{ color: 'var(--ink-fg-3)', marginLeft: '2px' }}
              >
                {p.n}
              </span>
            </SegmentChip>
          ))}
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

      {/* MAIN CONTAINER */}
      <div
        style={{
          flex: 1,
          background: 'var(--ink-0)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
          overflowY: 'auto',
        }}
      >
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
            }}
          >
            <BoxIcon />
            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {search
                ? 'No matches for this search'
                : filterMode === 'archived'
                  ? 'No archived products'
                  : filterMode === 'restock'
                    ? 'Nothing to restock'
                    : 'No products yet'}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              {search
                ? 'Try a different name, SKU, or category.'
                : filterMode === 'archived'
                  ? 'Archived items will appear here.'
                  : filterMode === 'restock'
                    ? 'All stock levels are above the low threshold.'
                    : 'Add your first product to begin.'}
            </div>
            {!search && filterMode === 'active' && (
              <button
                onClick={() => {
                  setAddMarginType('custom');
                  setItemForm(emptyForm());
                  setIsAddModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <PlusIcon /> Add product
              </button>
            )}
          </div>
        ) : viewMode === 'GRID' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredItems.map((item) => {
              const archived = item.is_active === 0;
              return (
                <div
                  key={item.id}
                  style={{
                    background: archived ? 'var(--ink-1)' : 'var(--ink-0)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
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
                          fontSize: '0.85rem',
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
                          display: 'flex',
                          gap: '6px',
                          marginTop: '6px',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          className="monospace tabular"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            color:
                              item.stock_qty <= 5 && !archived
                                ? 'var(--ink-danger)'
                                : 'var(--ink-fg-2)',
                            border: '1px solid var(--ink-3)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                          }}
                        >
                          {item.stock_qty} {item.unit || 'pcs'}
                        </span>
                        {archived && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--ink-fg-3)',
                            }}
                          >
                            Archived
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--ink-3)',
                      paddingTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      <span>Cost</span>
                      <span className="monospace tabular">
                        {fmt2(item.avg_cost)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      <span>Min</span>
                      <span className="monospace tabular">
                        {fmt2(item.min_price)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--ink-fg-2)',
                      }}
                    >
                      <span>Max</span>
                      <span className="monospace tabular">
                        {fmt2(item.max_price)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--ink-3)',
                      paddingTop: '10px',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--ink-fg-3)',
                        }}
                      >
                        Selling
                      </div>
                      <div
                        className="monospace tabular"
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: 'var(--ink-fg)',
                        }}
                      >
                        {fmt2(item.selling_price)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditMarginType('custom');
                          setIsEditModalOpen(true);
                        }}
                        aria-label="Edit product"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          background: 'var(--ink-1)',
                          color: 'var(--ink-fg)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <EditIcon /> Edit
                      </button>
                      {confirmArchive === item.id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleToggleArchive(item)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              background: 'var(--ink-danger)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmArchive(null)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              background: 'var(--ink-1)',
                              color: 'var(--ink-fg-2)',
                              border: '1px solid var(--ink-3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmArchive(item.id)}
                          aria-label={archived ? 'Reactivate' : 'Archive'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            background: 'var(--ink-1)',
                            color: 'var(--ink-fg-2)',
                            border: '1px solid var(--ink-3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          {archived ? <RestoreIcon /> : <ArchiveIcon />}
                        </button>
                      )}
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
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '0.8fr 2fr 0.8fr 0.9fr 0.9fr 0.9fr 1fr 1.2fr',
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
              <span style={{ textAlign: 'right' }}>Cost</span>
              <span style={{ textAlign: 'right' }}>Min</span>
              <span style={{ textAlign: 'right' }}>Max</span>
              <span style={{ textAlign: 'right' }}>Selling</span>
              <span style={{ textAlign: 'center' }}>Actions</span>
            </div>
            {filteredItems.map((item, idx) => {
              const archived = item.is_active === 0;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '0.8fr 2fr 0.8fr 0.9fr 0.9fr 0.9fr 1fr 1.2fr',
                    fontSize: '0.8rem',
                    alignItems: 'center',
                    background: archived ? 'var(--ink-1)' : 'var(--ink-0)',
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
                      color: 'var(--ink-fg-3)',
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
                      {archived && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.68rem',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      color:
                        item.stock_qty <= 5 && !archived
                          ? 'var(--ink-danger)'
                          : 'var(--ink-fg-2)',
                    }}
                  >
                    {item.stock_qty} {item.unit || ''}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{ textAlign: 'right', color: 'var(--ink-fg-2)' }}
                  >
                    {fmt2(item.avg_cost)}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{ textAlign: 'right', color: 'var(--ink-fg-2)' }}
                  >
                    {fmt2(item.min_price)}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{ textAlign: 'right', color: 'var(--ink-fg-2)' }}
                  >
                    {fmt2(item.max_price)}
                  </span>
                  <span
                    className="monospace tabular"
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: 'var(--ink-fg)',
                    }}
                  >
                    {fmt2(item.selling_price)}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditMarginType('custom');
                        setIsEditModalOpen(true);
                      }}
                      aria-label="Edit"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: 'var(--ink-1)',
                        color: 'var(--ink-fg)',
                        border: '1px solid var(--ink-3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    {confirmArchive === item.id ? (
                      <>
                        <button
                          onClick={() => handleToggleArchive(item)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: 'var(--ink-danger)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmArchive(null)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: 'var(--ink-1)',
                            color: 'var(--ink-fg-2)',
                            border: '1px solid var(--ink-3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmArchive(item.id)}
                        aria-label={archived ? 'Reactivate' : 'Archive'}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--ink-1)',
                          color: 'var(--ink-fg-2)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {archived ? <RestoreIcon /> : <ArchiveIcon />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────── ADD MODAL ─────────── */}
      {isAddModalOpen && (
        <ProductModal
          title="Add product"
          form={itemForm}
          setForm={setItemForm}
          marginType={addMarginType}
          setMarginType={setAddMarginType}
          onSubmit={handleRegisterItem}
          onClose={() => setIsAddModalOpen(false)}
          onImage={(e) => handleImageUpload(e, false)}
          isNew
        />
      )}

      {/* ─────────── EDIT MODAL ─────────── */}
      {isEditModalOpen && editingItem && (
        <ProductModal
          title="Edit product"
          form={editingItem}
          setForm={setEditingItem}
          marginType={editMarginType}
          setMarginType={setEditMarginType}
          onSubmit={handleSaveEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onImage={(e) => handleImageUpload(e, true)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared Modal
// ─────────────────────────────────────────────────────────────
function ProductModal({
  title,
  form,
  setForm,
  marginType,
  setMarginType,
  onSubmit,
  onClose,
  onImage,
  isNew = false,
}) {
  const calculateSellingPrice = (cost, m) => {
    if (m === 'custom') return null;
    const base = parseFloat(cost) || 0;
    const pct = parseFloat(m) || 0;
    return Math.round((base + base * (pct / 100)) * 100) / 100;
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
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
            {title}
          </h3>
          <button
            onClick={onClose}
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

        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Left */}
            <div
              style={{
                flex: '1 1 260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <Field label="SKU (auto-generated)">
                <input
                  type="text"
                  className="monospace"
                  style={{
                    ...inputStyle,
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                  }}
                  value={form.code}
                  readOnly={isNew}
                  disabled={!isNew}
                />
              </Field>
              <Field label="Name">
                <input
                  type="text"
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Wireless mouse"
                  required
                />
              </Field>
              <Field label="Category">
                <input
                  type="text"
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Electronics"
                />
              </Field>
              <Field label="Unit">
                <input
                  type="text"
                  style={inputStyle}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Pcs"
                />
              </Field>
              <Field label="Thumbnail">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImage}
                  style={{ fontSize: '0.78rem', color: 'var(--ink-fg-2)' }}
                />
                {form.image_path && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={form.image_path}
                      alt="Preview"
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid var(--ink-3)',
                      }}
                    />
                  </div>
                )}
              </Field>
            </div>

            {/* Right — pricing */}
            <div
              style={{
                flex: '1 1 260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--ink-1)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
                }}
              >
                Pricing
              </div>
              <Field label="Unit cost">
                <input
                  type="number"
                  className="monospace tabular"
                  style={inputStyle}
                  value={form.avg_cost}
                  onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    const sp =
                      calculateSellingPrice(cost, marginType) ??
                      form.selling_price;
                    setForm({ ...form, avg_cost: cost, selling_price: sp });
                  }}
                />
              </Field>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <Field label="Margin">
                  <select
                    style={inputStyle}
                    value={marginType}
                    onChange={(e) => {
                      const m = e.target.value;
                      setMarginType(m);
                      const sp = calculateSellingPrice(form.avg_cost, m);
                      if (sp !== null) setForm({ ...form, selling_price: sp });
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
                    value={form.selling_price}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        selling_price: parseFloat(e.target.value) || 0,
                      });
                      setMarginType('custom');
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
                    value={form.min_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
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
                    value={form.max_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--ink-3)',
              paddingTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
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
              {isNew ? 'Save product' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
