import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismisses after 3 seconds
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColors = {
    success: '#059669', // Green
    error: '#dc2626', // Red
    info: '#0284c7', // Blue
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: bgColors[type] || bgColors.success,
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        zIndex: 9999,
        animation: 'slideInUp 0.2s ease-out',
      }}
    >
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.9rem',
          marginLeft: '8px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
