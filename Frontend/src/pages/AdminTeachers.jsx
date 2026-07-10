import { useState, useEffect } from 'react';
import { Search, MoreVertical, CheckCircle2, XCircle, AlertCircle, Eye, ShieldAlert, GraduationCap, FileWarning, Ban, CheckCircle } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';

const mockTeachers = [
  {
    id: 't1',
    name: 'Hari Prasad L',
    initials: 'HP',
    email: 'hariprasad@trueed.in',
    verified: true,
    kycStatus: 'VERIFIED',
    activeClassrooms: 4,
    rating: 4.8,
    status: 'active'
  },
  {
    id: 't2',
    name: 'Rahul Sharma',
    initials: 'RS',
    email: 'rahul.s@example.com',
    verified: false,
    kycStatus: 'PENDING',
    activeClassrooms: 0,
    rating: 0,
    status: 'active'
  },
  {
    id: 't3',
    name: 'Anjali Verma',
    initials: 'AV',
    email: 'anjali.v@example.com',
    verified: true,
    kycStatus: 'VERIFIED',
    activeClassrooms: 2,
    rating: 4.9,
    status: 'active'
  },
  {
    id: 't4',
    name: 'Priya Desai',
    initials: 'PD',
    email: 'priya.desai@example.com',
    verified: false,
    kycStatus: 'REJECTED',
    activeClassrooms: 0,
    rating: 0,
    status: 'suspended'
  }
];

export default function AdminTeachers() {
  useEffect(() => { document.title = "Teachers — Admin Dashboard"; }, []);

  const [teachers, setTeachers] = useState(mockTeachers);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => {
    setTeachers(teachers.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'active' ? 'suspended' : 'active' };
      }
      return t;
    }));
    setActiveDropdown(null);
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
                    {teacher.kycStatus === 'VERIFIED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
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
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${teacher.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
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
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-400" /> View Profile
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-slate-400" /> Classrooms
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <FileWarning className="w-4 h-4 text-slate-400" /> View Reports
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
    </div>
  );
}
