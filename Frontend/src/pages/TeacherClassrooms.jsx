import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, IndianRupee, Plus, Edit, Eye, PowerOff, Trash2, CheckCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function TeacherClassrooms() {
  useEffect(() => {
    document.title = "My Classrooms — TrueEd";
  }, []);

  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState(() => {
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        teacherId: 'teacher-1',
        teacher: user?.name || 'Teacher User',
        name: 'Crash Course: Organic Chemistry',
        subject: 'Chemistry',
        classLevel: 'Class 12',
        unlimitedStudents: false,
        mode: 'Online',
        description: 'A complete crash course covering all important concepts.',
        price: 499,
        capacity: 20,
        enrolled: 12,
        startDate: '2026-10-01',
        endDate: '2026-11-01',
        scheduleDays: ['Mon', 'Wed', 'Fri'],
        startTime: '17:00',
        endTime: '18:00',
        schedule: 'Mon, Wed, Fri (5:00 PM - 6:00 PM)',
        status: 'active',
        sessions: [
          { id: 1, date: 'Oct 23, 2026', time: '5:00 PM - 6:00 PM', topic: 'Hydrocarbons', notes: '' },
          { id: 2, date: 'Oct 25, 2026', time: '5:00 PM - 6:00 PM', topic: 'Haloalkanes', notes: '' },
        ]
      },
      {
        id: 2,
        teacherId: 'teacher-1',
        teacher: user?.name || 'Teacher User',
        name: 'Board Prep: Calculus Masterclass',
        subject: 'Mathematics',
        classLevel: 'Class 12',
        unlimitedStudents: true,
        mode: 'Offline',
        description: 'Intensive calculus practice for board exams.',
        price: 799,
        capacity: 0,
        enrolled: 8,
        startDate: '2026-10-15',
        endDate: '2026-12-15',
        scheduleDays: ['Sat', 'Sun'],
        startTime: '10:00',
        endTime: '12:00',
        schedule: 'Sat, Sun (10:00 AM - 12:00 PM)',
        status: 'active',
        sessions: []
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState(null);
  
  const [newRoom, setNewRoom] = useState({
    name: '', subject: '', classLevel: '', unlimitedStudents: true, description: '', mode: 'Online', price: '',
    maxStudents: 10, startDate: '', endDate: '',
    scheduleDays: [], startTime: '', endTime: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const CLASS_LEVELS = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 
    'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'JEE', 'NEET', 'CUET', 'UPSC', 'Programming', 'Spoken English', 'Music', 'Karate', 'Other'
  ];

  const handleDayToggle = (day) => {
    setNewRoom(p => ({
      ...p,
      scheduleDays: p.scheduleDays.includes(day)
        ? p.scheduleDays.filter(d => d !== day)
        : [...p.scheduleDays, day]
    }));
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h, 10) + parseInt(m, 10) / 60;
  };

  const getSessionDuration = (start, end) => {
    if (!start || !end) return { hours: 0, text: '-' };
    let diff = parseTime(end) - parseTime(start);
    if (diff < 0) diff += 24; 
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    let text = '';
    if (h > 0) text += `${h} Hour${h > 1 ? 's' : ''} `;
    if (m > 0) text += `${m} Minute${m > 1 ? 's' : ''}`;
    if (!text) return { hours: 0, text: '-' };
    return { hours: diff, text: text.trim() };
  };

  const getExpectedLectures = (startDate, endDate, scheduleDays) => {
    if (!startDate || !endDate || !scheduleDays || scheduleDays.length === 0) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;

    let count = 0;
    const current = new Date(start);
    const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const validDays = scheduleDays.map(d => dayMap[d]);

    while (current <= end) {
      if (validDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const handleSaveClassroom = (e) => {
    e.preventDefault();
    
    const daysStr = newRoom.scheduleDays.join(', ') || 'TBD';
    const timeStr = (newRoom.startTime && newRoom.endTime) ? `(${formatTime12hr(newRoom.startTime)} - ${formatTime12hr(newRoom.endTime)})` : '';
    const computedSchedule = `${daysStr} ${timeStr}`.trim();
    
    if (editingClassroomId) {
      // Edit existing
      setClassrooms(classrooms.map(c => c.id === editingClassroomId ? {
        ...c,
        name: newRoom.name,
        subject: newRoom.subject,
        classLevel: newRoom.classLevel,
        unlimitedStudents: newRoom.unlimitedStudents,
        mode: newRoom.mode,
        description: newRoom.description,
        price: Number(newRoom.price),
        capacity: newRoom.unlimitedStudents ? 0 : Number(newRoom.maxStudents),
        startDate: newRoom.startDate,
        endDate: newRoom.endDate,
        scheduleDays: newRoom.scheduleDays,
        startTime: newRoom.startTime,
        endTime: newRoom.endTime,
        schedule: computedSchedule
      } : c));
      setToastMessage('Classroom updated successfully');
    } else {
      // Create new
      const newId = classrooms.length > 0 ? Math.max(...classrooms.map(c => c.id)) + 1 : 1;
      setClassrooms([...classrooms, {
        id: newId,
        teacherId: 'teacher-1',
        teacher: user?.name || 'Teacher User',
        name: newRoom.name,
        subject: newRoom.subject,
        classLevel: newRoom.classLevel,
        unlimitedStudents: newRoom.unlimitedStudents,
        mode: newRoom.mode,
        description: newRoom.description,
        price: Number(newRoom.price),
        capacity: newRoom.unlimitedStudents ? 0 : Number(newRoom.maxStudents),
        startDate: newRoom.startDate,
        endDate: newRoom.endDate,
        scheduleDays: newRoom.scheduleDays,
        startTime: newRoom.startTime,
        endTime: newRoom.endTime,
        enrolled: 0,
        schedule: computedSchedule,
        status: 'active',
        sessions: []
      }]);
      setToastMessage('Classroom created successfully');
    }
    
    setTimeout(() => setToastMessage(null), 3000);
    closeModal();
  };

  const openEditModal = (room) => {
    setNewRoom({
      name: room.name,
      subject: room.subject,
      classLevel: room.classLevel || '',
      unlimitedStudents: room.unlimitedStudents ?? true,
      description: room.description || '',
      mode: room.mode,
      price: room.price,
      maxStudents: room.capacity || 10,
      startDate: room.startDate || '',
      endDate: room.endDate || '',
      scheduleDays: room.scheduleDays || [],
      startTime: room.startTime || '',
      endTime: room.endTime || ''
    });
    setEditingClassroomId(room.id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setNewRoom({
      name: '', subject: '', classLevel: '', unlimitedStudents: true, description: '', mode: 'Online', price: '',
      maxStudents: 10, startDate: '', endDate: '',
      scheduleDays: [], startTime: '', endTime: ''
    });
    setEditingClassroomId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClassroomId(null);
  };

  const toggleStatus = (roomId) => {
    setClassrooms(classrooms.map(c => c.id === roomId ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
  };

  const confirmDelete = () => {
    setClassrooms(classrooms.filter(c => c.id !== roomToDelete));
    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
    setToastMessage('Classroom deleted successfully');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Auto Calculations
  const { hours: sessionHours, text: sessionDurationText } = getSessionDuration(newRoom.startTime, newRoom.endTime);
  const expectedLecturesCount = getExpectedLectures(newRoom.startDate, newRoom.endDate, newRoom.scheduleDays);
  const totalTeachingHours = (expectedLecturesCount * sessionHours).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-3xl font-bold text-navy mb-2">My Classrooms</h1>
          <p className="text-slate-500 font-medium">Manage your active group classes and schedules.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-lg font-bold hover:bg-navy-light transition shadow-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create Classroom
        </button>
      </div>

      {/* Classrooms List / Empty State */}
      {classrooms.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            📚
          </div>
          <h3 className="font-sora font-bold text-navy text-2xl mb-3">No Classrooms Yet</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't created any classrooms yet. Set up your first class to start teaching groups of students.</p>
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-navy text-white px-8 py-3.5 rounded-lg font-bold hover:bg-navy-light transition shadow-sm text-lg"
          >
            Create Your First Classroom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classrooms.map(room => (
            <div key={room.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${room.status === 'inactive' ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-md hover:border-sky/30'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-sora font-bold text-xl text-navy mb-1">{room.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{room.classLevel || 'N/A'}</span>
                      <span className="text-[10px] font-bold text-sky bg-sky/10 px-2 py-0.5 rounded uppercase tracking-wider">{room.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {room.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-slate-400" /></div>
                    <span className="line-clamp-2">{room.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-slate-400" /></div>
                    <span>{room.unlimitedStudents ? `${room.enrolled} / Unlimited Seats` : `${room.enrolled} / ${room.capacity} Enrolled`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <i className={`fa-solid ${room.mode === 'Online' ? 'fa-laptop text-slate-400' : room.mode === 'Hybrid' ? 'fa-shuffle text-slate-400' : 'fa-house-user text-slate-400'}`} />
                    </div>
                    <span>{room.mode} Mode</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><IndianRupee className="w-4 h-4 text-slate-400" /></div>
                    <span>₹{room.price} / student</span>
                  </div>
                </div>

              </div>
              
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center">
                <Link to={`/teacher/classrooms/${room.id}`} aria-label="View Classroom" title="View Classroom" className="flex items-center gap-2 text-navy hover:text-sky font-bold text-sm transition cursor-pointer">
                  <Eye className="w-4 h-4" /> View Details
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(room)} aria-label="Edit Classroom" title="Edit Classroom" className="p-2 text-slate-400 hover:text-navy hover:bg-slate-200 rounded transition cursor-pointer">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleStatus(room.id)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer" 
                    title={room.status === 'active' ? "Deactivate Classroom" : "Activate Classroom"}
                    aria-label={room.status === 'active' ? "Deactivate Classroom" : "Activate Classroom"}
                  >
                    <PowerOff className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setRoomToDelete(room.id); setIsDeleteModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer" 
                    title="Delete Classroom"
                    aria-label="Delete Classroom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-sora font-bold text-navy mb-4">Delete Classroom</h3>
            <p className="text-sm text-slate-600 mb-2">Are you sure you want to delete this classroom?</p>
            <p className="text-sm font-bold text-red-500 mb-6">This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setRoomToDelete(null); }} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer"
              >
                Delete Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            
            {/* Header - Fixed */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-sora font-bold text-navy">{editingClassroomId ? 'Edit Classroom' : 'Create New Classroom'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div className="p-6 overflow-y-auto">
              <form id="classroom-form" onSubmit={handleSaveClassroom} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Classroom Name</label>
                    <input required type="text" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" placeholder="e.g. Physics Crash Course" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Class / Level *</label>
                    <select required value={newRoom.classLevel} onChange={e => setNewRoom({...newRoom, classLevel: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none bg-white">
                      <option value="" disabled>Select Level</option>
                      {CLASS_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                    <input required type="text" value={newRoom.subject} onChange={e => setNewRoom({...newRoom, subject: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" placeholder="e.g. Physics" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Mode</label>
                    <select value={newRoom.mode} onChange={e => setNewRoom({...newRoom, mode: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none bg-white">
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Price Per Student (₹)</label>
                    <input required type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" placeholder="e.g. 500" />
                    <p className="text-xs text-slate-400 mt-1">Students will pay this amount per session.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea required value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} rows="3" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none resize-none" placeholder="What will be covered in this classroom?"></textarea>
                  </div>

                  <div className="md:col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-navy">Unlimited Students</p>
                        <p className="text-xs text-slate-500 mt-0.5">{newRoom.unlimitedStudents ? 'Unlimited Seats' : 'Set a maximum capacity for this class'}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNewRoom({...newRoom, unlimitedStudents: !newRoom.unlimitedStudents})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky/50 focus:ring-offset-1 ${newRoom.unlimitedStudents ? 'bg-sky' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newRoom.unlimitedStudents ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {!newRoom.unlimitedStudents && (
                      <div className="pt-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                          <span>Max Students</span>
                          <span className="text-sky bg-sky/10 px-2 py-0.5 rounded text-xs">{newRoom.maxStudents}</span>
                        </label>
                        <input type="range" min="2" max="100" value={newRoom.maxStudents} onChange={e => setNewRoom({...newRoom, maxStudents: e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-navy" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <h3 className="font-bold text-navy mb-4">Schedule Builder</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <input required type="date" value={newRoom.startDate} onChange={e => setNewRoom({...newRoom, startDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Date (Required for calculation)</label>
                        <input required type="date" value={newRoom.endDate} onChange={e => setNewRoom({...newRoom, endDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                    </div>

                    <label className="block text-sm font-bold text-slate-700 mb-2">Days of Week</label>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {DAYS.map(day => (
                        <button 
                          key={day} 
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-md text-sm font-bold transition border cursor-pointer ${newRoom.scheduleDays.includes(day) ? 'bg-sky/10 text-sky border-sky/30' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                        <input required type="time" value={newRoom.startTime} onChange={e => setNewRoom({...newRoom, startTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Time</label>
                        <input required type="time" value={newRoom.endTime} onChange={e => setNewRoom({...newRoom, endTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                    </div>
                  </div>

                </div>
                
                {/* Classroom Summary Section */}
                <div className="bg-sky/5 border border-sky/20 rounded-xl p-5 mt-8">
                  <h3 className="font-sora font-bold text-navy mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-sky"></i> Classroom Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Subject</p>
                      <p className="font-bold text-navy">{newRoom.subject || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Class / Level</p>
                      <p className="font-bold text-navy">{newRoom.classLevel || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Mode</p>
                      <p className="font-bold text-navy">{newRoom.mode}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Price Per Student</p>
                      <p className="font-bold text-navy">{newRoom.price ? `₹${newRoom.price}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Session Duration</p>
                      <p className="font-bold text-navy">{sessionDurationText}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Expected Lectures</p>
                      <p className="font-bold text-navy">{expectedLecturesCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Total Teaching</p>
                      <p className="font-bold text-navy">{totalTeachingHours > 0 ? `${totalTeachingHours} Hours` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Capacity</p>
                      <p className="font-bold text-navy">{newRoom.unlimitedStudents ? 'Unlimited Seats' : newRoom.maxStudents}</p>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg transition hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button type="submit" form="classroom-form" className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer">
                <i className="fa-solid fa-floppy-disk"></i> {editingClassroomId ? 'Save Changes' : 'Save Classroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
