import { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // If Sentry is configured, capture the exception
    try {
      if (window.__SENTRY_INITIALIZED__) {
        import('@sentry/react').then(Sentry => {
          Sentry.captureException(error, { extra: errorInfo });
        });
      }
    } catch (e) {
      // Sentry not available, that's okay
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6">
          <div className="bg-white rounded-brand-xl shadow-brand-xl p-10 max-w-md w-full text-center">
            <img src="/logo.png" alt="TrueEd logo" className="h-10 w-auto mx-auto mb-6" loading="lazy" />
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl" />
            </div>
            <h2 className="font-sora text-xl font-bold text-navy mb-2">Something went wrong</h2>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="inline-block py-3 px-8 bg-navy text-white rounded-lg font-sora font-semibold hover:bg-navy-light transition shadow-brand"
            >
              Go back to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
