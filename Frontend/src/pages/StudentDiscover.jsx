import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tutors as allTutors } from '../data/tutors';
import SortDropdown from '../components/student/SortDropdown';
import TutorCard from '../components/shared/TutorCard';
import Pagination from '../components/shared/Pagination';

const PER_PAGE = 6;
const subjectsList = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Hindi'];
const levelsList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE', 'NEET', 'CUET', 'UPSC', 'Programming', 'Spoken English', 'Music', 'Karate'];
const responseTimes = ['Any', 'Within 12 hours', 'Within 24 hours'];

const searchSubjects = [
  // Academics
  { name: "Mathematics", category: "Academics", emoji: "📚" },
  { name: "Physics", category: "Academics", emoji: "📚" },
  { name: "Chemistry", category: "Academics", emoji: "📚" },
  { name: "Biology", category: "Academics", emoji: "📚" },
  { name: "Science", category: "Academics", emoji: "📚" },
  { name: "English", category: "Academics", emoji: "📚" },
  { name: "Hindi", category: "Academics", emoji: "📚" },
  { name: "Kannada", category: "Academics", emoji: "📚" },
  { name: "Sanskrit", category: "Academics", emoji: "📚" },
  { name: "French", category: "Academics", emoji: "📚" },
  { name: "German", category: "Academics", emoji: "📚" },
  { name: "Spanish", category: "Academics", emoji: "📚" },
  // Technology
  { name: "Computer Science", category: "Technology", emoji: "💻" },
  { name: "Programming", category: "Technology", emoji: "💻" },
  { name: "Web Development", category: "Technology", emoji: "💻" },
  { name: "App Development", category: "Technology", emoji: "💻" },
  { name: "Python", category: "Technology", emoji: "💻" },
  { name: "Java", category: "Technology", emoji: "💻" },
  { name: "C++", category: "Technology", emoji: "💻" },
  { name: "Data Science", category: "Technology", emoji: "💻" },
  { name: "Artificial Intelligence", category: "Technology", emoji: "💻" },
  { name: "Machine Learning", category: "Technology", emoji: "💻" },
  { name: "Cyber Security", category: "Technology", emoji: "💻" },
  // Commerce
  { name: "Accounting", category: "Commerce", emoji: "📈" },
  { name: "Economics", category: "Commerce", emoji: "📈" },
  { name: "Business Studies", category: "Commerce", emoji: "📈" },
  { name: "Finance", category: "Commerce", emoji: "📈" },
  { name: "Statistics", category: "Commerce", emoji: "📈" },
  // Humanities
  { name: "History", category: "Humanities", emoji: "🌍" },
  { name: "Geography", category: "Humanities", emoji: "🌍" },
  { name: "Political Science", category: "Humanities", emoji: "🌍" },
  { name: "Sociology", category: "Humanities", emoji: "🌍" },
  { name: "Psychology", category: "Humanities", emoji: "🌍" },
  // Competitive Exams
  { name: "JEE", category: "Competitive Exams", emoji: "🏆" },
  { name: "NEET", category: "Competitive Exams", emoji: "🏆" },
  { name: "UPSC", category: "Competitive Exams", emoji: "🏆" },
  { name: "KPSC", category: "Competitive Exams", emoji: "🏆" },
  { name: "GATE", category: "Competitive Exams", emoji: "🏆" },
  { name: "CAT", category: "Competitive Exams", emoji: "🏆" },
  { name: "IELTS", category: "Competitive Exams", emoji: "🏆" },
  { name: "TOEFL", category: "Competitive Exams", emoji: "🏆" },
  { name: "SSC", category: "Competitive Exams", emoji: "🏆" },
  { name: "Banking Exams", category: "Competitive Exams", emoji: "🏆" },
  // Arts & Skills
  { name: "Drawing", category: "Arts & Skills", emoji: "🎨" },
  { name: "Painting", category: "Arts & Skills", emoji: "🎨" },
  { name: "Guitar", category: "Arts & Skills", emoji: "🎨" },
  { name: "Piano", category: "Arts & Skills", emoji: "🎨" },
  { name: "Singing", category: "Arts & Skills", emoji: "🎨" },
  { name: "Dance", category: "Arts & Skills", emoji: "🎨" },
  { name: "Photography", category: "Arts & Skills", emoji: "🎨" },
  { name: "Public Speaking", category: "Arts & Skills", emoji: "🎨" },
  { name: "Content Writing", category: "Arts & Skills", emoji: "🎨" },
  // Sports & Wellness
  { name: "Yoga", category: "Sports & Wellness", emoji: "🧘" },
  { name: "Karate", category: "Sports & Wellness", emoji: "🧘" },
  { name: "Chess", category: "Sports & Wellness", emoji: "🧘" },
  { name: "Cricket Coaching", category: "Sports & Wellness", emoji: "🧘" },
  { name: "Fitness Training", category: "Sports & Wellness", emoji: "🧘" },
  { name: "Meditation", category: "Sports & Wellness", emoji: "🧘" },
];

const classGroups = [
  {
    title: "Primary School",
    classes: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"]
  },
  {
    title: "Middle School",
    classes: ["Class 6", "Class 7", "Class 8"]
  },
  {
    title: "High School",
    classes: ["Class 9", "Class 10"]
  },
  {
    title: "Higher Secondary",
    classes: ["Class 11", "Class 12"]
  }
];

const getSubjectColorBg = (subject) => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'bg-blue-500';
  if (s.includes('phys')) return 'bg-purple-500';
  if (s.includes('bio')) return 'bg-green-500';
  if (s.includes('chem')) return 'bg-orange-500';
  if (s.includes('computer')) return 'bg-teal-500';
  if (s.includes('hindi')) return 'bg-pink-500';
  if (s.includes('english')) return 'bg-amber-500';
  return 'bg-sky-500';
};

// Lightweight animated counter hook
const useAnimatedCount = (target) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = count;
    if (start === target) return;
    const duration = 500;
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(start + (target - start) * easeProgress));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    requestAnimationFrame(animate);
  }, [target]); 
  return count;
};

const FilterDropdown = ({ isOpen, onClose, onApply, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:bottom-auto lg:left-0 lg:top-full lg:mt-3 bg-white lg:rounded-2xl rounded-t-2xl p-6 shadow-2xl lg:min-w-[340px] z-50 animate-slide-up sm:animate-slide-up-sm max-h-[85vh] overflow-y-auto cursor-default">
        {children}
        <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
          <button onClick={onClose} className="text-slate-500 font-medium hover:text-navy transition underline underline-offset-4">
            Cancel
          </button>
          <button onClick={onApply} className="bg-[#1B2D5B] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-blue-900 transition shadow-md">
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

const StudentDiscover = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('recommended');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    subjects: searchParams.get('subject') ? [searchParams.get('subject')] : [],
    minRating: null,
    minPrice: '',
    maxPrice: '',
    distance: 10,
    typeOfClass: [],
    classGrades: [],
    levels: [],
    quickResponse: null,
  });

  const [openDropdown, setOpenDropdown] = useState(null);
  const [localFilters, setLocalFilters] = useState(filters);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  useEffect(() => { document.title = 'Discover Tutors — TrueEd'; }, []);

  useEffect(() => {
    const sub = searchParams.get('subject');
    if (sub) {
      setFilters(prev => ({ 
        ...prev, 
        subjects: [sub]
      }));
      setSearchQuery(sub);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleEsc = (e) => { 
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setSearchDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleDropdown = (id) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
    } else {
      setLocalFilters(filters);
      setOpenDropdown(id);
    }
  };

  const applyDropdown = () => {
    setFilters(localFilters);
    setPage(1);
    setOpenDropdown(null);
  };

  const handleReset = () => {
    const resetState = { 
      subjects: [], minRating: null, minPrice: '', maxPrice: '', distance: 10, typeOfClass: [], classGrades: [], levels: [], quickResponse: null
    };
    setFilters(resetState);
    setLocalFilters(resetState);
    setPage(1);
  };

  const isActive = {
    type: filters.typeOfClass && filters.typeOfClass.length > 0,
    distance: filters.distance !== null && filters.distance !== 10,
    classGrade: filters.classGrades && filters.classGrades.length > 0,
    fee: !!filters.minPrice || !!filters.maxPrice,
    level: filters.levels && filters.levels.length > 0,
    response: filters.quickResponse && filters.quickResponse !== 'Any',
    subject: filters.subjects && filters.subjects.length > 0,
    rating: !!filters.minRating
  };

  const hasAnyActive = Object.values(isActive).some(v => v);

  const filtered = useMemo(() => {
    let list = [...allTutors];

    const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
    if (classroomsRaw) {
      try {
        const classrooms = JSON.parse(classroomsRaw);
        list = list.map(tutor => {
          const teacherClassrooms = classrooms.filter(c => c.teacher === tutor.name);
          if (teacherClassrooms.length > 0) {
            const subjects = [...new Set(teacherClassrooms.map(c => c.subject).filter(Boolean))];
            const levels = [...new Set(teacherClassrooms.map(c => c.classLevel).filter(Boolean))];
            return { ...tutor, dynamicSubjects: subjects, dynamicLevels: levels };
          }
          return tutor;
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => 
        t.name.toLowerCase().includes(q) || 
        t.subject.toLowerCase().includes(q) || 
        (t.dynamicSubjects && t.dynamicSubjects.some(s => s.toLowerCase().includes(q))) ||
        (t.dynamicLevels && t.dynamicLevels.some(l => l.toLowerCase().includes(q))) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q))) ||
        (t.bio && t.bio.toLowerCase().includes(q))
      );
    }
    if (filters.minRating) {
      list = list.filter((t) => t.rating >= filters.minRating);
    }
    if (filters.minPrice) {
      list = list.filter((t) => t.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      list = list.filter((t) => t.price <= Number(filters.maxPrice));
    }
    if (filters.distance !== null && filters.distance !== 10) {
      if (filters.distance === 0) {
        list = list.filter((t) => t.mode === 'Online' || t.mode === 'Both');
      }
    }
    if (filters.levels && filters.levels.length > 0) {
      list = list.filter((t) => 
        filters.levels.some(l => 
          (t.dynamicLevels && t.dynamicLevels.some(dl => dl.toLowerCase().includes(l.toLowerCase()))) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(l.toLowerCase()))) ||
          (t.bio && t.bio.toLowerCase().includes(l.toLowerCase()))
        )
      );
    }
    if (filters.classGrades && filters.classGrades.length > 0) {
      list = list.filter((t) => 
        filters.classGrades.some(grade => 
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(grade.toLowerCase()))) || 
          (t.bio && t.bio.toLowerCase().includes(grade.toLowerCase())) ||
          (t.subject && t.subject.toLowerCase().includes(grade.toLowerCase()))
        )
      );
    }
    
    if (filters.typeOfClass && filters.typeOfClass.length > 0) {
      list = list.filter(t => {
        if (filters.typeOfClass.includes('online') && (t.mode === 'Online' || t.mode === 'Both')) return true;
        if (filters.typeOfClass.includes('face_to_face') && (t.mode === 'Offline' || t.mode === 'Both')) return true;
        if (filters.typeOfClass.includes('around_me')) return true;
        return false;
      });
    }
    
    if (locationQuery) {
      list = list.filter((t) => t.location && t.location.toLowerCase().includes(locationQuery.toLowerCase()));
    }

    switch (sortBy) {
      case 'toprated': list.sort((a, b) => b.rating - a.rating); break;
      case 'highestrated': list.sort((a, b) => b.rating - a.rating); break;
      case 'mostreviews': list.sort((a, b) => b.reviews - a.reviews); break;
      case 'pricelowtohigh': list.sort((a, b) => a.price - b.price); break;
      case 'pricehightolow': list.sort((a, b) => b.price - a.price); break;
      case 'mostexperienced': list.sort((a, b) => parseInt(b.experience) - parseInt(a.experience)); break;
      default: list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [filters, sortBy, searchQuery, locationQuery]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const animatedCount = useAnimatedCount(filtered.length);

  const clearSingleFilter = (id, e) => {
    e.stopPropagation();
    const next = { ...filters };
    if (id === 'type') next.typeOfClass = [];
    if (id === 'classGrade') next.classGrades = [];
    if (id === 'distance') next.distance = 10;
    if (id === 'fee') { next.minPrice = ''; next.maxPrice = ''; }
    if (id === 'level') next.levels = [];
    if (id === 'response') next.quickResponse = null;
    if (id === 'subject') next.subjects = [];
    if (id === 'rating') next.minRating = null;
    setFilters(next);
    setLocalFilters(next);
    setPage(1);
    setOpenDropdown(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 ml-0 relative">
      
      {/* Top Section */}
      <div className="bg-white border-b border-gray-100 flex flex-col pt-4 z-30 relative">

        {/* Large Hero Search Bar */}
        <div className="px-6 pb-6 w-full flex flex-col items-center">
          <div className="relative w-full max-w-[800px]">
            {searchDropdownOpen && (
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setSearchDropdownOpen(false)}
              />
            )}
            
            <div className={`relative z-20 flex flex-col sm:flex-row items-center bg-white rounded-3xl sm:rounded-full shadow-lg border border-gray-200 overflow-visible sm:h-16 ${searchDropdownOpen ? 'ring-2 ring-navy/10' : ''}`}>
              {/* Subject Input Section */}
              <div className="flex-1 flex items-center w-full h-14 sm:h-full pl-6 border-b sm:border-b-0 sm:border-r border-gray-200">
                <i className="fa-solid fa-book-open text-gray-400 mr-3 text-lg" />
                <input 
                  type="text" 
                  placeholder="Search Subjects, Tutors, Exams..." 
                  className="w-full h-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400 font-medium text-base sm:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchDropdownOpen(true)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({ ...filters, subjects: [] });
                    }}
                    className="pr-4 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>

              {/* Location Section */}
              <div className="flex-1 flex items-center w-full h-14 sm:h-full pl-6 pr-4">
                <i className="fa-solid fa-location-dot text-gray-400 mr-3 text-lg" />
                <input 
                  type="text" 
                  placeholder="Enter Area, City or PIN Code" 
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full h-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400 font-medium text-base sm:text-lg"
                />
                
                {/* Search Button (Desktop inside input area, Mobile stacked below) */}
                <div className="hidden sm:block ml-2">
                  <button className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1B2D5B] to-[#2B4582] text-white flex items-center justify-center hover:shadow-lg transition">
                    <i className="fa-solid fa-magnifying-glass text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Search Button */}
            <div className="sm:hidden mt-4 w-full">
               <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1B2D5B] to-[#2B4582] text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition">
                  <i className="fa-solid fa-magnifying-glass" />
                  Search
                </button>
            </div>

            {/* Subject Autocomplete Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute top-[68px] sm:top-full left-0 sm:mt-4 w-full sm:w-[50%] bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-30 max-h-[400px] overflow-y-auto">
                {!searchQuery ? (
                  <div>
                    <h4 className="px-5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trending searches</h4>
                    {['Mathematics', 'English', 'Physics', 'Guitar', 'Yoga', 'Hindi', 'Biology', 'Computer Science', 'Dance', 'Chess'].map(subj => (
                      <button 
                        key={subj}
                        onClick={() => {
                          setSearchQuery(subj);
                          setFilters({ ...filters, subjects: [subj] });
                          setSearchDropdownOpen(false);
                          setPage(1);
                        }}
                        className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-magnifying-glass text-gray-400 text-xs" />
                        </div>
                        <span className="text-gray-700 font-medium">{subj}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {searchSubjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                      searchSubjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(subj => (
                        <button 
                          key={subj.name}
                          onClick={() => {
                            setSearchQuery(subj.name);
                            setFilters({ ...filters, subjects: [subj.name] });
                            setSearchDropdownOpen(false);
                            setPage(1);
                          }}
                          className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition group"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                            {subj.emoji}
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium group-hover:text-navy">{subj.name}</div>
                            <div className="text-xs text-gray-400">{subj.category}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-8 text-center text-gray-500">
                        No subjects found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Helper text & Quick filters */}
            <div className="mt-6 flex flex-col items-center">
              <p className="text-gray-500 text-sm mb-4">Find verified tutors near your location or learn online from anywhere.</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button 
                  onClick={() => {
                    const active = (filters.typeOfClass || []).includes('around_me');
                    setFilters(prev => ({...prev, typeOfClass: active ? prev.typeOfClass.filter(v => v !== 'around_me') : [...prev.typeOfClass, 'around_me']}));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${filters.typeOfClass?.includes('around_me') ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  📍 Near Me
                </button>
                <button 
                  onClick={() => {
                    const active = (filters.typeOfClass || []).includes('online');
                    setFilters(prev => ({...prev, typeOfClass: active ? prev.typeOfClass.filter(v => v !== 'online') : [...prev.typeOfClass, 'online']}));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${filters.typeOfClass?.includes('online') ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  💻 Online Classes
                </button>
                <button 
                  onClick={() => {
                    const active = (filters.typeOfClass || []).includes('face_to_face');
                    setFilters(prev => ({...prev, typeOfClass: active ? prev.typeOfClass.filter(v => v !== 'face_to_face') : [...prev.typeOfClass, 'face_to_face']}));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${filters.typeOfClass?.includes('face_to_face') ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  🏠 Offline Classes
                </button>
                <div className="flex flex-wrap items-center gap-2 mt-4 max-w-[800px] w-full hide-scrollbar overflow-x-auto pb-1">
                  {/* Free Trial Button Removed */}
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Find Your Perfect Tutor</h1>
            <p className="text-sm text-gray-500 mt-1">Browse verified teachers, compare profiles, and book sessions instantly.</p>
          </div>
          <div className="flex items-center">
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <SortDropdown value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }} />
            </div>
          </div>
        </div>
        
        {/* Filter pills row */}
        <div className="w-full overflow-x-auto lg:overflow-visible scrollbar-hide px-6 pb-4">
          <div className="flex items-center gap-3 w-max">
            
            {/* Pill: Class / Grade */}
            <div className="relative">
              <button onClick={() => toggleDropdown('classGrade')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.classGrade ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                {filters.classGrades && filters.classGrades.length > 0 ? filters.classGrades[0] + (filters.classGrades.length > 1 ? ` +${filters.classGrades.length - 1}` : '') : 'Class / Grade'} <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.classGrade ? 'text-white' : 'text-slate-400'}`} />
                {isActive.classGrade && <span onClick={(e) => clearSingleFilter('classGrade', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              <FilterDropdown isOpen={openDropdown === 'classGrade'} onClose={() => setOpenDropdown(null)} onApply={applyDropdown}>
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {classGroups.map(group => (
                    <div key={group.title}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{group.title}</h4>
                      <div className="space-y-3">
                        {group.classes.map(cls => {
                          const checked = (localFilters.classGrades || []).includes(cls);
                          return (
                            <label key={cls} className="flex items-center justify-between cursor-pointer group">
                              <span className={`text-sm font-medium ${checked ? 'text-navy' : 'text-slate-700 group-hover:text-navy'}`}>{cls}</span>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-[#1B2D5B] border-[#1B2D5B]' : 'bg-white border-slate-300 group-hover:border-[#1B2D5B]'}`}>
                                {checked && <i className="fa-solid fa-check text-white text-xs" />}
                              </div>
                              <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                const arr = localFilters.classGrades || [];
                                setLocalFilters({ ...localFilters, classGrades: checked ? arr.filter(x => x !== cls) : [...arr, cls] });
                              }} />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </FilterDropdown>
            </div>

            {/* Pill: Distance */}
            <div className="relative">
              <button onClick={() => toggleDropdown('distance')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.distance ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                Distance <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.distance ? 'text-white' : 'text-slate-400'}`} />
                {isActive.distance && <span onClick={(e) => clearSingleFilter('distance', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              
              {openDropdown === 'distance' && (
                <>
                  <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setOpenDropdown(null)} />
                  <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:bottom-auto lg:left-0 lg:top-full lg:mt-3 bg-white lg:rounded-3xl rounded-t-3xl shadow-2xl z-50 animate-slide-up sm:animate-slide-up-sm min-w-[420px] p-8 cursor-default">
                    <h3 className="text-lg font-bold text-gray-900">
                      I'm willing to travel a maximum distance of : <span className="text-amber-500 font-bold">{localFilters.distance ?? 10}km</span>
                    </h3>

                    <div className="mt-8 relative pt-8 pb-2">
                      <div 
                        className="absolute top-0 -translate-x-1/2 bg-[#1B2D5B] text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                        style={{ left: `${((localFilters.distance ?? 10) - 1) / 49 * 100}%` }}
                      >
                        {localFilters.distance ?? 10}km
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={localFilters.distance ?? 10}
                        onChange={(e) => setLocalFilters({ ...localFilters, distance: parseInt(e.target.value) })}
                        className="distance-slider"
                        style={{ background: `linear-gradient(to right, #1B2D5B 0%, #1B2D5B ${((localFilters.distance ?? 10) - 1) / 49 * 100}%, #e5e7eb ${((localFilters.distance ?? 10) - 1) / 49 * 100}%, #e5e7eb 100%)` }}
                      />
                      <div className="flex justify-between items-center mt-3 text-sm text-gray-400 font-medium">
                        <span>1km</span>
                        <span>50km+</span>
                      </div>
                    </div>

                    <div className="mt-10 border-t border-gray-100 pt-6 flex justify-between items-center">
                      <button onClick={() => setOpenDropdown(null)} className="text-gray-400 text-base font-medium hover:text-navy transition underline underline-offset-4">
                        Cancel
                      </button>
                      <button onClick={applyDropdown} className="bg-[#1B2D5B] text-white px-8 py-3 rounded-full text-base font-bold hover:bg-blue-900 transition shadow-md">
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pill: Fee */}
            <div className="relative">
              <button onClick={() => toggleDropdown('fee')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.fee ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                Fee <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.fee ? 'text-white' : 'text-slate-400'}`} />
                {isActive.fee && <span onClick={(e) => clearSingleFilter('fee', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              <FilterDropdown isOpen={openDropdown === 'fee'} onClose={() => setOpenDropdown(null)} onApply={applyDropdown}>
                <h3 className="text-lg font-semibold text-navy mb-5">Fee range</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.minPrice || ''}
                      onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl py-3 pl-8 pr-3 text-base outline-none focus:border-[#1B2D5B] transition"
                    />
                  </div>
                  <span className="text-slate-400 font-medium">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.maxPrice || ''}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl py-3 pl-8 pr-3 text-base outline-none focus:border-[#1B2D5B] transition"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setLocalFilters({ ...localFilters, minPrice: '', maxPrice: '300' })} className="px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-full hover:border-[#1B2D5B] transition font-medium">Under ₹300</button>
                  <button onClick={() => setLocalFilters({ ...localFilters, minPrice: '300', maxPrice: '600' })} className="px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-full hover:border-[#1B2D5B] transition font-medium">₹300 - ₹600</button>
                  <button onClick={() => setLocalFilters({ ...localFilters, minPrice: '600', maxPrice: '' })} className="px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-full hover:border-[#1B2D5B] transition font-medium">₹600+</button>
                </div>
              </FilterDropdown>
            </div>

            {/* Pill: Level */}
            <div className="relative">
              <button onClick={() => toggleDropdown('level')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.level ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                Level <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.level ? 'text-white' : 'text-slate-400'}`} />
                {isActive.level && <span onClick={(e) => clearSingleFilter('level', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              <FilterDropdown isOpen={openDropdown === 'level'} onClose={() => setOpenDropdown(null)} onApply={applyDropdown}>
                <div className="space-y-4">
                  {levelsList.map(lvl => {
                    const checked = (localFilters.levels || []).includes(lvl);
                    return (
                      <label key={lvl} className="flex items-center justify-between cursor-pointer group">
                        <span className={`text-base font-medium ${checked ? 'text-navy' : 'text-slate-700'}`}>{lvl}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-[#1B2D5B] border-[#1B2D5B]' : 'bg-white border-slate-300'}`}>
                          {checked && <i className="fa-solid fa-check text-white text-xs" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                          const arr = localFilters.levels || [];
                          setLocalFilters({ ...localFilters, levels: checked ? arr.filter(x => x !== lvl) : [...arr, lvl] });
                        }} />
                      </label>
                    )
                  })}
                </div>
              </FilterDropdown>
            </div>

            {/* Pill: Response time */}
            <div className="relative">
              <button onClick={() => toggleDropdown('response')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.response ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                Response time <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.response ? 'text-white' : 'text-slate-400'}`} />
                {isActive.response && <span onClick={(e) => clearSingleFilter('response', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              <FilterDropdown isOpen={openDropdown === 'response'} onClose={() => setOpenDropdown(null)} onApply={applyDropdown}>
                <div className="space-y-4">
                  {responseTimes.map(opt => {
                    const checked = localFilters.quickResponse === opt || (opt === 'Any' && !localFilters.quickResponse);
                    return (
                      <label key={opt} className="flex items-center justify-between cursor-pointer group">
                        <span className={`text-base font-medium ${checked ? 'text-navy' : 'text-slate-700'}`}>{opt}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${checked ? 'border-[#1B2D5B]' : 'border-slate-300'}`}>
                          {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#1B2D5B]" />}
                        </div>
                        <input type="radio" name="response_time" className="sr-only" checked={checked} onChange={() => {
                          setLocalFilters({ ...localFilters, quickResponse: opt === 'Any' ? null : opt })
                        }} />
                      </label>
                    )
                  })}
                </div>
              </FilterDropdown>
            </div>


            {/* Pill: Rating */}
            <div className="relative">
              <button onClick={() => toggleDropdown('rating')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive.rating ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B2D5B]'}`}>
                Rating <i className={`fa-solid fa-chevron-down text-[10px] ${isActive.rating ? 'text-white' : 'text-slate-400'}`} />
                {isActive.rating && <span onClick={(e) => clearSingleFilter('rating', e)} className="ml-1 flex items-center justify-center rounded-full hover:bg-white/20 transition"><i className="fa-solid fa-xmark text-[11px]" /></span>}
              </button>
              <FilterDropdown isOpen={openDropdown === 'rating'} onClose={() => setOpenDropdown(null)} onApply={applyDropdown}>
                <div className="flex gap-3">
                  {[
                    { label: '⭐ 5', value: 5 },
                    { label: '⭐ 4+', value: 4 },
                    { label: '⭐ 3+', value: 3 },
                  ].map(r => {
                    const active = localFilters.minRating === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setLocalFilters({ ...localFilters, minRating: active ? null : r.value })}
                        className={`flex-1 py-3 text-base font-semibold rounded-xl border-2 transition ${
                          active ? 'bg-[#1B2D5B] text-white border-[#1B2D5B]' : 'bg-white text-slate-700 border-slate-200 hover:border-[#1B2D5B]'
                        }`}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </FilterDropdown>
            </div>

            {/* Clear All */}
            {hasAnyActive && (
              <button onClick={handleReset} className="ml-2 text-sm font-semibold text-slate-500 hover:text-[#1B2D5B] underline underline-offset-4 transition">
                Clear all
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 z-10 relative">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Showing {animatedCount} matching tutors
          </p>
        </div>

        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {paginated.map((t) => <TutorCard key={t.id} tutor={t} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="text-5xl mb-4 opacity-50">🔍</span>
            <h3 className="text-lg font-semibold text-navy mb-1">No teachers found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">We couldn't find any tutors matching your filters. Try adjusting them or clearing all filters.</p>
            <button onClick={handleReset} className="py-2.5 px-6 bg-[#1B2D5B] text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition shadow-sm">
              Clear all filters
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pb-10">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

    </div>
  );
};
export default StudentDiscover;
