import { Activity, CreditCard, Eye, Send, LogIn } from 'lucide-react';

export default function ActivityFeed() {
  const mockActivities = [
    { id: 1, type: 'viewed', text: 'Viewed Physics Classroom', time: 'Just now' },
    { id: 2, type: 'sent', text: 'Sent Query to Alex Johnson', time: '3 hours ago' },
    { id: 3, type: 'payment', text: 'Payment Completed for Mathematics', time: '1 day ago' },
    { id: 4, type: 'joined', text: 'Joined Mathematics Classroom', time: '1 day ago' },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'viewed': return <Eye className="w-4 h-4 text-slate-500" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'joined': return <LogIn className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sora font-bold text-slate-900 text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-500" />
          Recent Activity
        </h3>
      </div>
      
      <div className="space-y-4">
        {mockActivities.length > 0 ? (
          mockActivities.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <p className="font-semibold text-slate-700">{activity.text}</p>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{activity.time}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm font-medium text-slate-500">No recent activity.</p>
          </div>
        )}
      </div>
    </div>
  );
}
