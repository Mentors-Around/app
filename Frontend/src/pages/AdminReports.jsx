import { useState, useEffect } from 'react';
import { Search, MoreVertical, Eye, FileWarning, Ban, CheckCircle, AlertTriangle, XCircle, ShieldAlert, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getReports();
      const list = Array.isArray(data) ? data : (data?.docs || []);
      const mapped = list.map(r => ({
        id: r._id || r.id,
        reporter: {
          type: r.reporterModel?.toLowerCase() || 'user',
          name: r.reporterId?.name || r.reporter?.name || 'User',
          initials: (r.reporterId?.name || r.reporter?.name || 'U')[0].toUpperCase()
        },
        reportedUser: {
          type: r.reportedUserModel?.toLowerCase() || 'user',
          name: r.reportedUserId?.name || r.reportedUser?.name || 'User',
          initials: (r.reportedUserId?.name || r.reportedUser?.name || 'U')[0].toUpperCase()
        },
        category: r.category || 'General Violation',
        reason: r.description || r.reason || 'No description provided',
        date: r.createdAt || new Date().toISOString(),
        status: r.status ? r.status.toUpperCase() : 'OPEN'
      }));
      setReports(mapped);
    } catch (err) {
      console.warn('Failed to fetch reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Reports — Admin Dashboard";
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.reporter.name.toLowerCase().includes(search.toLowerCase()) || r.reportedUser.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAction = async (id, action) => {
    try {
      if (action === 'RESOLVE' || action === 'WARN' || action === 'SUSPEND') {
        await api.admin.resolveReport(id, { actionTaken: action, note: 'Resolved by admin' });
      } else if (action === 'REJECT') {
        await api.admin.dismissReport(id, { note: 'Dismissed by admin' });
      }
      setReports(reports.map(r => r.id === id ? { ...r, status: 'RESOLVED' } : r));
    } catch (err) {
      alert(err.message || 'Failed to update report status');
    } finally {
      setActiveDropdown(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Reports</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Review and resolve reports submitted by users.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['ALL', 'OPEN', 'RESOLVED'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition \${filter === f ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Reporter</th>
                <th className="p-4">Reported User</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={report.id + '1'} name={report.reporter.name} initials={report.reporter.initials} className="w-8 h-8 text-xs" />
                      <div>
                        <p className="font-bold text-navy text-sm">{report.reporter.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{report.reporter.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={report.id + '2'} name={report.reportedUser.name} initials={report.reportedUser.initials} className="w-8 h-8 text-xs bg-red-100 text-red-700" />
                      <div>
                        <p className="font-bold text-navy text-sm">{report.reportedUser.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{report.reportedUser.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-navy text-sm">{report.category}</p>
                    <p className="text-xs font-medium text-slate-500 truncate max-w-[200px]" title={report.reason}>{report.reason}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-slate-600">{new Date(report.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    {report.status === 'OPEN' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><AlertTriangle className="w-3 h-3"/> Open</span>}
                    {report.status === 'RESOLVED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> Resolved</span>}
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === report.id ? null : report.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === report.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up-sm">
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-400" /> View Details
                          </button>
                          {report.status === 'OPEN' && (
                            <>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button onClick={() => handleAction(report.id, 'RESOLVE')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Resolve Report
                              </button>
                              <button onClick={() => handleAction(report.id, 'WARN')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Warn User
                              </button>
                              <button onClick={() => handleAction(report.id, 'SUSPEND')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Ban className="w-4 h-4" /> Suspend User
                              </button>
                              <button onClick={() => handleAction(report.id, 'REJECT')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> Reject Report
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredReports.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No reports found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
