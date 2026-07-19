import { useState, useEffect } from 'react';
import { adminStats, pendingTeachers } from '../data/stats';
import StatCard from '../components/shared/StatCard';
import Modal from '../components/shared/Modal';

const approvedTeachers = [
  { id: 4, name: 'Meera Joshi', initials: 'MJ', color: '#ec4899', email: 'meera@email.com', phone: '+91 98765 11111', subject: 'Mathematics', education: 'M.Sc Mathematics, DU', experience: '8 years', expYears: 8, rate: '₹700/hr', location: 'JP Nagar', mode: 'Both', bio: 'Experienced mathematics educator.', status: 'approved', submittedAt: '2 weeks ago', documents: { idProof: 'Aadhaar', degree: 'M.Sc Cert', experience: 'Letter', photo: 'Photo' } },
  { id: 5, name: 'Suresh Iyer', initials: 'SI', color: '#6366f1', email: 'suresh@email.com', phone: '+91 98765 22222', subject: 'Physics', education: 'M.Sc Physics, BITS', experience: '5 years', expYears: 5, rate: '₹550/hr', location: 'Whitefield', mode: 'Online', bio: 'Physics teacher with IIT JEE expertise.', status: 'approved', submittedAt: '3 weeks ago', documents: { idProof: 'PAN Card', degree: 'B.Sc Cert', experience: null, photo: 'Photo' } },
];

const allTeachers = [...pendingTeachers, ...approvedTeachers];

const statusStyle = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
};

const TeacherCard = ({ teacher, onApprove, onReject, onView }) => (
  <div className="bg-white rounded-brand shadow-brand mb-4 overflow-hidden">
    <div className="flex items-center gap-4 p-5">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: teacher.color }}>
        {teacher.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy">{teacher.name}</p>
        <p className="text-xs text-muted">{teacher.email}</p>
        <p className="text-xs text-muted">Submitted {teacher.submittedAt}</p>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${statusStyle[teacher.status]}`}>
        {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
      </span>
    </div>
    <div className="px-5 pb-3">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {(teacher.subject || '').split(',').map((s) => (
          <span key={s} className="text-xs bg-cream text-navy px-2.5 py-1 rounded-full">{s.trim()}</span>
        ))}
      </div>
      <p className="text-xs text-muted">{teacher.experience} · {teacher.rate} · {teacher.location} · {teacher.mode}</p>
      {teacher.bio && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{teacher.bio}</p>}
    </div>
    <div className="flex gap-2 px-5 pb-5">
      {teacher.status === 'pending' && (
        <>
          <button onClick={() => onApprove(teacher.id)} className="py-2 px-4 bg-success text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">Approve</button>
          <button onClick={() => onReject(teacher.id)} className="py-2 px-4 bg-error text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">Reject</button>
        </>
      )}
      <button onClick={() => onView(teacher)} className="py-2 px-4 border-2 border-slate-200 text-muted rounded-lg text-sm font-semibold hover:border-navy hover:text-navy transition">
        View Details
      </button>
    </div>
  </div>
);

const AdminVerify = () => {
  useEffect(() => { document.title = 'Admin Verification — TrueEd'; }, []);
  const [teachers, setTeachers] = useState(allTeachers);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const statCards = [
    { icon: 'fa-solid fa-chalkboard-user', iconBg: 'bg-navy/10', iconColor: 'text-navy', label: 'Total Teachers', value: adminStats.totalTeachers },
    { icon: 'fa-solid fa-user-clock', iconBg: 'bg-warning/10', iconColor: 'text-warning', label: 'Pending KYC', value: adminStats.pendingKYC },
    { icon: 'fa-solid fa-graduation-cap', iconBg: 'bg-sky/10', iconColor: 'text-sky', label: 'Total Students', value: adminStats.totalStudents },
    { icon: 'fa-solid fa-calendar-check', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Total Sessions', value: adminStats.totalSessions },
    { icon: 'fa-solid fa-indian-rupee-sign', iconBg: 'bg-amber/10', iconColor: 'text-amber', label: 'Total Revenue', value: adminStats.totalRevenue },
  ];

  const handleApprove = (id) => {
    if (window.confirm('Approve this teacher?')) {
      setTeachers((t) => t.map((x) => x.id === id ? { ...x, status: 'approved' } : x));
    }
  };
  const handleReject = (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason) setTeachers((t) => t.map((x) => x.id === id ? { ...x, status: 'rejected', rejectionReason: reason } : x));
  };
  const handleView = (t) => { setSelected(t); setModalOpen(true); };

  const counts = {
    pending: teachers.filter((t) => t.status === 'pending').length,
    approved: teachers.filter((t) => t.status === 'approved').length,
    rejected: teachers.filter((t) => t.status === 'rejected').length,
    all: teachers.length,
  };

  const filtered = teachers
    .filter((t) => activeTab === 'all' || t.status === activeTab)
    .filter((t) => !search || [t.name, t.email, t.subject].some((v) => v?.toLowerCase().includes(search.toLowerCase())));

  const tabs = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: 'all', label: 'All Teachers', count: counts.all },
  ];

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">KYC Verification</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Search */}
      <div className="bg-white rounded-brand shadow-brand flex items-center gap-3 px-4 py-3 mb-5">
        <i className="fa-solid fa-magnifying-glass text-muted text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers by name, email, or subject..."
          className="flex-1 outline-none text-sm font-dm text-navy placeholder-muted"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-navy text-white' : 'bg-white text-muted border border-slate-200 hover:border-navy hover:text-navy'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Teacher list */}
      {filtered.length > 0 ? (
        filtered.map((t) => <TeacherCard key={t.id} teacher={t} onApprove={handleApprove} onReject={handleReject} onView={handleView} />)
      ) : (
        <div className="text-center py-16 text-muted">
          <i className="fa-solid fa-users-slash text-4xl mb-3 opacity-30" />
          <p>No teachers found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`${selected.name} — KYC Details`}
          footer={selected.status === 'pending' && (
            <>
              <button onClick={() => { handleApprove(selected.id); setModalOpen(false); }}
                className="py-2.5 px-5 bg-success text-white rounded-lg font-semibold text-sm hover:opacity-90">Approve</button>
              <button onClick={() => { handleReject(selected.id); setModalOpen(false); }}
                className="py-2.5 px-5 bg-error text-white rounded-lg font-semibold text-sm hover:opacity-90">Reject</button>
            </>
          )}
        >
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: selected.color }}>
              {selected.initials}
            </div>
            <div>
              <h4 className="font-sora font-bold text-navy text-lg">{selected.name}</h4>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[selected.status]}`}>
                {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ['Email', selected.email],
              ['Phone', selected.phone],
              ['Education', selected.education],
              ['Experience', selected.experience],
              ['Subjects', selected.subject],
              ['Rate', selected.rate],
              ['Location', selected.location],
              ['Mode', selected.mode],
            ].map(([k, v]) => (
              <div key={k} className="bg-cream rounded-lg p-3">
                <p className="text-xs text-muted mb-0.5">{k}</p>
                <p className="text-sm font-semibold text-navy">{v || '—'}</p>
              </div>
            ))}
          </div>
          {selected.bio && (
            <div className="bg-cream rounded-lg p-3 mb-4">
              <p className="text-xs text-muted mb-1">Bio</p>
              <p className="text-sm text-slate-700">{selected.bio}</p>
            </div>
          )}
          <div className="bg-cream rounded-lg p-3">
            <p className="text-xs text-muted mb-2">Documents</p>
            {Object.entries(selected.documents || {}).map(([k, v]) => v && (
              <div key={k} className="flex items-center gap-2 text-sm text-navy py-1">
                <i className="fa-solid fa-file text-sky text-xs" />
                <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>: <span className="text-muted ml-1">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
export default AdminVerify;
