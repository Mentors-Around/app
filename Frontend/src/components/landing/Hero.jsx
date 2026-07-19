import SearchBar from './SearchBar';

const Hero = () => {
  const trustPills = [
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
      label: 'Verified Teachers',
    },
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>,
      label: 'Secure Payments',
    },
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>,
      label: 'Instant Refund',
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-b from-cream to-cream-warm flex flex-col items-center justify-center pt-36 pb-20 px-6 text-center relative overflow-hidden hero-glow-right hero-glow-left">
      <div className="relative z-10 max-w-[700px] w-full">
        <h1 className="font-sora font-extrabold leading-[1.1] text-navy mb-4 tracking-tight text-[2.4rem] md:text-[3.6rem]">
          Find your<br />perfect <span className="text-amber">teacher</span>
        </h1>
        <p className="text-muted text-lg mb-12">
          Verified tutors for CBSE, ICSE &amp; State boards.
        </p>

        <SearchBar />

        {/* Trust pills */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {trustPills.map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-2 bg-navy/[0.06] px-4 py-2 rounded-full text-sm text-navy font-medium">
              <svg className="w-3.5 h-3.5 text-amber" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {icon}
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Hero;
