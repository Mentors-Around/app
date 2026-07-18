import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, MapPin, Users, BookOpen, AlertCircle, ArrowLeft, Send,
  CheckCircle2, Star, CreditCard, Wallet, Megaphone, FileText, HelpCircle,
  Video, PlayCircle, ShieldAlert, ArrowRight, ThumbsUp, Loader2, Upload
} from 'lucide-react';
import classroomService from '@/services/classroom.service';
import enrollmentService from '@/services/enrollment.service';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';
import { formatCurrency } from '@/utils/format.util';
import { formatDate, getCountdown } from '@/utils/date.util';
import openRazorpayCheckout from '@/utils/razorpay.util';

const TABS = [
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
  { id: 'doubts', label: 'Doubts & Q&A', icon: HelpCircle },
  { id: 'live', label: 'Live Sessions', icon: Video },
];

const StudentClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();

  const [classroom, setClassroom] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('announcements');

  // Tab content states
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Modal / Form states
  const [queryOpen, setQueryOpen] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showWalletPassword, setShowWalletPassword] = useState(false);

  // Doubt submission states
  const [doubtTitle, setDoubtTitle] = useState('');
  const [doubtContent, setDoubtContent] = useState('');
  const [askingDoubt, setAskingDoubt] = useState(false);

  // Assignment submission states
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [uploadingSubmission, setUploadingSubmission] = useState(false);

  const loadClassroom = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch classroom details
      const { data: classRes } = await classroomService.getDetail(classroomId);
      // Backend wraps response: { classroom, reviews, ratingBreakdown }
      const classPayload = classRes?.data ?? classRes;
      setClassroom(classPayload?.classroom ?? classPayload);

      // 2. Fetch student queries to see if they applied
      const { data: queryRes } = await enrollmentService.getMyQueries({ limit: 100 });
      const myQueries = queryRes?.data?.items ?? queryRes?.data?.docs ?? queryRes?.items ?? [];
      const classroomQuery = myQueries.find(q => q.classroomId?._id === classroomId);
      setQuery(classroomQuery);

      // 3. Fetch student enrollments to see if they are active
      const { data: enrollRes } = await enrollmentService.getStudentEnrollments({ limit: 100, tab: 'all' });
      const myEnrollments = enrollRes?.data?.items ?? enrollRes?.data?.docs ?? enrollRes?.items ?? [];
      const activeEnroll = myEnrollments.find(e => e.classroomId?._id === classroomId);
      setEnrollment(activeEnroll);
    } catch (err) {
      toast.error(err?.message || 'Could not load classroom details');
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    loadClassroom();
  }, [loadClassroom]);

  // Load Tab Content dynamically
  const loadTabContent = useCallback(async () => {
    if (!enrollment || enrollment.status !== 'active') return;
    setLoadingTab(true);
    try {
      if (activeTab === 'announcements') {
        const { data } = await classroomService.getAnnouncements(classroomId);
        setAnnouncements(data?.data ?? data ?? []);
      } else if (activeTab === 'materials') {
        const { data } = await classroomService.getMaterials(classroomId);
        setMaterials(data?.data ?? data ?? []);
      } else if (activeTab === 'assignments') {
        const { data } = await classroomService.getAssignments(classroomId);
        setAssignments(data?.data ?? data ?? []);
      } else if (activeTab === 'doubts') {
        const { data } = await classroomService.getDoubts(classroomId);
        setDoubts(data?.data ?? data ?? []);
      }
    } catch (err) {
      console.error('Error loading tab content', err);
    } finally {
      setLoadingTab(false);
    }
  }, [activeTab, enrollment, classroomId]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

  // Submit classroom inquiry query
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if ((wallet?.tokenBalance ?? 0) < 1) {
      toast.error('You need 1 query token. Buy tokens in your wallet.');
      return;
    }

    const piiError = validateNoPII(queryMessage, 'inquiry message');
    if (piiError) {
      toast.error(piiError);
      return;
    }

    setSubmittingQuery(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await enrollmentService.sendQuery({ classroomId, message: queryMessage }, idempotencyKey);
      toast.success('Application query sent successfully!');
      setQueryOpen(false);
      setQueryMessage('');
      refreshWallet();
      loadClassroom();
    } catch (err) {
      toast.error(err?.message || 'Failed to send query');
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Pay and enroll via wallet cash
  const handlePayWallet = async (e) => {
    if (e) e.preventDefault();
    const feesPaise = classroom?.feesPaise || 0;
    if ((wallet?.cashBalancePaise ?? 0) < feesPaise) {
      toast.error('Insufficient cash balance. Please deposit cash or use Gateway payment.');
      return;
    }
    if (!walletPassword) {
      toast.error('Please enter your account password to authorize wallet payment.');
      return;
    }
    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await enrollmentService.enroll(
        query._id,
        { useWalletCash: true, password: walletPassword },
        idempotencyKey
      );
      toast.success('Successfully enrolled! Receipt sent to your email.');
      setPayOpen(false);
      setWalletPassword('');
      refreshWallet();
      loadClassroom();
    } catch (err) {
      toast.error(err?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  // Pay and enroll via Razorpay card/UPI gateway
  const handlePayGateway = async () => {
    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await enrollmentService.enroll(query._id, { useWalletCash: false }, idempotencyKey);
      const payload = data?.data ?? data;
      const { razorpayOrder } = payload;

      const payment = await openRazorpayCheckout({
        order: razorpayOrder,
        description: `Enrollment - ${classroom.title}`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      });

      await enrollmentService.verifyEnrollPayment(query._id, {
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });

      toast.success('Successfully enrolled in classroom!');
      setPayOpen(false);
      refreshWallet();
      loadClassroom();
    } catch (err) {
      toast.error(err?.message || 'Gateway payment failed');
    } finally {
      setPaying(false);
    }
  };

  // Post doubt
  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!doubtTitle.trim() || !doubtContent.trim()) return;
    setAskingDoubt(true);
    try {
      await classroomService.createDoubt(classroomId, { title: doubtTitle, content: doubtContent });
      toast.success('Question posted!');
      setDoubtTitle('');
      setDoubtContent('');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Could not post question');
    } finally {
      setAskingDoubt(false);
    }
  };

  // Upvote doubt
  const handleUpvoteDoubt = async (doubtId) => {
    try {
      await classroomService.upvoteDoubt(classroomId, doubtId);
      toast.success('Question upvoted!');
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Could not upvote question');
    }
  };

  // Submit assignment
  const handleUploadAssignment = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      toast.error('Please choose a file to upload');
      return;
    }
    setUploadingSubmission(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      await classroomService.submitAssignment(classroomId, submittingAssignmentId, formData);
      toast.success('Assignment submitted successfully!');
      setSubmittingAssignmentId(null);
      setSubmissionFile(null);
      loadTabContent();
    } catch (err) {
      toast.error(err?.message || 'Could not submit assignment');
    } finally {
      setUploadingSubmission(false);
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

  const isEnrolled = enrollment?.status === 'active';

  return (
    <div className="font-inter">
      {/* Header and Back Button */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-navy font-semibold transition mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Classroom Banner details */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-brand-sm mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-sky/10 text-sky uppercase tracking-wider">
            {classroom.subject}
          </span>
          {classroom.academicLevel && (
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 uppercase tracking-wider">
              {classroom.academicLevel}
            </span>
          )}
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider capitalize">
            {classroom.mode}
          </span>
        </div>

        <h1 className="font-sora font-extrabold text-navy text-2xl md:text-3xl mb-4 leading-tight">
          {classroom.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
          {classroom.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {classroom.schedule?.map(s => getDayLabel(s.day)).join(', ') || 'TBD'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {classroom.totalHoursPlanned} hours planned
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {classroom.stats?.enrolledStudents || 0} / {classroom.maxStudents} Enrolled
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fees</p>
            <p className="text-xs font-bold text-navy mt-0.5">
              {formatCurrency((classroom.feesPaise || 0) / 100)}
            </p>
          </div>
        </div>
      </div>

      {/* Main section: Enrolled workspace vs Public view */}
      {isEnrolled ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workspace Tabs (Left Column) */}
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

          {/* Workspace Content Panel (Right 3 Columns) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-brand-sm min-h-[400px]">
            {loadingTab ? (
              <div className="flex justify-center py-20"><Spinner /></div>
            ) : (
              <>
                {/* Announcements */}
                {activeTab === 'announcements' && (
                  <div>
                    <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                      <Megaphone size={18} className="text-amber" /> Announcements
                    </h3>
                    {announcements.length === 0 ? (
                      <p className="text-sm text-muted py-12 text-center">No announcements yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((a) => (
                          <div key={a._id} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-navy text-sm">{a.title}</h4>
                              <span className="text-[10px] text-muted">{formatDate(a.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{a.content}</p>
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
                      <FileText size={18} className="text-sky" /> Course Materials
                    </h3>
                    {materials.length === 0 ? (
                      <p className="text-sm text-muted py-12 text-center">No reference documents uploaded yet.</p>
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
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-sky hover:underline"
                            >
                              Download
                            </a>
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
                      <CheckCircle2 size={18} className="text-indigo-500" /> Homework &amp; Assignments
                    </h3>
                    {assignments.length === 0 ? (
                      <p className="text-sm text-muted py-12 text-center">No assignments assigned yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {assignments.map((as) => {
                          const submission = as.submissions?.find(s => s.studentId === user?._id);

                          return (
                            <div key={as._id} className="p-5 rounded-xl border border-slate-100 bg-white">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-navy text-sm">{as.title}</h4>
                                  <p className="text-[10px] text-coral font-bold mt-0.5">Due {formatDate(as.deadline)}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  submission?.grade ? 'bg-emerald-500/10 text-emerald-600' :
                                  submission ? 'bg-sky/10 text-sky' : 'bg-amber/10 text-amber-hover'
                                }`}>
                                  {submission?.grade ? `Graded: ${submission.grade}/10` :
                                   submission ? 'Pending Grade' : 'Not Submitted'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed mb-4">{as.description}</p>

                              {!submission ? (
                                <button
                                  onClick={() => setSubmittingAssignmentId(as._id)}
                                  className="text-xs font-bold text-white bg-navy hover:bg-navy-hover transition px-3.5 py-1.5 rounded-lg flex items-center gap-1"
                                >
                                  <Upload size={13} /> Submit Assignment
                                </button>
                              ) : (
                                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  Submitted file:{' '}
                                  <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="font-bold text-sky hover:underline">
                                    View Submission
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Doubts */}
                {activeTab === 'doubts' && (
                  <div>
                    <h3 className="font-sora font-bold text-navy text-lg mb-6 flex items-center gap-2">
                      <HelpCircle size={18} className="text-coral" /> Questions &amp; Doubts
                    </h3>

                    {/* Ask a doubt form */}
                    <form onSubmit={handleAskDoubt} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 mb-6 space-y-3">
                      <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Ask the teacher a question</h4>
                      <input
                        value={doubtTitle}
                        onChange={(e) => setDoubtTitle(e.target.value)}
                        placeholder="Subject / Question Title"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white"
                      />
                      <textarea
                        value={doubtContent}
                        onChange={(e) => setDoubtContent(e.target.value)}
                        placeholder="Detail your question..."
                        required
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy bg-white resize-none"
                      />
                      <button
                        type="submit"
                        disabled={askingDoubt}
                        className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-hover transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send size={12} /> {askingDoubt ? 'Posting...' : 'Post Question'}
                      </button>
                    </form>

                    {doubts.length === 0 ? (
                      <p className="text-sm text-muted py-12 text-center">No doubts posted yet. Be the first to ask!</p>
                    ) : (
                      <div className="space-y-4">
                        {doubts.map((d) => (
                          <div key={d._id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-brand-sm">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-navy text-sm">{d.title}</h4>
                              <button
                                onClick={() => handleUpvoteDoubt(d._id)}
                                className="flex items-center gap-1 text-slate-400 hover:text-navy transition"
                              >
                                <ThumbsUp size={13} />
                                <span className="text-xs font-bold">{d.upvotes || 0}</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-3">{d.content}</p>

                            {d.answer ? (
                              <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-3 rounded-r-lg text-xs">
                                <p className="font-bold text-navy mb-1">Teacher's Answer:</p>
                                <p className="text-slate-600 leading-relaxed">{d.answer}</p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-hover font-bold bg-amber/10 px-2 py-0.5 rounded">
                                Waiting for answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Live Sessions */}
                {activeTab === 'live' && (
                  <div className="text-center py-12">
                    <Video size={48} className="mx-auto text-sky mb-4" />
                    <h3 className="font-sora font-bold text-navy text-lg mb-2">Live Jitsi/Meet Classroom</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                      Join scheduled live video sessions with your tutor and class.
                    </p>
                    {classroom.gmeetLink ? (
                      <a
                        href={classroom.gmeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-navy text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-navy-hover transition shadow-brand-sm"
                      >
                        <Video size={16} />
                        Join Live Meet Session
                      </a>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl max-w-md mx-auto">
                        <AlertCircle className="mx-auto text-slate-400 mb-2" size={20} />
                        <p className="text-xs text-slate-600 font-medium">
                          No active meeting link set. Tutors usually set the Google Meet/Jitsi link right before class.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Not Enrolled / Public View */
        <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-brand-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <h3 className="font-sora font-bold text-navy text-lg mb-2">Join this Classroom</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Submit an enrollment query with 1 query token to get verified. Tutors review queries within 24 hours. After approval, you can enroll.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4 flex-wrap">
            {query ? (
              query.status === 'pending' ? (
                <div className="bg-amber/10 border border-amber/20 text-amber-hover px-4 py-3 rounded-xl flex items-center gap-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold">Query Under Review</span>
                </div>
              ) : query.status === 'accepted' ? (
                <button
                  onClick={() => setPayOpen(true)}
                  className="bg-navy text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-navy-hover transition shadow-brand flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Proceed to Enroll ({formatCurrency((classroom.feesPaise || 0) / 100)})
                </button>
              ) : (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold capitalize">Status: {query.status}</span>
                </div>
              )
            ) : (
              <button
                onClick={() => setQueryOpen(true)}
                className="bg-navy text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-navy-hover transition shadow-brand flex items-center gap-1.5"
              >
                Send Inquiry Query <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Query Inquiry Modal */}
      {queryOpen && (
        <Modal
          isOpen={queryOpen}
          onClose={() => setQueryOpen(false)}
          title="Send Classroom Inquiry Query"
          footer={
            <>
              <button
                onClick={() => setQueryOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuerySubmit}
                disabled={submittingQuery}
                className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center gap-1"
              >
                {submittingQuery ? 'Sending...' : 'Send (1 token)'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-sky/5 border border-sky/10 p-4 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Cost: 1 query token</span>
              <span className="font-bold text-navy">Balance: {wallet?.tokenBalance ?? 0} tokens</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Inquiry Message</label>
              <textarea
                value={queryMessage}
                onChange={(e) => setQueryMessage(e.target.value)}
                placeholder="Ask details about target exams, boards covered, or specify your learning targets..."
                rows={4}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none focus:border-navy resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Confirmation Modal */}
      {payOpen && (
        <Modal
          isOpen={payOpen}
          onClose={() => {
            setPayOpen(false);
            setWalletPassword('');
          }}
          title="Confirm Enrollment Payment"
          footer={
            <>
              <button
                onClick={() => {
                  setPayOpen(false);
                  setWalletPassword('');
                }}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePayGateway}
                disabled={paying}
                className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                <CreditCard size={15} /> Pay via Card/UPI
              </button>
            </>
          }
        >
          <div className="space-y-4 font-inter">
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-sora font-bold text-navy text-sm mb-1">{classroom.title}</h4>
              <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-800 pt-3 mt-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fees:</span>
                <span className="font-sora font-extrabold text-navy text-lg">
                  {formatCurrency((classroom.feesPaise || 0) / 100)}
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Wallet Balance</p>
                  <p className="font-sora font-extrabold text-navy text-base">
                    {formatCurrency((wallet?.cashBalancePaise || 0) / 100)}
                  </p>
                </div>
                {(wallet?.cashBalancePaise ?? 0) < (classroom.feesPaise || 0) && (
                  <span className="text-xs font-bold text-coral bg-coral/10 px-2.5 py-1 rounded-md">
                    Insufficient Cash
                  </span>
                )}
              </div>

              {(wallet?.cashBalancePaise ?? 0) >= (classroom.feesPaise || 0) && (
                <form onSubmit={handlePayWallet} className="space-y-3 pt-2 border-t border-emerald-500/10">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Password Verification <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showWalletPassword ? 'text' : 'password'}
                        placeholder="Enter account password to authorize wallet debit"
                        value={walletPassword}
                        onChange={(e) => setWalletPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:bg-slate-800 dark:text-slate-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowWalletPassword(!showWalletPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy dark:hover:text-slate-200 transition"
                      >
                        {showWalletPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={paying || !walletPassword}
                    className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Wallet size={14} /> Confirm & Pay using Wallet Cash
                  </button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Assignment Upload Modal */}
      {submittingAssignmentId && (
        <Modal
          isOpen={!!submittingAssignmentId}
          onClose={() => { setSubmittingAssignmentId(null); setSubmissionFile(null); }}
          title="Submit Assignment"
          footer={
            <>
              <button
                onClick={() => { setSubmittingAssignmentId(null); setSubmissionFile(null); }}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAssignment}
                disabled={uploadingSubmission}
                className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center gap-1"
              >
                {uploadingSubmission ? 'Uploading...' : 'Submit'}
              </button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">Upload file (PDF, Docx, or Image)</label>
            <input
              type="file"
              onChange={(e) => setSubmissionFile(e.target.files[0])}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-navy"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentClassroomDetails;
