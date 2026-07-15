import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert, ShieldCheck, Clock, CheckCircle, XCircle,
  Search, Users, BookOpen, AlertCircle, Plus, X,
} from 'lucide-react';
import reportService from '@/services/report.service';
import teacherService from '@/services/teacher.service';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/utils/date.util';

const REPORT_REASONS = [
  { value: 'misbehavior', label: 'Misbehavior / Misconduct' },
  { value: 'harassment', label: 'Harassment / Bullying' },
  { value: 'spam', label: 'Spam / Irrelevant content' },
  { value: 'cheating', label: 'Cheating / Plagiarism' },
  { value: 'non_payment', label: 'Non-payment issues' },
  { value: 'fake_account', label: 'Fake / Impersonation account' },
  { value: 'other', label: 'Other' },
];

const statusPill = {
  open: 'bg-amber/10 text-amber-hover border-amber/20',
  under_review: 'bg-sky/10 text-sky border-sky/20',
  resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const TeacherReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [form, setForm] = useState({
    classroomId: '',
    studentId: '',
    reportType: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportService.getMyReports({ page, limit: 10 });
      const payload = data?.data ?? data;
      setReports(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch {
      toast.error('Could not load reports');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    document.title = 'Student Reports — TrueEd';
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!showForm) return;
    const fetchClassrooms = async () => {
      setLoadingClassrooms(true);
      try {
        const { data } = await teacherService.getMyClassrooms({ status: 'active', limit: 30 });
        const payload = data?.data ?? data;
        setClassrooms(payload?.items ?? payload?.docs ?? []);
      } catch {
        toast.error('Could not load classrooms');
      } finally {
        setLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, [showForm]);

  const handleClassroomChange = async (classroomId) => {
    setForm((f) => ({ ...f, classroomId, studentId: '' }));
    if (!classroomId) { setEnrollments([]); return; }
    setLoadingEnrollments(true);
    try {
      const { data } = await classroomService.getEnrolledStudents(classroomId, { limit: 50 });
      const payload = data?.data ?? data;
      setEnrollments(payload?.items ?? payload?.docs ?? []);
    } catch {
      toast.error('Could not load students');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classroomId || !form.studentId || !form.reportType || !form.description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await classroomService.report(form.classroomId, {
        targetType: 'user',
        targetId: form.studentId,
        reportType: form.reportType,
        description: form.description.trim(),
      });
      toast.success('Report submitted. Our team will review it within 24–48 hours.');
      setShowForm(false);
      setForm({ classroomId: '', studentId: '', reportType: '', description: '' });
      setEnrollments([]);
      loadReports();
    } catch (err) {
      toast.error(err?.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    open: reports.filter((r) => r.status === 'open').length,
    under_review: reports.filter((r) => r.status === 'under_review').length,
    resolved: reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed').length,
  };

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Student Reports</h1>
          <p className="text-sm text-muted mt-1">
            Report student misconduct for admin review. All reports are confidential.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy hover:bg-navy-hover text-white text-sm font-bold rounded-xl shadow-md transition"
        >
          <Plus size={16} /> New Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Review', val: stats.open, icon: Clock, bg: 'bg-amber/10', color: 'text-amber-hover' },
          { label: 'Under Investigation', val: stats.under_review, icon: AlertCircle, bg: 'bg-sky/10', color: 'text-sky' },
          { label: 'Resolved / Dismissed', val: stats.resolved, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="font-sora font-black text-navy text-xl">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <ShieldCheck className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No reports filed</p>
          <p className="text-xs text-muted mt-1">Reports you file against students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-5"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldAlert size={14} className="text-error" />
                    <span className="font-sora font-bold text-navy text-sm">
                      {REPORT_REASONS.find((x) => x.value === r.reportType)?.label || r.reportType}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusPill[r.status] || 'bg-slate-100 text-slate-500'}`}>
                      {r.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {r.description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Filed on {formatDate(r.createdAt)}
                    {r.classroomId?.title && ` · Classroom: ${r.classroomId.title}`}
                  </p>
                </div>

                {r.adminNote && (
                  <div className="md:w-64 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 font-medium">
                    <p className="font-bold text-navy mb-1">Admin Note:</p>
                    {r.adminNote}
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* New Report Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setForm({ classroomId: '', studentId: '', reportType: '', description: '' }); setEnrollments([]); }}
        title="File a Student Report"
        footer={
          <>
            <button
              onClick={() => { setShowForm(false); setEnrollments([]); }}
              className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2.5 bg-error hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : 'Submit Report'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 text-xs text-slate-600 font-medium flex gap-2">
            <AlertCircle size={14} className="text-amber-hover shrink-0 mt-0.5" />
            <span>All reports are reviewed by our admin team within 24–48 hours. Filing a false report may result in account action.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Select Classroom *</label>
            {loadingClassrooms ? (
              <div className="flex items-center gap-2 py-2"><Spinner size="sm" /><span className="text-xs text-muted">Loading...</span></div>
            ) : (
              <select
                required
                value={form.classroomId}
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy bg-white"
              >
                <option value="">-- Select a Classroom --</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            )}
          </div>

          {form.classroomId && (
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Select Student *</label>
              {loadingEnrollments ? (
                <div className="flex items-center gap-2 py-2"><Spinner size="sm" /><span className="text-xs text-muted">Loading students...</span></div>
              ) : enrollments.length === 0 ? (
                <p className="text-xs text-muted italic">No enrolled students found in this classroom.</p>
              ) : (
                <select
                  required
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy bg-white"
                >
                  <option value="">-- Select a Student --</option>
                  {enrollments.map((e) => (
                    <option key={e._id} value={e.studentId?._id}>
                      {e.studentId?.name || 'Unknown Student'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Report Category *</label>
            <select
              required
              value={form.reportType}
              onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy bg-white"
            >
              <option value="">-- Select Category --</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
              Detailed Description * <span className="text-slate-400 lowercase">(min 20 chars)</span>
            </label>
            <textarea
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the incident in detail — what happened, when it occurred, any prior warnings given, and the impact on the classroom..."
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{form.description.length}/2000</p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherReports;
