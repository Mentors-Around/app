import { useEffect } from 'react';
import { IndianRupee, Users, GraduationCap, MonitorPlay, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockGrowthData = [
  { name: 'Week 1', students: 400, teachers: 20 },
  { name: 'Week 2', students: 800, teachers: 45 },
  { name: 'Week 3', students: 1200, teachers: 70 },
  { name: 'Week 4', students: 1900, teachers: 95 },
  { name: 'Week 5', students: 2500, teachers: 130 },
  { name: 'Week 6', students: 2845, teachers: 142 },
];

export default function AdminAnalytics() {
  useEffect(() => { document.title = "Analytics — Admin Dashboard"; }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Analytics</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Platform growth and key performance indicators.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <IndianRupee className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-navy mb-2">₹4.2L</p>
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4" /> +12% this month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Teachers</p>
          <p className="text-3xl font-bold text-navy mb-2">42</p>
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4" /> +5% this month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap className="w-16 h-16 text-sky-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Students</p>
          <p className="text-3xl font-bold text-navy mb-2">456</p>
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4" /> +18% this month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MonitorPlay className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Enrollments</p>
          <p className="text-3xl font-bold text-navy mb-2">1,204</p>
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4" /> +22% this month
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-sora text-lg font-bold text-navy">User Growth (Last 6 Weeks)</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-sky-500"></div> Students
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Teachers
            </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockGrowthData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="students" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              <Area type="monotone" dataKey="teachers" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorTeachers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
