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
import Toast from './components/Toast'; // 👈 Import Toast component

const getIpc = () =>
  window.require ? window.require('electron').ipcRenderer : null;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🔔 Global Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 🛡️ License States
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);

  useEffect(() => {
    const verifyLicenseOnStartup = async () => {
      const ipc = getIpc();
      if (ipc) {
        const res = await ipc.invoke('check-license-status');
        setIsLicensed(res.active);
      } else {
        setIsLicensed(true);
      }
      setLicenseChecked(true);
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
          background: '#0a1128',
          color: '#fefcfb',
        }}
      >
        <div
          style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}
        >
          🔒 Verifying ShopMate security & license status...
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
      {/* Mobile Top Header with Burger Menu */}
      <header className="mobile-header">
        <button
          className="mobile-burger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          ☰ Menu
        </button>
        <span className="mobile-header-title">ShopMate POS</span>
      </header>

      {/* Extracted Responsive Sidebar Component */}
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

      {/* Main Content Workspace with showToast passed down */}
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

      {/* 🔔 Global Toast Notification Layer */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
