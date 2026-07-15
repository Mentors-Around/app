// src/components/shared/StatCard.jsx
// Generic metric card used on all dashboards.
// Accepts a Lucide icon component or a plain ReactNode for the icon slot.
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, trend }) => (
  <div className="bg-white rounded-brand shadow-brand p-4 lg:p-5 flex items-center gap-4 hover-lift">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {Icon && <Icon size={22} className={iconColor} />}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide truncate">{label}</p>
      <p className="font-sora text-xl font-extrabold text-navy mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-[11px] font-bold mt-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-error'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </p>
      )}
    </div>
  </div>
);

export default StatCard;
