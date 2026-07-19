import { useState, useEffect } from 'react';
import { Search, MoreVertical, CheckCircle2, XCircle, AlertCircle, Eye, ShieldAlert, GraduationCap, FileWarning, Ban, CheckCircle, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllTeachers();
      const list = Array.isArray(data) ? data : (data?.docs || data?.results || []);
      const mapped = list.map(item => {
        const u = item.userId || item.user || item;
        return {
          id: u._id || item._id,
          teacherId: u._id || item._id,
          name: u.name || item.name || 'Teacher',
          initials: (u.name || item.name || 'T')[0].toUpperCase(),
          email: u.email || item.email || 'N/A',
          phone: u.phone || 'N/A',
          verified: item.verificationStatus === 'approved' || u.kycStatus === 'approved',
          kycStatus: (item.verificationStatus || u.kycStatus || 'APPROVED').toUpperCase(),
          activeClassrooms: item.stats?.totalClassrooms ?? (item.classroomsCount ?? 0),
          walletBalance: item.walletRupees ?? ((item.walletPaise || 0) / 100),
          rating: item.stats?.avgRating || 0,
          bio: item.bio || 'No bio provided.',
          experience: item.experienceYears ? `${item.experienceYears} Years` : 'N/A',
          status: u.isBanned || u.isActive === false ? 'suspended' : 'active'
        };
      });
      setTeachers(mapped);
    } catch (err) {
      console.warn('Failed to fetch teachers from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Teachers — Admin Dashboard";
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id) => {
    const target = teachers.find(t => t.id === id);
    try {
      if (target?.status === 'active') {
        await api.admin.suspendTeacher(id, 'Admin suspension');
      } else {
        await api.admin.unbanUser(id);
      }
      setTeachers(teachers.map(t => {
        if (t.id === id) {
          return { ...t, status: t.status === 'active' ? 'suspended' : 'active' };
        }
        return t;
      }));
    } catch (err) {
      alert(err.message || 'Failed to update teacher status');
    } finally {
      setActiveDropdown(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Teachers</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage all registered teachers on TrueEd.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Teacher</th>
                <th className="p-4">KYC Status</th>
                <th className="p-4">Classrooms</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={teacher.id} name={teacher.name} initials={teacher.initials} className="w-10 h-10 text-sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-navy text-sm">{teacher.name}</p>
                          {teacher.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <p className="text-xs font-medium text-slate-500">{teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {(teacher.kycStatus === 'APPROVED' || teacher.kycStatus === 'VERIFIED') && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
                    {teacher.kycStatus === 'PENDING' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><ShieldAlert className="w-3 h-3"/> Pending</span>}
                    {teacher.kycStatus === 'REJECTED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3"/> Rejected</span>}
                    {teacher.kycStatus === 'NOT_VERIFIED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase"><AlertCircle className="w-3 h-3"/> Unverified</span>}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-navy text-sm">{teacher.activeClassrooms}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-navy text-sm flex items-center gap-1">
                      {teacher.rating > 0 ? (
                        <><span className="text-amber-500">★</span> {teacher.rating}</>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${teacher.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === teacher.id ? null : teacher.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === teacher.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up-sm">
                          <button 
                            onClick={() => { setSelectedTeacher(teacher); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4 text-slate-400" /> View Account Details
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          {teacher.status === 'active' ? (
                            <button onClick={() => toggleStatus(teacher.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Ban className="w-4 h-4" /> Suspend Teacher
                            </button>
                          ) : (
                            <button onClick={() => toggleStatus(teacher.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Activate Teacher
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTeachers.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No teachers found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slide-up-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sora text-lg font-bold text-navy">Teacher Account Overview</h3>
              <button 
                onClick={() => setSelectedTeacher(null)}
                className="text-slate-400 hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <TeacherAvatar teacherId={selectedTeacher.id} name={selectedTeacher.name} initials={selectedTeacher.initials} className="w-14 h-14 text-lg" />
                <div>
                  <h4 className="font-bold text-navy text-lg">{selectedTeacher.name}</h4>
                  <p className="text-sm font-medium text-slate-500">{selectedTeacher.email}</p>
                  <p className="text-xs font-semibold text-slate-400">Phone: {selectedTeacher.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">KYC Status</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedTeacher.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {selectedTeacher.kycStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                  <p className="font-bold text-amber-500 text-base">★ {selectedTeacher.rating || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Classrooms</p>
                  <p className="font-bold text-navy text-base">{selectedTeacher.activeClassrooms}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                  <p className="font-bold text-slate-700 text-base">{selectedTeacher.experience}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bio / Headline</p>
                <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedTeacher.bio}</p>
              </div>
              <div className="text-xs font-medium text-slate-400 flex justify-between">
                <span>User ID: {selectedTeacher.id}</span>
                <span>Account Status: <span className="font-bold uppercase text-navy">{selectedTeacher.status}</span></span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setSelectedTeacher(null)}
                className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
