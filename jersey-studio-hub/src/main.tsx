import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Squelch ResizeObserver error which is often a harmless warning in browsers
if (typeof window !== 'undefined') {
  const resizeObserverMessages = [
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop check failed'
  ];
  
  const originalError = window.console.error;
  window.console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && resizeObserverMessages.some(msg => args[0].includes(msg))) {
      return;
    }
    originalError.apply(window.console, args);
  };

  const isResizeObserverError = (msg: any) => {
    if (typeof msg !== 'string') return false;
    return resizeObserverMessages.some(m => msg.includes(m));
  };

  window.addEventListener('error', (e) => {
    if (isResizeObserverError(e.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });

  window.onerror = (msg) => {
    if (isResizeObserverError(msg)) {
      return true; // prevent default
    }
  };

  window.addEventListener('unhandledrejection', (e) => {
    if (isResizeObserverError(e.reason?.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
