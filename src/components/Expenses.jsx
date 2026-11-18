import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px/18px/24px 1.5 stroke)
// ─────────────────────────────────────────────────────────────
const iconBase = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const CloseIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// 16 Essential Business Expense Categories with unified Lucide icons
const expenseCategories = [
  {
    name: 'Rent / Store Lease',
    icon: (
      <svg {...iconBase}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Utilities (Electricity/Gas)',
    icon: (
      <svg {...iconBase}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    name: 'Internet & Telecom',
    icon: (
      <svg {...iconBase}>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.94 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  {
    name: 'Staff Salaries & Wages',
    icon: (
      <svg {...iconBase}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: 'Shop Maintenance & Repairs',
    icon: (
      <svg {...iconBase}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: 'Marketing & Advertising',
    icon: (
      <svg {...iconBase}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    ),
  },
  {
    name: 'Transportation & Freight',
    icon: (
      <svg {...iconBase}>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    name: 'Food & Refreshments',
    icon: (
      <svg {...iconBase}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    name: 'Taxes, Fees & Licenses',
    icon: (
      <svg {...iconBase}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: 'Packaging & Stationery',
    icon: (
      <svg {...iconBase}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    name: 'Software & Subscriptions',
    icon: (
      <svg {...iconBase}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    name: 'Security & Insurance',
    icon: (
      <svg {...iconBase}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    name: 'Legal & Professional',
    icon: (
      <svg {...iconBase}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: 'Cleaning & Sanitation',
    icon: (
      <svg {...iconBase}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    name: 'Travel & Fuel',
    icon: (
      <svg {...iconBase}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    name: 'Miscellaneous / Other',
    icon: (
      <svg {...iconBase}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--ink-0)',
        border: '1px solid var(--ink-3)',
        borderLeft: `4px solid ${isError ? 'var(--ink-danger)' : 'var(--ink-success)'}`,
        color: 'var(--ink-fg)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '280px',
        fontWeight: 500,
        fontSize: '0.82rem',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-fg-2)',
          display: 'flex',
          padding: 0,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label
      style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--ink-fg-2)',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  fontSize: '0.85rem',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Expenses({ currentUser }) {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [toasts, setToasts] = useState([]);
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

  const activeCatObj = expenseCategories.find(
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
        color: 'var(--ink-fg)',
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
          background: 'var(--ink-0)',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--ink-fg)',
              fontSize: '1.05rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Expenses & Operating Cost
          </h3>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--ink-fg-3)',
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
                background: 'var(--ink-0)',
                padding: '18px 16px',
                borderRadius: '10px',
                border: '1px solid var(--ink-3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.background = 'var(--ink-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--ink-3)';
                e.currentTarget.style.background = 'var(--ink-0)';
              }}
            >
              <div
                style={{
                  color: 'var(--brand-primary)',
                  padding: '10px',
                  background: 'var(--ink-1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--ink-3)',
                }}
              >
                {cat.icon}
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg)',
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
            background: 'var(--ink-0)',
            borderRadius: '10px',
            border: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--ink-3)',
              background: 'var(--ink-1)',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--ink-fg)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Recent Expenses
            </h4>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '0.72rem',
                color: 'var(--ink-fg-3)',
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
                  color: 'var(--ink-fg-3)',
                  fontSize: '0.8rem',
                  padding: '30px 0',
                }}
              >
                No recent expenses found.
              </div>
            ) : (
              recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    background: 'var(--ink-1)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--ink-3)',
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
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        color: 'var(--ink-fg)',
                      }}
                    >
                      {exp.category}
                    </span>
                    <span
                      className="monospace tabular"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--ink-danger)',
                      }}
                    >
                      − Rs. {Number(exp.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      fontSize: '0.7rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    <span>{exp.date ? exp.date.substring(0, 10) : ''}</span>
                    <span>by {exp.username || 'Manager'}</span>
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
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '400px',
              maxWidth: '100%',
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
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <div
                  style={{
                    color: 'var(--brand-primary)',
                    padding: '8px',
                    background: 'var(--ink-1)',
                    borderRadius: '6px',
                    display: 'flex',
                    border: '1px solid var(--ink-3)',
                  }}
                >
                  {activeCatObj?.icon}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--ink-fg)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Log Expense
                  </h3>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.72rem',
                      color: 'var(--ink-fg-3)',
                    }}
                  >
                    {modalForm.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                style={{
                  background: 'var(--ink-1)',
                  border: '1px solid var(--ink-3)',
                  color: 'var(--ink-fg-2)',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <CloseIcon />
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
                  gap: '10px',
                }}
              >
                <Field label="Amount (Rs.) *">
                  <input
                    type="number"
                    step="0.01"
                    className="monospace tabular"
                    value={modalForm.amount}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    style={{ ...inputStyle, fontWeight: 600 }}
                    autoFocus
                    required
                  />
                </Field>

                <Field label="Date *">
                  <input
                    type="date"
                    value={modalForm.date}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, date: e.target.value })
                    }
                    style={inputStyle}
                    required
                  />
                </Field>
              </div>

              <Field label="Description / Notes (Optional)">
                <input
                  type="text"
                  value={modalForm.description}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, description: e.target.value })
                  }
                  placeholder="e.g. October electric bill..."
                  style={inputStyle}
                />
              </Field>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--ink-3)',
                  marginTop: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg-2)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '6px',
                    fontWeight: 500,
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
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
