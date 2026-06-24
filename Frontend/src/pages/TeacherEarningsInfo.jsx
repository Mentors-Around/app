import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TeacherEarningsInfo = () => {
  useEffect(() => { document.title = 'Teacher Earnings — TrueEd'; }, []);
  const [rate, setRate] = useState(500);
  const [sessions, setSessions] = useState(10);
  
  // Platform takes 15%, teacher keeps 85%
  const monthlyEarnings = Math.round(rate * sessions * 4 * 0.85);

  return (
    <div>
      {/* Hero */}
      <div className="bg-navy text-white py-20 px-6 text-center">
        <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-4">Earn on Your Own Terms</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">Set your own rates, choose your hours, and keep 85% of what you earn. Teaching has never been more rewarding.</p>
        <Link to="/teacher/verification" className="inline-block py-3.5 px-8 bg-amber text-navy rounded-lg font-sora font-semibold hover:bg-amber-hover transition">
          Apply to Teach
        </Link>
      </div>

      <div className="max-w-[1100px] mx-auto py-16 px-6">
        
        {/* Earnings Calculator */}
        <section className="bg-white rounded-brand shadow-brand-xl p-8 md:p-12 mb-20 border border-slate-100 max-w-3xl mx-auto">
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-8">Estimate Your Earnings</h2>
          
          <div className="space-y-8 mb-10">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-navy">Hourly Rate (₹)</label>
                <span className="font-bold text-sky">₹{rate}/hr</span>
              </div>
              <input type="range" min="200" max="2000" step="50" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-sky" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-navy">Sessions per week</label>
                <span className="font-bold text-sky">{sessions} sessions</span>
              </div>
              <input type="range" min="1" max="40" value={sessions} onChange={e => setSessions(Number(e.target.value))} className="w-full accent-sky" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-6 text-center text-white">
            <p className="text-white/70 text-sm mb-1">Estimated Monthly Earnings</p>
            <p className="font-sora text-4xl font-bold text-amber">₹{monthlyEarnings.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/50 mt-2">*Based on 4 weeks/month after 15% platform fee</p>
          </div>
        </section>

        {/* How earnings work */}
        <section className="mb-20">
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-10">Transparent Payouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-cream p-8 rounded-brand text-center">
              <i className="fa-solid fa-percent text-3xl text-navy mb-4" />
              <h3 className="font-bold text-navy mb-2">85% / 15% Split</h3>
              <p className="text-sm text-muted">You keep exactly 85% of your hourly rate. The 15% covers platform maintenance, marketing, and payment gateway fees.</p>
            </div>
            <div className="bg-cream p-8 rounded-brand text-center">
              <i className="fa-solid fa-building-columns text-3xl text-navy mb-4" />
              <h3 className="font-bold text-navy mb-2">Weekly Bank Transfers</h3>
              <p className="text-sm text-muted">Earnings are automatically transferred to your bank account or UPI ID every Tuesday.</p>
            </div>
            <div className="bg-cream p-8 rounded-brand text-center">
              <i className="fa-solid fa-file-invoice text-3xl text-navy mb-4" />
              <h3 className="font-bold text-navy mb-2">Tax Compliant</h3>
              <p className="text-sm text-muted">Download automated invoice summaries and TDS certificates directly from your dashboard.</p>
            </div>
          </div>
        </section>

        {/* Top Earners */}
        <section>
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-10">Teacher Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Kavita Verma', subj: 'Mathematics', city: 'Delhi', earn: '₹45,000/mo' },
              { name: 'Arun Singh', subj: 'Physics (JEE)', city: 'Kota', earn: '₹82,000/mo' },
              { name: 'Sneha R', subj: 'English', city: 'Bangalore', earn: '₹35,000/mo' }
            ].map(t => (
              <div key={t.name} className="border border-slate-200 p-6 rounded-brand flex items-start gap-4 hover:shadow-brand transition">
                <div className="w-12 h-12 bg-sky/10 text-sky rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {t.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-navy">{t.name}</h4>
                  <p className="text-xs text-muted mb-2">{t.subj} · {t.city}</p>
                  <p className="text-sm font-semibold text-success">{t.earn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
export default TeacherEarningsInfo;
