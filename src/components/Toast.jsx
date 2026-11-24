import React, { useEffect, useRef, useState } from 'react';

const DURATION = 4000; // design.md §4

const iconFor = (type) => {
  if (type === 'error') {
    return (
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
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (type === 'info') {
    return (
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
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );
  }
  return (
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const semantic = (type) => {
  if (type === 'error') return 'var(--ink-danger)';
  if (type === 'info') return 'var(--ink-info)';
  return 'var(--ink-success)';
};

export default function Toast({ message, type = 'success', onClose }) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef(0);

  // Auto-dismiss + countdown, restarts on new message
  useEffect(() => {
    if (!message) return undefined;
    startRef.current = Date.now();
    setProgress(1);

    const raf = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / DURATION);
      setProgress(remaining);
      if (remaining > 0) requestAnimationFrame(raf);
    };
    const frame = requestAnimationFrame(raf);

    const timer = setTimeout(() => {
      onClose();
    }, DURATION);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [message, type, onClose]);

  if (!message) return null;

  const accent = semantic(type);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        minWidth: '300px',
        maxWidth: '420px',
        background: 'var(--ink-0)',
        color: 'var(--ink-fg)',
        borderRadius: '10px',
        border: '1px solid var(--ink-3)',
        borderLeft: `3px solid ${accent}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        fontSize: '0.82rem',
        fontWeight: 500,
        zIndex: 9999,
        animation: 'toastRise 150ms ease-out',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          color: accent,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {iconFor(type)}
      </span>

      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>

      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-fg-3)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Countdown bar — design.md §4 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: '2px',
          width: `${progress * 100}%`,
          background: accent,
          transition: 'width 80ms linear',
        }}
      />

      <style>{`
        @keyframes toastRise {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
