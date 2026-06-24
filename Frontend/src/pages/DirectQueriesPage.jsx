import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DirectQueriesPage = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [queriesUsed, setQueriesUsed] = useState(0);

  useEffect(() => {
    document.title = 'Direct Queries — TrueEd';
    window.scrollTo(0, 0);
    // Check localStorage
    const passData = localStorage.getItem('trueed_query_pass');
    if (passData) {
      try {
        const parsed = JSON.parse(passData);
        if (parsed.active && new Date(parsed.expiry) > new Date()) {
          setHasAccess(true);
          setQueriesUsed(parsed.used || 0);
        }
      } catch (e) { console.error(e) }
    }
  }, []);

  const handlePaymentConfirm = () => {
    setShowPaymentModal(false);
    setHasAccess(true);
    setQueriesUsed(0);
    // Update localStorage
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 5);
    localStorage.setItem('trueed_query_pass', JSON.stringify({ active: true, used: 0, expiry }));
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Connect with Teachers Before Booking</h1>
        <p className="text-muted text-base">Send a direct message to any teacher. Ask about their teaching style, availability and fees. Pay ₹19 for access to 5 teachers for 5 days.</p>
      </div>

      <div className="relative z-10">
        {!hasAccess ? (
          /* Sales Pitch & Comparison */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-brand shadow-brand-lg p-8 border border-slate-200 h-full flex flex-col">
              <h2 className="font-sora font-bold text-xl text-navy mb-6">How it Works</h2>
              <ul className="space-y-5 mb-8">
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-amber/10 text-amber rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-bolt" /></div>
                  <div>
                    <h4 className="font-bold text-navy">Send up to 5 queries</h4>
                    <p className="text-sm text-muted">Message up to 5 different teachers directly on TrueEd</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-sky/10 text-sky rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-regular fa-clock" /></div>
                  <div>
                    <h4 className="font-bold text-navy">Valid for 5 days</h4>
                    <p className="text-sm text-muted">Take your time to find the right teacher. No rushing.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-green-50 text-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-message" /></div>
                  <div>
                    <h4 className="font-bold text-navy">Teacher replies on platform</h4>
                    <p className="text-sm text-muted">Get a response from the teacher before you commit to booking</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-brand shadow-brand-lg border-2 border-navy overflow-hidden flex flex-col h-full">
              <div className="bg-navy text-white text-center py-4 font-sora font-bold tracking-wide uppercase text-sm">
                Unlock Direct Access
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-navy text-xl">Query Pass</h3>
                    <p className="text-sm text-muted">One-time payment</p>
                  </div>
                  <div className="text-right">
                    <span className="font-sora font-extrabold text-4xl text-navy">₹19</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex justify-between text-sm font-semibold text-navy bg-amber/10 p-2 rounded-md">
                    <span>Direct Messaging</span>
                    <span>5 Teachers</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Teacher Replies on Platform</span>
                    <i className="fa-solid fa-check text-success" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Book After Connecting</span>
                    <i className="fa-solid fa-check text-success" />
                  </div>
                </div>

                <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 bg-gradient-to-r from-navy to-sky text-white rounded-lg font-sora font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Get Access for ₹19
                </button>
                <p className="text-center text-xs text-muted mt-3">No recurring charges. Pay once, use for 5 days.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Access State */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-green-50 border border-green-200 text-success p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2 animate-fade-in shadow-sm">
              <div className="w-16 h-16 bg-white text-success rounded-full flex items-center justify-center text-3xl shadow-sm mb-2"><i className="fa-solid fa-check" /></div>
              <h2 className="font-sora font-bold text-2xl">Query Pass Activated! ✓</h2>
              <p className="font-medium">You can now send direct messages to 5 teachers · Valid for 5 days</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 text-center">
              <h3 className="font-sora font-bold text-navy text-xl mb-4">{5 - queriesUsed} of 5 queries remaining</h3>
              <div className="flex gap-2 justify-center mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-12 h-3 rounded-full ${i <= queriesUsed ? 'bg-slate-200' : 'bg-navy'}`} />
                ))}
              </div>
              <Link to="/student/discover" className="inline-block w-full sm:w-auto px-8 py-3.5 bg-navy text-white rounded-lg font-sora font-bold hover:bg-navy-light transition shadow-sm">
                Find Teachers to Message
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Dummy Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 text-center">
              <h3 className="font-sora font-bold text-xl text-navy">Secure Checkout</h3>
              <p className="text-muted text-sm mt-1">Total to pay: <strong className="text-navy">₹19</strong></p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {['UPI', 'Credit/Debit Card', 'Net Banking'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${paymentMethod === method ? 'border-navy bg-navy/5' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <span className="font-semibold text-sm text-navy">{method}</span>
                    {paymentMethod === method && <i className="fa-solid fa-circle-check text-navy" />}
                  </button>
                ))}
              </div>

              {paymentMethod === 'UPI' && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-navy/70 mb-2 uppercase tracking-wide">Enter UPI ID</label>
                  <input type="text" className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-navy" placeholder="e.g. 9876543210@ybl" />
                </div>
              )}
              {paymentMethod === 'Credit/Debit Card' && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-navy/70 mb-2 uppercase tracking-wide">Card Details</label>
                  <input type="text" className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-navy mb-2" placeholder="Card Number" />
                  <div className="flex gap-2">
                    <input type="text" className="w-1/2 py-2.5 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-navy" placeholder="MM/YY" />
                    <input type="text" className="w-1/2 py-2.5 px-3 border border-slate-200 rounded-md text-sm outline-none focus:border-navy" placeholder="CVV" />
                  </div>
                </div>
              )}

              <button onClick={handlePaymentConfirm} className="w-full py-3.5 bg-success text-white rounded-lg font-sora font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                <i className="fa-solid fa-lock" /> Pay ₹19 Securely
              </button>
              
              <button onClick={() => setShowPaymentModal(false)} className="w-full mt-3 py-2 text-muted text-sm font-medium hover:text-navy transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectQueriesPage;
