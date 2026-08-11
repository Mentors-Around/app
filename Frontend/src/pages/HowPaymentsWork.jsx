import { useState, useEffect } from 'react';
import { Shield, Clock, AlertCircle, CheckCircle, RefreshCw, Layers, DollarSign } from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden mb-3 shadow-xs">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition"
      >
        <span className="font-sora font-semibold text-navy text-base">{question}</span>
        <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 pt-0 text-muted text-sm border-t border-slate-100 mt-2 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
};

const HowPaymentsWork = () => {
  useEffect(() => {
    document.title = 'How Payments Work — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    { 
      q: 'How does the 10% platform commission work?', 
      a: 'TrueEd charges a flat 10% total platform fee. 4% is deposited by the teacher upfront when accepting a student query token, and the remaining 6% is deducted upon successful completion of the course.' 
    },
    { 
      q: 'What happens if a teacher leaves or cancels early?', 
      a: 'If a teacher leaves before 50% course duration (or before 15 days), students get a 100% full refund and 4% is kept as platform commission. If a teacher leaves after 50% duration on a long course, the teacher receives 40%, the student gets a 50% refund, and 14% is retained by the platform.' 
    },
    { 
      q: 'When do teachers receive their payouts?', 
      a: 'For courses longer than 15 days (Case 1), teachers receive 40% after completing 50% of course duration and the remaining 54% upon 100% completion. For courses 15 days or shorter (Case 2), teachers receive 94% upon 100% course completion.' 
    },
    { 
      q: 'Can I pay directly to the teacher?', 
      a: 'To ensure your payment is fully protected by TrueEd Escrow, all payments must go through our platform. Direct payments violate platform policy and forfeit payment protection.' 
    },
    { 
      q: 'Are there any hidden charges?', 
      a: 'No. The amount shown at checkout includes the session fee and 10% platform fee transparency. There are zero hidden fees.' 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-sky-700 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs px-4 py-2 rounded-full mb-6">
            <Shield className="w-4 h-4 text-amber-300" /> 100% Escrow Protection Guaranteed
          </div>
          <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            How Payments &amp; Escrow Work
          </h1>
          <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
            TrueEd protects every rupee using transparent escrow rules. We take a flat <strong>10% platform fee</strong> while securing 100% of student funds until learning milestones are completed.
          </p>
        </div>
      </section>

      {/* Overview Cards: Upfront 4% + 10% Commission */}
      <section className="py-12 px-6 max-w-[1100px] mx-auto -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
              10%
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">Flat 10% Platform Fee</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our overall commission is strictly capped at 10%. The teacher receives 94% net payout upon successful completion.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
              4%
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">Upfront Teacher Commitment</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Teachers deposit 4% immediately upon accepting query tokens to lock in commitment before class starts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
              100%
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">Student Money Safeguard</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full 100% money back guarantee to students if a teacher leaves early or cancels a course.
            </p>
          </div>
        </div>
      </section>

      {/* Case 1 vs Case 2 Payout Breakdown */}
      <section className="py-12 px-6 max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-sora text-3xl font-extrabold text-navy mb-3">Two Simple Payout Cases</h2>
          <p className="text-slate-600 font-medium">Clear milestones based on classroom duration.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CASE 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-sky-100 text-sky-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-4">
                CASE 1: Long Classrooms (&gt; 15 Days)
              </div>
              <h3 className="font-sora text-2xl font-bold text-navy mb-4">Scheduled for More Than 15 Days</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                To maintain trust over extended periods, payouts are released in two milestone installments:
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy text-sm">50% Course Duration Completed:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Teacher receives <strong>40%</strong> of the total course fees.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy text-sm">100% Course Duration Completed:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Teacher receives remaining <strong>54%</strong> of total course fees (Total 94%).</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold text-amber-950 mb-1">If Teacher Leaves Early (&gt; 15 Days):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Before 50% / 15 Days:</strong> Student gets <strong>100% refund</strong>, platform keeps 4%, teacher gets 0%.</li>
                  <li><strong>After 50% Duration:</strong> Teacher keeps <strong>40%</strong>, student gets <strong>50% refund</strong>, platform keeps 14% total.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CASE 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-purple-100 text-purple-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-4">
                CASE 2: Short Classrooms (≤ 15 Days)
              </div>
              <h3 className="font-sora text-2xl font-bold text-navy mb-4">Scheduled for 15 Days or Less</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                For short crash courses and workshops, full payout is settled at completion:
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy text-sm">100% Course Completion:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Teacher receives full <strong>94%</strong> net fees after course completion.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy text-sm">Platform Commission:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Platform retains <strong>10%</strong> commission total (4% upfront + 6% at completion).</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold text-amber-950 mb-1">If Teacher Leaves Early (≤ 15 Days):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Student receives <strong>100% refund</strong> back to their wallet/bank.</li>
                  <li>Platform keeps <strong>4%</strong> commission (taken upfront from teacher deposit).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Timeline Section */}
      <section className="py-12 px-6 max-w-[1100px] mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-sora font-bold text-2xl text-navy text-center mb-8">Course Payout Timeline (Case 1: &gt; 15 Days)</h3>
          
          <div className="relative pt-8 pb-4">
            <div className="absolute top-12 left-6 right-6 h-2 bg-slate-200 rounded-full" />
            <div className="absolute top-12 left-6 w-1/2 h-2 bg-sky-500 rounded-l-full" />
            <div className="absolute top-12 left-1/2 w-1/2 h-2 bg-emerald-500 rounded-r-full" />
            
            <div className="flex justify-between relative z-10">
              <div className="flex flex-col items-center w-1/3">
                <div className="w-7 h-7 bg-sky-500 rounded-full border-4 border-white shadow-md mb-3" />
                <span className="font-bold text-navy text-sm">Day 1</span>
                <span className="text-xs text-slate-500 text-center mt-1">Student Enrolls &amp; Teacher 4% Deposit Charged</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div className="w-7 h-7 bg-amber-500 rounded-full border-4 border-white shadow-md mb-3" />
                <span className="font-bold text-navy text-sm">50% Duration</span>
                <span className="text-xs text-slate-500 text-center mt-1">Teacher Receives <strong>40%</strong> Payout</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div className="w-7 h-7 bg-emerald-500 rounded-full border-4 border-white shadow-md mb-3" />
                <span className="font-bold text-navy text-sm">100% Completion</span>
                <span className="text-xs text-slate-500 text-center mt-1">Teacher Receives Remaining <strong>54%</strong> (Total 94%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-sora text-3xl font-bold text-navy mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-600">Everything you need to know about TrueEd payments and commission.</p>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HowPaymentsWork;
