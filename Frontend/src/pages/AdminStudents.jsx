import { useState, useEffect } from 'react';
import { Search, MoreVertical, Eye, FileWarning, Ban, CheckCircle, IndianRupee, Coins } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar'; // Reusing for initials

const mockStudents = [
  {
    id: 's1',
    name: 'Akash Singh',
    initials: 'AS',
    email: 'akash@example.com',
    walletBalance: 2500,
    queryTokens: 15,
    activeClassrooms: 3,
    status: 'active'
  },
  {
    id: 's2',
    name: 'Neha Gupta',
    initials: 'NG',
    email: 'neha.gupta@example.com',
    walletBalance: 400,
    queryTokens: 2,
    activeClassrooms: 1,
    status: 'active'
  },
  {
    id: 's3',
    name: 'Vikram Patel',
    initials: 'VP',
    email: 'vikram@example.com',
    walletBalance: 0,
    queryTokens: 0,
    activeClassrooms: 0,
    status: 'suspended'
  },
];

export default function AdminStudents() {
  useEffect(() => { document.title = "Students — Admin Dashboard"; }, []);

  const [students, setStudents] = useState(mockStudents);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'active' ? 'suspended' : 'active' };
      }
      return s;
    }));
    setActiveDropdown(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Students</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage all registered students on TrueEd.</p>
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
                <th className="p-4">Student</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Query Tokens</th>
                <th className="p-4">Classrooms</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={student.id} name={student.name} initials={student.initials} className="w-10 h-10 text-sm" />
                      <div>
                        <p className="font-bold text-navy text-sm">{student.name}</p>
                        <p className="text-xs font-medium text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <IndianRupee className="w-4 h-4 text-emerald-600" /> {student.walletBalance}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <Coins className="w-4 h-4 text-amber-500" /> {student.queryTokens}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-navy text-sm">{student.activeClassrooms}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === student.id ? null : student.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === student.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up-sm">
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-400" /> View Profile
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <FileWarning className="w-4 h-4 text-slate-400" /> View Reports
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          {student.status === 'active' ? (
                            <button onClick={() => toggleStatus(student.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Ban className="w-4 h-4" /> Suspend Student
                            </button>
                          ) : (
                            <button onClick={() => toggleStatus(student.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Activate Student
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
          
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No students found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
