import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Search, Flag, User, MoreVertical, X, Loader2 } from 'lucide-react';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/utils/date.util';

const REPORT_REASONS = [
  'Misconduct',
  'Disruptive Behaviour',
  'Inappropriate Language',
  'Academic Dishonesty',
  'Spam / Misuse',
  'Other'
];

const StudentRow = ({ enrollment, classroomId, reportedStudentIds, onReportInit }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const student = enrollment.studentId || {};
  const initials = student.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
  const isReported = reportedStudentIds.includes(student._id);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-brand-sm transition">
      <div className="flex items-center gap-4">
        {student.avatarUrl ? (
          <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-sky/10 flex items-center justify-center text-sky font-extrabold text-lg shrink-0 border border-sky/20">
            {initials}
          </div>
        )}
        <div>
          <p className="font-bold text-navy text-base">{student.name || 'Verified Student'}</p>
          <p className="text-xs text-slate-500 font-medium">Joined {formatDate(enrollment.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
          <p className="text-sm font-bold text-emerald-600">{enrollment.classesAttended ?? 0} classes</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
          <p className="text-sm font-bold text-indigo-500">{enrollment.assignmentsCompleted ?? 0} done</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-slate-400 hover:text-navy transition rounded-full hover:bg-slate-100"
          >
            <MoreVertical size={18} />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <Link
                  to={`/teachers/${student._id}`} // Or student profile page if available
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-navy font-bold transition flex items-center gap-2"
                >
                  <User size={14} /> View Profile
                </Link>
                <button
                  disabled={isReported}
                  onClick={() => {
                    onReportInit(student);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                    isReported ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Flag size={14} /> {isReported ? 'Report Submitted' : 'Report Student'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TeacherClassroomStudents() {
  const { id: classroomId } = useParams();
  const [classroomName, setClassroomName] = useState('Classroom');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [studentToReport, setStudentToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedStudentIds, setReportedStudentIds] = useState([]);

  // Load classroom details to get name
  useEffect(() => {
    document.title = 'Classroom Students — TrueEd';
    const loadClassroom = async () => {
      try {
        const { data } = await classroomService.getDetail(classroomId);
        const cls = data?.data ?? data;
        setClassroomName(cls?.title || 'Classroom');
      } catch {
        // Fallback gracefully
      }
    };
    loadClassroom();
  }, [classroomId]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await classroomService.getEnrolledStudents(classroomId, { page, limit: 15 });
      const payload = data?.data ?? data;
      const items = payload?.items ?? payload?.docs ?? [];
      setEnrollments(items);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalStudents(payload?.totalDocs ?? items.length);
    } catch {
      toast.error('Could not load students');
    } finally {
      setLoading(false);
    }
  }, [classroomId, page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason || !reportDesc.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmittingReport(true);
    try {
      await classroomService.report(classroomId, {
        targetType: 'student',
        targetId: studentToReport._id,
        reportType: reportReason,
        description: reportDesc
      });
      setReportedStudentIds([...reportedStudentIds, studentToReport._id]);
      toast.success('Student report submitted successfully. Our team will review it.');
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDesc('');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const name = e.studentId?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="font-inter max-w-5xl mx-auto pb-12 space-y-6">
      <Link
        to={`/teacher/classrooms/${classroomId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-navy font-bold transition text-sm"
      >
        <ArrowLeft size={16} /> Back to Classroom Details
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-3xl font-extrabold text-navy mb-1">Classroom Students</h1>
          <p className="text-slate-500 font-medium text-sm">{classroomName}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-brand-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="font-sora text-lg font-bold text-navy flex items-center gap-2">
            <Users className="text-emerald-500" size={20} /> Enrolled Students ({totalStudents})
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy text-sm font-medium text-navy placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => (
              <StudentRow
                key={enrollment._id}
                enrollment={enrollment}
                classroomId={classroomId}
                reportedStudentIds={reportedStudentIds}
                onReportInit={(student) => {
                  setStudentToReport(student);
                  setIsReportModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 font-medium">No students found.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Report Student Modal */}
      {isReportModalOpen && studentToReport && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Report Student"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={submittingReport}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingReport && <Loader2 size={14} className="animate-spin" />}
                Submit Report
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Report inappropriate behaviour or issues related to this classroom.
            </p>

            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student</p>
                <p className="font-bold text-navy">{studentToReport.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classroom</p>
                <p className="font-bold text-navy max-w-[150px] truncate" title={classroomName}>
                  {classroomName}
                </p>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-navy outline-none font-semibold text-slate-700 bg-white"
                >
                  <option value="" disabled>Select a reason...</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe what happened and provide any relevant details."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-navy outline-none resize-none font-medium text-slate-700 focus:ring-1 focus:ring-navy"
                ></textarea>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
