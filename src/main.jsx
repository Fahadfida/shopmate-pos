import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
// import './theme.css';
// src/main.jsx
const bootTheme = localStorage.getItem('shopmate_theme') || 'light';
document.documentElement.setAttribute('data-theme', bootTheme);
document.body?.setAttribute('data-theme', bootTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
