import { useState, useEffect } from 'react';
import { Search, MoreVertical, Eye, FileWarning, Ban, CheckCircle, IndianRupee, Coins, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllUsers({ role: 'student' });
      const list = Array.isArray(data) ? data : (data?.docs || data?.results || []);
      const studentUsers = list.filter(u => u.role === 'student' || !u.role);
      const mapped = studentUsers.map(item => ({
        id: item._id || item.id,
        name: item.name || 'Student User',
        initials: (item.name || 'S')[0].toUpperCase(),
        email: item.email || 'N/A',
        phone: item.phone || 'N/A',
        walletBalance: item.walletBalanceRs ?? 0,
        queryTokens: item.queryTokens ?? 0,
        activeClassrooms: item.classroomsCount ?? 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
        status: item.isBanned || item.isActive === false ? 'suspended' : 'active'
      }));
      setStudents(mapped);
    } catch (err) {
      console.warn('Failed to fetch students from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Students — Admin Dashboard";
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id) => {
    const target = students.find(s => s.id === id);
    try {
      if (target?.status === 'active') {
        await api.admin.banUser(id, 'Violation of terms of service');
      } else {
        await api.admin.unbanUser(id);
      }
      setStudents(students.map(s => {
        if (s.id === id) {
          return { ...s, status: s.status === 'active' ? 'suspended' : 'active' };
        }
        return s;
      }));
    } catch (err) {
      alert(err.message || 'Failed to update student status');
    } finally {
      setActiveDropdown(null);
    }
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
                      <IndianRupee className="w-4 h-4 text-emerald-600" /> ₹{student.walletBalance}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <Coins className="w-4 h-4 text-amber-500" /> {student.queryTokens} Tokens
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-navy text-sm">{student.activeClassrooms}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
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
                          <button 
                            onClick={() => { setSelectedStudent(student); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4 text-slate-400" /> View Account Details
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

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slide-up-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sora text-lg font-bold text-navy">Student Account Overview</h3>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <TeacherAvatar teacherId={selectedStudent.id} name={selectedStudent.name} initials={selectedStudent.initials} className="w-14 h-14 text-lg" />
                <div>
                  <h4 className="font-bold text-navy text-lg">{selectedStudent.name}</h4>
                  <p className="text-sm font-medium text-slate-500">{selectedStudent.email}</p>
                  <p className="text-xs font-semibold text-slate-400">Phone: {selectedStudent.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                  <p className="font-bold text-emerald-600 text-lg">₹{selectedStudent.walletBalance}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Query Tokens</p>
                  <p className="font-bold text-amber-500 text-lg">{selectedStudent.queryTokens}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enrolled Classrooms</p>
                  <p className="font-bold text-navy text-base">{selectedStudent.activeClassrooms}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedStudent.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-400 flex justify-between">
                <span>User ID: {selectedStudent.id}</span>
                <span>Joined: {selectedStudent.createdAt}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setSelectedStudent(null)}
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
