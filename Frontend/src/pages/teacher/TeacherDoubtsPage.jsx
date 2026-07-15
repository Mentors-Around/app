import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HelpCircle, Clock, CheckCircle, Search, Eye, EyeOff, MessageSquare, Send, X } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/utils/date.util';

const TeacherDoubtsPage = () => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusTab, setStatusTab] = useState('open'); // open, resolved
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({ openCount: 0, resolvedCount: 0 });

  // Detail Modal state
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [closingDoubt, setClosingDoubt] = useState(false);

  const loadDoubts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teacherService.getMyDoubts({
        page,
        limit: 10,
        status: statusTab,
      });
      const payload = data?.data ?? data;
      setDoubts(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);

      // Get count of open vs resolved for stats (fetch with limit 1 to minimize overhead)
      const [openRes, resolvedRes] = await Promise.all([
        teacherService.getMyDoubts({ page: 1, limit: 1, status: 'open' }),
        teacherService.getMyDoubts({ page: 1, limit: 1, status: 'resolved' }),
      ]);
      setStats({
        openCount: openRes.data?.data?.totalDocs ?? openRes.data?.totalDocs ?? 0,
        resolvedCount: resolvedRes.data?.data?.totalDocs ?? resolvedRes.data?.totalDocs ?? 0,
      });
    } catch (err) {
      toast.error(err?.message || 'Could not load doubts');
    } finally {
      setLoading(false);
    }
  }, [page, statusTab]);

  useEffect(() => {
    document.title = 'Classroom Doubts — TrueEd';
    loadDoubts();
  }, [loadDoubts]);

  const handleOpenDoubt = (doubt) => {
    setSelectedDoubt(doubt);
    setResponseText(doubt.answer?.text || '');
  };

  const handleCloseDoubt = async (classroomId, doubtId) => {
    if (!window.confirm('Are you sure you want to close this doubt and mark it as resolved?')) return;
    setClosingDoubt(true);
    try {
      await classroomService.closeDoubt(classroomId, doubtId);
      toast.success('Doubt marked as resolved.');
      setSelectedDoubt(null);
      loadDoubts();
    } catch (err) {
      toast.error(err?.message || 'Could not close doubt');
    } finally {
      setClosingDoubt(false);
    }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Please enter an answer text.');
      return;
    }
    setSubmittingReply(true);
    try {
      await classroomService.answerDoubt(selectedDoubt.classroomId?._id || selectedDoubt.classroomId, selectedDoubt._id, {
        text: responseText,
      });
      toast.success('Answer posted successfully.');
      setSelectedDoubt(null);
      loadDoubts();
    } catch (err) {
      toast.error(err?.message || 'Could not post answer');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    const studentName = d.studentId?.name || '';
    const classroomName = d.classroomId?.title || '';
    const topic = d.topic || '';
    const question = d.question || '';
    const matchText = searchQuery.toLowerCase();
    return (
      studentName.toLowerCase().includes(matchText) ||
      classroomName.toLowerCase().includes(matchText) ||
      topic.toLowerCase().includes(matchText) ||
      question.toLowerCase().includes(matchText)
    );
  });

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Classroom Doubts</h1>
          <p className="text-sm text-muted mt-1">
            Manage and respond to student inquiries from your classrooms.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search doubts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-brand-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber/10 text-amber-hover flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending doubts</p>
            <p className="font-sora text-2xl font-black text-navy">{stats.openCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-brand-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved doubts</p>
            <p className="font-sora text-2xl font-black text-navy">{stats.resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 pb-1">
        {['open', 'resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              statusTab === tab
                ? 'border-navy text-navy font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'open' ? 'Pending Doubts' : 'Answered & Closed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <HelpCircle className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No doubts found</p>
          <p className="text-xs text-muted mt-1">There are no inquiries matching this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => {
            const initials = doubt.studentId?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'S';

            return (
              <div
                key={doubt._id}
                onClick={() => handleOpenDoubt(doubt)}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm hover:shadow-brand hover:border-slate-200 transition cursor-pointer flex justify-between gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="shrink-0 pt-1">
                    {doubt.studentId?.avatarUrl ? (
                      <img
                        src={doubt.studentId.avatarUrl}
                        alt={doubt.studentId.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-navy text-white rounded-full flex items-center justify-center font-sora font-extrabold text-xs">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide">
                        {doubt.topic || 'General'}
                      </span>
                      <span className="text-xs font-bold text-navy">
                        {doubt.studentId?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        &middot; {formatDate(doubt.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-sora font-bold text-navy text-sm mt-1">
                      {doubt.question}
                    </h3>

                    <p className="text-[11px] text-slate-400 font-medium">
                      Classroom: {doubt.classroomId?.title || 'Unknown Classroom'}
                    </p>

                    {doubt.answer && (
                      <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> Answered:
                        </p>
                        <p className="mt-1 font-medium">{doubt.answer.text}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 text-slate-400 text-xs">
                  <div className="flex items-center gap-1">
                    {doubt.visibility === 'public' ? (
                      <>
                        <Eye size={14} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400">Public</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400">Private</span>
                      </>
                    )}
                  </div>

                  {doubt.status === 'open' && (
                    <span className="text-[10px] font-bold text-sky uppercase tracking-wider flex items-center gap-1">
                      Reply <Send size={10} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Doubt Detail Modal */}
      {selectedDoubt && (
        <Modal
          isOpen={!!selectedDoubt}
          onClose={() => setSelectedDoubt(null)}
          title="Doubt Details"
          footer={
            <>
              <button
                onClick={() => setSelectedDoubt(null)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              {selectedDoubt.status === 'open' && (
                <>
                  <button
                    onClick={() => handleCloseDoubt(selectedDoubt.classroomId?._id || selectedDoubt.classroomId, selectedDoubt._id)}
                    className="px-4 py-2.5 border border-red-200 text-error hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    disabled={closingDoubt || submittingReply}
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={handlePostAnswer}
                    className="px-4 py-2.5 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                    disabled={submittingReply || closingDoubt}
                  >
                    {submittingReply ? <Spinner size="sm" /> : <>Send Answer <Send size={12} /></>}
                  </button>
                </>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-navy text-white rounded-full flex items-center justify-center font-sora font-extrabold text-sm shrink-0">
                {selectedDoubt.studentId?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'S'}
              </div>
              <div>
                <h4 className="font-sora font-bold text-navy text-sm">
                  {selectedDoubt.studentId?.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Asked on {formatDate(selectedDoubt.createdAt)} &middot; Classroom:{' '}
                  {selectedDoubt.classroomId?.title}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide mb-2 inline-block">
                Topic: {selectedDoubt.topic || 'General'}
              </span>
              <p className="text-navy text-sm font-semibold leading-relaxed">
                {selectedDoubt.question}
              </p>
            </div>

            {selectedDoubt.status === 'open' ? (
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  Your Answer
                </label>
                <textarea
                  placeholder="Provide a detailed, helpful answer to help the student understand..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full h-36 p-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none transition-all outline-none"
                  maxLength={2000}
                />
              </div>
            ) : (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-2">
                  <CheckCircle size={14} /> Answered by You
                </h4>
                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                  {selectedDoubt.answer?.text}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                  Answered on {formatDate(selectedDoubt.answer?.answeredAt)}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherDoubtsPage;
