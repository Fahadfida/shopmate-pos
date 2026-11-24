import React, { useState, useEffect } from 'react';
import bgImage from '../assets/login-bg.jpg';
import logoImage from '../assets/logo.png';
import { getIpc } from '../utils/ipc';

// ─────────────────────────────────────────────────────────────
// Icons (Lucide 16px/18px 1.5 stroke)
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
  <svg {...iconBase}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconBase}>
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
// Component
// ─────────────────────────────────────────────────────────────
export default function Login({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({ username: 'Manager', pin: '' });
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const ipc = getIpc();

    // Fallback for browser dev mode
    if (!ipc) {
      if (loginForm.pin === '1234' || loginForm.pin === '0000') {
        onLoginSuccess({
          id: 1,
          username: loginForm.username,
          role: loginForm.username === 'Manager' ? 'ADMIN' : 'CASHIER',
        });
      } else {
        addToast('Invalid PIN. Try 1234 or 0000.', 'error');
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await ipc.invoke('login', loginForm);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        addToast(res.error || 'Invalid credentials.', 'error');
        setLoginForm({ ...loginForm, pin: '' });
      }
    } catch (err) {
      addToast('System error. Please try again.', 'error');
    }
    setIsLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        // background: 'var(--bg-app)',
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

      {/* LEFT PANEL: BRANDING & HERO */}
      <div
        style={{
          flex: 1.2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--sidebar-bg, #0a1128)',
        }}
      >
        {/* Background Image with Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle,rgba(20, 18, 18, 1) 0%, rgba(20, 18, 18, 0.79) 100%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '460px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            <img
              src={logoImage}
              alt="ShopMate Logo"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
              }}
            />
            <h1
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '3.5rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              ShopMate
            </h1>
          </div>

          <h2
            style={{
              color: '#f8fafc',
              fontSize: '2.2rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '16px',
              letterSpacing: '-0.03em',
            }}
          >
            The smartest way to run your wholesale / retail store.
          </h2>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '32px',
              color: '#f8fafc',
            }}
          >
            Manage inventory, track customer khata, and process sales
            seamlessly. Built for speed, accuracy, and enterprise-grade
            reliability.
          </p>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38bdf8',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--ink-0)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--ink-0)',
                }}
              />
              Offline-First SQLite
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--ink-0)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--ink-0)',
                }}
              />
              Secure Role Access
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '64px',
          background: 'var(--ink-0)',
          borderLeft: '1px solid var(--ink-3)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h3
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '0 0 6px 0',
                color: 'var(--ink-fg)',
                fontSize: '2.35rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Welcome back
            </h3>
            {/* <p
              style={{
                margin: 0,
                color: 'var(--ink-fg-3)',
                fontSize: '0.85rem',
              }}
            >
              Enter your operator PIN to access the counter.
            </p> */}
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                Operator Account
              </label>
              <select
                className="input-field"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                style={{
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: '1px solid var(--ink-3)',
                  background: 'var(--ink-0)',
                  color: 'var(--ink-fg)',
                  width: '100%',
                  outline: 'none',
                }}
              >
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--ink-fg-2)',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                Secure PIN
              </label>
              <input
                type="password"
                className="monospace"
                value={loginForm.pin}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, pin: e.target.value })
                }
                placeholder="••••"
                required
                style={{
                  padding: '10px 12px',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  letterSpacing: '6px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--ink-3)',
                  background: 'var(--ink-0)',
                  color: 'var(--ink-fg)',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '11px 16px',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginTop: '4px',
                background: 'var(--ink-fg)',
                color: 'var(--brand-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to ShopMate'}
            </button>
          </form>

          <div
            style={{
              marginTop: '28px',
              padding: '14px',
              background: 'var(--ink-1)',
              borderRadius: '8px',
              border: '1px solid var(--ink-3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--ink-fg-2)',
                fontSize: '0.72rem',
                marginBottom: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              <LockIcon />
              Default Credentials
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--ink-fg-3)',
              }}
            >
              <span>
                Manager PIN:{' '}
                <strong style={{ color: 'var(--ink-fg)' }}>1234</strong>
              </span>
              <span>
                Cashier PIN:{' '}
                <strong style={{ color: 'var(--ink-fg)' }}>0000</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
