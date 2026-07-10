import { useState, useEffect } from 'react';
import { Search, MoreVertical, ExternalLink, Ban, Trash2, Users, IndianRupee } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';

const mockClassrooms = [
  { id: 'c1', teacher: { id: 't1', name: 'Hari Prasad L', initials: 'HP' }, subject: 'Physics Class 12', students: 45, price: 1500, status: 'active' },
  { id: 'c2', teacher: { id: 't2', name: 'Rahul Sharma', initials: 'RS' }, subject: 'Chemistry Crash Course', students: 20, price: 1000, status: 'active' },
  { id: 'c3', teacher: { id: 't3', name: 'Anjali Verma', initials: 'AV' }, subject: 'Mathematics Board Prep', students: 30, price: 2000, status: 'disabled' },
];

export default function AdminClassrooms() {
  useEffect(() => { document.title = "Classrooms — Admin Dashboard"; }, []);

  const [classrooms, setClassrooms] = useState(mockClassrooms);
  const [search, setSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredClassrooms = classrooms.filter(c => 
    c.teacher.name.toLowerCase().includes(search.toLowerCase()) || 
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => {
    setClassrooms(classrooms.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'disabled' : 'active' } : c));
    setActiveDropdown(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      setClassrooms(classrooms.filter(c => c.id !== id));
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
                <th className="p-4">Subject</th>
                <th className="p-4">Students</th>
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
                  <td className="p-4 font-bold text-slate-700 text-sm">{room.subject}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <Users className="w-4 h-4 text-sky-500" /> {room.students}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                      <IndianRupee className="w-4 h-4 text-emerald-600" /> {room.price}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${room.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
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
                          <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-slate-400" /> Open Classroom
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={() => toggleStatus(room.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                            <Ban className="w-4 h-4" /> {room.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDelete(room.id)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete
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
              No classrooms found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
