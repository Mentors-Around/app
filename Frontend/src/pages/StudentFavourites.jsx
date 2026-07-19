import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const StudentFavourites = () => {
  useEffect(() => { document.title = 'Favourite Teachers — TrueEd'; }, []);

  const dummyFavourites = [
    { id: 1, name: 'Kavita Verma', subject: 'Mathematics', rating: 4.9, location: 'Online' },
    { id: 2, name: 'Arun Singh', subject: 'Physics', rating: 4.8, location: 'Bangalore' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Favourite Teachers</h1>
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        {dummyFavourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dummyFavourites.map(t => (
              <div key={t.id} className="border border-slate-100 p-4 rounded-lg hover:shadow-sm transition relative group">
                <button onClick={() => console.log('clicked')} className="absolute top-3 right-3 text-slate-300 hover:text-error transition"><i className="fa-solid fa-heart" /></button>
                <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center text-white font-bold mb-3">
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
