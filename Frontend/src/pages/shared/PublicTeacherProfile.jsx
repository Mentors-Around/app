import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, GraduationCap, Users, Clock } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/shared/Logo';
import StarRating from '@/components/shared/StarRating';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';

const PublicTeacherProfile = () => {
  const { teacherId } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await teacherService.getPublicProfile(teacherId);
        setData(res?.data ?? res);
      } catch (err) {
        setError(true);
        toast.error(err?.message || 'Teacher not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="font-sora font-bold text-navy mb-2">Teacher not found</p>
        <Link to="/" className="text-sm text-sky hover:underline">Back to home</Link>
      </div>
    );
  }

  const { user, profile, classrooms = [], stats } = data;
  const queryHref = isAuthenticated ? '/student/discover' : `/login?next=/student/discover`;

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-white border-b border-slate-100 py-4 px-6">
        <Link to="/"><Logo className="h-9 w-auto" /></Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-brand shadow-brand p-8 mb-6">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-sora text-2xl font-extrabold text-navy">{user?.name}</h1>
              <p className="text-muted text-sm mt-1">{profile?.headline}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-muted">
                <span className="flex items-center gap-1"><MapPin size={13} /> {user?.city}, {user?.state}</span>
                <span className="flex items-center gap-1"><GraduationCap size={13} /> {profile?.experienceYears || 0} yrs experience</span>
              </div>
              <div className="mt-2"><StarRating rating={stats?.avgRating || 0} showCount count={stats?.totalReviews || 0} /></div>
            </div>
            <Link to={queryHref} className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition shrink-0">
              Send a query
            </Link>
          </div>

          {profile?.bio && <p className="text-sm text-muted mt-6 leading-relaxed">{profile.bio}</p>}

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center"><p className="font-sora font-extrabold text-navy text-xl">{stats?.totalStudentsTaught || 0}</p><p className="text-xs text-muted">Students taught</p></div>
            <div className="text-center"><p className="font-sora font-extrabold text-navy text-xl">{stats?.completedClassrooms || 0}</p><p className="text-xs text-muted">Classrooms completed</p></div>
            <div className="text-center"><p className="font-sora font-extrabold text-navy text-xl">{profile?.subjects?.length || 0}</p><p className="text-xs text-muted">Subjects taught</p></div>
          </div>

          {profile?.subjects?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {profile.subjects.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-sky/10 text-sky text-xs font-bold">{s}</span>
              ))}
            </div>
          )}
        </div>

        <h2 className="font-sora font-bold text-navy text-lg mb-4">Active classrooms</h2>
        {classrooms.length === 0 ? (
          <p className="text-sm text-muted">No active classrooms right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classrooms.map((c) => (
              <div key={c._id} className="bg-white rounded-brand shadow-brand p-5">
                <span className="text-xs font-bold text-sky uppercase">{c.subject}</span>
                <h3 className="font-sora font-bold text-navy mt-1 mb-3">{c.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted mb-3">
                  <span className="flex items-center gap-1"><Users size={12} /> {c.stats?.enrolledStudents || 0}/{c.maxStudents}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {humanizeEnum(c.mode)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="font-sora font-extrabold text-navy">{formatCurrency((c.feesPaise || 0) / 100)}</span>
                  <Link to={queryHref} className="text-xs font-bold text-sky hover:underline">Query &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTeacherProfile;
