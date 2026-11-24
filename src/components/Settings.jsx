import React, { useState, useEffect, useId } from 'react';
import logoImage from '../assets/logo.png';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (18px 1.5 stroke)
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
  <svg {...iconBase} aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const InfoIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const PaletteIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const SunIcon = () => (
  <svg {...iconBase} width={20} height={20} aria-hidden="true">
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
  <svg {...iconBase} width={20} height={20} aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UploadIcon = () => (
  <svg {...iconBase} width={16} height={16} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconBase} width={16} height={16} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SaveIcon = () => (
  <svg {...iconBase} width={16} height={16} aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconBase} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RefreshIcon = () => (
  <svg {...iconBase} width={16} height={16} aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Typography & Surface Tokens (4px grid, legible POS scale)
// ─────────────────────────────────────────────────────────────
const sansFamily = {
  fontFamily: 'var(--font-sans)',
};

const typeScale = {
  pageTitle: {
    ...sansFamily,
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  sectionTitle: {
    ...sansFamily,
    fontSize: '1.0625rem',
    fontWeight: 600,
    lineHeight: 1.35,
  },
  cardTitle: {
    ...sansFamily,
    fontSize: '0.9375rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    ...sansFamily,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  label: {
    ...sansFamily,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  helper: {
    ...sansFamily,
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: 1.45,
  },
  control: {
    ...sansFamily,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  badge: {
    ...sansFamily,
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
};

const Field = ({ label, htmlFor, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label
      htmlFor={htmlFor}
      style={{
        ...typeScale.label,
        color: 'var(--ink-fg-2)',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  ...typeScale.body,
  minHeight: '40px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--ink-3)',
  background: 'var(--ink-0)',
  color: 'var(--ink-fg)',
  width: '100%',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
};

const primaryButtonStyle = {
  ...typeScale.control,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '38px',
  padding: '8px 16px',
  background: 'var(--brand-primary)',
  color: 'var(--ink-0)',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 150ms ease, transform 120ms ease',
};

const applyThemeToDom = (theme) => {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalized);
  if (document.body) {
    document.body.setAttribute('data-theme', normalized);
  }
  return normalized;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Settings({ currentUser, showToast }) {
  const shopNameId = useId();
  const shopAddressId = useId();
  const shopPhoneId = useId();
  const skuFormatId = useId();
  const shopLogoId = useId();
  const operatorSelectId = useId();
  const newPasswordId = useId();

  const [activeTab, setActiveTab] = useState('shop');

  const [settings, setSettings] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_logo: '',
    sku_format: 'CAT_SEQ',
    theme: 'light',
    cloud_provider: 'NONE',
    cloud_sync_enabled: false,
    last_sync_time: 'Never',
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('shopmate_theme') || 'light';
    return applyThemeToDom(saved);
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  const [updateStatus, setUpdateStatus] = useState('');
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'downloading' | 'downloaded' | 'error'
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updateInfo, setUpdateInfo] = useState({
    version: '',
    currentVersion: '',
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const notify = (msg, type = 'success') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  };

  const loadSettingsAndUsers = async () => {
    const ipc = getIpc();
    if (!ipc) return;

    const data = await ipc.invoke('get-settings');
    if (data) {
      setSettings((prev) => ({ ...prev, ...data }));
      const persistedTheme =
        data.theme || localStorage.getItem('shopmate_theme') || 'light';
      const applied = applyThemeToDom(persistedTheme);
      setCurrentTheme(applied);
      localStorage.setItem('shopmate_theme', applied);
    }

    if (currentUser?.role?.toUpperCase() === 'ADMIN') {
      const fetchedUsers = await ipc.invoke('get-users');
      setUsers(fetchedUsers || []);
    }
  };

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    const ipc = getIpc();

    if (ipc) {
      const res = await ipc.invoke('check-for-updates');
      if (res && res.success) {
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
        const msg = res?.error || 'Could not check for updates.';
        notify(msg, 'error');
        alert(msg);
      }
    } else {
      setUpdateStatus('error');
      alert('Updates require the desktop app.');
    }
  };

  const handleStartUpdate = async () => {
    const ipc = getIpc();
    if (!ipc) {
      alert('Updates require the desktop app.');
      return;
    }

    setDownloadState('downloading');
    setDownloadPercent(0);
    setIsUpdateModalOpen(false);
    notify(`Downloading ShopMate v${updateInfo.version}...`, 'info');

    const res = await ipc.invoke('download-update');
    if (!res || !res.success) {
      setDownloadState('error');
      const msg = res?.error || 'Could not start update download.';
      notify(msg, 'error');
      alert(msg);
    }
  };

  const handleInstallNow = async () => {
    const ipc = getIpc();
    if (!ipc) return;

    const res = await ipc.invoke('install-update');
    if (!res || !res.success) {
      const msg = res?.error || 'Could not install update.';
      notify(msg, 'error');
      alert(msg);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('shopmate_theme') || 'light';
    setCurrentTheme(applyThemeToDom(savedTheme));
    loadSettingsAndUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    const ipc = getIpc();
    if (!ipc || typeof ipc.on !== 'function') return;

    const onProgress = (_event, pct) => {
      setDownloadState('downloading');
      setDownloadPercent(pct);
    };

    const onDownloaded = (info) => {
      setDownloadState('downloaded');
      setDownloadPercent(100);
      if (info?.version) {
        setUpdateInfo((prev) => ({ ...prev, version: info.version }));
      }
      notify(
        'Update downloaded. Click "Restart & install" to apply.',
        'success',
      );
    };

    const onError = (_event, message) => {
      setDownloadState('error');
      const errMsg = message || 'Update download failed.';
      notify(errMsg, 'error');
    };

    ipc.on('update-download-progress', onProgress);
    ipc.on('update-downloaded', onDownloaded);
    ipc.on('update-error', onError);

    return () => {
      if (typeof ipc.removeListener === 'function') {
        ipc.removeListener('update-download-progress', onProgress);
        ipc.removeListener('update-downloaded', onDownloaded);
        ipc.removeListener('update-error', onError);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeChange = async (theme) => {
    const applied = applyThemeToDom(theme);
    setCurrentTheme(applied);
    localStorage.setItem('shopmate_theme', applied);
    setSettings((prev) => ({ ...prev, theme: applied }));

    const ipc = getIpc();
    if (ipc) {
      try {
        const res = await ipc.invoke('save-settings', { theme: applied });
        if (!res?.success) {
          console.warn('Theme saved locally but DB write failed:', res?.error);
          // do NOT revert — localStorage remains authoritative
        }
      } catch (err) {
        console.error('Failed to persist theme setting:', err);
      }
    }
    notify(`Switched to ${applied} mode`);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const payload = { ...settings, theme: currentTheme };
      const res = await ipc.invoke('save-settings', payload);
      if (res && res.success) {
        setSaveStatus('Settings saved');
        notify('Shop settings saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        alert('Error: ' + (res?.error || 'Unknown error'));
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
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
      return alert('Unauthorized');
    if (!selectedUserId) return alert('Select a user');
    if (!newPassword || newPassword.length < 4)
      return alert('Password must be at least 4 characters');

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('update-user-password', {
        userId: parseInt(selectedUserId, 10),
        newPassword,
        currentUser,
      });
      if (res && res.success) {
        setPasswordStatus('Operator password updated');
        notify('Operator password updated');
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
      if (res && res.success) {
        setBackupStatus('Backup saved to: ' + res.filePath);
        notify('Database backup exported');
      } else if (res && res.canceled) setBackupStatus('');
      else setBackupStatus('Backup failed: ' + (res?.error || 'Unknown error'));
    }
  };

  const handleRestoreBackup = async () => {
    if (
      !window.confirm(
        'This will overwrite all current sales, inventory, and khata records with the backup file data. Continue?',
      )
    )
      return;
    const ipc = getIpc();
    if (ipc) {
      setBackupStatus('Restoring database...');
      const res = await ipc.invoke('restore-database-backup');
      if (res && res.success) {
        alert('Database restored. The application will now reload.');
        window.location.reload();
      } else if (res && res.canceled) setBackupStatus('');
      else
        setBackupStatus('Restore failed: ' + (res?.error || 'Unknown error'));
    }
  };

  const tabs = [
    { id: 'shop', label: 'Shop info and SKU', icon: StoreIcon },
    { id: 'theme', label: 'Appearance', icon: PaletteIcon },
    { id: 'security', label: 'Security and passwords', icon: ShieldIcon },
    { id: 'backup', label: 'Backup and recovery', icon: DatabaseIcon },
    { id: 'about', label: 'About and support', icon: InfoIcon },
  ];

  return (
    <div
      style={{
        ...typeScale.body,
        display: 'flex',
        gap: '20px',
        flex: 1,
        height: '100%',
        color: 'var(--ink-fg)',
      }}
    >
      {/* LEFT SIDEBAR NAVIGATION */}
      <nav
        aria-label="Settings sections"
        style={{
          ...sansFamily,
          width: '248px',
          flexShrink: 0,
          background: 'var(--ink-0)',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <h2
          style={{
            ...typeScale.pageTitle,
            margin: '0 0 12px 8px',
            color: 'var(--ink-fg)',
          }}
        >
          Settings
        </h2>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...sansFamily,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minHeight: '38px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--ink-1)' : 'transparent',
                color: isActive ? 'var(--ink-fg)' : 'var(--ink-fg-2)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                lineHeight: 1.35,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              <span
                style={{
                  color: isActive ? 'var(--brand-primary)' : 'var(--ink-fg-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  flexShrink: 0,
                }}
              >
                <Icon />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* RIGHT CONTENT AREA */}
      <div
        style={{
          ...sansFamily,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--ink-0)',
          borderRadius: '12px',
          border: '1px solid var(--ink-3)',
        }}
      >
        {/* SHOP INFO TAB */}
        {activeTab === 'shop' && (
          <form
            onSubmit={handleSave}
            style={{
              ...sansFamily,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                ...sansFamily,
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '16px',
                }}
              >
                <h3
                  style={{
                    ...typeScale.sectionTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  Shop identity and branding
                </h3>
                <p
                  style={{
                    ...typeScale.helper,
                    margin: '4px 0 0 0',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  These details appear on 80mm thermal receipt prints and
                  generated SKUs.
                </p>
              </div>

              {saveStatus && (
                <div
                  role="status"
                  style={{
                    ...typeScale.helper,
                    background: 'var(--ink-1)',
                    color: 'var(--ink-success)',
                    padding: '10px 14px',
                    borderRadius: '8px',
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
                  <Field label="Business name" htmlFor={shopNameId}>
                    <input
                      id={shopNameId}
                      type="text"
                      value={settings.shop_name || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, shop_name: e.target.value })
                      }
                      placeholder="e.g. ShopMate Gaming and Tech"
                      required
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Physical address" htmlFor={shopAddressId}>
                    <textarea
                      id={shopAddressId}
                      rows={2}
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

                <Field label="Contact phone or helpline" htmlFor={shopPhoneId}>
                  <input
                    id={shopPhoneId}
                    type="text"
                    value={settings.shop_phone || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, shop_phone: e.target.value })
                    }
                    placeholder="e.g. +92 300 1234567"
                    style={{
                      ...inputStyle,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </Field>

                <Field label="Automated SKU format" htmlFor={skuFormatId}>
                  <select
                    id={skuFormatId}
                    value={settings.sku_format || 'CAT_SEQ'}
                    onChange={(e) =>
                      setSettings({ ...settings, sku_format: e.target.value })
                    }
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="CAT_SEQ">
                      Category prefix + sequential (e.g. ELE-0001)
                    </option>
                    <option value="NAME_SEQ">
                      Name abbreviation + sequential (e.g. WHP-0001)
                    </option>
                    <option value="TIMESTAMP">
                      Epoch timestamp hex (e.g. TS-19FA8C)
                    </option>
                    <option value="NUMERIC">
                      Pure numeric (e.g. 1001, 1002)
                    </option>
                  </select>
                </Field>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Shop logo" htmlFor={shopLogoId}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'var(--ink-1)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px dashed var(--ink-3)',
                      }}
                    >
                      {settings.shop_logo ? (
                        <img
                          src={settings.shop_logo}
                          alt="Shop logo"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            border: '1px solid var(--ink-3)',
                            background: 'var(--ink-0)',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            background: 'var(--ink-2)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ink-fg-3)',
                            flexShrink: 0,
                          }}
                        >
                          <StoreIcon />
                        </div>
                      )}
                      <input
                        id={shopLogoId}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{
                          ...typeScale.helper,
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
                padding: '16px 24px',
                borderTop: '1px solid var(--ink-3)',
                background: 'var(--ink-1)',
                borderRadius: '0 0 12px 12px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button type="submit" style={primaryButtonStyle}>
                <SaveIcon /> Save shop branding
              </button>
            </div>
          </form>
        )}

        {/* APPEARANCE THEME TAB */}
        {activeTab === 'theme' && (
          <div
            style={{
              ...sansFamily,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                ...sansFamily,
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '16px',
                }}
              >
                <h3
                  style={{
                    ...typeScale.sectionTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  App appearance
                </h3>
                <p
                  style={{
                    ...typeScale.helper,
                    margin: '4px 0 0 0',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  Choose the surface contrast for your counter display. Changes
                  save automatically and persist across logins.
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
                    label: 'Light mode',
                    desc: 'High-contrast daylight surface for bright retail counters.',
                    icon: SunIcon,
                  },
                  {
                    id: 'dark',
                    label: 'Dark mode',
                    desc: 'Low-glare dark surface for evening and low-light shifts.',
                    icon: MoonIcon,
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = currentTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleThemeChange(t.id)}
                      style={{
                        ...sansFamily,
                        cursor: 'pointer',
                        background: isSelected
                          ? 'var(--ink-1)'
                          : 'var(--ink-0)',
                        border: isSelected
                          ? '1.5px solid var(--brand-primary)'
                          : '1px solid var(--ink-3)',
                        borderRadius: '12px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'center',
                        transition:
                          'border-color 150ms ease, background-color 150ms ease',
                      }}
                    >
                      <div
                        style={{
                          background: isSelected
                            ? 'var(--brand-primary)'
                            : 'var(--ink-2)',
                          color: isSelected
                            ? 'var(--ink-0)'
                            : 'var(--ink-fg-2)',
                          padding: '12px',
                          borderRadius: '50%',
                          display: 'flex',
                        }}
                      >
                        <Icon />
                      </div>
                      <div>
                        <h4
                          style={{
                            ...typeScale.cardTitle,
                            margin: 0,
                            color: 'var(--ink-fg)',
                          }}
                        >
                          {t.label}
                        </h4>
                        <p
                          style={{
                            ...typeScale.helper,
                            margin: '4px 0 0 0',
                            color: 'var(--ink-fg-3)',
                          }}
                        >
                          {t.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <span
                          style={{
                            ...typeScale.badge,
                            background: 'var(--brand-primary)',
                            color: 'var(--ink-0)',
                            padding: '4px 10px',
                            borderRadius: '999px',
                          }}
                        >
                          Active
                        </span>
                      )}
                    </button>
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
            style={{
              ...sansFamily,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                ...sansFamily,
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '16px',
                }}
              >
                <h3
                  style={{
                    ...typeScale.sectionTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  Operator security
                </h3>
                <p
                  style={{
                    ...typeScale.helper,
                    margin: '4px 0 0 0',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  Update login passwords for staff operators and admin accounts.
                </p>
              </div>

              {currentUser?.role?.toUpperCase() !== 'ADMIN' ? (
                <div
                  role="alert"
                  style={{
                    ...typeScale.body,
                    background: 'var(--ink-1)',
                    color: 'var(--ink-danger)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--ink-3)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <LockIcon />
                  <span>
                    Access restricted to ADMIN accounts. Sign in as an
                    administrator to change operator passwords.
                  </span>
                </div>
              ) : (
                <>
                  {passwordStatus && (
                    <div
                      role="status"
                      style={{
                        ...typeScale.helper,
                        background: 'var(--ink-1)',
                        color: 'var(--ink-success)',
                        padding: '10px 14px',
                        borderRadius: '8px',
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
                      maxWidth: '420px',
                    }}
                  >
                    <Field
                      label="Select operator account"
                      htmlFor={operatorSelectId}
                    >
                      <select
                        id={operatorSelectId}
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">Choose staff operator</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="New password" htmlFor={newPasswordId}>
                      <input
                        id={newPasswordId}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
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
                  padding: '16px 24px',
                  borderTop: '1px solid var(--ink-3)',
                  background: 'var(--ink-1)',
                  borderRadius: '0 0 12px 12px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button type="submit" style={primaryButtonStyle}>
                  <ShieldIcon /> Update operator password
                </button>
              </div>
            )}
          </form>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div
            style={{
              ...sansFamily,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                ...sansFamily,
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '16px',
                }}
              >
                <h3
                  style={{
                    ...typeScale.sectionTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  Database backup and recovery
                </h3>
                <p
                  style={{
                    ...typeScale.helper,
                    margin: '4px 0 0 0',
                    color: 'var(--ink-fg-3)',
                  }}
                >
                  Export a snapshot of your SQLite ledger or restore from a
                  saved archive.
                </p>
              </div>

              {backupStatus && (
                <div
                  role="status"
                  style={{
                    ...typeScale.helper,
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg)',
                    padding: '10px 14px',
                    borderRadius: '8px',
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
                    padding: '24px',
                    borderRadius: '12px',
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
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <DownloadIcon />
                  </div>
                  <div>
                    <h4
                      style={{
                        ...typeScale.cardTitle,
                        margin: 0,
                        color: 'var(--ink-fg)',
                      }}
                    >
                      Export backup
                    </h4>
                    <p
                      style={{
                        ...typeScale.helper,
                        margin: '4px 0 0 0',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      Save a complete copy of your local SQLite database file.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    style={{
                      ...primaryButtonStyle,
                      marginTop: 'auto',
                      width: '100%',
                    }}
                  >
                    Download .sqlite file
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--ink-1)',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid var(--ink-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--ink-danger)',
                      background: 'var(--ink-0)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ink-3)',
                    }}
                  >
                    <UploadIcon />
                  </div>
                  <div>
                    <h4
                      style={{
                        ...typeScale.cardTitle,
                        margin: 0,
                        color: 'var(--ink-fg)',
                      }}
                    >
                      Restore data
                    </h4>
                    <p
                      style={{
                        ...typeScale.helper,
                        margin: '4px 0 0 0',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      Replace current sales, stock, and khata entries with a
                      backup file.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreBackup}
                    style={{
                      ...typeScale.control,
                      marginTop: 'auto',
                      width: '100%',
                      minHeight: '38px',
                      padding: '8px 16px',
                      background: 'var(--ink-danger)',
                      color: 'var(--ink-0)',
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Restore from backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div
            style={{
              ...sansFamily,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                ...sansFamily,
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--ink-3)',
                  paddingBottom: '16px',
                }}
              >
                <img
                  src={logoImage}
                  alt="ShopMate logo"
                  style={{
                    width: '44px',
                    height: '44px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: 'var(--ink-1)',
                    padding: '6px',
                    border: '1px solid var(--ink-3)',
                  }}
                />
                <div>
                  <h3
                    style={{
                      ...typeScale.sectionTitle,
                      margin: 0,
                      color: 'var(--ink-fg)',
                    }}
                  >
                    ShopMate Desktop POS
                  </h3>
                  <p
                    style={{
                      ...typeScale.helper,
                      margin: '4px 0 0 0',
                      color: 'var(--ink-fg-3)',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Version {updateInfo.currentVersion} (Offline Desktop WAL
                    Edition)
                  </p>
                </div>
              </div>

              <p
                style={{
                  ...typeScale.body,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '20px',
                }}
              >
                Offline-first Windows point-of-sale, inventory, and khata
                accounting suite built for fast counter operation and local data
                durability.
              </p>

              <div
                style={{
                  background: 'var(--ink-1)',
                  padding: '24px',
                  borderRadius: '12px',
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
                    gap: '16px',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        ...typeScale.cardTitle,
                        margin: 0,
                        color: 'var(--ink-fg)',
                      }}
                    >
                      Software updates
                    </h4>
                    <p
                      style={{
                        ...typeScale.helper,
                        margin: '4px 0 0 0',
                        color: 'var(--ink-fg-3)',
                      }}
                    >
                      Check for feature releases and stability fixes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={
                      updateStatus === 'checking' ||
                      downloadState === 'downloading'
                    }
                    style={{
                      ...primaryButtonStyle,
                      flexShrink: 0,
                      opacity:
                        updateStatus === 'checking' ||
                        downloadState === 'downloading'
                          ? 0.7
                          : 1,
                      cursor:
                        updateStatus === 'checking' ||
                        downloadState === 'downloading'
                          ? 'wait'
                          : 'pointer',
                    }}
                  >
                    <RefreshIcon />
                    {updateStatus === 'checking'
                      ? 'Checking...'
                      : downloadState === 'downloading'
                        ? `Downloading (${downloadPercent}%)`
                        : 'Check for updates'}
                  </button>
                </div>

                {updateStatus === 'up-to-date' && (
                  <div
                    role="status"
                    style={{
                      ...typeScale.helper,
                      background: 'var(--ink-0)',
                      color: 'var(--ink-success)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: '1px solid var(--ink-3)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Up to date on v{updateInfo.currentVersion}.
                  </div>
                )}

                {downloadState === 'downloading' && (
                  <div
                    role="status"
                    style={{
                      ...typeScale.helper,
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--ink-3)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Downloading update v{updateInfo.version}… {downloadPercent}%
                  </div>
                )}

                {downloadState === 'downloaded' && (
                  <div
                    role="status"
                    style={{
                      ...typeScale.helper,
                      background: 'var(--ink-0)',
                      color: 'var(--ink-fg)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--ink-3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span>
                      Update v{updateInfo.version} is ready to install.
                    </span>
                    <button
                      type="button"
                      onClick={handleInstallNow}
                      style={{
                        ...primaryButtonStyle,
                        minHeight: '36px',
                        padding: '6px 14px',
                      }}
                    >
                      Restart & install
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: 'var(--ink-1)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid var(--ink-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <h4
                  style={{
                    ...typeScale.cardTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  Support and developer contact
                </h4>
                <div
                  style={{
                    ...typeScale.body,
                    color: 'var(--ink-fg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--ink-fg-3)' }}>Email: </span>
                    fahadfida400@gmail.com
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-fg-3)' }}>WhatsApp: </span>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-modal-title"
            style={{
              ...sansFamily,
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
                borderRadius: '12px',
                width: '400px',
                maxWidth: '100%',
                padding: '24px',
                border: '1px solid var(--ink-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
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
                  id="update-modal-title"
                  style={{
                    ...typeScale.sectionTitle,
                    margin: 0,
                    color: 'var(--ink-fg)',
                  }}
                >
                  Update available
                </h3>
              </div>

              <p
                style={{
                  ...typeScale.body,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '20px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ShopMate <strong>v{updateInfo.version}</strong> is ready to
                download. Current version:{' '}
                <strong>v{updateInfo.currentVersion}</strong>.
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  style={{ ...primaryButtonStyle, flex: 1 }}
                >
                  Update now
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  style={{
                    ...typeScale.control,
                    minHeight: '38px',
                    padding: '8px 16px',
                    background: 'var(--ink-1)',
                    color: 'var(--ink-fg)',
                    border: '1px solid var(--ink-3)',
                    borderRadius: '8px',
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
