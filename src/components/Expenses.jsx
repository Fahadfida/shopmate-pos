import React, { useState } from 'react';
import { getIpc } from '../utils/ipc';

export default function Expenses({ currentUser }) {
  // Comprehensive 4x4 grid (16 essential business expense categories with SVG favicons)
  const expenseCategories = [
    {
      name: 'Rent / Store Lease',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Utilities (Electricity/Gas/Water)',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Internet & Telecom',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Staff Salaries & Wages',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Shop Maintenance & Repairs',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Marketing & Advertising',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Transportation & Freight',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Food & Refreshments',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Taxes, Fees & Licenses',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Packaging & Stationery',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Software & Subscriptions',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Security & Insurance',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Legal & Professional',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Cleaning & Sanitation',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Travel & Fuel',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
    {
      name: 'Miscellaneous / Other',
      icon: (
        <svg
          width="20"
          height="20"
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
    },
  ];

  // Modal State for Quick Pop-up
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    category: 'Rent / Store Lease',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    description: '',
  });

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
    if (!amt || amt <= 0) return alert('Enter a valid expense amount.');

    if (ipc) {
      const res = await ipc.invoke('add-expense', {
        expense: modalForm,
        currentUser,
      });
      if (res.success) {
        setIsModalOpen(false);
        alert(`✅ Successfully recorded expense for ${modalForm.category}!`);
      } else {
        alert('Error recording expense: ' + res.error);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '14px 20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>
            Expenses & Operating Cost
          </h3>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            Select any business category below to instantly log an expense.
          </p>
        </div>
      </div>

      {/* 🌟 4x4 GRID THUMBNAIL CARDS (16 Options) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '12px',
          flex: 1,
          padding: '4px 0',
          overflowY: 'auto',
        }}
      >
        {expenseCategories.map((cat, idx) => (
          <div
            key={idx}
            onClick={() => openQuickModal(cat.name)}
            className="card"
            style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0d5c75';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 12px rgba(13, 92, 117, 0.08)';
              e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
              e.currentTarget.style.background = '#fff';
            }}
          >
            <div
              style={{
                color: '#0d5c75',
                padding: '8px',
                background: '#e0f2fe',
                borderRadius: '8px',
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
                color: '#1e293b',
                textAlign: 'center',
                lineHeight: '1.2',
              }}
            >
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* ⚡ SPEED POPUP MODAL FOR EXPENSE RECORDING */}
      {isModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '400px',
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
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
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0d5c75' }}>
                ⚡ Quick Log Expense
              </h3>
              <button
                className="btn"
                style={{
                  background: '#e2e8f0',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
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
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#475569',
                  }}
                >
                  Category
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={modalForm.category}
                  disabled
                  style={{
                    background: '#f8fafc',
                    fontWeight: 'bold',
                    padding: '9px',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
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
                    placeholder="1500"
                    style={{ padding: '9px', fontSize: '0.85rem' }}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
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
                    style={{ padding: '9px', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
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
                  placeholder="e.g. October bill note..."
                  style={{ padding: '9px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: '#0d5c75',
                    fontWeight: 'bold',
                    padding: '11px',
                    color: '#fff',
                    borderRadius: '6px',
                  }}
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#cbd5e0',
                    padding: '11px',
                    borderRadius: '6px',
                    fontWeight: '600',
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
