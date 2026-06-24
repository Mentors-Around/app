import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// Initialize Sentry error monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Mark Sentry as initialized for the ErrorBoundary component
window.__SENTRY_INITIALIZED__ = true;

const SentryFallback = () => (
  <div className="min-h-screen bg-cream flex items-center justify-center p-6">
    <div className="bg-white rounded-brand-xl shadow-brand-xl p-10 max-w-md w-full text-center">
      <img src="/logo.png" alt="TrueEd" className="h-10 w-auto mx-auto mb-6" loading="lazy" />
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl" />
      </div>
      <h2 className="font-sora text-xl font-bold text-navy mb-2">Something went wrong</h2>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        Our team has been notified. Please try again.
      </p>
      <a
        href="/"
        className="inline-block py-3 px-8 bg-navy text-white rounded-lg font-sora font-semibold hover:bg-navy-light transition shadow-brand"
      >
        Go back to Home
      </a>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
            <App />
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
