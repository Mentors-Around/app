import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Compass, Star, MapPin, BookOpen } from 'lucide-react';
import userService from '@/services/user.service';
import Spinner from '@/components/shared/Spinner';
import StarRating from '@/components/shared/StarRating';

const StudentFavourites = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Saved Tutors — TrueEd';
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    setLoading(true);
    try {
      const { data } = await userService.getSavedTeachers();
      setTeachers(data?.data ?? data ?? []);
    } catch (err) {
      toast.error(err?.message || 'Could not load saved tutors');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (teacherId) => {
    try {
      await userService.unsaveTeacher(teacherId);
      toast.success('Removed from saved tutors');
      setTeachers((prev) => prev.filter((t) => t._id !== teacherId));
    } catch (err) {
      toast.error(err?.message || 'Could not remove tutor');
    }
  };

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="font-sora text-2xl font-extrabold text-navy">Saved Tutors</h1>
        <p className="text-sm text-muted mt-1">Keep track of the educators you like best.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-brand-sm">
          <Heart className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-sora font-bold text-navy text-lg mb-2">No saved tutors yet</h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Browse through classrooms and save teachers whose profile or methodology you prefer.
          </p>
          <Link
            to="/student/discover"
            className="px-6 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition inline-block"
          >
            Discover Teachers
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => {
            const initials = t.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'T';

            const rating = t.profile?.stats?.averageRating ?? 5.0;
            const subjects = t.profile?.subjects ?? [];
            const reviewCount = t.profile?.stats?.totalReviews ?? 0;
            const location = t.city ? `${t.city}, ${t.state || ''}` : 'Online';

            return (
              <div
                key={t._id}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm hover:shadow-brand transition flex flex-col justify-between relative group"
              >
                <button
                  onClick={() => handleUnsave(t._id)}
                  className="absolute top-4 right-4 text-error hover:scale-115 transition p-1 bg-red-50 rounded-full"
                  title="Remove from saved"
                >
                  <Heart size={16} className="fill-current" />
                </button>

                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {t.avatarUrl ? (
                      <img
                        src={t.avatarUrl}
                        alt={t.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-sora font-extrabold text-sm">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h4 className="font-sora font-bold text-navy group-hover:text-sky transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {location}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Specialities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.length > 0 ? (
                        subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide"
                          >
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          General Education
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={rating} />
                    <span className="text-xs font-bold text-navy">{rating.toFixed(1)}</span>
                    <span className="text-xs text-muted">({reviewCount})</span>
                  </div>

                  <Link
                    to={`/teachers/${t._id}`}
                    className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-hover transition"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentFavourites;
