import { useState, useEffect } from 'react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition"
      >
        <span className="font-sora font-semibold text-navy">{question}</span>
        <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 pt-0 text-muted text-sm border-t border-slate-100 mt-2">
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
    { q: 'What happens if the teacher cancels the class?', a: 'If a teacher cancels or does not show up, your money is completely safe. Report the issue from your dashboard within 12 hours, and we will process a 100% refund immediately.' },
    { q: 'Can I pay directly to the teacher?', a: 'To ensure your payment is protected by TrueEd escrow, all payments must go through our secure platform. Direct payments are against our policy and forfeit payment protection.' },
    { q: 'How do I request a refund?', a: 'Go to your Bookings tab, select the specific class, and click "Report Issue / Request Refund". Provide a brief reason, and our admin team will resolve it within 12 hours.' },
    { q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit cards, Net Banking, and major mobile wallets through our secure payment gateway.' },
    { q: 'Are there any hidden charges?', a: 'No. The amount you see at checkout (Session fee + 15% platform fee + ₹19 access fee) is exactly what you pay. There are zero hidden costs.' }
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy to-sky text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber/20 border border-amber/30 text-amber font-bold text-xs px-4 py-2 rounded-full mb-6">
            <i className="fa-solid fa-shield-halved" /> Payment Protection Included
          </div>
          <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Your Money is Always Safe
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            TrueEd uses a secure escrow system. We hold your payment safely and only release it to the teacher once your learning is delivered as promised.
          </p>
        </div>
      </section>

      {/* Escrow Visual Flow */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-4">How TrueEd Escrow Works</h2>
        <p className="text-muted mb-16">A simple, transparent process to protect both students and teachers.</p>
        
        <div className="flex flex-col md:flex-row items-center justify-between relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-slate-200 -z-10 -translate-y-1/2" />
          
          <div className="bg-white w-64 p-6 rounded-brand shadow-brand border border-slate-200 z-10 mb-8 md:mb-0 relative">
            <div className="w-14 h-14 bg-sky/10 text-sky rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fa-solid fa-credit-card" />
            </div>
            <h3 className="font-sora font-bold text-navy mb-2">1. Student Pays</h3>
            <p className="text-xs text-muted">You book a class and pay securely through our platform.</p>
          </div>

          <div className="bg-navy w-64 p-6 rounded-brand shadow-brand z-10 mb-8 md:mb-0 transform md:scale-110 relative">
            <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-white/20">
              <i className="fa-solid fa-lock" />
            </div>
            <h3 className="font-sora font-bold text-white mb-2">2. TrueEd Holds</h3>
            <p className="text-xs text-white/70">Funds are locked securely in our escrow account.</p>
          </div>

          <div className="bg-white w-64 p-6 rounded-brand shadow-brand border border-slate-200 z-10 relative">
            <div className="w-14 h-14 bg-green-50 text-success rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fa-solid fa-hand-holding-dollar" />
            </div>
            <h3 className="font-sora font-bold text-navy mb-2">3. Teacher Gets Paid</h3>
            <p className="text-xs text-muted">Money is released only after the class is completed.</p>
          </div>
        </div>
      </section>

      {/* Payment Release Rules */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-sora text-3xl font-bold text-navy mb-6">Payment Release Rules</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-sky/10 text-sky rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                  <i className="fa-solid fa-laptop" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-lg">For Online Sessions</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    Money is held securely for <strong>24 hours</strong> after each class finishes. If the student raises no dispute, the funds are automatically released to the teacher.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber/10 text-amber-700 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                  <i className="fa-solid fa-house-user" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-lg">For Offline/Monthly Courses</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    To protect both parties over long commitments, <strong>40%</strong> is released to the teacher after 15 days, and the remaining <strong>60%</strong> is released upon course completion.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                  <i className="fa-solid fa-arrow-rotate-left" />
                </div>
                <div>
                  <h3 className="font-bold text-error text-lg">Refund Policy</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    If the teacher doesn't show up or leaves early, report it within <strong>12 hours</strong>. Our admin team will review and process a full refund within <strong>12 hours</strong> of reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visual Timeline */}
          <div className="bg-slate-50 p-8 rounded-brand border border-slate-200">
            <h3 className="font-sora font-bold text-navy text-center mb-8">Monthly Booking Timeline</h3>
            <div className="relative pt-6 pb-2">
              <div className="absolute top-10 left-4 right-4 h-1.5 bg-slate-200 rounded-full" />
              <div className="absolute top-10 left-4 w-1/2 h-1.5 bg-sky rounded-l-full" />
              <div className="absolute top-10 left-1/2 w-1/2 h-1.5 bg-amber rounded-r-full" />
              
              <div className="flex justify-between relative z-10">
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-5 h-5 bg-sky rounded-full border-4 border-white shadow-sm mb-3" />
                  <span className="font-bold text-navy text-sm">Day 1</span>
                  <span className="text-[10px] text-muted text-center mt-1">Student pays full amount</span>
                </div>
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-5 h-5 bg-amber rounded-full border-4 border-white shadow-sm mb-3" />
                  <span className="font-bold text-navy text-sm">Day 15</span>
                  <span className="text-[10px] text-muted text-center mt-1">Teacher receives 40%</span>
                </div>
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm mb-3" />
                  <span className="font-bold text-navy text-sm">Course End</span>
                  <span className="text-[10px] text-muted text-center mt-1">Teacher receives 60%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-brand shadow-sm border-t-4 border-t-red-400">
            <i className="fa-solid fa-calendar-xmark text-3xl text-red-400 mb-4" />
            <h3 className="font-bold text-navy mb-2">No Show, Full Refund</h3>
            <p className="text-sm text-muted">If the class doesn't happen due to the teacher, you get your money back instantly.</p>
          </div>
          <div className="bg-white p-8 rounded-brand shadow-sm border-t-4 border-t-sky">
            <i className="fa-solid fa-lock text-3xl text-sky mb-4" />
            <h3 className="font-bold text-navy mb-2">Secure Gateway</h3>
            <p className="text-sm text-muted">Bank-grade encryption ensures your card details and payments are always protected.</p>
          </div>
          <div className="bg-white p-8 rounded-brand shadow-sm border-t-4 border-t-amber">
            <i className="fa-solid fa-file-invoice-dollar text-3xl text-amber mb-4" />
            <h3 className="font-bold text-navy mb-2">No Hidden Charges</h3>
            <p className="text-sm text-muted">What you see is what you pay. We maintain 100% transparency on platform fees.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl font-bold text-navy mb-4">Frequently Asked Questions</h2>
            <p className="text-muted">Everything you need to know about payments and refunds.</p>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowPaymentsWork;
