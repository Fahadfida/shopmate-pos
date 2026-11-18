import React, { useState, useEffect } from 'react';
import './index.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Purchases from './components/Purchases';
import Expenses from './components/Expenses';
import Settings from './components/Settings';
import MyLedger from './components/MyLedger';
import WholeSaleBuyersLedger from './components/WholeSaleBuyersLedger';
import SupplierLedger from './components/SupplierLedger';
import MasterLedger from './components/MasterLedger';
import ActivationModal from './components/ActivationModal';
import RefundsRepairs from './components/RefundsRepairs';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { getIpc } from './utils/ipc';

const MenuIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [toasts, setToasts] = useState([]); // 1

  const showToast = (message, type = 'success') => {
    // 2
    if (!message) return;
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);

  useEffect(() => {
    const verifyLicenseOnStartup = async () => {
      try {
        const ipc = getIpc();
        if (ipc) {
          const res = await ipc.invoke('check-license-status');
          setIsLicensed(res?.active === true);
        } else {
          setIsLicensed(true);
        }
      } catch (err) {
        console.error('License check failed:', err);
        setIsLicensed(false);
      } finally {
        setLicenseChecked(true);
      }
    };
    verifyLicenseOnStartup();
  }, []);

  if (!licenseChecked) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--ink-sidebar)',
          color: 'var(--ink-sidebar-fg-strong)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              border: '2px solid var(--ink-sidebar-hairline)',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              marginTop: '12px',
              fontWeight: 500,
              fontSize: '0.8rem',
              color: 'var(--ink-sidebar-fg)',
            }}
          >
            Verifying license
          </div>
        </div>
      </div>
    );
  }

  if (!isLicensed) {
    return <ActivationModal onActivated={() => setIsLicensed(true)} />;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="shopmate-container">
      <header className="mobile-header">
        <button
          className="mobile-burger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          <MenuIcon />
          <span>Menu</span>
        </button>
        <span className="mobile-header-title">ShopMate</span>
      </header>

      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="shopmate-content">
        {activeTab === 'dashboard' && <Dashboard showToast={showToast} />}
        {activeTab === 'pos' && (
          <POS currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'inventory' && (
          <Inventory currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'purchases' && (
          <Purchases currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'expenses' && (
          <Expenses currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'refunds' && (
          <RefundsRepairs currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'financial_ledger' && (
          <MyLedger currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'customer_ledger' && (
          <WholeSaleBuyersLedger
            currentUser={currentUser}
            showToast={showToast}
          />
        )}
        {activeTab === 'supplier_ledger' && (
          <SupplierLedger currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'master_ledger' && (
          <MasterLedger currentUser={currentUser} showToast={showToast} />
        )}
        {activeTab === 'settings' && (
          <Settings currentUser={currentUser} showToast={showToast} />
        )}
      </main>

      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px', // design.md §4
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              message={t.message}
              type={t.type}
              onClose={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
