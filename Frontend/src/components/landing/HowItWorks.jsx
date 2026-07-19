const steps = [
  {
    num: 1,
    title: 'Search & Filter',
    desc: 'Find teachers by subject, class, board, and location. See response time and hourly rate upfront.',
  },
  {
    num: 2,
    title: 'Book & Pay Securely',
    desc: 'Pay for the days you need. Teacher gets paid only after class completion.',
  },
  {
    num: 3,
    title: 'Learn & Review',
    desc: "Attend online or offline classes. Report issues in one click. Get instant refunds if teacher doesn't show up.",
  },
];

const HowItWorks = () => (
  <section id="how" className="py-20 px-6">
    <div className="max-w-[1100px] mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">How TrueEd Works</h2>
        <p className="text-muted text-base">From search to first class</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <div key={s.num} className="bg-white border border-slate-200 rounded-brand p-8 text-center hover:-translate-y-1 hover:shadow-brand-lg transition-all duration-200">
            <div className="w-11 h-11 bg-gradient-to-br from-navy to-sky text-white rounded-full flex items-center justify-center font-sora font-bold text-base mx-auto mb-4">
              {s.num}
            </div>
            <h3 className="font-sora text-lg font-semibold mb-2 text-navy">{s.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
export default HowItWorks;
