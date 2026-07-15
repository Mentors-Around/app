import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  Star
} from 'lucide-react';

const TeacherBecome = () => {
  const [hourlyRate, setHourlyRate] = useState(500);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(10);
  const [openFaq, setOpenFaq] = useState(null);

  const monthlyIncome = hourlyRate * sessionsPerWeek * 4;

  const faqs = [
    { q: "Do I need a degree?", a: "While a degree is preferred for academic subjects, we also welcome experts with practical experience in their respective fields." },
    { q: "How do I get paid?", a: "Payments are processed securely and sent directly to your linked bank account on a weekly basis." },
    { q: "Can I set my own schedule?", a: "Absolutely! You have full control over your availability and can accept or decline session requests as you see fit." },
    { q: "What subjects can I teach?", a: "We offer a wide range of subjects from K-12 academics to competitive exam prep, language learning, and professional skills." },
    { q: "How does verification work?", a: "We review your submitted documents (ID, qualifications) and conduct a brief introductory call to ensure quality and safety on our platform." }
  ];

  return (
    <div className="min-h-screen bg-page font-inter">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-navy tracking-tight mb-4">
          Turn Your Knowledge Into Income <span className="inline-block animate-bounce">🎓</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted mx-auto mb-8">
          Join 500+ verified teachers earning on TrueEd. Share your expertise, set your own rates, and teach from anywhere.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/teacher/apply" className="w-full sm:w-auto px-8 py-3 text-lg font-bold rounded-xl text-white bg-navy hover:bg-navy-hover transition shadow-lg">
            Apply Now
          </Link>
          <Link to="/teacher/earnings-info" className="w-full sm:w-auto px-8 py-3 text-lg font-bold rounded-xl text-navy bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm">
            Learn About Earnings
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-navy mb-12">Why Teach with TrueEd?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-sky/10 rounded-2xl">
              <div className="w-12 h-12 bg-sky/20 rounded-full flex items-center justify-center mb-4 text-sky font-bold">
                <span className="text-2xl">₹</span>
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Set Your Own Rate</h3>
              <p className="text-sm text-muted">You decide how much your time is worth. Adjust your rates anytime.</p>
            </div>
            <div className="p-6 bg-emerald-500/10 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Work From Anywhere</h3>
              <p className="text-sm text-muted">Teach online from the comfort of your home or choose offline sessions.</p>
            </div>
            <div className="p-6 bg-navy/10 rounded-2xl">
              <div className="w-12 h-12 bg-navy/20 rounded-full flex items-center justify-center mb-4 text-navy font-bold">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Get Verified Badge</h3>
              <p className="text-sm text-muted">Stand out to students with our trusted verified teacher badge.</p>
            </div>
            <div className="p-6 bg-amber/10 rounded-2xl">
              <div className="w-12 h-12 bg-amber/20 rounded-full flex items-center justify-center mb-4 text-amber-hover font-bold">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Weekly Payouts</h3>
              <p className="text-sm text-muted">Reliable, automated weekly transfers directly to your bank account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-cream/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-navy mb-16">How It Works</h2>
          <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-4">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-slate-200 z-0"></div>
            
            {['Create Profile', 'Get Verified', 'Start Teaching'].map((step, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center text-center w-full md:w-1/3">
                <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-lg border-4 border-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{step}</h3>
                <p className="text-sm text-muted max-w-xs px-2">
                  {index === 0 && "Fill out our simple application form with your details and teaching preferences."}
                  {index === 1 && "Upload necessary documents and complete a quick verification call with our team."}
                  {index === 2 && "Go live on the platform, accept student requests, and start earning."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who can join */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-navy mb-8">Who Can Join?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['School Teachers', 'College Professors', 'Working Professionals', 'Freelance Tutors', 'Skill Experts'].map((type, i) => (
              <span key={i} className="px-6 py-2 bg-cream text-navy rounded-full font-bold border border-slate-200 text-base hover:bg-cream-warm transition">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Potential */}
      <section className="py-16 bg-navy text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 font-sora">Calculate Your Earnings Potential</h2>
          <p className="text-white/70 text-center mb-12">See how much you could earn by teaching on TrueEd.</p>
          
          <div className="bg-white rounded-3xl p-8 shadow-brand-lg text-navy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-bold text-slate-700">Hourly Rate (₹)</label>
                    <span className="font-bold text-sky">₹{hourlyRate}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" max="2000" step="50" 
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-bold text-slate-700">Sessions per Week</label>
                    <span className="font-bold text-sky">{sessionsPerWeek}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="40" 
                    value={sessionsPerWeek} 
                    onChange={(e) => setSessionsPerWeek(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky"
                  />
                </div>
              </div>
              
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-500 font-semibold mb-2">Estimated Monthly Income</p>
                <h3 className="text-4xl md:text-5xl font-extrabold text-navy mb-2 font-sora">
                  ₹{monthlyIncome.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400">*Based on 4 weeks per month. Actual earnings may vary.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-cream/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-navy mb-12">Hear From Our Teachers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Anita Sharma", role: "Math Tutor", text: "TrueEd allowed me to transition from a stressful school job to teaching on my own terms. The flexibility is amazing." },
              { name: "Rahul Verma", role: "Coding Instructor", text: "I teach Python on weekends. The students are eager to learn, and the extra income has been a game changer for my family." },
              { name: "Priya Desai", role: "Language Expert", text: "The verified badge really helps attract serious students. I love the platform's ease of use and prompt weekly payouts." }
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-brand border border-slate-100">
                <div className="flex text-amber mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                </div>
                <p className="text-sm text-slate-600 italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky/10 rounded-full flex items-center justify-center text-sky font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-navy mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  className="w-full px-6 py-4 text-left font-bold text-navy bg-slate-50 hover:bg-slate-100 flex justify-between items-center transition"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {faq.q}
                  {openFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-navy to-navy-light text-white text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 font-sora">Ready to start teaching?</h2>
        <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">Join our community of passionate educators and start making a difference today.</p>
        <Link to="/teacher/apply" className="inline-block px-10 py-4 text-base font-bold rounded-xl text-navy bg-white hover:bg-slate-50 transition shadow-xl">
          Apply Now
        </Link>
      </section>
    </div>
  );
};

export default TeacherBecome;
