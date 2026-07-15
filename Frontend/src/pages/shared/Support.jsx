import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Mail, Phone, MessageSquare, Headphones } from 'lucide-react';
import userService from '@/services/user.service';
import Spinner from '@/components/shared/Spinner';
import PublicLayout from '@/layouts/PublicLayout';

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${open ? 'border-navy/30 shadow-brand-sm' : 'border-slate-200'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-5 text-left bg-white hover:bg-slate-50/50 transition"
        aria-expanded={open}
      >
        <span className="font-sora font-semibold text-navy text-sm pr-4">{question}</span>
        {open ? (
          <ChevronUp size={16} className="text-navy shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white border-t border-slate-100">
          <p className="text-sm text-slate-600 font-medium leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
};

const Support = () => {
  const [supportData, setSupportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Help & Support — TrueEd';
    userService.getSupport()
      .then(({ data }) => setSupportData(data?.data ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback FAQ if API doesn't return structured data
  const fallbackFAQs = [
    {
      category: 'Getting Started',
      items: [
        { q: 'How do I sign up as a student?', a: 'Click "Sign Up" on the homepage, choose "Student", and follow the OTP verification process for your phone and email.' },
        { q: 'How do I sign up as a teacher?', a: 'Click "Become a Teacher" and complete your profile and KYC verification. Our team reviews applications within 2–3 business days.' },
        { q: 'Is TrueEd free to use?', a: 'Signing up is free. Students purchase query tokens (₹19 for 3 tokens) to send enrollment queries to teachers.' },
      ],
    },
    {
      category: 'Payments & Wallet',
      items: [
        { q: 'What are query tokens?', a: 'Query tokens are used to send enrollment requests to teachers. Each query costs 1 token. Tokens are ₹19 for a pack of 3.' },
        { q: 'How do I add cash to my wallet?', a: 'Go to Wallet & Payments in your dashboard and click "Deposit Cash". You can pay via UPI, cards, or netbanking through our secure Razorpay checkout.' },
        { q: 'How long do teacher payouts take?', a: 'Teacher earnings are held in escrow during the classroom month. Payouts are processed within 3–5 business days after classroom completion.' },
        { q: 'What is the teacher security deposit?', a: 'Teachers place a 4% security deposit when accepting a student enrollment query. This is refunded after the classroom completes successfully.' },
      ],
    },
    {
      category: 'Classrooms',
      items: [
        { q: 'How do I enroll in a classroom?', a: 'Use the Discover page to find a classroom, send an enrollment query (costs 1 token), and wait for the teacher to accept. Then complete your enrollment payment.' },
        { q: 'Can I get a refund?', a: 'Refunds are available if the teacher abandons the course or there is significant non-delivery. See our Refund Policy for full details.' },
        { q: 'What happens if a teacher misses classes?', a: 'You can file a report against the teacher. Our admin team reviews all reports within 24–48 hours and takes appropriate action.' },
      ],
    },
    {
      category: 'For Teachers',
      items: [
        { q: 'What does KYC verification involve?', a: 'We require a valid Aadhaar and professional documents. KYC is reviewed by our admin team within 2–3 business days.' },
        { q: 'How much can I earn?', a: 'You set your own fees. TrueEd charges a platform fee. Payouts are processed to your linked bank account after classroom completion.' },
        { q: 'Can I set my own schedule?', a: 'Yes. When creating a classroom, you define the schedule slots, start/end dates, and maximum number of students.' },
      ],
    },
    {
      category: 'Safety & Trust',
      items: [
        { q: 'How does TrueEd verify teachers?', a: 'All teachers go through a multi-step KYC process including identity verification, qualification documents, and admin review.' },
        { q: 'What if a student misbehaves?', a: 'Teachers can file a report against students from the classroom context. All reports are reviewed by our admin team confidentially.' },
        { q: 'Is my payment information safe?', a: 'Yes. All payments are processed through Razorpay — a PCI-DSS compliant payment gateway. TrueEd never stores your card details.' },
      ],
    },
  ];

  const faqCategories = supportData?.faqs ?? fallbackFAQs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky/5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-hover to-sky/80 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Headphones size={32} className="text-white" />
          </div>
          <h1 className="font-sora text-4xl font-extrabold mb-3">Help & Support</h1>
          <p className="text-sky/80 text-lg font-medium">
            Find answers to common questions, or reach out to our team.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-14">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {[
            {
              icon: Mail,
              label: 'Email Support',
              value: supportData?.email || 'support@trued.in',
              sub: 'We reply within 24 hours',
              href: `mailto:${supportData?.email || 'support@trued.in'}`,
              color: 'text-navy',
              bg: 'bg-navy/5 hover:bg-navy/10',
            },
            {
              icon: Phone,
              label: 'Phone Support',
              value: supportData?.phone || '+91 1800-XXX-XXXX',
              sub: 'Mon–Sat, 9 AM – 7 PM IST',
              href: `tel:${supportData?.phone || ''}`,
              color: 'text-sky',
              bg: 'bg-sky/5 hover:bg-sky/10',
            },
            {
              icon: MessageSquare,
              label: 'WhatsApp Chat',
              value: 'Chat with us',
              sub: 'Instant support',
              href: `https://wa.me/${supportData?.whatsapp || ''}`,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 hover:bg-emerald-100',
            },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${c.bg} rounded-xl p-5 flex flex-col items-center text-center border border-transparent hover:border-slate-200 transition`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3`}>
                <c.icon size={18} className={c.color} />
              </div>
              <p className="font-sora font-bold text-navy text-sm mb-1">{c.label}</p>
              <p className={`text-xs font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.sub}</p>
            </a>
          ))}
        </div>

        {/* FAQs */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-10">
            <h2 className="font-sora text-2xl font-extrabold text-navy text-center">
              Frequently Asked Questions
            </h2>
            {faqCategories.map((cat, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="flex-1 h-px bg-slate-200" />
                  {cat.category}
                  <span className="flex-1 h-px bg-slate-200" />
                </h3>
                <div className="space-y-3">
                  {(cat.items || cat.faqs || []).map((item, i) => (
                    <FAQItem key={i} question={item.q || item.question} answer={item.a || item.answer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
