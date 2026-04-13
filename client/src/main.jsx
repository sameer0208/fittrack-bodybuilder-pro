import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Suppress benign browser warnings ──────────────────────────────────────────
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

const _origConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('chart should be greater than 0')) return;
  _origConsoleWarn.apply(console, args);
};

const _origConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Expected static flag was missing')) return;
  _origConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
