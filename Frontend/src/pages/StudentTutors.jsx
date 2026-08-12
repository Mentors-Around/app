import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorCard from '../components/shared/TutorCard';
import Pagination from '../components/shared/Pagination';
import api from '../services/api';

const PER_PAGE = 6;

const StudentTutors = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchTutors = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.teacher.search(q).catch(() => null);
      const list = res?.docs || res?.teachers || [];
      setTeachers(list);
    } catch (err) {
      console.warn('Failed to fetch tutors:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'View Tutors — TrueEd';
    fetchTutors();
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchTutors(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    fetchTutors('');
  };

  // Pagination logic
  const totalDocs = teachers.length;
  const totalPages = Math.ceil(totalDocs / PER_PAGE);
  const startIndex = (page - 1) * PER_PAGE;
  const paginatedTeachers = teachers.slice(startIndex, startIndex + PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1B2D5B] to-[#2B4582] text-white p-8 md:p-12 shadow-brand">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-amber text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4 shadow-sm">
            Expert Educators
          </span>
          <h1 className="font-sora font-extrabold text-3xl md:text-5xl tracking-tight leading-tight">
            Find the Perfect Tutor
          </h1>
          <p className="text-white/80 font-medium text-base md:text-lg mt-3">
            Browse verified teacher profiles, view credentials, and communicate directly to start your classrooms.
          </p>
        </div>
        <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: "url('/banner-pattern.svg')" }} />
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row items-center bg-slate-50 rounded-full border border-slate-200 overflow-hidden h-14 sm:h-16">
          <div className="flex-1 flex items-center w-full h-full pl-6 pr-4">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3 text-lg" />
            <input 
              type="text" 
              placeholder="Search tutors by name, subject, username, city..." 
              className="w-full h-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400 font-medium text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="pr-4 text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto h-full px-8 bg-gradient-to-r from-[#1B2D5B] to-[#2B4582] text-white font-bold text-sm hover:opacity-90 transition flex items-center justify-center shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-slate-500 font-bold text-sm">
            Showing {Math.min(startIndex + 1, totalDocs)} - {Math.min(startIndex + PER_PAGE, totalDocs)} of {totalDocs} Tutors
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <span className="inline-block w-8 h-8 border-4 border-slate-200 border-t-navy rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading teacher profiles...</p>
          </div>
        ) : paginatedTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-solid fa-graduation-cap" />
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">No tutors found</h3>
            <p className="text-muted text-sm max-w-sm mx-auto mb-6">We couldn't find any teacher matching "{searchQuery}". Try using different terms.</p>
            <button onClick={handleClearSearch} className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
              Reset Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTeachers.map((tutor) => (
                <TutorCard key={tutor.id || tutor._id} tutor={tutor} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-100 flex justify-center">
                <Pagination 
                  currentPage={page} 
                  totalPages={totalPages} 
                  onPageChange={(p) => { setPage(p); window.scrollTo(0, 300); }} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentTutors;
