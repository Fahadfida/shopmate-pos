import React, { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px/18px 1.5 stroke)
// ─────────────────────────────────────────────────────────────
const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const StoreIcon = () => (
  <svg {...iconBase}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...iconBase}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg {...iconBase}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const InfoIcon = () => (
  <svg {...iconBase}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const PaletteIcon = () => (
  <svg {...iconBase}>
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const SunIcon = () => (
  <svg {...iconBase} width={22} height={22}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg {...iconBase} width={22} height={22}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UploadIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SaveIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconBase}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RefreshIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Reusable Primitives
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

  const [updateStatus, setUpdateStatus] = useState(''); // '', 'checking', 'available', 'up-to-date', 'error'
  const [updateInfo, setUpdateInfo] = useState({
    version: '',
    currentVersion: '',
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

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
        setSaveStatus('Settings saved successfully.');
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
        setPasswordStatus('Operator password updated successfully.');
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

  const tabs = [
    { id: 'shop', label: 'Shop Info & SKU', icon: StoreIcon },
    { id: 'theme', label: 'Appearance', icon: PaletteIcon },
    { id: 'security', label: 'Security & Passwords', icon: ShieldIcon },
    { id: 'backup', label: 'Backup & Recovery', icon: DatabaseIcon },
    { id: 'about', label: 'About & Support', icon: InfoIcon },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        flex: 1,
        height: '100%',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--ink-fg)',
      }}
    >
      {/* LEFT SIDEBAR NAVIGATION */}
      <div
        style={{
          width: '240px',
          flexShrink: 0,
          background: 'var(--ink-0)',
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <h3
          style={{
            margin: '8px 0 12px 10px',
            color: 'var(--ink-fg)',
            fontSize: '0.8rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Settings
        </h3>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? 'var(--ink-1)' : 'transparent',
                color: isActive ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              <span
                style={{
                  color: isActive ? 'var(--brand-primary)' : 'var(--ink-fg-3)',
                  display: 'flex',
                }}
              >
                <Icon />
              </span>
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
          background: 'var(--ink-0)',
          borderRadius: '10px',
          border: '1px solid var(--ink-3)',
        }}
      >
        {/* SHOP INFO TAB */}
        {activeTab === 'shop' && (
          <form
            onSubmit={handleSave}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '14px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--ink-fg)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Shop Identity & Branding
                </h4>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  These details will automatically display on all 80mm thermal
                  receipt prints.
                </p>
              </div>

              {saveStatus && (
                <div
                  style={{
                    background: 'var(--ink-1)',
                    color: 'var(--ink-success, #2e7d32)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    border: '1px solid var(--ink-3)',
                    fontWeight: 500,
                  }}
                >
                  {saveStatus}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Business Name">
                    <input
                      type="text"
                      value={settings.shop_name || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, shop_name: e.target.value })
                      }
                      placeholder="e.g. ShopMate Gaming & Tech"
                      required
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Physical Address">
                    <textarea
                      rows="2"
                      value={settings.shop_address || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shop_address: e.target.value,
                        })
                      }
                      placeholder="e.g. Shop #42, Main Plaza, Saddar Market"
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </Field>
                </div>

                <Field label="Contact Phone / Helpline">
                  <input
                    type="text"
                    value={settings.shop_phone || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, shop_phone: e.target.value })
                    }
                    placeholder="e.g. +92 300 1234567"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Automated SKU Format">
                  <select
                    value={settings.sku_format || 'CAT_SEQ'}
                    onChange={(e) =>
                      setSettings({ ...settings, sku_format: e.target.value })
                    }
                    style={{ ...inputStyle, cursor: 'pointer' }}
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
                </Field>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Shop Logo">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        background: 'var(--ink-1)',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px dashed var(--ink-3)',
                      }}
                    >
                      {settings.shop_logo ? (
                        <img
                          src={settings.shop_logo}
                          alt="Logo"
                          style={{
                            height: '40px',
                            borderRadius: '4px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-0)',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--ink-2)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ink-fg-3)',
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
                          fontSize: '0.8rem',
                          color: 'var(--ink-fg-2)',
                        }}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--ink-3)',
                background: 'var(--ink-1)',
                borderRadius: '0 0 10px 10px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '14px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--ink-fg)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  App Appearance
                </h4>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--ink-fg-3)',
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
                  gap: '16px',
                }}
              >
                {[
                  {
                    id: 'light',
                    label: 'Light Mode',
                    desc: 'Clean, bright, and professional. Best for daytime use.',
                    icon: SunIcon,
                  },
                  {
                    id: 'dark',
                    label: 'Dark Mode',
                    desc: 'Sleek and easy on the eyes. Best for late-night shifts.',
                    icon: MoonIcon,
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = currentTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected
                          ? 'var(--ink-1)'
                          : 'var(--ink-0)',
                        border: isSelected
                          ? '1.5px solid var(--brand-primary)'
                          : '1px solid var(--ink-3)',
                        borderRadius: '10px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'center',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div
                        style={{
                          background: isSelected
                            ? 'var(--brand-primary)'
                            : 'var(--ink-2)',
                          color: isSelected ? '#ffffff' : 'var(--ink-fg-2)',
                          padding: '12px',
                          borderRadius: '50%',
                          display: 'flex',
                        }}
                      >
                        <Icon />
                      </div>
                      <div>
                        <h5
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: 'var(--ink-fg)',
                            fontWeight: 600,
                          }}
                        >
                          {t.label}
                        </h5>
                        <p
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '0.75rem',
                            color: 'var(--ink-fg-3)',
                            lineHeight: 1.4,
                          }}
                        >
                          {t.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <span
                          style={{
                            background: 'var(--brand-primary)',
                            color: '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '14px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--ink-fg)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Operator Security
                </h4>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  Securely update operator credentials and manager passwords.
                </p>
              </div>

              {currentUser?.role?.toUpperCase() !== 'ADMIN' ? (
                <div
                  style={{
                    background: 'var(--ink-1)',
                    color: 'var(--ink-danger, #d32f2f)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--ink-3)',
                    fontWeight: 500,
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
                        background: 'var(--ink-1)',
                        color: 'var(--ink-success, #2e7d32)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        marginBottom: '16px',
                        border: '1px solid var(--ink-3)',
                        fontWeight: 500,
                      }}
                    >
                      {passwordStatus}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      maxWidth: '400px',
                    }}
                  >
                    <Field label="Select Operator Account">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">-- Choose Staff Operator --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="New Secure Password">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        required
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </>
              )}
            </div>

            {currentUser?.role?.toUpperCase() === 'ADMIN' && (
              <div
                style={{
                  padding: '16px 28px',
                  borderTop: '1px solid var(--ink-3)',
                  background: 'var(--ink-1)',
                  borderRadius: '0 0 10px 10px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '14px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: 'var(--ink-fg)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Database Backup & Recovery
                </h4>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  Safeguard your business records. Export a complete copy of
                  your database or restore from a previous archive.
                </p>
              </div>

              {backupStatus && (
                <div
                  style={{
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    border: '1px solid var(--ink-3)',
                    fontWeight: 500,
                  }}
                >
                  {backupStatus}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    background: 'var(--ink-1)',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid var(--ink-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--brand-primary)',
                      background: 'var(--ink-0)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <DownloadIcon />
                  </div>
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: 'var(--ink-fg)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Export Backup
                    </h5>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-3)',
                        lineHeight: 1.4,
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
                      padding: '8px 12px',
                      background: 'var(--brand-primary)',
                      color: '#ffffff',
                      fontWeight: 500,
                      fontSize: '0.8rem',
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
                    background: 'var(--ink-1)',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid var(--ink-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--ink-danger, #d32f2f)',
                      background: 'var(--ink-0)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <UploadIcon />
                  </div>
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: 'var(--ink-fg)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Restore Data
                    </h5>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-3)',
                        lineHeight: 1.4,
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
                      padding: '8px 12px',
                      background: 'var(--ink-danger, #d32f2f)',
                      color: '#ffffff',
                      fontWeight: 500,
                      fontSize: '0.8rem',
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '14px',
                }}
              >
                <img
                  src={logoImage}
                  alt="ShopMate Logo"
                  style={{
                    width: '42px',
                    height: '42px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: 'var(--ink-1)',
                    padding: '6px',
                    border: '1px solid var(--ink-3)',
                  }}
                />
                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: 'var(--ink-fg)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    ShopMate Desktop POS
                  </h4>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.75rem',
                      color: 'var(--ink-fg-3)',
                      fontWeight: 500,
                    }}
                  >
                    Version {updateInfo.currentVersion || '1.1.0'} (Offline
                    Desktop WAL Edition)
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--ink-fg-2)',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              >
                ShopMate is an enterprise-grade, offline-first Windows POS &
                Khata management system built for high performance, accuracy,
                and reliability.
              </p>

              <div
                style={{
                  background: 'var(--ink-1)',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px',
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
                        color: 'var(--ink-fg)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Software Updates
                    </h5>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      Check for the latest features and security patches.
                    </p>
                  </div>
                  <button
                    onClick={handleCheckUpdates}
                    disabled={updateStatus === 'checking'}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--brand-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      opacity: updateStatus === 'checking' ? 0.7 : 1,
                      cursor: updateStatus === 'checking' ? 'wait' : 'pointer',
                    }}
                  >
                    <RefreshIcon />
                    {updateStatus === 'checking'
                      ? 'Checking...'
                      : 'Check for Updates'}
                  </button>
                </div>

                {updateStatus === 'up-to-date' && (
                  <div
                    style={{
                      background: 'var(--ink-0)',
                      color: 'var(--ink-success, #2e7d32)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    ✓ You are on the latest version (v
                    {updateInfo.currentVersion}).
                  </div>
                )}
              </div>

              <div
                style={{
                  background: 'var(--ink-1)',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid var(--ink-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    color: 'var(--brand-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Support & Developer Contact
                </h5>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--ink-fg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--ink-fg-3)' }}>Email:</span>{' '}
                    fahadfida400@gmail.com
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-fg-3)' }}>WhatsApp:</span>{' '}
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--ink-0)',
                borderRadius: '10px',
                width: '380px',
                padding: '24px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    background: 'var(--ink-1)',
                    color: 'var(--brand-primary)',
                    padding: '10px',
                    borderRadius: '50%',
                    border: '1px solid var(--ink-3)',
                    display: 'flex',
                  }}
                >
                  <DownloadIcon />
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: 'var(--ink-fg)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Update Available
                </h3>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--ink-fg-2)',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}
              >
                ShopMate <strong>v{updateInfo.version}</strong> is available!
                Your current version is{' '}
                <strong>v{updateInfo.currentVersion}</strong>.<br />
                <br />
                Do you want to download and install the update now?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleStartUpdate}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '0.82rem',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Yes, Update Now
                </button>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.82rem',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
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
