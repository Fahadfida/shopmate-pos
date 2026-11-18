import React from 'react';
import mainLogoImage from '../assets/logo.png';

const iconBase = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { flexShrink: 0 },
};

const icons = {
  dashboard: (
    <svg {...iconBase}>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  pos: (
    <svg {...iconBase}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  inventory: (
    <svg {...iconBase}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  purchases: (
    <svg {...iconBase}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  expenses: (
    <svg {...iconBase}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  refunds: (
    <svg {...iconBase}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  financial_ledger: (
    <svg {...iconBase}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  customer_ledger: (
    <svg {...iconBase}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  supplier_ledger: (
    <svg {...iconBase}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  master_ledger: (
    <svg {...iconBase}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  settings: (
    <svg {...iconBase}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  collapse: (
    <svg {...iconBase} width="14" height="14">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  expand: (
    <svg {...iconBase} width="14" height="14">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  signOut: (
    <svg {...iconBase} width="14" height="14">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const groups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: 'pos', label: 'POS Billing', icon: icons.pos },
      { id: 'inventory', label: 'Inventory', icon: icons.inventory },
      { id: 'purchases', label: 'Purchases', icon: icons.purchases },
      { id: 'expenses', label: 'Expenses', icon: icons.expenses },
      { id: 'refunds', label: 'Refunds & Repairs', icon: icons.refunds },
    ],
  },
  {
    label: 'Books',
    items: [
      {
        id: 'financial_ledger',
        label: 'My Ledger (P&L)',
        icon: icons.financial_ledger,
      },
      {
        id: 'customer_ledger',
        label: 'Wholesale Ledger',
        icon: icons.customer_ledger,
      },
      {
        id: 'supplier_ledger',
        label: 'Supplier Ledger',
        icon: icons.supplier_ledger,
      },
      {
        id: 'master_ledger',
        label: 'Master General Ledger',
        icon: icons.master_ledger,
      },
    ],
  },
];

export default function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onLogout,
}) {
  const handleNav = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="mobile-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 99,
          }}
        />
      )}

      <aside
        className={`shopmate-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: isSidebarCollapsed ? '72px' : '256px',
          minWidth: isSidebarCollapsed ? '72px' : '256px',
          height: '100vh',
          backgroundColor: 'var(--ink-sidebar)',
          color: 'var(--ink-sidebar-fg-strong)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--ink-sidebar-hairline)',
          zIndex: 100,
          transition:
            'width 0.2s ease, min-width 0.2s ease, transform 0.25s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 12px',
              borderBottom: '1px solid var(--ink-sidebar-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              minHeight: '64px',
              gap: '8px',
            }}
          >
            {isSidebarCollapsed ? (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                title="Expand sidebar"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={mainLogoImage}
                  alt="ShopMate"
                  style={{
                    width: '30px',
                    height: '30px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
              </button>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  <img
                    src={mainLogoImage}
                    alt="ShopMate"
                    style={{
                      width: '28px',
                      height: '28px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--ink-sidebar-fg-strong)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '-0.01em',
                    }}
                  >
                    ShopMate
                  </span>
                </div>

                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Collapse sidebar"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--ink-sidebar-hairline)',
                    color: 'var(--ink-sidebar-fg)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 120ms ease, color 120ms ease',
                  }}
                >
                  {icons.collapse}
                </button>
              </>
            )}
          </div>

          {/* Nav */}
          <nav
            style={{
              padding: '12px 8px',
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {groups.map((group) => (
              <div key={group.label}>
                {!isSidebarCollapsed && (
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      color: 'var(--ink-sidebar-fg)',
                      padding: '0 10px 6px 10px',
                      letterSpacing: '0.02em',
                      opacity: 0.75,
                    }}
                  >
                    {group.label}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {group.items.map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`nav-item ${active ? 'active' : ''}`}
                        onClick={() => handleNav(item.id)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        style={{
                          justifyContent: isSidebarCollapsed
                            ? 'center'
                            : 'flex-start',
                          gap: '10px',
                        }}
                      >
                        {item.icon}
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Settings */}
          <div
            style={{
              padding: '8px',
              borderTop: '1px solid var(--ink-sidebar-hairline)',
            }}
          >
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNav('settings')}
              title={isSidebarCollapsed ? 'Settings' : undefined}
              style={{
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: '10px',
              }}
            >
              {icons.settings}
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>
          </div>

          {/* User footer */}
          <div
            style={{
              padding: isSidebarCollapsed ? '12px 8px' : '12px 14px',
              borderTop: '1px solid var(--ink-sidebar-hairline)',
              display: 'flex',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: 'var(--ink-sidebar-fg-strong)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.username}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--ink-sidebar-fg)',
                    marginTop: '2px',
                  }}
                >
                  {currentUser.role}
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--ink-sidebar-hairline)',
                background: 'transparent',
                color: 'var(--ink-sidebar-fg)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 120ms ease, color 120ms ease',
                flexShrink: 0,
              }}
            >
              {isSidebarCollapsed ? (
                icons.signOut
              ) : (
                <>
                  {icons.signOut}
                  <span>Sign out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
