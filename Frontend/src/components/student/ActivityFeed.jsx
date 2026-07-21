import { Activity, CreditCard, Eye, Send, LogIn, Loader2 } from 'lucide-react';

export default function ActivityFeed({ activities, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm h-32 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-navy animate-spin" />
      </div>
    );
  }

  const list = activities && activities.length > 0 ? activities : [];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ENROLLMENT': return <LogIn className="w-4 h-4 text-purple-500" />;
      case 'QUERY': return <Send className="w-4 h-4 text-blue-500" />;
      case 'PAYMENT': return <CreditCard className="w-4 h-4 text-emerald-500" />;
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
        {list.length > 0 ? (
          list.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <p className="font-semibold text-slate-700">{activity.title}</p>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recently'}
              </span>
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
