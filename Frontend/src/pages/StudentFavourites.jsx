import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StudentFavourites = () => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Favourite Teachers — TrueEd';
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const res = await api.student.getSavedTeachers().catch(() => null);
        const list = Array.isArray(res) ? res : (res?.teachers || res?.docs || []);
        const mapped = list.map(t => {
          const u = t.userId || t;
          return {
            id: u._id || u.id || t._id,
            name: u.name || 'Teacher',
            subject: (t.subjects?.[0]) || 'General',
            rating: t.stats?.avgRating || 5.0,
            location: u.city || 'Online'
          };
        });
        setFavourites(mapped);
      } catch (err) {
        console.warn('Failed to load saved teachers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Favourite Teachers</h1>
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium">Loading favourites...</div>
        ) : favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favourites.map(t => (
              <div key={t.id} className="border border-slate-100 p-4 rounded-lg hover:shadow-sm transition relative group">
                <button className="absolute top-3 right-3 text-error transition"><i className="fa-solid fa-heart" /></button>
                <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-bold mb-3">
                  {t.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <h4 className="font-bold text-navy">{t.name}</h4>
                <p className="text-xs text-muted">{t.subject} · {t.location}</p>
                <p className="text-xs text-amber font-semibold mt-1"><i className="fa-solid fa-star" /> {t.rating}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-16">
            <span className="text-6xl mb-4">❤️</span>
            <h3 className="text-xl font-semibold text-navy mb-2">No favourite teachers yet</h3>
            <p className="text-slate-500 mb-6">Save teachers you like while browsing</p>
            <Link to="/student/discover" className="bg-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-navy-light transition shadow-md">
              Discover Teachers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentFavourites;
