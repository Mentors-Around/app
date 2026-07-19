import { useEffect, useState } from 'react';

const EarningsChart = ({ earnings }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  const max = Math.max(...earnings.monthlyData.map((d) => d.amount));

  return (
    <div className="bg-white rounded-brand shadow-brand p-5">
      <h3 className="font-sora font-semibold text-navy mb-3">Earnings Overview</h3>
      <div className="flex gap-2 flex-wrap mb-5">
        <span className="text-xs px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">Held: {earnings.held}</span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-sky/10 text-sky font-medium">Released: {earnings.released}</span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">Transferred: {earnings.transferred}</span>
      </div>

      <div className="flex items-end justify-around gap-2 h-[180px] border-b border-slate-100 pb-2">
        {earnings.monthlyData.map((d) => {
          const heightPct = visible ? (d.amount / max) * 100 : 0;
          return (
            <div key={d.month} className="flex flex-col items-center flex-1">
              <span className="text-[0.65rem] font-semibold text-navy mb-1">
                ₹{(d.amount / 1000).toFixed(0)}k
              </span>
              <div
                className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-navy to-sky transition-all duration-700 ease-out"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-around mt-2">
        {earnings.monthlyData.map((d) => (
          <span key={d.month} className="flex-1 text-center text-xs text-muted">{d.month}</span>
        ))}
      </div>
    </div>
  );
};
export default EarningsChart;
