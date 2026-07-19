import ProgressBar from '../shared/ProgressBar';

const WeeklyGoal = () => (
  <div className="bg-white rounded-brand shadow-brand p-6">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-sora font-semibold text-navy">Weekly Goal</h3>
      <span className="text-xs text-muted bg-cream px-2 py-1 rounded-full">This week</span>
    </div>
    <p className="text-sm text-muted mb-4">5 of 7 sessions completed</p>
    <ProgressBar progress={71} />
    <div className="flex items-center justify-between mt-4 text-xs text-muted">
      <span>🔥 7-day streak</span>
      <span className="text-success font-semibold">On track!</span>
    </div>
  </div>
);
export default WeeklyGoal;
