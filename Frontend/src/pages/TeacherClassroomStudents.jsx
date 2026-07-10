import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useOverlay, useOverlayRefs } from '../contexts/OverlayContext';
import { handleComingSoon } from '../utils/navigationFixes';

const StudentRow = ({ student, reportedStudentIds, setStudentToReport, setIsReportModalOpen }) => {
  const { activeOverlayId, toggleOverlay, closeOverlay } = useOverlay();
  const dropdownId = `student-action-${student.id}`;
  const { triggerRef, overlayRef } = useOverlayRefs(dropdownId);
  const isOpen = activeOverlayId === dropdownId;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-sky/10 flex items-center justify-center text-sky font-extrabold text-lg shrink-0 border border-sky/20">
          {student.initials}
        </div>
        <div>
          <p className="font-bold text-navy text-lg">{student.name}</p>
          <p className="text-sm text-slate-500 font-medium">Joined {student.joinedDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
          <p className="text-lg font-bold text-emerald-600">{student.attendance}</p>
        </div>
        <div className="relative">
          <button 
            ref={triggerRef}
            onClick={() => toggleOverlay(dropdownId)} 
            className="p-2 text-slate-400 hover:text-navy transition rounded-full hover:bg-slate-100"
          >
            <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
          </button>
          {isOpen && (
            <div ref={overlayRef} className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
              <button onClick={() => { handleComingSoon("Student Profile"); closeOverlay(); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy font-bold transition flex items-center gap-2">
                <i className="fa-regular fa-user"></i> View Profile
              </button>
              <button 
                disabled={reportedStudentIds.includes(student.id)}
                onClick={() => { setStudentToReport(student); setIsReportModalOpen(true); closeOverlay(); }} 
                className={`w-full text-left px-4 py-2.5 text-sm font-bold transition flex items-center gap-2 ${reportedStudentIds.includes(student.id) ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
              >
                <i className="fa-solid fa-flag"></i> {reportedStudentIds.includes(student.id) ? 'Report Submitted' : 'Report Student'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TeacherClassroomStudents() {
  const { id } = useParams();
  
  useEffect(() => {
    document.title = `Classroom Students — TrueEd`;
  }, []);

  const [classrooms] = useState(() => {
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    return saved ? JSON.parse(saved) : [];
  });

  const classroom = classrooms.find(c => c.id.toString() === id) || { name: 'Classroom' };

  const [students, setStudents] = useState([
    { id: 1, name: 'Aarav Sharma', initials: 'AS', joinedDate: 'Oct 10, 2026', attendance: '95%' },
    { id: 2, name: 'Priya Patel', initials: 'PP', joinedDate: 'Oct 12, 2026', attendance: '88%' },
    { id: 3, name: 'Rohan Gupta', initials: 'RG', joinedDate: 'Oct 15, 2026', attendance: '100%' },
  ]);

  const [search, setSearch] = useState('');
  
  const [toastMessage, setToastMessage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [studentToReport, setStudentToReport] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: '', description: '' });
  const [reportedStudentIds, setReportedStudentIds] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportedStudentIds([...reportedStudentIds, studentToReport.id]);
    showToast('Student report submitted successfully. Our team will review it.');
    setIsReportModalOpen(false);
    setReportForm({ reason: '', description: '' });
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <Link to={`/teacher/classrooms/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-navy font-bold transition mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Classroom Details
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-3xl font-bold text-navy mb-2">Classroom Students</h1>
          <p className="text-slate-500 font-medium">{classroom.name}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
            <i className="fa-solid fa-users text-emerald-500"></i> Enrolled Students ({students.length})
          </h2>
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky/50 text-sm font-medium text-navy placeholder-slate-400"
            />
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="space-y-4">
            {filteredStudents.map(student => (
              <StudentRow 
                key={student.id} 
                student={student} 
                reportedStudentIds={reportedStudentIds} 
                setStudentToReport={setStudentToReport} 
                setIsReportModalOpen={setIsReportModalOpen} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">No students found matching your search.</p>
          </div>
        )}
      </div>

      {/* Report Student Modal */}
      {isReportModalOpen && studentToReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-sora font-bold text-navy">Report Student</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Report inappropriate behaviour or issues related to this classroom.</p>
            
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student</p>
                <p className="font-bold text-navy text-sm">{studentToReport.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classroom</p>
                <p className="font-bold text-navy text-sm truncate max-w-[120px]" title={classroom.name}>{classroom.name}</p>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Reason <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={reportForm.reason}
                  onChange={e => setReportForm({...reportForm, reason: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none font-medium text-slate-700 bg-white"
                >
                  <option value="" disabled>Select a reason...</option>
                  <option value="Misconduct">Misconduct</option>
                  <option value="Disruptive Behaviour">Disruptive Behaviour</option>
                  <option value="Inappropriate Language">Inappropriate Language</option>
                  <option value="Academic Dishonesty">Academic Dishonesty</option>
                  <option value="Spam / Misuse">Spam / Misuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Description <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe what happened and provide any relevant details."
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none resize-none font-medium text-slate-700"
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition shadow-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-sm">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
