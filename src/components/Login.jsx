import React, { useState, useEffect } from 'react';
import bgImage from '../assets/login-bg.jpg';
import logoImage from '../assets/logo.png';
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
        background: 'var(--bg-app)',
      }}
    >
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
          background: 'var(--sidebar-bg)',
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
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, rgba(10, 17, 40, 0.95), rgba(10, 17, 40, 0.7))',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
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
                background: '#fff',
                padding: '4px',
              }}
            />
            <h1
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '1.8rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: '800',
                letterSpacing: '-0.5px',
              }}
            >
              ShopMate POS
            </h1>
          </div>

          <h2
            style={{
              color: '#f8fafc',
              fontSize: '2.5rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}
          >
            The smartest way to run your retail store.
          </h2>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '1.05rem',
              lineHeight: '1.6',
              marginBottom: '40px',
            }}
          >
            Manage inventory, track customer khata, and process sales
            seamlessly. Built for speed, accuracy, and enterprise-grade
            reliability.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38bdf8',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                }}
              />
              Offline-First SQLite
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38bdf8',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
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
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: '800',
              }}
            >
              Welcome back
            </h3>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              Enter your operator PIN to access the counter.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
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
                Operator Account
              </label>
              <select
                className="input-field"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                style={{
                  padding: '12px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="Manager">Manager (Admin)</option>
                <option value="Cashier">Cashier (Standard)</option>
              </select>
            </div>

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
                Secure PIN
              </label>
              <input
                type="password"
                className="input-field monospace"
                value={loginForm.pin}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, pin: e.target.value })
                }
                placeholder="••••"
                required
                style={{
                  padding: '12px',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: '800',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: '14px',
                fontSize: '0.95rem',
                marginTop: '8px',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to ShopMate'}
            </button>
          </form>

          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              background: 'var(--bg-hover)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                marginBottom: '8px',
                fontWeight: '700',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Default Credentials
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                Manager PIN: <strong>1234</strong>
              </span>
              <span>
                Cashier PIN: <strong>0000</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
