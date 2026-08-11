const stats = [
  { value: '100%', label: 'Verified Teachers' },
  { value: '₹0', label: 'Hidden Fees' },
  { value: '12hr', label: 'Admin Response' },
  { value: '10%', label: 'Platform Fee' },
];

const TrustStats = () => (
  <section className="bg-white py-12 px-6 border-t border-slate-200">
    <div className="max-w-[900px] mx-auto flex justify-around items-center flex-wrap gap-8">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="font-sora text-3xl font-extrabold text-navy">{s.value}</div>
          <div className="text-sm text-muted font-medium mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  </section>
);
export default TrustStats;
