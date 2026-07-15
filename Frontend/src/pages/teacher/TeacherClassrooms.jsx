import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Users, Clock, MapPin, X } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import classroomService from '@/services/classroom.service';
import Modal from '@/components/shared/Modal';
import Pagination from '@/components/shared/Pagination';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';
import { SUBJECTS, CLASSROOM_MODE, CLASSROOM_TYPE, CLASSROOM_STATUS } from '@/constants/enums';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_TABS = ['all', CLASSROOM_STATUS.ACTIVE, CLASSROOM_STATUS.COMPLETED, CLASSROOM_STATUS.PAUSED];

const emptySlot = () => ({ day: 1, startTime: '17:00', endTime: '18:00', durationMinutes: 60 });

const emptyForm = () => ({
  title: '', subject: '', description: '',
  classroomType: CLASSROOM_TYPE.ACADEMIC, academicLevel: '',
  feesPaise: '', totalHoursPlanned: '', maxStudents: '',
  startDate: '', endDate: '', mode: CLASSROOM_MODE.ONLINE,
  offlineAddress: '', offlineCity: '',
  schedule: [emptySlot()],
});

const statusPill = {
  [CLASSROOM_STATUS.ACTIVE]: 'bg-emerald-500/10 text-emerald-600',
  [CLASSROOM_STATUS.DRAFT]: 'bg-slate-100 text-slate-500',
  [CLASSROOM_STATUS.PAUSED]: 'bg-amber/10 text-amber-hover',
  [CLASSROOM_STATUS.COMPLETION_PENDING]: 'bg-sky/10 text-sky',
  [CLASSROOM_STATUS.COMPLETED]: 'bg-navy/10 text-navy',
  [CLASSROOM_STATUS.CANCELLED]: 'bg-error/10 text-error',
};

const TeacherClassrooms = () => {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teacherService.getMyClassrooms({
        page, limit: 12, status: tab === 'all' ? undefined : tab,
      });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load classrooms');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const updateSlot = (i, field, value) => {
    setForm((f) => {
      const schedule = [...f.schedule];
      schedule[i] = { ...schedule[i], [field]: value };
      return { ...f, schedule };
    });
  };
  const addSlot = () => setForm((f) => ({ ...f, schedule: [...f.schedule, emptySlot()] }));
  const removeSlot = (i) => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }));

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.feesPaise || !form.totalHoursPlanned || !form.startDate || !form.endDate || !form.maxStudents) {
      toast.error('Please fill in all required fields'); return;
    }
    if (form.classroomType === CLASSROOM_TYPE.ACADEMIC && !form.academicLevel) {
      toast.error('Academic level is required for academic classrooms'); return;
    }
    if (form.mode === CLASSROOM_MODE.OFFLINE && !form.offlineAddress) {
      toast.error('Offline address is required for offline classrooms'); return;
    }

    setSaving(true);
    try {
      await classroomService.create({
        title: form.title,
        subject: form.subject,
        description: form.description,
        classroomType: form.classroomType,
        academicLevel: form.classroomType === CLASSROOM_TYPE.ACADEMIC ? form.academicLevel : undefined,
        feesPaise: Math.round(Number(form.feesPaise) * 100),
        totalHoursPlanned: Number(form.totalHoursPlanned),
        maxStudents: Number(form.maxStudents),
        startDate: form.startDate,
        endDate: form.endDate,
        mode: form.mode,
        offlineFacility: form.mode === CLASSROOM_MODE.OFFLINE
          ? { address: form.offlineAddress, city: form.offlineCity }
          : undefined,
        schedule: form.schedule.map((s) => ({
          day: Number(s.day), startTime: s.startTime, endTime: s.endTime, durationMinutes: Number(s.durationMinutes),
        })),
      });
      toast.success('Classroom created!');
      setCreateOpen(false);
      setForm(emptyForm());
      setTab('all');
      setPage(1);
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not create classroom');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-sora text-2xl font-extrabold text-navy">My Classrooms</h1>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-navy-hover transition">
          <PlusCircle size={16} /> New classroom
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${tab === t ? 'bg-navy text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-navy'}`}
          >
            {t === 'all' ? 'All' : humanizeEnum(t)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-semibold text-muted mb-4">No classrooms here yet.</p>
          <button onClick={() => setCreateOpen(true)} className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition">
            Create your first classroom
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((c) => (
              <div key={c._id} className="bg-white rounded-brand shadow-brand p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-sky uppercase tracking-wide">{c.subject}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusPill[c.status] || 'bg-slate-100 text-slate-500'}`}>
                    {humanizeEnum(c.status)}
                  </span>
                </div>
                <Link to={`/teacher/classrooms/${c._id}`}>
                  <h3 className="font-sora font-bold text-navy leading-snug mb-3 line-clamp-2 hover:text-sky transition-colors">{c.title}</h3>
                </Link>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-medium mb-4">
                  <span className="flex items-center gap-1"><Users size={12} /> {c.stats?.enrolledStudents || 0}/{c.maxStudents}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {c.totalHoursPlanned}h</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.mode === CLASSROOM_MODE.ONLINE ? 'Online' : 'Offline'}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <span className="font-sora font-extrabold text-navy">{formatCurrency((c.feesPaise || 0) / 100)}</span>
                  <Link to={`/teacher/classrooms/${c._id}`} className="text-xs font-bold text-sky hover:underline">
                    Manage Class &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create a new classroom">
        <form onSubmit={submitCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Title *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Subject *</label>
              <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy">
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Type</label>
              <select value={form.classroomType} onChange={(e) => setForm((f) => ({ ...f, classroomType: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy">
                <option value={CLASSROOM_TYPE.ACADEMIC}>Academic</option>
                <option value={CLASSROOM_TYPE.HOBBY}>Hobby</option>
              </select>
            </div>
          </div>

          {form.classroomType === CLASSROOM_TYPE.ACADEMIC && (
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Academic level * (e.g. Class 10, JEE Advanced)</label>
              <input value={form.academicLevel} onChange={(e) => setForm((f) => ({ ...f, academicLevel: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Fees (₹) *</label>
              <input type="number" min="1" value={form.feesPaise} onChange={(e) => setForm((f) => ({ ...f, feesPaise: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Total hours *</label>
              <input type="number" min="1" value={form.totalHoursPlanned} onChange={(e) => setForm((f) => ({ ...f, totalHoursPlanned: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Max students *</label>
              <input type="number" min="1" value={form.maxStudents} onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Start date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">End date *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Mode</label>
            <div className="flex gap-3">
              {[CLASSROOM_MODE.ONLINE, CLASSROOM_MODE.OFFLINE].map((m) => (
                <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, mode: m }))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${form.mode === m ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500'}`}>
                  {humanizeEnum(m)}
                </button>
              ))}
            </div>
          </div>

          {form.mode === CLASSROOM_MODE.OFFLINE && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Address *</label>
                <input value={form.offlineAddress} onChange={(e) => setForm((f) => ({ ...f, offlineAddress: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">City</label>
                <input value={form.offlineCity} onChange={(e) => setForm((f) => ({ ...f, offlineCity: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-navy">Weekly schedule *</label>
              <button type="button" onClick={addSlot} className="text-xs font-bold text-sky hover:underline">+ Add slot</button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={slot.day} onChange={(e) => updateSlot(i, 'day', e.target.value)}
                    className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:border-navy">
                    {DAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
                  </select>
                  <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:border-navy" />
                  <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                    className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:border-navy" />
                  <input type="number" min="15" value={slot.durationMinutes} onChange={(e) => updateSlot(i, 'durationMinutes', e.target.value)}
                    placeholder="mins" className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:border-navy" />
                  {form.schedule.length > 1 && (
                    <button type="button" onClick={() => removeSlot(i)} className="text-error hover:bg-error/10 rounded-lg p-2"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy-hover disabled:opacity-50">
              {saving ? 'Creating...' : 'Create classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherClassrooms;
