import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Suppress benign browser warnings ──────────────────────────────────────────
// "ResizeObserver loop limit exceeded" is a known false-positive from Recharts'
// ResponsiveContainer using ResizeObserver. It does NOT indicate a real error.
const _origError = window.onerror;
window.onerror = (message, ...rest) => {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) return true;
  return _origError ? _origError(message, ...rest) : false;
};

window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
