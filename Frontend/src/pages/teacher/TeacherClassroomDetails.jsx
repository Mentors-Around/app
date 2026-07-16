import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Users, Clock, MapPin, Edit, Calendar, BookOpen, Plus,
  Megaphone, FileText, CheckCircle2, HelpCircle, Video, Play, Trash, Send,
  ThumbsUp, Upload, Check, AlertTriangle, ShieldAlert
} from 'lucide-react';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const TABS = [
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
  { id: 'doubts', label: 'Student Doubts', icon: HelpCircle },
  { id: 'students', label: 'Enrolled Students', icon: Users },
  { id: 'settings', label: 'Live Settings', icon: Video },
];

export default function TeacherClassroomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('announcements');

  // Tab content states
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Form states
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Doubt answer states
  const [answeringDoubtId, setAnsweringDoubtId] = useState(null);
  const [doubtAnswerText, setDoubtAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Grading states
  const [gradingAssignmentId, setGradingAssignmentId] = useState(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeValue, setGradeValue] = useState('10');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Live Settings
  const [gmeetLink, setGmeetLink] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Student Report
  const [reportingStudent, setReportingStudent] = useState(null);
  const [reportReason, setReportReason] = useState('Misconduct');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadClassroom = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await classroomService.getDetail(id);
      const cls = data?.data ?? data;
      setClassroom(cls);
      setGmeetLink(cls.gmeetLink || '');
    } catch (err) {
      toast.error(err?.message || 'Could not load classroom details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClassroom();
  }, [loadClassroom]);

  const loadTabContent = useCallback(async () => {
    setLoadingTab(true);
    try {
      if (activeTab === 'announcements') {
        const { data } = await classroomService.getAnnouncements(id);
        setAnnouncements(data?.data ?? data ?? []);
      } else if (activeTab === 'materials') {
        const { data } = await classroomService.getMaterials(id);
        setMaterials(data?.data ?? data ?? []);
      } else if (activeTab === 'assignments') {
        const { data } = await classroomService.getAssignments(id);
        setAssignments(data?.data ?? data ?? []);
      } else if (activeTab === 'doubts') {
        const { data } = await classroomService.getDoubts(id);
        setDoubts(data?.data ?? data ?? []);
      } else if (activeTab === 'students') {
        const { data } = await classroomService.getEnrolledStudents(id);
        setStudentsList(data?.data ?? data ?? []);
      }
    } catch (err) {
      console.error('Error loading tab content', err);
    } finally {
      setLoadingTab(false);
    }
  }, [id, activeTab]);

  useEffect(() => {
    if (classroom) {
      loadTabContent();
    }
  }, [classroom, activeTab, loadTabContent]);

  // Create announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    setCreatingAnnouncement(true);
    try {
      await classroomService.createAnnouncement(id, {
        title: announcementTitle,
        content: announcementContent
      });
      toast.success('Announcement published!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Failed to publish announcement');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await classroomService.deleteAnnouncement(id, annId);
      toast.success('Announcement deleted');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Could not delete announcement');
    }
  };

  // Upload material
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle.trim() || !materialFile) return;
    setUploadingMaterial(true);
    try {
      const formData = new FormData();
      formData.append('title', materialTitle);
      formData.append('file', materialFile);
      await classroomService.uploadMaterial(id, formData);
      toast.success('Material uploaded successfully!');
      setMaterialTitle('');
      setMaterialFile(null);
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Failed to upload material');
    } finally {
      setUploadingMaterial(false);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await classroomService.deleteMaterial(id, matId);
      toast.success('Material deleted');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Could not delete material');
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !assignmentDeadline) return;
    setCreatingAssignment(true);
    try {
      await classroomService.createAssignment(id, {
        title: assignmentTitle,
        description: assignmentDesc,
        deadline: assignmentDeadline
      });
      toast.success('Assignment assigned!');
      setAssignmentTitle('');
      setAssignmentDesc('');
      setAssignmentDeadline('');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Failed to assign homework');
    } finally {
      setCreatingAssignment(false);
    }
  };

  // Answer doubt
  const handleAnswerDoubt = async (e) => {
    e.preventDefault();
    if (!doubtAnswerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      await classroomService.answerDoubt(id, answeringDoubtId, { answer: doubtAnswerText });
      toast.success('Doubt answered successfully!');
      setAnsweringDoubtId(null);
      setDoubtAnswerText('');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Grade assignment submission
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    setSubmittingGrade(true);
    try {
      await classroomService.gradeSubmission(id, gradingAssignmentId, {
        submissionId: gradingSubmissionId,
        grade: Number(gradeValue),
        feedback: gradingFeedback
      });
      toast.success('Submission graded successfully!');
      setGradingAssignmentId(null);
      setGradingSubmissionId(null);
      setGradeValue('10');
      setGradingFeedback('');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit grade');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Update live settings (Google meet link)
  const handleUpdateLiveSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      await classroomService.update(id, { gmeetLink });
      toast.success('Google Meet link updated!');
      loadClassroom();
    } catch (err) {
      toast.error(err?.message || 'Failed to update meeting settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Report student
  const handleReportStudent = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await classroomService.report(id, {
        targetType: 'student',
        targetId: reportingStudent._id,
        reportType: reportReason,
        description: reportDesc
      });
      toast.success('Student report submitted successfully');
      setReportingStudent(null);
      setReportDesc('');
    } catch (err) {
      toast.error(err?.message || 'Failed to report student');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getDayLabel = (dayNum) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum] ?? '';

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (!classroom) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-slate-100 shadow-brand-sm">
        <ShieldAlert className="mx-auto text-coral mb-4" size={48} />
        <h3 className="font-sora font-bold text-navy text-lg mb-2">Classroom not found</h3>
        <p className="text-muted text-sm mb-6">This classroom doesn't exist or is unavailable.</p>
        <button onClick={() => navigate(-1)} className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-navy-hover transition">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="font-inter">
      <Link to="/teacher/classrooms" className="inline-flex items-center gap-2 text-slate-500 hover:text-navy font-semibold transition mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Classrooms
      </Link>

      <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-brand-sm mb-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="font-sora font-extrabold text-navy text-2xl md:text-3xl leading-tight">
              {classroom.title}
            </h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              classroom.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber/10 text-amber-hover'
            }`}>
              {classroom.status}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fees</p>
            <p className="font-sora font-extrabold text-navy text-lg">
              {formatCurrency((classroom.feesPaise || 0) / 100)}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
          {classroom.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject &amp; Stream</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5 capitalize">
              {classroom.subject}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5 capitalize">
              {classroom.mode}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Schedule</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {classroom.schedule?.map(s => getDayLabel(s.day)).join(', ') || 'TBD'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students Enrolled</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {classroom.stats?.enrolledStudents || 0} / {classroom.maxStudents}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === t.id
                    ? 'bg-navy text-white shadow-brand-sm'
                    : 'bg-white text-slate-600 border border-slate-50 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Workspace content */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-brand-sm min-h-[400px]">
          {loadingTab ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : (
            <>
              {/* Announcements */}
              {activeTab === 'announcements' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-sora font-bold text-navy text-lg flex items-center gap-2">
                      <Megaphone size={18} className="text-amber" /> Announcements
                    </h3>
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 mb-6 space-y-3">
                    <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Publish New Announcement</h4>
                    <input
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement Title"
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white"
                    />
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Type details for students..."
                      required
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white resize-none"
                    />
                    <button
                      type="submit"
                      disabled={creatingAnnouncement}
                      className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-hover transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Plus size={13} /> {creatingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
                    </button>
                  </form>

                  {announcements.length === 0 ? (
                    <p className="text-sm text-muted py-12 text-center">No announcements published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((a) => (
                        <div key={a._id} className="p-5 rounded-xl border border-slate-100 bg-slate-50/30 flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-navy text-sm mb-1">{a.title}</h4>
                            <p className="text-[10px] text-muted mb-3">Published {formatDate(a.createdAt)}</p>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(a._id)}
                            className="text-slate-400 hover:text-error transition p-1 hover:bg-error/5 rounded-lg"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Materials */}
              {activeTab === 'materials' && (
                <div>
                  <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-sky" /> Classroom Materials
                  </h3>

                  <form onSubmit={handleUploadMaterial} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 mb-6 space-y-3">
                    <h4 className="font-bold text-navy text-xs uppercase tracking-wider font-sora">Upload reference notes / materials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        placeholder="Material Title / Name"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white"
                      />
                      <input
                        type="file"
                        onChange={(e) => setMaterialFile(e.target.files[0])}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-navy bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploadingMaterial}
                      className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-hover transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Upload size={13} /> {uploadingMaterial ? 'Uploading...' : 'Upload File'}
                    </button>
                  </form>

                  {materials.length === 0 ? (
                    <p className="text-sm text-muted py-12 text-center">No materials uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((m) => (
                        <div key={m._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-navy">{m.title}</p>
                              <p className="text-[10px] text-muted">Uploaded {formatDate(m.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-sky hover:underline"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => handleDeleteMaterial(m._id)}
                              className="text-slate-400 hover:text-error transition p-1"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assignments */}
              {activeTab === 'assignments' && (
                <div>
                  <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-500" /> Assignments
                  </h3>

                  <form onSubmit={handleCreateAssignment} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 mb-6 space-y-3">
                    <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Create New Assignment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        placeholder="Assignment Title"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white"
                      />
                      <input
                        type="date"
                        value={assignmentDeadline}
                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-navy bg-white"
                      />
                    </div>
                    <textarea
                      value={assignmentDesc}
                      onChange={(e) => setAssignmentDesc(e.target.value)}
                      placeholder="Assignment details or instructions..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white resize-none"
                    />
                    <button
                      type="submit"
                      disabled={creatingAssignment}
                      className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-hover transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Plus size={13} /> {creatingAssignment ? 'Creating...' : 'Assign Homework'}
                    </button>
                  </form>

                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted py-12 text-center">No assignments assigned yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((as) => (
                        <div key={as._id} className="p-5 rounded-xl border border-slate-100 bg-white shadow-brand-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-navy text-sm">{as.title}</h4>
                              <p className="text-[10px] text-coral font-bold mt-0.5">Due {formatDate(as.deadline)}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                              {as.submissions?.length || 0} Submissions
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">{as.description}</p>

                          {/* Submissions Section */}
                          {as.submissions && as.submissions.length > 0 && (
                            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                              <h5 className="text-xs font-bold text-navy">Submissions:</h5>
                              {as.submissions.map((sub) => (
                                <div key={sub.studentId} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-700">Student: {sub.studentName || 'Verified Student'}</span>
                                    <span className="text-slate-400 mx-2">|</span>
                                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-sky font-semibold hover:underline">
                                      View Document
                                    </a>
                                  </div>

                                  {sub.grade ? (
                                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                                      Grade: {sub.grade}/10
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setGradingAssignmentId(as._id);
                                        setGradingSubmissionId(sub._id);
                                      }}
                                      className="bg-navy text-white text-[10px] font-bold px-2.5 py-1 rounded hover:bg-navy-hover transition"
                                    >
                                      Grade
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Student Doubts */}
              {activeTab === 'doubts' && (
                <div>
                  <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                    <HelpCircle size={18} className="text-coral" /> Student Questions &amp; Doubts
                  </h3>

                  {doubts.length === 0 ? (
                    <p className="text-sm text-muted py-12 text-center">No student doubts posted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {doubts.map((d) => (
                        <div key={d._id} className="p-5 rounded-xl border border-slate-100 bg-white shadow-brand-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-navy text-sm">{d.title}</h4>
                              <p className="text-[10px] text-muted mt-0.5">Asked by {d.studentId?.name || 'Student'}</p>
                            </div>
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <ThumbsUp size={12} /> {d.upvotes || 0}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">{d.content}</p>

                          {d.answer ? (
                            <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-3 rounded-r-lg text-xs">
                              <p className="font-bold text-navy mb-1">Your Answer:</p>
                              <p className="text-slate-600 leading-relaxed">{d.answer}</p>
                            </div>
                          ) : (
                            answeringDoubtId === d._id ? (
                              <form onSubmit={handleAnswerDoubt} className="border-t border-slate-100 pt-4 space-y-2">
                                <textarea
                                  value={doubtAnswerText}
                                  onChange={(e) => setDoubtAnswerText(e.target.value)}
                                  placeholder="Type your answer to this doubt..."
                                  rows={2}
                                  required
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-navy bg-white resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAnsweringDoubtId(null)}
                                    className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingAnswer}
                                    className="bg-navy text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-navy-hover transition disabled:opacity-50"
                                  >
                                    {submittingAnswer ? 'Submitting...' : 'Post Answer'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setAnsweringDoubtId(d._id)}
                                className="bg-navy text-white text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-navy-hover transition flex items-center gap-1"
                              >
                                <Send size={12} /> Answer Doubt
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enrolled Students */}
              {activeTab === 'students' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-sora font-bold text-navy text-lg flex items-center gap-2">
                      <Users size={18} className="text-sky" /> Enrolled Students
                    </h3>
                    <Link
                      to={`/teacher/classrooms/${id}/students`}
                      className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy-hover transition font-bold"
                    >
                      Manage Students
                    </Link>
                  </div>

                  {studentsList.length === 0 ? (
                    <p className="text-sm text-muted py-12 text-center">No students enrolled yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3">Student Name</th>
                            <th className="pb-3">Email</th>
                            <th className="pb-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsList.map((st) => (
                            <tr key={st._id} className="border-b border-slate-50 last:border-0 text-xs">
                              <td className="py-3.5 font-bold text-navy">{st.name || 'Verified Student'}</td>
                              <td className="py-3.5 text-slate-500">{st.email}</td>
                              <td className="py-3.5">
                                <button
                                  onClick={() => setReportingStudent(st)}
                                  className="text-coral hover:underline font-bold"
                                >
                                  Report Student
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Settings (Live class URL) */}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                    <Video size={18} className="text-sky" /> Live Class Settings
                  </h3>

                  <form onSubmit={handleUpdateLiveSettings} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Google Meet / Live Video Link</label>
                      <input
                        type="url"
                        value={gmeetLink}
                        onChange={(e) => setGmeetLink(e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij"
                        required
                        className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:border-navy outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updatingSettings}
                      className="bg-navy text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition disabled:opacity-50"
                    >
                      {updatingSettings ? 'Updating...' : 'Save meeting link'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grade Submission Modal */}
      {gradingSubmissionId && (
        <Modal
          isOpen={!!gradingSubmissionId}
          onClose={() => { setGradingSubmissionId(null); setGradingAssignmentId(null); }}
          title="Grade Homework Submission"
          footer={
            <>
              <button
                onClick={() => { setGradingSubmissionId(null); setGradingAssignmentId(null); }}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGradeSubmission}
                disabled={submittingGrade}
                className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50"
              >
                {submittingGrade ? 'Submitting...' : 'Submit Grade'}
              </button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Grade (out of 10)</label>
              <select
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-navy outline-none bg-white font-medium text-slate-700"
              >
                {[...Array(11).keys()].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Feedback (Optional)</label>
              <textarea
                value={gradingFeedback}
                onChange={(e) => setGradingFeedback(e.target.value)}
                placeholder="Give constructive feedback..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-navy outline-none resize-none font-medium text-slate-700"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Report Student Modal */}
      {reportingStudent && (
        <Modal
          isOpen={!!reportingStudent}
          onClose={() => setReportingStudent(null)}
          title="Report Student"
          footer={
            <>
              <button
                onClick={() => setReportingStudent(null)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReportStudent}
                disabled={submittingReport}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-navy outline-none bg-white font-medium text-slate-700"
              >
                <option value="Misconduct">Misconduct</option>
                <option value="Disruptive Behavior">Disruptive Behavior</option>
                <option value="Harassment">Harassment</option>
                <option value="Spam">Spam</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Detailed Description</label>
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Details of the issue..."
                rows={3}
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-navy outline-none resize-none font-medium text-slate-700"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
