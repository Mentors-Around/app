import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Heart, CheckCircle2, MapPin, Star, Calendar, Monitor, Award, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { tutors } from '../data/tutors';
import TutorCard from '../components/shared/TutorCard';
import useAuth from '../hooks/useAuth';
import TokenPurchaseModal from '../components/shared/TokenPurchaseModal';

const getSubjectColor = (subject) => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'from-blue-400 to-blue-600';
  if (s.includes('phys')) return 'from-purple-400 to-purple-600';
  if (s.includes('bio')) return 'from-green-400 to-green-600';
  if (s.includes('chem')) return 'from-orange-400 to-orange-600';
  return 'from-sky-400 to-sky-600';
};

const getFormattedDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const dummyReviews = [
  { id: 1, name: 'Rahul S.', initial: 'R', date: getFormattedDate(-2), rating: 5, text: 'Absolutely brilliant teacher. The concepts are explained so clearly that even the hardest problems feel easy now.' },
  { id: 2, name: 'Priya M.', initial: 'P', date: getFormattedDate(-15), rating: 5, text: 'Very patient and understanding. Helped me build confidence before my final exams.' },
  { id: 3, name: 'Karan V.', initial: 'K', date: getFormattedDate(-30), rating: 4, text: 'Great teaching style. Sometimes internet issues during online classes but overall very good.' },
  { id: 4, name: 'Neha G.', initial: 'N', date: getFormattedDate(-45), rating: 5, text: 'Highly recommend! Scored 95% in boards because of the structured study plans provided.' },
  { id: 5, name: 'Amit K.', initial: 'A', date: getFormattedDate(-60), rating: 5, text: 'The mock tests and detailed feedback are a game changer.' },
];

const availabilityGrid = [
  { day: 'Mon', slots: ['09:00 AM', '04:00 PM', null] },
  { day: 'Tue', slots: [null, '05:00 PM', '07:00 PM'] },
  { day: 'Wed', slots: ['10:00 AM', null, '06:00 PM'] },
  { day: 'Thu', slots: [null, '04:00 PM', '07:00 PM'] },
  { day: 'Fri', slots: ['09:00 AM', '05:00 PM', null] },
  { day: 'Sat', slots: ['11:00 AM', '02:00 PM', '06:00 PM'] },
  { day: 'Sun', slots: [null, null, null] }, // Day off
];

const PublicTeacherProfile = () => {
  const { teacherId, id } = useParams();
  const profileId = id || teacherId;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Classrooms');
  const [saved, setSaved] = useState(false);
  const [showGeneralQueryModal, setShowGeneralQueryModal] = useState(false);
  const [generalQueryForm, setGeneralQueryForm] = useState({ subject: '', message: '' });
  const [querySuccessToast, setQuerySuccessToast] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const handleSendGeneralQueryClick = () => {
    const tokens = parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10);
    if (tokens > 0) {
      setShowGeneralQueryModal(true);
    } else {
      setIsTokenModalOpen(true);
    }
  };

  const handleGeneralQuerySubmit = (e) => {
    e.preventDefault();
    if (!generalQueryForm.subject || !generalQueryForm.message) return;

    // Deduct token
    const tokens = parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10);
    localStorage.setItem('trueed_student_tokens', (tokens - 1).toString());

    // Save Query
    const queriesRaw = localStorage.getItem('trueed_general_queries');
    const existing = queriesRaw ? JSON.parse(queriesRaw) : [];
    existing.push({
      id: Date.now(),
      type: 'general',
      teacherId: profileId,
      teacherName: tutorData ? tutorData.name : 'Unknown',
      teacherInitials: tutorData ? tutorData.initials : '?',
      studentId: user?.id || 'student-1',
      studentName: user?.name || 'Student User',
      studentInitials: user?.initials || 'ST',
      subject: generalQueryForm.subject,
      message: generalQueryForm.message,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('trueed_general_queries', JSON.stringify(existing));

    setShowGeneralQueryModal(false);
    setQuerySuccessToast(true);
    setTimeout(() => setQuerySuccessToast(false), 5000);
    setGeneralQueryForm({ subject: '', message: '' });
  };

  const tutorData = tutors.find(t => t.id.toString() === profileId);

  // Scroll to top on mount and update title
  useEffect(() => {
    window.scrollTo(0, 0);
    const rawName = tutorData ? tutorData.name : (teacherId ? teacherId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Teacher Name');
    document.title = rawName + ' — TrueEd';
  }, [profileId, tutorData, teacherId]);

  if (!tutorData) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="font-sora font-extrabold text-2xl text-navy mb-3">Tutor Not Found</h1>
          <p className="text-slate-500 font-medium mb-8">We couldn't find the tutor profile you're looking for. It might have been removed or the link is incorrect.</p>
          <Link to="/student/discover" className="inline-block px-8 py-3.5 bg-navy text-white font-bold rounded-xl shadow-sm hover:shadow-md transition">
            Browse All Tutors
          </Link>
        </div>
      </div>
    );
  }

  const teacher = {
    name: tutorData.name || 'Unknown Teacher',
    initials: tutorData.initials || '?',
    subject: tutorData.subject || 'Not specified',
    location: tutorData.location || 'Not specified',
    rating: tutorData.rating || 0,
    reviews: tutorData.reviews || 0,
    rate: tutorData.price || 0,
    experience: tutorData.experience || 'Not specified',
    mode: tutorData.mode || 'Not specified',
    verified: tutorData.verified || false,
    bio: tutorData.bio || "No description provided.",
    boards: tutorData.tags || [],
    languages: tutorData.languages || [],
    achievements: tutorData.achievements || [],
  };

  let dynamicSubjects = [];
  let dynamicLevels = [];
  let teacherClassrooms = [];
  const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
  if (classroomsRaw) {
    try {
      const classrooms = JSON.parse(classroomsRaw);
      teacherClassrooms = classrooms.filter(c => c.teacherId === profileId || c.teacher === teacher.name);
      // Only show active classrooms
      teacherClassrooms = teacherClassrooms.filter(c => c.status !== 'inactive');
      if (teacherClassrooms.length > 0) {
        dynamicSubjects = [...new Set(teacherClassrooms.map(c => c.subject).filter(Boolean))];
        dynamicLevels = [...new Set(teacherClassrooms.map(c => c.classLevel).filter(Boolean))];
      }
    } catch (e) {}
  }

  const displaySubjects = dynamicSubjects.length > 0 ? dynamicSubjects : [teacher.subject];
  const displayLevels = dynamicLevels.length > 0 ? dynamicLevels : teacher.boards;

  const similarTeachers = tutors.filter(t => t.subject === teacher.subject).slice(0, 3);

  const Tabs = ['Classrooms', 'About', 'Reviews', 'Availability', 'Achievements'];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-navy transition">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/student/discover" className="hover:text-navy transition">Discover Tutors</Link>
          <span className="mx-2">›</span>
          <span className="text-navy">{teacher.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column - Sticky Teacher Info Card */}
          <div className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0">
            <div className="bg-white rounded-brand-xl shadow-brand border border-slate-200 p-6 md:sticky md:top-36 relative">
              {/* Top Right Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => console.log('clicked')} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-navy hover:bg-slate-100 transition">
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSaved(!saved)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition"
                >
                  <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-error text-error' : 'hover:text-error'}`} />
                </button>
              </div>

              {/* Avatar & Header */}
              <div className="flex flex-col items-center text-center mt-4 mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-sora font-extrabold text-3xl mb-4 bg-gradient-to-br ${getSubjectColor(teacher.subject)} shadow-md`}>
                  {teacher.initials}
                </div>
                <h1 className="font-sora font-extrabold text-2xl text-navy flex items-center gap-2 justify-center mb-1">
                  {teacher.name}
                </h1>
                {teacher.verified && (
                  <span className="text-xs font-bold text-sky flex items-center gap-1 mb-2 bg-sky/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Profile
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {teacher.location}
                </p>
              </div>

              <hr className="border-slate-100 my-5" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rating</p>
                  <div className="flex items-center gap-1.5 text-amber">
                    <Star className="w-4 h-4 fill-amber" />
                    <span className="font-bold text-navy">{teacher.rating}</span>
                    <span className="text-xs text-muted font-medium">({teacher.reviews})</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Hourly Rate</p>
                  <p className="font-sora font-extrabold text-xl text-navy">₹{teacher.rate}<span className="text-xs font-semibold text-muted">/hr</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Mode</p>
                  <p className="font-semibold text-sm text-navy flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-slate-400" /> {teacher.mode}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Experience</p>
                  <p className="font-semibold text-sm text-navy flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {teacher.experience}</p>
                </div>
              </div>
            </div>

            {/* Premium General Inquiry Card */}
            <div className="mt-6 bg-[#F8FAFC] rounded-2xl p-5 border border-transparent hover:border-slate-100 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:bg-white group">
              <h3 className="font-sora font-bold text-slate-900 text-[15px] mb-2 flex items-center gap-2">
                <span className="opacity-90">💬</span> Ask This Teacher
              </h3>
              <p className="text-[13px] text-slate-500 mb-5 leading-relaxed pr-2">
                Have questions before choosing a classroom? Send a direct inquiry and discuss your learning goals.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="px-2.5 py-1.5 bg-slate-100 rounded-md flex items-center gap-1.5 group-hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] leading-none opacity-80">⚡</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-px">
                    Uses 1 Query Token
                  </span>
                </div>
                <button 
                  onClick={handleSendGeneralQueryClick}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:-translate-y-[2px] hover:shadow-[0_6px_16px_rgba(15,23,42,0.15)] transition-all duration-300 ease-out"
                >
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs & Content */}
          <div className="flex-1 min-w-0">
            
            {/* Tabs Header */}
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 mb-6 overflow-x-auto hide-scrollbar sticky top-16 md:top-24 z-20">
              <div className="flex px-2 min-w-max">
                {Tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-bold transition-colors relative whitespace-nowrap ${
                      activeTab === tab ? 'text-amber-hover' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-amber rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8">

              {/* CLASSROOMS TAB */}
              {activeTab === 'Classrooms' && (
                <div className="animate-fade-in">
                  <h3 className="font-sora font-bold text-navy text-lg mb-6">Available Classrooms</h3>
                  {teacherClassrooms.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-slate-500 font-medium">This teacher hasn't created any classrooms yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teacherClassrooms.map((room) => (
                        <div key={room.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-navy/30 transition-all shadow-sm group">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">
                              {room.subject} • {room.classLevel || 'General'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                               room.unlimitedStudents ? 'bg-green-50 text-success' : 
                               ((room.students || room.enrolled || 0) >= (room.capacity || room.maxStudents || 0) ? 'bg-red-50 text-error' : 'bg-green-50 text-success')
                             }`}>
                              {room.unlimitedStudents ? 'Active' : ((room.students || room.enrolled || 0) >= (room.capacity || room.maxStudents || 0) ? 'Full' : 'Active')}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-navy text-base mb-2 line-clamp-2">{room.name}</h4>
                          
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {room.scheduleDays?.length ? room.scheduleDays.join(', ') : 'TBD'} • {room.startTime || '--'} to {room.endTime || '--'}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                              <Monitor className="w-3.5 h-3.5 text-slate-400" /> {room.mode || 'Online'}
                            </p>
                            {!room.unlimitedStudents ? (
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                <i className="fa-solid fa-users text-slate-400 w-3.5" /> 
                                {(room.capacity || room.maxStudents || 0) - (room.students || room.enrolled || 0)} Seats Available (Max: {room.capacity || room.maxStudents || 0})
                              </p>
                            ) : (
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                <i className="fa-solid fa-users text-slate-400 w-3.5" /> 
                                Unlimited Seats
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-2">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Price per Student</p>
                              <p className="font-sora font-extrabold text-navy">₹{room.price}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/classroom/${room.id}`} className="px-4 py-2 bg-slate-100 text-navy text-xs font-bold rounded-lg shadow-sm hover:bg-slate-200 transition">
                                View Details
                              </Link>
                              <Link to={`/classroom/${room.id}?query=true`} className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition">
                                Send Query
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* ABOUT TAB */}
              {activeTab === 'About' && (
                <div className="animate-fade-in">

                  <h3 className="font-sora font-bold text-navy text-lg mb-3">About Me</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-8 font-medium">
                    {teacher.bio}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> Subjects Taught</h4>
                      <div className="flex flex-wrap gap-2">
                        {displaySubjects && displaySubjects.length > 0 ? (
                          displaySubjects.map(s => (
                            <span key={s} className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md">{s}</span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" /> Levels / Exams Taught</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayLevels && displayLevels.length > 0 ? (
                          displayLevels.map(l => (
                            <span key={l} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md">{l}</span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2"><Monitor className="w-4 h-4 text-slate-400" /> Teaching Mode</h4>
                      <ul className="space-y-2 text-sm font-medium text-slate-600">
                        {teacher.mode && teacher.mode !== 'Not specified' ? (
                          <li className="flex items-center gap-2">
                            <i className="fa-solid fa-circle text-[6px] text-amber" /> 
                            {teacher.mode === 'Both' ? 'Online and Offline' : teacher.mode}
                          </li>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not specified</span>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-3">Languages Spoken</h4>
                      <div className="flex flex-wrap gap-2">
                        {teacher.languages && teacher.languages.length > 0 ? (
                          teacher.languages.map(l => (
                            <span key={l} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">{l}</span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'Reviews' && (
                <div className="animate-fade-in">
                  {/* Summary */}
                  <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="text-center md:text-left flex-shrink-0">
                      <p className="font-sora font-extrabold text-5xl text-navy mb-2">{teacher.rating}</p>
                      <div className="flex gap-1 text-amber mb-1 justify-center md:justify-start">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(teacher.rating) ? 'fill-amber' : 'fill-slate-200 text-slate-200'}`} />)}
                      </div>
                      <p className="text-xs font-bold text-slate-500">Based on {teacher.reviews} reviews</p>
                    </div>
                    
                    <div className="flex-1 w-full space-y-2">
                      {[
                        { stars: 5, pct: '80%' },
                        { stars: 4, pct: '10%' },
                        { stars: 3, pct: '5%' },
                        { stars: 2, pct: '0%' },
                        { stars: 1, pct: '0%' },
                      ].map((bar) => (
                        <div key={bar.stars} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 w-6">{bar.stars} ★</span>
                          <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber rounded-full" style={{ width: bar.pct }} />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-8 text-right">{bar.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review List */}
                  <div className="space-y-6">
                    {dummyReviews.map(r => (
                      <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                              {r.initial}
                            </div>
                            <div>
                              <h5 className="font-bold text-navy text-sm">{r.name}</h5>
                              <p className="text-xs text-slate-400 font-medium">{r.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-amber">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber' : 'fill-slate-200 text-slate-200'}`} />)}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => console.log('clicked')} className="w-full py-3 mt-8 border-2 border-slate-200 rounded-xl text-sm font-bold text-navy hover:bg-slate-50 transition">
                    Load More Reviews
                  </button>
                </div>
              )}

              {/* AVAILABILITY TAB */}
              {activeTab === 'Availability' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="font-sora font-bold text-navy text-lg">Weekly Schedule</h3>
                    <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                      <Clock className="w-3.5 h-3.5" /> IST (India Standard Time)
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-500 mb-6">Slots update weekly — book early to secure your preferred time.</p>

                  <div className="overflow-x-auto hide-scrollbar pb-4">
                    <div className="min-w-[700px]">
                      {/* Grid Header */}
                      <div className="grid grid-cols-8 gap-2 mb-2">
                        <div className="p-3"></div> {/* Empty corner */}
                        {availabilityGrid.map(day => (
                          <div key={day.day} className="p-3 text-center bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-sm font-bold text-navy">{day.day}</span>
                          </div>
                        ))}
                      </div>

                      {/* Grid Body */}
                      {['Morning', 'Afternoon', 'Evening'].map((period, pIdx) => (
                        <div key={period} className="grid grid-cols-8 gap-2 mb-2">
                          <div className="p-3 flex items-center justify-end">
                            <span className="text-xs font-bold text-slate-400 uppercase">{period}</span>
                          </div>
                          {availabilityGrid.map((day) => {
                            const slot = day.slots[pIdx];
                            return (
                              <div key={`${day.day}-${period}`} className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
                                slot ? 'bg-success/10 border-success/20 text-success font-bold text-xs hover:bg-success/20 cursor-pointer' : 'bg-slate-50 border-slate-100 text-slate-300 text-xs'
                              }`}>
                                {slot || '---'}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACHIEVEMENTS TAB */}
              {activeTab === 'Achievements' && (
                <div className="animate-fade-in">
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-100">
                      <Award className="w-6 h-6 text-amber" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-sm">Outstanding Results!</h4>
                      <p className="text-xs font-medium text-slate-700 mt-1"><span className="font-bold text-amber-700">12 students</span> from this teacher successfully cracked JEE/NEET this year.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h3 className="font-sora font-bold text-navy text-lg mb-4">Education</h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        <div className="relative flex items-center gap-4 pl-8">
                          <div className="absolute left-1.5 w-3 h-3 rounded-full bg-sky ring-4 ring-white" />
                          <div>
                            <h5 className="font-bold text-navy text-sm">M.Sc. in Mathematics</h5>
                            <p className="text-xs font-medium text-slate-500">Delhi University • 2018</p>
                          </div>
                        </div>
                        <div className="relative flex items-center gap-4 pl-8">
                          <div className="absolute left-1.5 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white" />
                          <div>
                            <h5 className="font-bold text-navy text-sm">B.Sc. in Mathematics (Hons)</h5>
                            <p className="text-xs font-medium text-slate-500">Delhi University • 2016</p>
                          </div>
                        </div>
                      </div>

                      <h3 className="font-sora font-bold text-navy text-lg mt-8 mb-4">Certifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <Award className="w-5 h-5 text-sky flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-navy text-sm">Advanced Pedagogy Certificate</h5>
                            <p className="text-xs font-medium text-slate-500">National Council of Education • 2020</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-sora font-bold text-navy text-lg mb-4">Impact</h3>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-center">
                          <p className="font-sora font-extrabold text-3xl text-sky mb-1">120+</p>
                          <p className="text-xs font-bold text-slate-500 uppercase">Students Taught</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                          <p className="font-sora font-extrabold text-3xl text-purple-600 mb-1">5+</p>
                          <p className="text-xs font-bold text-slate-500 uppercase">Years Experience</p>
                        </div>
                      </div>

                      <h4 className="font-bold text-navy text-sm mb-3">Student Success Stories</h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                          <i className="fa-solid fa-quote-left absolute top-3 left-3 text-slate-200 text-xl" />
                          <p className="text-sm font-medium text-slate-600 relative z-10 pl-6 italic">"I went from failing math to scoring 92% in my 12th boards. Couldn't have done it without this guidance."</p>
                          <p className="text-xs font-bold text-navy mt-2 pl-6">— Arjun K., IIT Delhi 2025</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Bottom Section - Similar Teachers */}
        <div className="mt-16">
          <h2 className="font-sora font-bold text-2xl text-navy mb-8">Similar Teachers You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarTeachers.map(t => <TutorCard key={t.id} tutor={t} />)}
          </div>
        </div>
      </div>

      {/* General Inquiry Modal */}
      {showGeneralQueryModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="font-sora font-bold text-xl text-navy">General Inquiry</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">To: {teacher.name}</p>
              </div>
              <button onClick={() => setShowGeneralQueryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleGeneralQuerySubmit} className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-sky shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-navy mb-1">Uses 1 Query Token</p>
                  <p className="text-xs font-semibold text-slate-600">You currently have {parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10)} tokens.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. JEE Preparation Help"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-all"
                  value={generalQueryForm.subject}
                  onChange={(e) => setGeneralQueryForm({...generalQueryForm, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe your learning goals, current grade, or any questions you have..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-all resize-none"
                  value={generalQueryForm.message}
                  onChange={(e) => setGeneralQueryForm({...generalQueryForm, message: e.target.value})}
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TokenPurchaseModal 
        isOpen={isTokenModalOpen} 
        onClose={() => setIsTokenModalOpen(false)} 
        onSuccess={(tokens) => {
          setIsTokenModalOpen(false);
          setShowGeneralQueryModal(true);
        }} 
      />

      {/* Success Toast */}
      {querySuccessToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-success" />
          General Inquiry Sent Successfully!
        </div>
      )}

    </div>
  );
};

export default PublicTeacherProfile;
