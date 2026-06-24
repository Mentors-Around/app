import { useState, useEffect } from 'react';
import { MapPin, BookOpen, GraduationCap, Clock, Activity, FileText, X, CheckCircle } from 'lucide-react';

const mockStudents = [
  { id: 1, name: 'Aarav Sharma', initials: 'AS', grade: 'Class 12', city: 'Mumbai', subjects: ['Physics', 'Math'], totalSessions: 14, lastSession: 'Oct 24, 2026', status: 'Active', attendance: '94%' },
  { id: 2, name: 'Priya Kapoor', initials: 'PK', grade: 'Class 10', city: 'Delhi', subjects: ['Math', 'Science'], totalSessions: 8, lastSession: 'Oct 20, 2026', status: 'Active', attendance: '88%' },
  { id: 3, name: 'Rahul Verma', initials: 'RV', grade: 'Class 11', city: 'Bangalore', subjects: ['Chemistry'], totalSessions: 22, lastSession: 'Sep 15, 2026', status: 'Inactive', attendance: '76%' },
  { id: 4, name: 'Sneha Patel', initials: 'SP', grade: 'Class 9', city: 'Ahmedabad', subjects: ['English', 'SST'], totalSessions: 5, lastSession: 'Oct 25, 2026', status: 'Active', attendance: '100%' },
  { id: 5, name: 'Karan Singh', initials: 'KS', grade: 'Class 12', city: 'Pune', subjects: ['Physics'], totalSessions: 3, lastSession: 'Oct 10, 2026', status: 'Inactive', attendance: '50%' },
  { id: 6, name: 'Neha Gupta', initials: 'NG', grade: 'Class 8', city: 'Lucknow', subjects: ['Math'], totalSessions: 12, lastSession: 'Oct 22, 2026', status: 'Active', attendance: '92%' },
  { id: 7, name: 'Vikram Joshi', initials: 'VJ', grade: 'Class 11', city: 'Jaipur', subjects: ['Biology', 'Chemistry'], totalSessions: 19, lastSession: 'Oct 23, 2026', status: 'Active', attendance: '95%' },
  { id: 8, name: 'Aditi Rao', initials: 'AR', grade: 'Class 10', city: 'Hyderabad', subjects: ['Physics', 'Math'], totalSessions: 2, lastSession: 'Aug 05, 2026', status: 'Inactive', attendance: '60%' },
];

export default function TeacherStudents() {
  useEffect(() => {
    document.title = "My Students — TrueEd";
  }, []);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [classrooms, setClassrooms] = useState([]);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [originalNoteText, setOriginalNoteText] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const savedClassrooms = localStorage.getItem('trueed_teacher_classrooms');
    if (savedClassrooms) {
      setClassrooms(JSON.parse(savedClassrooms));
    }
  }, []);

  // Compute enriched students with classrooms based on dummy determinism
  const enrichedStudents = mockStudents.map(student => {
    let studentClassrooms = [];
    if (classrooms.length > 0) {
      if (student.id % 3 === 1) {
        studentClassrooms = classrooms.slice(0, 2);
      } else if (student.id % 3 === 2) {
        studentClassrooms = classrooms.slice(0, 1);
      } else {
        studentClassrooms = [];
      }
    }
    return { ...student, classrooms: studentClassrooms };
  });

  const filteredStudents = enrichedStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenModal = (student) => {
    const savedNote = localStorage.getItem(`studentNotes_${student.id}`) || "";
    setNoteText(savedNote);
    setOriginalNoteText(savedNote);
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    if (noteText !== originalNoteText) {
      setShowDiscardConfirm(true);
    } else {
      setSelectedStudent(null);
    }
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`studentNotes_${selectedStudent.id}`, noteText);
    setOriginalNoteText(noteText);
    showToast("Notes saved successfully");
  };

  return (
    <div className="space-y-6 pb-10 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[100] animate-fade-in" role="alert" aria-live="assertive">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-sora font-extrabold text-navy">My Students</h1>
          <span className="bg-sky/10 text-sky font-bold px-3 py-1 rounded-full text-sm">
            {mockStudents.length} Total
          </span>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-download"></i> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-96">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search students by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky/50 text-sm font-medium text-navy placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {['All', 'Active', 'Inactive'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2.5 rounded-lg font-bold whitespace-nowrap transition text-sm ${filter === tab ? 'bg-navy text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
            >
              {tab === 'All' ? 'All Students' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-sky/30 transition-all duration-300 group flex flex-col h-full">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky/20 to-sky/5 flex items-center justify-center text-sky font-extrabold text-xl border border-sky/10">
                  {student.initials}
                </div>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md tracking-wider ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {student.status}
                </span>
              </div>
              
              <h3 className="font-sora font-bold text-navy text-lg mb-1 group-hover:text-sky transition-colors">{student.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 font-medium">
                <GraduationCap className="w-4 h-4" /> {student.grade} <span className="mx-1">•</span> <MapPin className="w-4 h-4" /> {student.city}
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-5">
                {student.subjects.map((sub, i) => (
                  <span key={i} className="text-[11px] font-bold bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {sub}
                  </span>
                ))}
              </div>

              {/* Enrolled Classrooms Section */}
              <div className="mb-5 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Enrolled Classrooms
                </p>
                {student.classrooms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.classrooms.map((room, idx) => (
                      <span key={idx} className="text-xs font-bold bg-sky/10 text-sky border border-sky/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <i className="fa-solid fa-book text-[10px]"></i> {room.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic bg-slate-50 py-1.5 px-3 rounded-lg inline-block border border-slate-100">
                    No Active Classroom
                  </p>
                )}
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 mb-5">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Sessions</p>
                  <p className="font-sora font-bold text-navy text-sm">{student.totalSessions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Last Session</p>
                  <p className="font-sora font-bold text-navy text-sm">{student.lastSession}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Active Classrooms</p>
                  <p className="font-sora font-bold text-navy text-sm">{student.classrooms.length}</p>
                </div>
              </div>

              <button 
                onClick={() => handleOpenModal(student)} 
                className="w-full py-2.5 bg-slate-50 hover:bg-navy text-slate-600 hover:text-white font-bold rounded-lg transition-colors text-sm shadow-sm border border-slate-200 hover:border-navy mt-auto"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-user-xmark text-4xl text-slate-300"></i>
          </div>
          <h3 className="text-xl font-sora font-bold text-navy mb-2">No students found</h3>
          <p className="text-slate-500 max-w-sm mb-6">We couldn't find any students matching your current search or filter criteria. Try adjusting your filters.</p>
          <button 
            onClick={() => { setSearch(''); setFilter('All'); }}
            className="text-sky font-bold hover:text-navy transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white rounded-t-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <GraduationCap className="w-24 h-24 text-navy" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky/20 to-sky/5 flex items-center justify-center text-sky font-extrabold text-2xl border border-sky/10">
                  {selectedStudent.initials}
                </div>
                <div>
                  <h2 className="text-2xl font-sora font-bold text-navy mb-1">{selectedStudent.name}</h2>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> {selectedStudent.grade} • <MapPin className="w-4 h-4" /> {selectedStudent.city}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal} 
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-600 transition relative z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky/50 rounded-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className={`font-bold text-sm ${selectedStudent.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>{selectedStudent.status}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance</p>
                  <p className="font-bold text-navy text-sm">{selectedStudent.attendance}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sessions</p>
                  <p className="font-bold text-navy text-sm">{selectedStudent.totalSessions}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Class</p>
                  <p className="font-bold text-navy text-sm">{selectedStudent.lastSession}</p>
                </div>
              </div>

              {/* Classrooms */}
              <div>
                <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky" /> Enrolled Classrooms
                </h3>
                {selectedStudent.classrooms.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.classrooms.map((room, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-sky/20 bg-sky/5 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-sky/20 flex items-center justify-center text-sky shrink-0">
                            <i className="fa-solid fa-book text-xs"></i>
                          </div>
                          <div>
                            <p className="font-bold text-navy text-sm">{room.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{room.scheduleDays?.join(', ') || 'TBD'} • {room.mode}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                    <p className="text-sm font-semibold text-slate-500 italic">This student is currently not enrolled in any active classrooms.</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Teacher Notes
                </h3>
                <textarea 
                  aria-label="Teacher Notes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-navy font-medium outline-none focus:border-sky/50 resize-none transition"
                  rows="4"
                  value={noteText}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setNoteText(e.target.value);
                    }
                  }}
                  placeholder="Add private notes about this student's progress, strengths, weaknesses, attendance, learning style, or follow-up actions..."
                ></textarea>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-3">
                  <span className="text-xs font-bold text-slate-400">{noteText.length} / 1000 characters</span>
                  <button 
                    aria-label="Save Notes"
                    onClick={handleSaveNotes}
                    className="w-full sm:w-auto px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light transition shadow-sm focus:outline-none focus:ring-2 focus:ring-sky/50 cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center border border-slate-100">
            <h3 className="text-xl font-sora font-bold text-navy mb-2">Discard unsaved notes?</h3>
            <p className="text-slate-500 text-sm mb-6">You have unsaved changes. Are you sure you want to discard them?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Continue Editing
              </button>
              <button 
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setSelectedStudent(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
