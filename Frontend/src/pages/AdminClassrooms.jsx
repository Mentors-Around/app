import { useState, useEffect } from 'react';
import { Search, MoreVertical, ExternalLink, Ban, Trash2, Users, IndianRupee, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllClassrooms();
      const list = Array.isArray(data) ? data : (data?.docs || data?.results || []);
      const mapped = list.map(item => ({
        id: item._id || item.id,
        teacher: {
          id: item.teacherId?._id || item.teacher?._id || item.teacher || 't1',
          name: item.teacherId?.name || item.teacher?.name || item.teacherName || 'Teacher',
          initials: (item.teacherId?.name || item.teacher?.name || 'T')[0].toUpperCase(),
          email: item.teacherId?.email || 'N/A'
        },
        title: item.title || item.subject || 'Classroom',
        subject: item.subject || item.title || 'Subject',
        students: item.stats?.enrolledStudents ?? (item.enrolledStudentsCount || item.studentsCount || (item.students?.length || 0)),
        price: item.feesPaise ? item.feesPaise / 100 : (item.monthlyFeeRs || item.price || 0),
        mode: item.mode || 'ONLINE',
        totalHours: item.totalHoursPlanned || 0,
        gmeetLink: item.gmeetLink || 'N/A',
        startDate: item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A',
        endDate: item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A',
        status: item.isCancelled || item.status === 'cancelled' ? 'disabled' : (item.status || 'active')
      }));
      setClassrooms(mapped);
    } catch (err) {
      console.warn('Failed to fetch classrooms from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Classrooms — Admin Dashboard";
    fetchClassrooms();
  }, []);

  const filteredClassrooms = classrooms.filter(c => 
    c.teacher.name.toLowerCase().includes(search.toLowerCase()) || 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id) => {
    try {
      await api.admin.cancelClassroom(id);
      setClassrooms(classrooms.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'disabled' : 'active' } : c));
    } catch (err) {
      alert(err.message || 'Failed to update classroom status');
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to cancel this classroom?")) {
      try {
        await api.admin.cancelClassroom(id);
        setClassrooms(classrooms.filter(c => c.id !== id));
      } catch (err) {
        alert(err.message || 'Failed to delete classroom');
      }
    }
    setActiveDropdown(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Classrooms</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Monitor and manage all active classrooms.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search classrooms or teachers..." 
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
                <th className="p-4">Classroom Title / Subject</th>
                <th className="p-4">Enrolled Students</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms.map(room => (
                <tr key={room.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={room.teacher.id} name={room.teacher.name} initials={room.teacher.initials} className="w-8 h-8 text-xs" />
                      <span className="font-bold text-navy text-sm">{room.teacher.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-700 text-sm">
                    {room.title}
                    <span className="block text-xs font-medium text-slate-400">{room.subject}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <Users className="w-4 h-4 text-sky-500" /> {room.students} Students
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <IndianRupee className="w-4 h-4 text-emerald-600" /> ₹{room.price}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${room.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === room.id ? null : room.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === room.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up-sm">
                          <button 
                            onClick={() => { setSelectedClassroom(room); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" /> Inspect Details
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={() => toggleStatus(room.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                            <Ban className="w-4 h-4" /> {room.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDelete(room.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Cancel Classroom
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClassrooms.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No classrooms found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Classroom Details Modal */}
      {selectedClassroom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sora text-lg font-bold text-navy">Classroom Overview</h3>
              <button 
                onClick={() => setSelectedClassroom(null)}
                className="text-slate-400 hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-navy text-lg">{selectedClassroom.title}</h4>
                <p className="text-sm font-medium text-slate-500">{selectedClassroom.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher</p>
                  <p className="font-bold text-navy text-sm">{selectedClassroom.teacher.name}</p>
                  <p className="text-xs text-slate-500">{selectedClassroom.teacher.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fee</p>
                  <p className="font-bold text-emerald-600 text-base">₹{selectedClassroom.price}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enrolled Students</p>
                  <p className="font-bold text-sky-600 text-base">{selectedClassroom.students} Students</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mode</p>
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-700 uppercase">
                    {selectedClassroom.mode}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <p><span className="font-bold text-slate-400">Total Planned Hours:</span> {selectedClassroom.totalHours} Hours</p>
                <p><span className="font-bold text-slate-400">Duration:</span> {selectedClassroom.startDate} to {selectedClassroom.endDate}</p>
                <p><span className="font-bold text-slate-400">GMeet Link:</span> {selectedClassroom.gmeetLink}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">ID: {selectedClassroom.id}</span>
              <button 
                onClick={() => setSelectedClassroom(null)}
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
