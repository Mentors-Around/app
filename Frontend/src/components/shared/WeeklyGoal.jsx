const WeeklyGoal = ({ current = 5, target = 8, label = "Sessions This Week" }) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="bg-white rounded-brand p-5 shadow-brand">
      <h3 className="font-sora font-semibold text-navy mb-4">Weekly Goal</h3>
      <div className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-28 h-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#e2e8f0"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#0F2B4D"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-navy font-sora">{current}</span>
            <span className="text-xs text-muted">of {target}</span>
          </div>
        </div>
        <p className="text-sm text-muted font-dm">{label}</p>
        <p className="text-xs text-success font-semibold mt-1">
          {percentage}% Complete
        </p>
      </div>
    </div>
  );
};

export default WeeklyGoal;
