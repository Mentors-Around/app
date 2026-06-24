import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('trueed_cookie_consent');
    if (!consent) {
      // Delay to allow page to load first
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('trueed_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleSavePreferences = () => {
    const prefs = { essential: true, analytics, marketing };
    localStorage.setItem('trueed_cookie_consent', JSON.stringify(prefs));
    setShowPreferences(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPreferences(false)} />
          <div className="relative bg-white rounded-brand-xl shadow-brand-xl p-6 w-full max-w-md mb-32 md:mb-0 animate-slide-up z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-sora font-bold text-navy text-lg">Cookie Preferences</h3>
              <button onClick={() => setShowPreferences(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition" aria-label="Close preferences">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-navy text-sm">Essential Cookies</p>
                  <p className="text-xs text-muted mt-0.5">Required for the website to function</p>
                </div>
                <div className="w-11 h-6 bg-success rounded-full p-1 opacity-60 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full translate-x-5" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-navy text-sm">Analytics Cookies</p>
                  <p className="text-xs text-muted mt-0.5">Help us improve the platform</p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${analytics ? 'bg-success' : 'bg-slate-300'}`}
                  aria-label="Toggle analytics cookies"
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${analytics ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-navy text-sm">Marketing Cookies</p>
                  <p className="text-xs text-muted mt-0.5">Used for targeted advertisements</p>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${marketing ? 'bg-success' : 'bg-slate-300'}`}
                  aria-label="Toggle marketing cookies"
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${marketing ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full mt-5 py-3 bg-navy text-white rounded-lg font-sora font-semibold text-sm hover:bg-navy-light transition shadow-brand"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Main Banner */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-[#1B2D5B] text-white rounded-brand-xl shadow-brand-xl p-5 md:p-6 w-full md:max-w-2xl md:rounded-brand-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-cookie-bite text-amber text-lg" />
                <h4 className="font-sora font-bold text-sm">Cookie Notice</h4>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                We use cookies to improve your experience on TrueEd. By continuing, you agree to our{' '}
                <Link to="/privacy" className="text-amber font-semibold hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 md:flex-none py-2.5 px-5 border-2 border-white/30 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition whitespace-nowrap"
                aria-label="Manage cookie preferences"
              >
                Manage Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 md:flex-none py-2.5 px-5 bg-amber text-navy rounded-lg text-sm font-bold hover:bg-amber-hover transition whitespace-nowrap shadow-sm"
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
