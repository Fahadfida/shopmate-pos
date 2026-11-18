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
      bg: 'var(--success-bg)',
      border: 'var(--success)',
      text: 'var(--success)',
      icon: '✅',
    },
    error: {
      bg: 'var(--danger-bg)',
      border: 'var(--danger)',
      text: 'var(--danger)',
      icon: '🚨',
    },
  };
  const c = colors[type] || colors.error;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: c.bg,
        borderLeft: `4px solid ${c.border}`,
        color: c.text,
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        minWidth: '320px',
        fontWeight: '600',
        fontSize: '0.85rem',
        animation: 'slideInUp 0.3s ease-out',
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
          fontSize: '1rem',
        }}
      >
        ✕
      </button>
    </div>
  );
};

// --- SVG ICONS ---
const LockIcon = () => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const CopyIcon = () => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
const KeyIcon = () => (
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
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

export default function ActivationModal({ onActivated }) {
  const [machineId, setMachineId] = useState('');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    const fetchMachineId = async () => {
      const ipc = getIpc();
      if (ipc) {
        const res = await ipc.invoke('get-machine-id');
        if (res.success) setMachineId(res.machineId);
        else addToast('Failed to retrieve hardware ID: ' + res.error, 'error');
      } else {
        // Fallback for browser dev
        setMachineId('DEV-MACHINE-ID-1234-5678-90AB-CDEF');
      }
    };
    fetchMachineId();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(machineId);
    setCopied(true);
    addToast('Hardware ID copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('activate-license', licenseKeyInput);
      if (res.success) {
        addToast(
          `Activation successful for ${res.payload.shop || 'this terminal'}!`,
          'success',
        );
        if (onActivated) onActivated(res.payload);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('Activation failed: ' + res.error, 'error');
        setIsLoading(false);
      }
    } else {
      addToast('Activation requires the Electron environment.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="receipt-modal-backdrop">
      {/* TOASTS */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
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

      <div
        style={{
          width: '520px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            background: 'var(--sidebar-bg)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '16px',
              borderRadius: '50%',
              color: '#fff',
              marginBottom: '16px',
            }}
          >
            <LockIcon />
          </div>
          <h2
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '1.4rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: '800',
            }}
          >
            Software Activation
          </h2>
          <p
            style={{
              margin: '8px 0 0 0',
              color: '#94a3b8',
              fontSize: '0.85rem',
              textAlign: 'center',
              maxWidth: '340px',
            }}
          >
            This terminal requires a valid cryptographic license key to unlock
            ShopMate POS.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px' }}>
          {/* Hardware ID Box */}
          <div
            style={{
              background: 'var(--bg-hover)',
              padding: '20px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Your Terminal Hardware ID
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <code
                className="monospace"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  flex: 1,
                }}
              >
                {machineId || 'Generating hardware fingerprint...'}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!machineId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: copied
                    ? 'var(--success)'
                    : 'var(--brand-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? (
                  <>
                    <CheckIcon /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon /> Copy
                  </>
                )}
              </button>
            </div>
            <p
              style={{
                margin: '12px 0 0 0',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
              }}
            >
              Send this ID to your vendor to receive your activation key.
            </p>
          </div>

          {/* Activation Form */}
          <form
            onSubmit={handleActivate}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                Paste Activation Key
              </label>
              <textarea
                className="input-field monospace"
                rows="4"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="Paste the signed license key (e.g. eyJjdXN0b21lciI6...)"
                required
                style={{ fontSize: '0.8rem', padding: '12px', resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: '14px',
                fontWeight: '700',
                fontSize: '0.95rem',
                marginTop: '8px',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <KeyIcon />{' '}
              {isLoading ? 'Verifying Signature...' : 'Activate Software'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
