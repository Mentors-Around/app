import { useEffect, useState } from 'react';

const StatCard = ({ icon, iconBg, iconColor, label, value }) => {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const t = setTimeout(() => setDisplay(String(value)), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="bg-white rounded-brand shadow-brand p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`${icon} ${iconColor} text-base sm:text-lg`} />
      </div>
      <div className="min-w-0">
        <div className="font-sora font-extrabold text-xl sm:text-2xl text-navy leading-none truncate">{display}</div>
        <div className="text-xs text-muted mt-0.5 font-medium truncate">{label}</div>
      </div>
    </div>
  );
};
export default StatCard;
