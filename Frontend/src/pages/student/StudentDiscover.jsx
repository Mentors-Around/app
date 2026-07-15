import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, Clock, Users, Loader2 } from 'lucide-react';
import classroomService from '@/services/classroom.service';
import enrollmentService from '@/services/enrollment.service';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/shared/StarRating';
import Pagination from '@/components/shared/Pagination';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';
import { formatCurrency } from '@/utils/format.util';
import { SUBJECTS, CLASSROOM_MODE } from '@/constants/enums';

const ClassroomCard = ({ classroom, onQuery, sending }) => (
  <div className="bg-white rounded-brand shadow-brand hover:shadow-brand-lg transition-all p-5 flex flex-col">
    <Link to={`/classroom/${classroom._id}`} className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden mb-4 block">
      {classroom.thumbnailUrl ? (
        <img src={classroom.thumbnailUrl} alt={classroom.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300 font-sora font-bold text-3xl">
          {classroom.subject?.[0] ?? 'T'}
        </div>
      )}
    </Link>

    <span className="text-xs font-bold text-sky uppercase tracking-wide mb-1">{classroom.subject}</span>
    <Link to={`/classroom/${classroom._id}`}>
      <h3 className="font-sora font-bold text-navy leading-snug mb-2 line-clamp-2 hover:text-sky transition-colors">{classroom.title}</h3>
    </Link>

    <div className="flex items-center gap-2 mb-2">
      <StarRating rating={classroom.stats?.avgRating || 0} showCount count={classroom.stats?.reviewCount || 0} />
    </div>

    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-medium mb-4">
      <span className="flex items-center gap-1">
        <MapPin size={12} /> {classroom.mode === CLASSROOM_MODE.ONLINE ? 'Online' : classroom.offlineFacility?.city || 'Offline'}
      </span>
      <span className="flex items-center gap-1">
        <Clock size={12} /> {classroom.totalHoursPlanned}h total
      </span>
      <span className="flex items-center gap-1">
        <Users size={12} /> {classroom.stats?.enrolledStudents || 0}/{classroom.maxStudents}
      </span>
    </div>

    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
      <span className="font-sora font-extrabold text-navy">{formatCurrency((classroom.feesPaise || 0) / 100)}</span>
      <button
        onClick={() => onQuery(classroom)}
        disabled={sending}
        className="bg-navy text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-navy-hover transition disabled:opacity-50 flex items-center gap-2"
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : null}
        Send Query
      </button>
    </div>
  </div>
);

const StudentDiscover = () => {
  const { refreshWallet, wallet } = useWallet();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState(searchParams.get('subject') ? 'search' : 'discover');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState(searchParams.get('subject') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [queryMessage, setQueryMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'discover') {
        const { data } = await classroomService.discover({ page, limit: 12 });
        const payload = data?.data ?? data;
        setItems(payload?.items ?? payload?.docs ?? []);
        setTotalPages(payload?.totalPages ?? 1);
      } else {
        const { data } = await classroomService.search({
          query: query || undefined,
          subject: subject || undefined,
          page,
        });
        const payload = data?.data ?? data;
        setItems(payload?.items ?? payload?.docs ?? []);
        setTotalPages(payload?.totalPages ?? 1);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not load classrooms');
    } finally {
      setLoading(false);
    }
  }, [mode, page, query, subject]);

  useEffect(() => { load(); }, [load]);

  const runSearch = (e) => {
    e?.preventDefault();
    setMode('search');
    setPage(1);
    setSearchParams(subject ? { subject } : {});
  };

  const handleQueryClick = (classroom) => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent('/discover')}`);
      toast('Please log in to send a query', { icon: '🔒' });
      return;
    }
    setConfirmTarget(classroom);
  };

  const sendQuery = async () => {
    if (!confirmTarget) return;
    if ((wallet?.tokenBalance ?? 0) < 1) {
      toast.error('You need at least 1 query token. Top up your wallet.');
      return;
    }
    setSending(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await enrollmentService.sendQuery({ classroomId: confirmTarget._id, message: queryMessage }, idempotencyKey);
      toast.success('Query sent! The teacher will respond within 24 hours.');
      setConfirmTarget(null);
      setQueryMessage('');
      refreshWallet();
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not send query');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Discover Classrooms</h1>
          <p className="text-sm text-muted mt-1">
            {wallet ? `${wallet.tokenBalance} query token${wallet.tokenBalance === 1 ? '' : 's'} available` : 'Personalised for you'}
          </p>
        </div>
        <form onSubmit={runSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search classrooms..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy"
            />
          </div>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-slate-200 text-sm px-3 focus:outline-none focus:border-navy"
          >
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="bg-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-navy-hover transition">
            Search
          </button>
        </form>
      </div>

      {mode === 'search' && (
        <button
          onClick={() => { setMode('discover'); setPage(1); setQuery(''); setSubject(''); setSearchParams({}); }}
          className="text-sm font-semibold text-sky hover:underline mb-4"
        >
          &larr; Back to personalised feed
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-muted">
          <p className="font-semibold">No classrooms found.</p>
          <p className="text-sm mt-1">Try a different search or check back soon.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((c) => (
              <ClassroomCard
                key={c._id}
                classroom={c}
                sending={sending && confirmTarget?._id === c._id}
                onQuery={handleQueryClick}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Send enrollment query"
        footer={
          <>
            <button onClick={() => setConfirmTarget(null)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={sendQuery} disabled={sending} className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50">
              {sending ? 'Sending...' : 'Send Query (1 token)'}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Sending a query to <strong className="text-navy">{confirmTarget?.title}</strong> costs{' '}
          <strong>1 query token</strong>. The teacher has 24 hours to respond.
        </p>
        <textarea
          value={queryMessage}
          onChange={(e) => setQueryMessage(e.target.value)}
          placeholder="Optional message to the teacher (no phone numbers or emails, please)"
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
        />
      </Modal>
    </div>
  );
};

export default StudentDiscover;
