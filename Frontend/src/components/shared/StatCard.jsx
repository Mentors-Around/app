import { useEffect, useState } from 'react';

const StatCard = ({ icon, iconBg, iconColor, label, value }) => {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const t = setTimeout(() => setDisplay(String(value)), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="bg-white rounded-brand shadow-brand p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`${icon} ${iconColor} text-lg`} />
      </div>
      <div>
        <div className="font-sora font-extrabold text-2xl text-navy leading-none">{display}</div>
        <div className="text-xs text-muted mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
};
export default StatCard;
