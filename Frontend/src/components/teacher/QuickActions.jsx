const actions = [
  { icon: 'fa-solid fa-calendar-plus', label: 'Add Availability', bg: 'bg-sky/10', color: 'text-sky' },
  { icon: 'fa-solid fa-video', label: 'Start Live Class', bg: 'bg-success/10', color: 'text-success' },
  { icon: 'fa-solid fa-upload', label: 'Upload Material', bg: 'bg-amber/10', color: 'text-amber' },
];

const QuickActions = () => (
  <div className="bg-white rounded-brand shadow-brand p-5">
    <h3 className="font-sora font-semibold text-navy mb-4">Quick Actions</h3>
    <div className="space-y-1">
      {actions.map((a) => (
        <button onClick={() => console.log('clicked')} key={a.label} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-cream transition text-left">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${a.bg}`}>
            <i className={`${a.icon} ${a.color}`} />
          </div>
          <span className="text-sm font-medium text-navy">{a.label}</span>
          <i className="fa-solid fa-chevron-right text-xs text-muted ml-auto" />
        </button>
      ))}
    </div>
  </div>
);
export default QuickActions;
