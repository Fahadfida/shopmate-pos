import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const IconEdit = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconArchive = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export default function Consignment({ currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState({ items: [], balances: [] });

  // Item Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Payout Modal States
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutOwner, setPayoutOwner] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const initialForm = {
    name: '',
    owner: '',
    category: 'General',
    qty: 1,
    cost: 0,
    price: 0,
    commission: 20,
    image_path: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('get-consignment-data');
      if (res) setData(res);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setForm((prev) => ({ ...prev, image_path: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc) return;

    const payload = {
      item: {
        name: form.name,
        consignment_owner: form.owner,
        category: form.category,
        stock_qty: form.qty,
        avg_cost: form.cost,
        selling_price: form.price,
        commission_rate: form.commission,
        image_path: form.image_path,
      },
      currentUser,
    };

    if (editingId) {
      payload.id = editingId;
      const res = await ipc.invoke('update-consignment-item', payload);
      if (res.success) {
        showToast('Consignment item updated');
        closeModal();
      } else showToast(res.error, 'error');
    } else {
      const res = await ipc.invoke('add-consignment-item', payload);
      if (res.success) {
        showToast('Consignment item added');
        closeModal();
      } else showToast(res.error, 'error');
    }
  };

  const handleArchive = async (item) => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${item.name}"? It will be moved to the standard Inventory archive.`,
      )
    )
      return;

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-item', {
        itemId: item.id,
        is_active: 0,
        currentUser,
      });

      if (res.success) {
        showToast(`"${item.name}" has been archived to Inventory.`);
        loadData();
      } else {
        showToast(res.error || 'Failed to archive item', 'error');
      }
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      owner: item.consignment_owner,
      category: item.category || 'General',
      qty: item.stock_qty,
      cost: item.avg_cost || 0,
      price: item.selling_price,
      commission: item.commission_rate,
      image_path: item.image_path || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  // Open Payout Modal
  const openPayout = (owner, maxAmount) => {
    setPayoutOwner(owner);
    setPayoutAmount(maxAmount);
    setPayoutNotes('');
    setIsPayoutModalOpen(true);
  };

  // Submit Payout
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0)
      return showToast('Invalid amount', 'error');

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('record-consignment-payout', {
        owner: payoutOwner,
        amount,
        notes: payoutNotes,
        currentUser,
      });

      if (res.success) {
        showToast(`Payout of ${fmtMoney(amount)} recorded for ${payoutOwner}`);
        setIsPayoutModalOpen(false);
        loadData();
      } else {
        showToast(res.error, 'error');
      }
    }
  };

  const totalSales = data.balances.reduce(
    (s, b) => s + Number(b.total_sold || 0),
    0,
  );
  const totalCommission = data.balances.reduce(
    (s, b) => s + Number(b.our_commission || 0),
    0,
  );
  const totalOwed = data.balances.reduce(
    (s, b) => s + Number(b.balance_due || 0),
    0,
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 96px)',
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: 'var(--ink-0)',
          padding: '16px 20px',
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
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              Consignment Hub
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--ink-fg-3)',
                fontSize: '0.875rem',
              }}
            >
              Manage partner stock and financial splits.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--brand-primary)',
              color: 'var(--ink-0)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Add Partner Item
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--ink-3)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background:
                activeTab === 'inventory'
                  ? 'var(--brand-primary)'
                  : 'transparent',
              color:
                activeTab === 'inventory' ? 'var(--ink-0)' : 'var(--ink-fg-2)',
            }}
          >
            Partner Inventory
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background:
                activeTab === 'finances'
                  ? 'var(--brand-primary)'
                  : 'transparent',
              color:
                activeTab === 'finances' ? 'var(--ink-0)' : 'var(--ink-fg-2)',
            }}
          >
            Finances & Payouts
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TAB 1: INVENTORY CARDS */}
        {activeTab === 'inventory' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {data.items.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'var(--ink-fg-3)',
                  padding: '60px 0',
                  background: 'var(--ink-0)',
                  borderRadius: '12px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                No consignment items currently in stock.
              </div>
            ) : (
              data.items.map((i) => (
                <div
                  key={i.id}
                  style={{
                    background: 'var(--ink-0)',
                    borderRadius: '12px',
                    border: '1px solid var(--ink-3)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* IMAGE CONTAINER WITH FLOATING ACTIONS */}
                  <div
                    style={{
                      height: '140px',
                      background: 'var(--ink-1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid var(--ink-3)',
                      position: 'relative',
                    }}
                  >
                    {i.image_path ? (
                      <img
                        src={i.image_path}
                        alt={i.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          color: 'var(--ink-fg-3)',
                        }}
                      >
                        {getInitials(i.name)}
                      </span>
                    )}

                    {/* FLOATING EDIT & ARCHIVE BUTTONS */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <button
                        onClick={() => openEdit(i)}
                        title="Edit Item"
                        style={{
                          padding: '6px',
                          background: 'var(--ink-0)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleArchive(i)}
                        title="Archive to Inventory"
                        style={{
                          padding: '6px',
                          background: 'var(--ink-0)',
                          border: '1px solid var(--ink-3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--ink-danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        <IconArchive />
                      </button>
                    </div>
                  </div>

                  {/* CARD DETAILS */}
                  <div
                    style={{
                      padding: '16px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--brand-primary)',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {i.code}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        marginBottom: '8px',
                        color: 'var(--ink-fg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {i.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--ink-fg-3)',
                        marginBottom: '12px',
                      }}
                    >
                      Owner:{' '}
                      <strong style={{ color: 'var(--ink-fg-2)' }}>
                        {i.consignment_owner}
                      </strong>
                    </div>
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--ink-1)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          Stock
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {i.stock_qty} {i.unit}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          Price
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {fmtMoney(i.selling_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: FINANCES */}
        {activeTab === 'finances' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: 'var(--ink-0)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--ink-fg-2)',
                    textTransform: 'uppercase',
                  }}
                >
                  Total Consignment Sales
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginTop: '8px',
                  }}
                >
                  {fmtMoney(totalSales)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--ink-0)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--ink-success)',
                    textTransform: 'uppercase',
                  }}
                >
                  Your Total Commission
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginTop: '8px',
                    color: 'var(--ink-success)',
                  }}
                >
                  {fmtMoney(totalCommission)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--ink-0)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--ink-3)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--ink-danger)',
                    textTransform: 'uppercase',
                  }}
                >
                  Outstanding Payouts Owed
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginTop: '8px',
                    color: 'var(--ink-danger)',
                  }}
                >
                  {fmtMoney(totalOwed)}
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--ink-0)',
                borderRadius: '12px',
                border: '1px solid var(--ink-3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--ink-3)',
                  fontWeight: 600,
                }}
              >
                Partner Balances
              </div>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      color: 'var(--ink-fg-3)',
                      borderBottom: '1px solid var(--ink-3)',
                      background: 'var(--ink-1)',
                    }}
                  >
                    <th style={{ padding: '12px 20px' }}>Partner Name</th>
                    <th style={{ padding: '12px' }}>Total Sold</th>
                    <th style={{ padding: '12px' }}>Your Cut</th>
                    <th style={{ padding: '12px' }}>Partner's Share</th>
                    <th style={{ padding: '12px' }}>Already Paid</th>
                    <th style={{ padding: '12px' }}>Balance Owed</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.balances.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: 'var(--ink-fg-3)',
                        }}
                      >
                        No sales data yet.
                      </td>
                    </tr>
                  ) : (
                    data.balances.map((b) => (
                      <tr
                        key={b.consignment_owner}
                        style={{ borderBottom: '1px solid var(--ink-2)' }}
                      >
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>
                          {b.consignment_owner}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {fmtMoney(b.total_sold)}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            color: 'var(--ink-success)',
                          }}
                        >
                          +{fmtMoney(b.our_commission)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {fmtMoney(b.total_owed)}
                        </td>
                        <td
                          style={{ padding: '12px', color: 'var(--ink-fg-3)' }}
                        >
                          {fmtMoney(b.total_paid)}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            fontWeight: 600,
                            color: 'var(--ink-danger)',
                          }}
                        >
                          {fmtMoney(b.balance_due)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            disabled={b.balance_due <= 0}
                            onClick={() =>
                              openPayout(b.consignment_owner, b.balance_due)
                            }
                            style={{
                              padding: '6px 12px',
                              background:
                                b.balance_due > 0
                                  ? 'var(--brand-primary)'
                                  : 'var(--ink-2)',
                              color:
                                b.balance_due > 0 ? 'white' : 'var(--ink-fg-3)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor:
                                b.balance_due > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Pay Out
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--ink-0)',
              padding: '24px',
              borderRadius: '12px',
              width: '420px',
              border: '1px solid var(--ink-3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem' }}>
              {editingId ? 'Edit Partner Item' : 'Add Partner Item'}
            </h3>
            <form
              onSubmit={handleSaveItem}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: 'var(--ink-1)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px dashed var(--ink-3)',
                }}
              >
                {form.image_path ? (
                  <img
                    src={form.image_path}
                    alt="Preview"
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      background: 'white',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--ink-2)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    IMG
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Item Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-0)',
                    color: 'var(--ink-fg)',
                    marginTop: '4px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Partner Name (Owner)
                </label>
                <input
                  required
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-0)',
                    color: 'var(--ink-fg)',
                    marginTop: '4px',
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
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--ink-3)',
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg)',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Selling Price
                  </label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--ink-3)',
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg)',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Your Commission %
                </label>
                <input
                  type="number"
                  required
                  value={form.commission}
                  onChange={(e) =>
                    setForm({ ...form, commission: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-0)',
                    color: 'var(--ink-fg)',
                    marginTop: '4px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--ink-fg)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {editingId ? 'Save Changes' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT MODAL */}
      {isPayoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--ink-0)',
              padding: '24px',
              borderRadius: '12px',
              width: '400px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem' }}>
              Record Payout
            </h3>
            <form
              onSubmit={handlePayoutSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Partner
                </label>
                <div
                  style={{
                    padding: '8px',
                    background: 'var(--ink-1)',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    marginTop: '4px',
                    fontWeight: 500,
                  }}
                >
                  {payoutOwner}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Amount to Pay (Rs.)
                </label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-0)',
                    color: 'var(--ink-fg)',
                    marginTop: '4px',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Handed over cash"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--ink-3)',
                    background: 'var(--ink-0)',
                    color: 'var(--ink-fg)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--ink-1)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--ink-fg)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
