import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, IndianRupee, Plus, Edit, Eye, PowerOff, Trash2, CheckCircle, Trash, ShieldAlert, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api.js';

export default function TeacherClassrooms() {
  const { user, kycStatus } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyClassrooms = async () => {
    try {
      setLoading(true);
      const data = await api.teacher.getMyClassrooms();
      const list = Array.isArray(data) ? data : (data?.docs || data?.classrooms || []);
      const mapped = list.map(item => ({
        id: item._id || item.id,
        teacherId: item.teacherId?._id || item.teacherId || item.teacher || user?.id,
        teacher: item.teacherId?.name || item.teacher?.name || user?.name || 'Teacher User',
        name: item.title || item.name || 'Classroom',
        subject: item.subject || 'General',
        classLevel: item.academicLevel || item.grade || item.classLevel || 'N/A',
        unlimitedStudents: item.maxStudents >= 9999 ? true : false,
        mode: item.mode ? (item.mode.charAt(0).toUpperCase() + item.mode.slice(1)) : 'Online',
        description: item.description || '',
        price: item.feesPaise ? item.feesPaise / 100 : (item.pricePaise ? item.pricePaise / 100 : item.price || 0),
        capacity: item.maxStudents || 0,
        startDate: item.startDate ? item.startDate.split('T')[0] : '',
        endDate: item.endDate ? item.endDate.split('T')[0] : '',
        schedules: item.schedules || [],
        enrolled: item.stats?.enrolledStudents || item.enrolledStudentsCount || item.enrolled || 0,
        schedule: Array.isArray(item.schedule) ? `${item.schedule.length} Weekly Sessions` : (item.schedule || 'Flexible Schedule'),
        status: item.status === 'active' ? 'active' : 'inactive'
      }));
      setClassrooms(mapped);
    } catch (err) {
      console.warn('Failed to fetch classrooms from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "My Classrooms — TrueEd";
    fetchMyClassrooms();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState(null);
  
  const [newRoom, setNewRoom] = useState({
    name: '', subject: '', classLevel: '', unlimitedStudents: true, description: '', mode: 'Online', price: '',
    maxStudents: 10, startDate: '', endDate: '',
    schedules: [{ id: 1, days: [], startTime: '', endTime: '' }]
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

  const handleScheduleDayToggle = (scheduleId, day) => {
    setNewRoom(p => {
      const updatedSchedules = p.schedules.map(sch => {
        if (sch.id === scheduleId) {
          return {
            ...sch,
            days: sch.days.includes(day)
              ? sch.days.filter(d => d !== day)
              : [...sch.days, day]
          };
        }
        return sch;
      });
      return { ...p, schedules: updatedSchedules };
    });
  };

  const updateScheduleTime = (scheduleId, field, value) => {
    setNewRoom(p => {
      const updatedSchedules = p.schedules.map(sch => {
        if (sch.id === scheduleId) {
          return { ...sch, [field]: value };
        }
        return sch;
      });
      return { ...p, schedules: updatedSchedules };
    });
  };

  const addSchedule = () => {
    setNewRoom(p => ({
      ...p,
      schedules: [
        ...p.schedules, 
        { id: Math.max(0, ...p.schedules.map(s => s.id)) + 1, days: [], startTime: '', endTime: '' }
      ]
    }));
  };

  const removeSchedule = (id) => {
    setNewRoom(p => ({
      ...p,
      schedules: p.schedules.filter(s => s.id !== id)
    }));
  };

  const getDisabledDays = (currentScheduleId) => {
    const disabled = [];
    newRoom.schedules.forEach(sch => {
      if (sch.id !== currentScheduleId) {
        disabled.push(...sch.days);
      }
    });
    return disabled;
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

  const handleSaveClassroom = async (e) => {
    e.preventDefault();
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (newRoom.startDate && newRoom.startDate < todayStr) {
      setToastMessage('Start date cannot be in the past.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (newRoom.startDate && newRoom.endDate && newRoom.endDate <= newRoom.startDate) {
      setToastMessage('End date must be strictly after start date.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Validation
    if (!newRoom.schedules || newRoom.schedules.length === 0) {
      setToastMessage('Please add at least one schedule.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      const scheduleSlots = [];

      (newRoom.schedules || []).forEach(sch => {
        (sch.days || []).forEach(dayName => {
          const dayOfWeek = dayMap[dayName];
          if (dayOfWeek !== undefined && sch.startTime && sch.endTime) {
            const { hours } = getSessionDuration(sch.startTime, sch.endTime);
            const durationMinutes = Math.round(hours * 60);
            scheduleSlots.push({
              day: dayOfWeek,
              dayOfWeek: dayOfWeek,
              startTime: sch.startTime,
              endTime: sch.endTime,
              durationMinutes: durationMinutes > 0 ? durationMinutes : 60,
            });
          }
        });
      });

      if (scheduleSlots.length === 0) {
        setToastMessage('Please select at least one day and time for your schedule.');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const payload = {
        title: newRoom.name,
        subject: newRoom.subject,
        classroomType: 'academic',
        academicLevel: newRoom.classLevel || 'Class 10',
        description: newRoom.description || '',
        feesPaise: Math.round(Number(newRoom.price || 0) * 100),
        totalHoursPlanned: Number(totalTeachingHours) > 0 ? Number(totalTeachingHours) : 20,
        maxStudents: newRoom.unlimitedStudents ? 99999 : Number(newRoom.maxStudents || 30),
        startDate: newRoom.startDate,
        endDate: newRoom.endDate,
        mode: (newRoom.mode || 'Online').toLowerCase(),
        schedule: scheduleSlots,
        ...(newRoom.mode?.toLowerCase() === 'offline' ? { offlineAddress: newRoom.offlineAddress || 'Teacher Training Center' } : {})
      };

      await api.classroom.create(payload);
      setToastMessage('Classroom created successfully');
      fetchMyClassrooms();
      closeModal();
    } catch (err) {
      setToastMessage(err.message || 'Failed to create classroom');
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openEditModal = (room) => {
    // Migration for legacy classrooms that don't have the new schedules array
    let migratedSchedules = room.schedules || [];
    if (migratedSchedules.length === 0 && room.scheduleDays) {
      migratedSchedules = [{
        id: 1,
        days: room.scheduleDays || [],
        startTime: room.startTime || '',
        endTime: room.endTime || ''
      }];
    }
    if (migratedSchedules.length === 0) {
      migratedSchedules = [{ id: 1, days: [], startTime: '', endTime: '' }];
    }

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
      schedules: migratedSchedules
    });
    setEditingClassroomId(room.id);
    setIsModalOpen(true);
  };

  const [kycRestrictionOpen, setKycRestrictionOpen] = useState(false);

  const openCreateModal = () => {
    if (kycStatus === 'NOT_VERIFIED' || kycStatus === 'PENDING') {
      setKycRestrictionOpen(true);
      return;
    }
    setNewRoom({
      name: '', subject: '', classLevel: '', unlimitedStudents: true, description: '', mode: 'Online', price: '',
      maxStudents: 10, startDate: '', endDate: '',
      schedules: [{ id: 1, days: [], startTime: '', endTime: '' }]
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
  let totalTeachingHoursVal = 0;
  let totalLecturesVal = 0;
  
  if (newRoom.startDate && newRoom.endDate && newRoom.schedules) {
    const start = new Date(newRoom.startDate);
    const end = new Date(newRoom.endDate);
    if (start <= end) {
      newRoom.schedules.forEach(sch => {
        if (sch.days.length > 0 && sch.startTime && sch.endTime) {
          const { hours: sessionHours } = getSessionDuration(sch.startTime, sch.endTime);
          const lectures = getExpectedLectures(newRoom.startDate, newRoom.endDate, sch.days);
          totalLecturesVal += lectures;
          totalTeachingHoursVal += (lectures * sessionHours);
        }
      });
    }
  }
  const expectedLecturesCount = totalLecturesVal;
  const totalTeachingHours = totalTeachingHoursVal.toFixed(1);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[9999] animate-fade-in">
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
                  <button 
                    onClick={() => {
                      setToastMessage('Classrooms cannot be edited after creation per platform policy.');
                      setTimeout(() => setToastMessage(null), 3000);
                    }} 
                    aria-label="Classroom Locked" 
                    title="Classrooms cannot be edited after creation" 
                    className="p-2 text-slate-300 hover:text-slate-400 rounded transition cursor-not-allowed opacity-60"
                  >
                    <Edit className="w-4 h-4" />
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
                        <input type="range" min="1" max="100" value={newRoom.maxStudents} onChange={e => setNewRoom({...newRoom, maxStudents: e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-navy" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <h3 className="font-bold text-navy mb-4">Weekly Schedule Builder</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <input required type="date" min={new Date().toISOString().split('T')[0]} value={newRoom.startDate} onChange={e => setNewRoom({...newRoom, startDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                        <input required type="date" min={newRoom.startDate || new Date().toISOString().split('T')[0]} value={newRoom.endDate} onChange={e => setNewRoom({...newRoom, endDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4 mb-4">
                      {newRoom.schedules.map((sch, idx) => {
                        const disabledDays = getDisabledDays(sch.id);
                        return (
                          <div key={sch.id} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm relative">
                            {newRoom.schedules.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeSchedule(sch.id)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition p-1"
                                aria-label="Remove Schedule"
                                title="Remove Schedule"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                            <h4 className="text-sm font-bold text-slate-700 mb-3">Schedule {idx + 1}</h4>
                            
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Days</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {DAYS.map(day => {
                                const isSelected = sch.days.includes(day);
                                const isDisabled = !isSelected && disabledDays.includes(day);
                                return (
                                  <button 
                                    key={day} 
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleScheduleDayToggle(sch.id, day)}
                                    title={isDisabled ? "Day already selected in another schedule" : ""}
                                    className={`px-3 py-1.5 rounded-md text-sm font-bold transition border 
                                      ${isSelected ? 'bg-sky/10 text-sky border-sky/30 cursor-pointer' : 
                                        isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 
                                        'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 cursor-pointer'}`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                                <input required type="time" value={sch.startTime} onChange={e => updateScheduleTime(sch.id, 'startTime', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                                <input required type="time" value={sch.endTime} onChange={e => updateScheduleTime(sch.id, 'endTime', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      type="button" 
                      onClick={addSchedule}
                      className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm hover:border-sky hover:text-sky hover:bg-sky/5 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Another Time Slot
                    </button>
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
                      <p className="text-slate-500 mb-1">Schedule Blocks</p>
                      <p className="font-bold text-navy">{newRoom.schedules.length}</p>
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
                <i className="fa-solid fa-floppy-disk"></i> {editingClassroomId ? 'Save Changes' : 'Create Classroom'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Restriction Modal */}
      {kycRestrictionOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            {kycStatus === 'NOT_VERIFIED' ? (
              <>
                <h3 className="font-sora font-bold text-2xl text-navy mb-3">Verification Required</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Complete your KYC before creating classrooms. Your documents will be reviewed by the TrueEd Admin Team.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setKycRestrictionOpen(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
                    Cancel
                  </button>
                  <button onClick={() => { setKycRestrictionOpen(false); navigate('/teacher/profile'); }} className="flex-[2] px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                    Go to Verification
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-sora font-bold text-2xl text-navy mb-3">Under Review</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Your verification is under review. You can create classrooms after approval.
                </p>
                <button onClick={() => setKycRestrictionOpen(false)} className="w-full px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                  Okay
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
