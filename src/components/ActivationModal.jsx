import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 14px/16px/18px/24px 1.5 stroke)
// ─────────────────────────────────────────────────────────────
const iconBase = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const LockIcon = () => (
  <svg {...iconBase} width={24} height={24}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CopyIcon = () => (
  <svg {...iconBase} width={14} height={14}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg {...iconBase} width={14} height={14} strokeWidth={2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const KeyIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconBase} width={16} height={16}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
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

      <div
        style={{
          width: '480px',
          maxWidth: '100%',
          background: 'var(--ink-0)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          border: '1px solid var(--ink-3)',
          color: 'var(--ink-fg)',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            background: 'var(--sidebar-bg, #0a1128)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: '1px solid var(--ink-3)',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '12px',
              borderRadius: '50%',
              color: '#ffffff',
              marginBottom: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <LockIcon />
          </div>
          <h2
            style={{
              margin: 0,
              color: '#ffffff',
              fontSize: '1.25rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Software Activation
          </h2>
          <p
            style={{
              margin: '6px 0 0 0',
              color: '#94a3b8',
              fontSize: '0.82rem',
              textAlign: 'center',
              maxWidth: '320px',
              lineHeight: 1.5,
            }}
          >
            This terminal requires a valid cryptographic license key to unlock
            ShopMate POS.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {/* Hardware ID Box */}
          <div
            style={{
              background: 'var(--ink-1)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--ink-3)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--ink-fg-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '6px',
              }}
            >
              Your Terminal Hardware ID
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <code
                className="monospace"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--ink-fg)',
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
                  gap: '5px',
                  padding: '6px 12px',
                  background: copied
                    ? 'var(--ink-success)'
                    : 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  flexShrink: 0,
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
                margin: '10px 0 0 0',
                fontSize: '0.7rem',
                color: 'var(--ink-fg-3)',
              }}
            >
              Send this ID to your vendor to receive your activation key.
            </p>
          </div>

          {/* Activation Form */}
          <form
            onSubmit={handleActivate}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <Field label="Paste Activation Key">
              <textarea
                className="monospace"
                rows="3"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="Paste the signed license key (e.g. eyJjdXN0b21lciI6...)"
                required
                style={{
                  ...inputStyle,
                  fontSize: '0.78rem',
                  resize: 'none',
                  lineHeight: '1.4',
                }}
              />
            </Field>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '11px 16px',
                fontWeight: 500,
                fontSize: '0.85rem',
                marginTop: '4px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
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
