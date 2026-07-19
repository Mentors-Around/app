import { useEffect, useState } from 'react';
import { Users, GraduationCap, MonitorPlay, ShieldAlert, AlertTriangle, IndianRupee, TrendingUp, Activity, Clock, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    teachersCount: 0,
    studentsCount: 0,
    classroomsCount: 0,
    pendingKycCount: 0,
    pendingReportsCount: 0,
    pendingWithdrawalsCount: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });
  const [revenueGraphData, setRevenueGraphData] = useState([
    { name: 'Jan', revenue: 0 },
    { name: 'Feb', revenue: 0 },
    { name: 'Mar', revenue: 0 },
    { name: 'Apr', revenue: 0 },
    { name: 'May', revenue: 0 },
    { name: 'Jun', revenue: 0 },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin Dashboard — TrueEd";

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.admin.getStats();
        if (res) {
          const teacherObj = res.userStats?.find(u => u._id === 'teacher');
          const studentObj = res.userStats?.find(u => u._id === 'student');
          const totalClassrooms = res.classroomStats?.reduce((acc, c) => acc + (c.count || 0), 0) || 0;
          const totalRevenuePaise = res.paymentStats?.reduce((acc, p) => acc + (p.totalPaise || 0), 0) || 0;
          const totalRevenueRupees = Math.round(totalRevenuePaise / 100);

          setStats({
            teachersCount: teacherObj ? teacherObj.count : (res.teachersCount ?? 0),
            studentsCount: studentObj ? studentObj.count : (res.studentsCount ?? 0),
            classroomsCount: totalClassrooms,
            pendingKycCount: res.pendingKycCount || 0,
            pendingReportsCount: res.openReportsCount || 0,
            pendingWithdrawalsCount: res.pendingWithdrawalsCount || 0,
            todayRevenue: res.todayRevenue || 0,
            monthlyRevenue: totalRevenueRupees,
          });

          if (res.monthlyRevenueTrend && Array.isArray(res.monthlyRevenueTrend)) {
            setRevenueGraphData(res.monthlyRevenueTrend);
          } else {
            setRevenueGraphData([
              { name: 'Jan', revenue: 0 },
              { name: 'Feb', revenue: 0 },
              { name: 'Mar', revenue: 0 },
              { name: 'Apr', revenue: 0 },
              { name: 'May', revenue: 0 },
              { name: 'Jun', revenue: 0 },
            ]);
          }
        }

        // Fetch recent reports / activities if available
        try {
          const reportsData = await api.admin.getReports();
          const reportsList = Array.isArray(reportsData) ? reportsData : (reportsData?.docs || []);
          const activities = reportsList.map(r => ({
            id: r._id,
            type: 'report',
            user: r.reporter?.name || 'User',
            action: `submitted a report (${r.category || 'Issue'})`,
            time: new Date(r.createdAt || Date.now()).toLocaleDateString(),
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-50'
          }));
          setRecentActivities(activities);
        } catch {
          setRecentActivities([]);
        }

      } catch (err) {
        console.warn('Failed to load admin stats from backend:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Teachers,${stats.teachersCount}\n`
      + `Total Students,${stats.studentsCount}\n`
      + `Total Classrooms,${stats.classroomsCount}\n`
      + `Pending KYC,${stats.pendingKycCount}\n`
      + `Pending Reports,${stats.pendingReportsCount}\n`
      + `Pending Withdrawals,${stats.pendingWithdrawalsCount}\n`
      + `Today Revenue (INR),${stats.todayRevenue}\n`
      + `Monthly Revenue (INR),${stats.monthlyRevenue}\n`
      + `Report Generated Date,${new Date().toLocaleString()}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trueed_platform_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm flex items-center gap-2"
        >
          <Activity className="w-4 h-4" /> Download Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teachers</p>
            <p className="text-2xl font-bold text-navy">{stats.teachersCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
            <p className="text-2xl font-bold text-navy">{stats.studentsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <MonitorPlay className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Classrooms</p>
            <p className="text-2xl font-bold text-navy">{stats.classroomsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending KYC</p>
            <p className="text-2xl font-bold text-navy">{stats.pendingKycCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Reports</p>
            <p className="text-2xl font-bold text-navy">{stats.pendingReportsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-navy">{stats.pendingWithdrawalsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Revenue</p>
            <p className="text-2xl font-bold text-navy">₹{stats.todayRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-navy">₹{stats.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora text-lg font-bold text-navy">Monthly Revenue</h2>
            <select className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGraphData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora text-lg font-bold text-navy">Recent Activity</h2>
            <button className="text-sm font-bold text-sky hover:text-navy transition">View All</button>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-6">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${activity.bg} flex items-center justify-center shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-navy font-medium">
                      <span className="font-bold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-medium text-sm">
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
