import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Wallet, RefreshCw, Search, GraduationCap, BookOpen } from 'lucide-react';
import { SUBJECTS } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';

const trustPills = [
  { icon: ShieldCheck, label: 'Verified teachers' },
  { icon: Wallet, label: 'Secure payments' },
  { icon: RefreshCw, label: 'Instant refund' },
];

const steps = [
  { title: 'Discover', desc: 'Browse verified teachers and classrooms by subject, board and city.' },
  { title: 'Send a query', desc: 'Message a teacher directly. They respond within 24 hours.' },
  { title: 'Enroll & learn', desc: 'Pay securely and join live or in-person classes on schedule.' },
];

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const discoverBase = isAuthenticated ? '/student/discover' : '/discover';
    const target = `${discoverBase}${query ? `?subject=${encodeURIComponent(query)}` : ''}`;
    navigate(target);
  };

  return (
    <section className="bg-gradient-to-b from-cream to-cream-warm flex flex-col items-center justify-center pt-24 pb-20 px-6 text-center">
      <div className="max-w-[700px] w-full">
        <h1 className="font-sora font-extrabold leading-[1.1] text-navy mb-4 tracking-tight text-[2.4rem] md:text-[3.6rem]">
          Find your<br />perfect <span className="text-amber">teacher</span>
        </h1>
        <p className="text-muted text-base md:text-lg mb-10">Verified tutors for CBSE, ICSE &amp; State boards. Classes 6-12.</p>

        <form onSubmit={submit} className="flex items-center gap-2 bg-white rounded-2xl shadow-brand p-2 max-w-lg mx-auto mb-8 border border-slate-100">
          <Search size={18} className="text-slate-400 ml-3 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects — e.g. Mathematics, Physics..."
            className="flex-1 py-2 px-2 text-sm focus:outline-none bg-transparent font-semibold"
          />
          <button type="submit" className="bg-navy text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-navy-hover transition shrink-0 cursor-pointer">
            Search
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {trustPills.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 bg-navy/[0.06] px-4 py-2 rounded-full text-xs text-navy font-semibold">
              <Icon size={14} className="text-amber" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

const SubjectStrip = () => {
  const { isAuthenticated } = useAuth();
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-sora text-2xl font-bold text-navy text-center mb-8">Popular subjects</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {SUBJECTS.slice(0, 12).map((s) => (
            <Link
              key={s}
              to={`${isAuthenticated ? '/student/discover' : '/discover'}?subject=${encodeURIComponent(s)}`}
              className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-navy hover:border-navy hover:bg-navy/5 transition"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section className="py-20 px-6 bg-cream/30">
    <div className="max-w-[1100px] mx-auto">
      <h2 className="font-sora text-2xl md:text-3xl font-bold text-navy text-center mb-12">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={s.title} className="bg-white rounded-brand shadow-brand p-6 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-navy text-white font-sora font-bold flex items-center justify-center mx-auto mb-4">
              {i + 1}
            </div>
            <h3 className="font-sora font-bold text-navy mb-2">{s.title}</h3>
            <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ForWhom = () => (
  <section className="py-20 px-6 bg-white">
    <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-navy rounded-brand p-8 text-white shadow-brand">
        <GraduationCap size={28} className="text-amber mb-4" />
        <h3 className="font-sora font-bold text-xl mb-2">For students</h3>
        <p className="text-white/70 text-xs mb-6 leading-relaxed">Query verified teachers, enroll in live or offline classrooms, and track your learning — all in one place.</p>
        <Link to="/signup" className="inline-block bg-amber text-navy font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-amber-hover transition">
          Start learning
        </Link>
      </div>
      <div className="bg-cream rounded-brand p-8 border border-slate-200 shadow-brand">
        <BookOpen size={28} className="text-navy mb-4" />
        <h3 className="font-sora font-bold text-xl text-navy mb-2">For teachers</h3>
        <p className="text-muted text-xs mb-6 leading-relaxed">Build your classroom, set your own schedule and fees, and get paid securely through the platform.</p>
        <Link to="/signup?role=teacher" className="inline-block bg-navy text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-navy-hover transition">
          Start teaching
        </Link>
      </div>
    </div>
  </section>
);

const LandingPage = () => (
  <div className="bg-cream/20">
    <Hero />
    <SubjectStrip />
    <HowItWorks />
    <ForWhom />
  </div>
);

export default LandingPage;
