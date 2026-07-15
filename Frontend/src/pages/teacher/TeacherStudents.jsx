import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, BookOpen, Activity, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import { formatDate } from '@/utils/date.util';
import { formatCurrency } from '@/utils/format.util';

const TeacherStudents = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notes, setNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Load teacher's active classrooms
  useEffect(() => {
    document.title = 'My Students — TrueEd';
    const fetchClassrooms = async () => {
      setLoadingClassrooms(true);
      try {
        const { data } = await teacherService.getMyClassrooms({ status: 'active', limit: 30 });
        const payload = data?.data ?? data;
        const items = payload?.items ?? payload?.docs ?? [];
        setClassrooms(items);
        if (items.length > 0) setSelectedClassroom(items[0]);
      } catch {
        toast.error('Could not load classrooms');
      } finally {
        setLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClassroom) return;
    setLoadingStudents(true);
    try {
      const { data } = await classroomService.getEnrolledStudents(selectedClassroom._id, { page, limit: 12 });
      const payload = data?.data ?? data;
      const items = payload?.items ?? payload?.docs ?? [];
      setStudents(items);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalStudents(payload?.totalDocs ?? items.length);
    } catch {
      toast.error('Could not load students');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassroom, page]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleOpenStudent = (enrollment) => {
    setSelectedStudent(enrollment);
    const saved = localStorage.getItem(`teacher_notes_${enrollment.studentId?._id || enrollment._id}`) || '';
    setNotes(saved);
    setOriginalNotes(saved);
  };

  const handleSaveNotes = () => {
    const key = `teacher_notes_${selectedStudent.studentId?._id || selectedStudent._id}`;
    localStorage.setItem(key, notes);
    setOriginalNotes(notes);
    toast.success('Notes saved!');
  };

  const handleCloseStudent = () => {
    if (notes !== originalNotes) {
      if (!window.confirm('You have unsaved notes. Discard changes?')) return;
    }
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter((e) => {
    const name = e.studentId?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">My Students</h1>
          <p className="text-sm text-muted mt-1">View and manage students enrolled in your classrooms.</p>
        </div>
        <div className="flex items-center gap-2 bg-navy/5 px-3 py-1.5 rounded-xl">
          <Users size={15} className="text-navy" />
          <span className="text-xs font-bold text-navy">{totalStudents} enrolled</span>
        </div>
      </div>

      {/* Classroom Selector */}
      {loadingClassrooms ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No active classrooms</p>
          <p className="text-xs text-muted mt-1">Create a classroom to see enrolled students here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {classrooms.map((c) => (
              <button
                key={c._id}
                onClick={() => { setSelectedClassroom(c); setPage(1); }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition ${
                  selectedClassroom?._id === c._id
                    ? 'bg-navy text-white border-navy'
                    : 'border-slate-200 text-slate-600 hover:border-navy hover:text-navy bg-white'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5 w-full md:w-72">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
          </div>

          {loadingStudents ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
              <Users className="mx-auto text-slate-300 mb-3" size={44} />
              <p className="text-sm font-bold text-navy">No students found</p>
              <p className="text-xs text-muted mt-1">No enrolled students match your search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((enrollment) => {
                  const student = enrollment.studentId || {};
                  const initials = student.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

                  return (
                    <div
                      key={enrollment._id}
                      className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm hover:shadow-brand hover:border-slate-200 transition group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt={student.name} className="w-11 h-11 rounded-full object-cover border border-slate-100 shrink-0" />
                        ) : (
                          <div className="w-11 h-11 bg-gradient-to-br from-sky/30 to-navy/20 text-navy rounded-full flex items-center justify-center font-sora font-extrabold text-sm shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-sora font-bold text-navy text-sm truncate">{student.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {student.isMinor ? 'Minor Account' : 'Standard Account'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attended</p>
                          <p className="font-sora font-black text-navy text-lg">{enrollment.classesAttended ?? 0}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assignments</p>
                          <p className="font-sora font-black text-navy text-lg">{enrollment.assignmentsCompleted ?? 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-4">
                        <span>Fees: {formatCurrency((enrollment.feesPaidPaise || 0) / 100)}</span>
                        <span>Enrolled: {formatDate(enrollment.createdAt)}</span>
                      </div>

                      <button
                        onClick={() => handleOpenStudent(enrollment)}
                        className="w-full py-2 rounded-lg bg-slate-50 hover:bg-navy hover:text-white text-slate-600 text-xs font-bold border border-slate-200 hover:border-navy transition group-hover:bg-navy/5"
                      >
                        View Details & Notes
                      </button>
                    </div>
                  );
                })}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* Student Detail / Notes Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseStudent}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-sky/30 to-navy/20 rounded-full flex items-center justify-center font-sora font-extrabold text-xl text-navy shrink-0">
                  {(selectedStudent.studentId?.name || 'S').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-sora font-bold text-navy text-lg">{selectedStudent.studentId?.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Enrolled {formatDate(selectedStudent.createdAt)}
                  </p>
                </div>
              </div>
              <button onClick={handleCloseStudent} className="text-slate-400 hover:text-slate-600 transition p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Classes Attended', val: selectedStudent.classesAttended ?? 0 },
                  { label: 'Assignments Done', val: selectedStudent.assignmentsCompleted ?? 0 },
                  { label: 'Fees Paid', val: formatCurrency((selectedStudent.feesPaidPaise || 0) / 100) },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="font-sora font-black text-navy">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-bold text-navy text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-amber-500" /> Private Teacher Notes
                </h4>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-navy focus:outline-none focus:border-navy resize-none transition-all"
                  rows={5}
                  value={notes}
                  onChange={(e) => { if (e.target.value.length <= 1000) setNotes(e.target.value); }}
                  placeholder="Add private notes about this student's progress, strengths, areas of improvement, or follow-up actions..."
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">{notes.length}/1000</span>
                  <button
                    onClick={handleSaveNotes}
                    className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-hover transition"
                    disabled={savingNotes}
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
