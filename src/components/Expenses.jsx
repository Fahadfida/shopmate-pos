import React, { useState, useEffect } from 'react';
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

export default function Expenses({ currentUser }) {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [toasts, setToasts] = useState([]);

  // 16 Essential Business Expense Categories
  const expenseCategories = [
    {
      name: 'Rent / Store Lease',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      color: 'var(--brand-primary)',
      bg: '#e0f2fe',
    },
    {
      name: 'Utilities (Electricity/Gas)',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      name: 'Internet & Telecom',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.94 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      ),
      color: 'var(--info)',
      bg: '#e0f2fe',
    },
    {
      name: 'Staff Salaries & Wages',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      color: 'var(--success)',
      bg: '#d1fae5',
    },
    {
      name: 'Shop Maintenance & Repairs',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ),
      color: 'var(--text-secondary)',
      bg: '#f1f5f9',
    },
    {
      name: 'Marketing & Advertising',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      ),
      color: 'var(--danger)',
      bg: '#fee2e2',
    },
    {
      name: 'Transportation & Freight',
      icon: (
        <svg
          width="24"
          height="24"
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
      ),
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      name: 'Food & Refreshments',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
      ),
      color: '#ea580c',
      bg: '#ffedd5',
    },
    {
      name: 'Taxes, Fees & Licenses',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      color: 'var(--brand-primary)',
      bg: '#e0f2fe',
    },
    {
      name: 'Packaging & Stationery',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
      color: 'var(--text-secondary)',
      bg: '#f1f5f9',
    },
    {
      name: 'Software & Subscriptions',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      color: 'var(--info)',
      bg: '#e0f2fe',
    },
    {
      name: 'Security & Insurance',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      color: 'var(--success)',
      bg: '#d1fae5',
    },
    {
      name: 'Legal & Professional',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ),
      color: 'var(--text-primary)',
      bg: '#e2e8f0',
    },
    {
      name: 'Cleaning & Sanitation',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      ),
      color: 'var(--info)',
      bg: '#e0f2fe',
    },
    {
      name: 'Travel & Fuel',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      ),
      color: '#ea580c',
      bg: '#ffedd5',
    },
    {
      name: 'Miscellaneous / Other',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      ),
      color: 'var(--text-secondary)',
      bg: '#f1f5f9',
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    category: 'Rent / Store Lease',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    description: '',
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadRecent = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-expenses');
      setRecentExpenses((data || []).slice(0, 8)); // Show last 8
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const openQuickModal = (categoryName) => {
    setModalForm({
      category: categoryName || 'Rent / Store Lease',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(modalForm.amount);
    if (!amt || amt <= 0)
      return addToast('Enter a valid expense amount.', 'error');

    if (ipc) {
      const res = await ipc.invoke('add-expense', {
        expense: modalForm,
        currentUser,
      });
      if (res.success) {
        setIsModalOpen(false);
        addToast(
          `Rs. ${amt.toLocaleString()} logged for ${modalForm.category}`,
          'success',
        );
        loadRecent();
      } else {
        addToast('Error recording expense: ' + res.error, 'error');
      }
    }
  };

  const activeCatIcon = expenseCategories.find(
    (c) => c.name === modalForm.category,
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
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
            Expenses & Operating Cost
          </h3>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            Select a category to instantly log an overhead expense.
          </p>
        </div>
      </div>

      <div
        style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}
      >
        {/* LEFT PANEL: CATEGORY GRID */}
        <div
          style={{
            flex: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            overflowY: 'auto',
            alignContent: 'start',
            paddingBottom: '20px',
          }}
        >
          {expenseCategories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => openQuickModal(cat.name)}
              style={{
                background: 'var(--bg-card)',
                padding: '16px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 12px rgba(13, 92, 117, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <div
                style={{
                  color: cat.color,
                  padding: '12px',
                  background: cat.bg,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cat.icon}
              </div>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  lineHeight: '1.3',
                }}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL: RECENT ACTIVITY */}
        <div
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              background: 'var(--bg-hover)',
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
              Recent Expenses
            </h4>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
              }}
            >
              Your last 8 logged overheads
            </p>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {recentExpenses.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  padding: '20px 0',
                }}
              >
                No recent expenses found.
              </div>
            ) : (
              recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    background: 'var(--bg-hover)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {exp.category}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        color: 'var(--danger)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      - Rs. {exp.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {exp.date ? exp.date.substring(0, 10) : ''}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                      }}
                    >
                      by {exp.username || 'Manager'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ⚡ SPEED POPUP MODAL FOR EXPENSE RECORDING */}
      {isModalOpen && (
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
              width: '420px',
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
                marginBottom: '20px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div
                  style={{
                    color: activeCatIcon?.color,
                    padding: '10px',
                    background: activeCatIcon?.bg,
                    borderRadius: '8px',
                    display: 'flex',
                  }}
                >
                  {activeCatIcon?.icon}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      color: 'var(--text-primary)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Log Expense
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {modalForm.category}
                  </p>
                </div>
              </div>
              <button
                style={{
                  background: 'var(--bg-hover)',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleModalSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
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
                      color: '#475569',
                    }}
                  >
                    Amount (Rs.)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={modalForm.amount}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    style={{
                      padding: '12px',
                      fontSize: '1rem',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      width: '100%',
                      fontWeight: 'bold',
                    }}
                    autoFocus
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
                    Date*
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={modalForm.date}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, date: e.target.value })
                    }
                    style={{
                      padding: '11px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      width: '100%',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={modalForm.description}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, description: e.target.value })
                  }
                  placeholder="e.g. October electric bill..."
                  style={{
                    padding: '10px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: 'var(--brand-primary)',
                    fontWeight: 'bold',
                    padding: '12px',
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Confirm & Save
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#e2e8f0',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                  onClick={() => setIsModalOpen(false)}
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
