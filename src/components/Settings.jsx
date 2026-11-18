import React, { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import { getIpc } from '../utils/ipc';

// --- SVG ICONS ---
const StoreIcon = () => (
  <svg
    width="18"
    height="18"
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
);
const ShieldIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);
const DatabaseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);
const InfoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
const PaletteIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r=".5"></circle>
    <circle cx="17.5" cy="10.5" r=".5"></circle>
    <circle cx="8.5" cy="7.5" r=".5"></circle>
    <circle cx="6.5" cy="12.5" r=".5"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
  </svg>
);
const SunIcon = () => (
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
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);
const MoonIcon = () => (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);
const UploadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);
const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);
const SaveIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default function Settings({ currentUser }) {
  const [activeTab, setActiveTab] = useState('shop');

  const [settings, setSettings] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_logo: '',
    sku_format: 'CAT_SEQ',
    cloud_provider: 'NONE',
    cloud_sync_enabled: false,
    last_sync_time: 'Never',
  });

  const [currentTheme, setCurrentTheme] = useState('light');
  const [saveStatus, setSaveStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  // 👇 THESE ARE NOW SAFELY INSIDE THE COMPONENT 👇
  const [updateStatus, setUpdateStatus] = useState(''); // '', 'checking', 'available', 'up-to-date', 'error'
  const [updateInfo, setUpdateInfo] = useState({
    version: '',
    currentVersion: '',
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  // 👆 ------------------------------------------ 👆

  const loadSettingsAndUsers = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-settings');
      if (data) setSettings((prev) => ({ ...prev, ...data }));
      if (currentUser?.role?.toUpperCase() === 'ADMIN') {
        const fetchedUsers = await ipc.invoke('get-users');
        setUsers(fetchedUsers || []);
      }
    }
  };

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    const ipc = getIpc();

    if (ipc) {
      const res = await ipc.invoke('check-for-updates');
      if (res.success) {
        if (res.hasUpdate) {
          setUpdateInfo({
            version: res.version,
            currentVersion: res.currentVersion,
          });
          setUpdateStatus('available');
          setIsUpdateModalOpen(true);
        } else {
          setUpdateStatus('up-to-date');
          setUpdateInfo({ currentVersion: res.version });
        }
      } else {
        setUpdateStatus('error');
        alert(res.error);
      }
    } else {
      setUpdateStatus('error');
      alert('Updates require the desktop app.');
    }
  };

  const handleStartUpdate = async () => {
    const ipc = getIpc();
    if (ipc) {
      await ipc.invoke('download-update');
      setIsUpdateModalOpen(false);
      alert('Download started! The app will prompt you to restart when ready.');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('shopmate_theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    loadSettingsAndUsers();
  }, [currentUser]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shopmate_theme', theme);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('save-settings', settings);
      if (res && res.success) {
        setSaveStatus('Settings saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        alert('Error: ' + (res?.error || 'Unknown error'));
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setSettings((prev) => ({ ...prev, shop_logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (currentUser?.role?.toUpperCase() !== 'ADMIN')
      return alert('Unauthorized.');
    if (!selectedUserId) return alert('Select a user.');
    if (!newPassword || newPassword.length < 4)
      return alert('Password must be at least 4 characters.');

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('update-user-password', {
        userId: parseInt(selectedUserId),
        newPassword,
        currentUser,
      });
      if (res && res.success) {
        setPasswordStatus('Operator password updated successfully!');
        setNewPassword('');
        setSelectedUserId('');
        setTimeout(() => setPasswordStatus(''), 4000);
      } else {
        alert('Failed: ' + (res?.error || 'Unknown error'));
      }
    }
  };

  const handleExportBackup = async () => {
    const ipc = getIpc();
    if (ipc) {
      setBackupStatus('Generating backup file...');
      const res = await ipc.invoke('export-database-backup');
      if (res && res.success)
        setBackupStatus('Backup saved to: ' + res.filePath);
      else if (res && res.canceled) setBackupStatus('');
      else setBackupStatus('Backup failed: ' + (res?.error || 'Unknown error'));
    }
  };

  const handleRestoreBackup = async () => {
    if (
      !window.confirm(
        'WARNING: This will overwrite all current sales, inventory, and khata records with the backup file data. Are you sure?',
      )
    )
      return;
    const ipc = getIpc();
    if (ipc) {
      setBackupStatus('Restoring database...');
      const res = await ipc.invoke('restore-database-backup');
      if (res && res.success) {
        alert(
          'Database restored successfully! The application will now reload.',
        );
        window.location.reload();
      } else if (res && res.canceled) setBackupStatus('');
      else
        setBackupStatus('Restore failed: ' + (res?.error || 'Unknown error'));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        flex: 1,
        height: '100%',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* LEFT SIDEBAR NAVIGATION */}
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 8px',
            color: 'var(--text-primary)',
            fontSize: '1.05rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          Settings
        </h3>
        {[
          { id: 'shop', label: 'Shop Info & SKU', icon: StoreIcon },
          { id: 'theme', label: 'Appearance', icon: PaletteIcon },
          { id: 'security', label: 'Security & Passwords', icon: ShieldIcon },
          { id: 'backup', label: 'Backup & Recovery', icon: DatabaseIcon },
          { id: 'about', label: 'About & Support', icon: InfoIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--info-bg)' : 'transparent',
                color: isActive ? 'var(--info)' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  color: isActive ? 'var(--info)' : 'var(--text-secondary)',
                }}
              >
                <Icon />
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1.5px solid var(--border-color)',
        }}
      >
        {/* SHOP INFO TAB */}
        {activeTab === 'shop' && (
          <form
            onSubmit={handleSave}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div
                style={{
                  marginBottom: '24px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Shop Identity & Branding
                </h4>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  These details will automatically display on all 80mm thermal
                  receipt prints.
                </p>
              </div>
              {saveStatus && (
                <div
                  style={{
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    border: '1px solid var(--success)',
                    fontWeight: '600',
                  }}
                >
                  {saveStatus}
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.shop_name || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, shop_name: e.target.value })
                    }
                    placeholder="e.g. ShopMate Gaming & Tech"
                    required
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Physical Address
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    value={settings.shop_address || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, shop_address: e.target.value })
                    }
                    placeholder="e.g. Shop #42, Main Plaza, Saddar Market"
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Contact Phone / Helpline
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.shop_phone || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, shop_phone: e.target.value })
                    }
                    placeholder="e.g. +92 300 1234567"
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Automated SKU Format
                  </label>
                  <select
                    className="input-field"
                    value={settings.sku_format || 'CAT_SEQ'}
                    onChange={(e) =>
                      setSettings({ ...settings, sku_format: e.target.value })
                    }
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="CAT_SEQ">
                      Category Prefix + Sequential (e.g. ELE-0001)
                    </option>
                    <option value="NAME_SEQ">
                      Name Abbreviation + Sequential (e.g. WHP-0001)
                    </option>
                    <option value="TIMESTAMP">
                      Epoch Timestamp Hex (e.g. TS-19FA8C)
                    </option>
                    <option value="NUMERIC">
                      Pure Numeric (e.g. 1001, 1002)
                    </option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Shop Logo
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      background: 'var(--bg-hover)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-strong)',
                    }}
                  >
                    {settings.shop_logo ? (
                      <img
                        src={settings.shop_logo}
                        alt="Logo"
                        style={{
                          height: '48px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: 'var(--border-color)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <StoreIcon />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '20px 32px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-hover)',
                borderRadius: '0 0 10px 10px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  borderRadius: '6px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <SaveIcon /> Save Shop Branding
              </button>
            </div>
          </form>
        )}

        {/* APPEARANCE THEME TAB */}
        {activeTab === 'theme' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div
                style={{
                  marginBottom: '24px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  App Appearance
                </h4>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Customize how ShopMate looks on your screen. Your preference
                  is saved automatically.
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                }}
              >
                <div
                  onClick={() => handleThemeChange('light')}
                  style={{
                    cursor: 'pointer',
                    background:
                      currentTheme === 'light'
                        ? 'var(--info-bg)'
                        : 'var(--bg-hover)',
                    border:
                      currentTheme === 'light'
                        ? '2px solid var(--info)'
                        : '2px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      background:
                        currentTheme === 'light'
                          ? 'var(--info)'
                          : 'var(--text-secondary)',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '50%',
                    }}
                  >
                    <SunIcon />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h5
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '800',
                      }}
                    >
                      Light Mode
                    </h5>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Clean, bright, and professional. Best for daytime use.
                    </p>
                  </div>
                  {currentTheme === 'light' && (
                    <span
                      style={{
                        background: 'var(--info)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <div
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    cursor: 'pointer',
                    background:
                      currentTheme === 'dark'
                        ? 'var(--info-bg)'
                        : 'var(--bg-hover)',
                    border:
                      currentTheme === 'dark'
                        ? '2px solid var(--info)'
                        : '2px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      background:
                        currentTheme === 'dark'
                          ? 'var(--info)'
                          : 'var(--text-secondary)',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '50%',
                    }}
                  >
                    <MoonIcon />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h5
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '800',
                      }}
                    >
                      Dark Mode
                    </h5>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Sleek and easy on the eyes. Best for late-night shifts.
                    </p>
                  </div>
                  {currentTheme === 'dark' && (
                    <span
                      style={{
                        background: 'var(--info)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <form
            onSubmit={handleUpdatePassword}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div
                style={{
                  marginBottom: '24px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Operator Security
                </h4>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Securely update operator credentials and manager passwords.
                </p>
              </div>
              {currentUser?.role?.toUpperCase() !== 'ADMIN' ? (
                <div
                  style={{
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    border: '1px solid var(--danger)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <LockIcon /> Access Denied: Only Manager (ADMIN) accounts can
                  access password management.
                </div>
              ) : (
                <>
                  {passwordStatus && (
                    <div
                      style={{
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginBottom: '20px',
                        border: '1px solid var(--success)',
                        fontWeight: '600',
                      }}
                    >
                      {passwordStatus}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          marginBottom: '6px',
                          display: 'block',
                        }}
                      >
                        Select Operator Account
                      </label>
                      <select
                        className="input-field"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">-- Choose Staff Operator --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          marginBottom: '6px',
                          display: 'block',
                        }}
                      >
                        New Secure Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        required
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            {currentUser?.role?.toUpperCase() === 'ADMIN' && (
              <div
                style={{
                  padding: '20px 32px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-hover)',
                  borderRadius: '0 0 10px 10px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  <ShieldIcon /> Update Operator Password
                </button>
              </div>
            )}
          </form>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div
                style={{
                  marginBottom: '24px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Database Backup & Recovery
                </h4>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Safeguard your business records. Export a complete copy of
                  your database or restore from a previous archive.
                </p>
              </div>
              {backupStatus && (
                <div
                  style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    border: '1px solid var(--border-strong)',
                    fontWeight: '600',
                  }}
                >
                  {backupStatus}
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    background: 'var(--info-bg)',
                    padding: '24px',
                    borderRadius: '10px',
                    border: '1px solid var(--info)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--info)',
                      background: 'var(--bg-card)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <DownloadIcon />
                  </div>
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                      }}
                    >
                      Export Backup
                    </h5>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                      }}
                    >
                      Download a complete copy of your SQLite database file.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    style={{
                      marginTop: 'auto',
                      padding: '10px',
                      background: 'var(--info)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Download .sqlite File
                  </button>
                </div>
                <div
                  style={{
                    background: 'var(--danger-bg)',
                    padding: '24px',
                    borderRadius: '10px',
                    border: '1px solid var(--danger)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--danger)',
                      background: 'var(--bg-card)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <UploadIcon />
                  </div>
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                      }}
                    >
                      Restore Data
                    </h5>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                      }}
                    >
                      Overwrite current data with a backup file. Use with
                      caution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreBackup}
                    style={{
                      marginTop: 'auto',
                      padding: '10px',
                      background: 'var(--danger)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Restore from Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <img
                  src={logoImage}
                  alt="ShopMate Logo"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                    borderRadius: '10px',
                    background: 'var(--bg-hover)',
                    padding: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                />
                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    ShopMate Desktop POS
                  </h4>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontWeight: '600',
                    }}
                  >
                    Version {updateInfo.currentVersion || '1.1.0'} (Offline
                    Desktop WAL Edition)
                  </p>
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '24px',
                }}
              >
                ShopMate is an enterprise-grade, offline-first Windows POS &
                Khata management system built for high performance, accuracy,
                and reliability.
              </p>

              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                      }}
                    >
                      Software Updates
                    </h5>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Check for the latest features and security patches.
                    </p>
                  </div>
                  <button
                    onClick={handleCheckUpdates}
                    disabled={updateStatus === 'checking'}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: updateStatus === 'checking' ? 0.7 : 1,
                      cursor: updateStatus === 'checking' ? 'wait' : 'pointer',
                    }}
                  >
                    {updateStatus === 'checking' ? (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ animation: 'spin 1s linear infinite' }}
                        >
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Checking...
                      </>
                    ) : (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Check for Updates
                      </>
                    )}
                  </button>
                </div>
                {updateStatus === 'up-to-date' && (
                  <div
                    style={{
                      background: 'var(--success-bg)',
                      color: 'var(--success)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ✅ You are on the latest version (v
                    {updateInfo.currentVersion}).
                  </div>
                )}
              </div>

              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    color: 'var(--brand-primary)',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Support & Developer Contact
                </h5>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>
                      Email:
                    </strong>{' '}
                    fahadfida400@gmail.com
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>
                      WhatsApp:
                    </strong>{' '}
                    +92 331 546 9223
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPDATE CONFIRM MODAL */}
        {isUpdateModalOpen && (
          <div
            className="receipt-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                width: '400px',
                padding: '28px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    background: 'var(--info-bg)',
                    color: 'var(--info)',
                    padding: '12px',
                    borderRadius: '50%',
                  }}
                >
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Update Available
                </h3>
              </div>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  marginBottom: '24px',
                }}
              >
                ShopMate <strong>v{updateInfo.version}</strong> is available!
                Your current version is{' '}
                <strong>v{updateInfo.currentVersion}</strong>.<br />
                <br />
                Do you want to download and install the update now?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleStartUpdate}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
                >
                  Yes, Update Now
                </button>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="btn"
                  style={{
                    padding: '12px 20px',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
