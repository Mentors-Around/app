import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Heart, CheckCircle2, MapPin, Star, Calendar, Monitor, Award, BookOpen, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { tutors } from '../data/tutors';
import TutorCard from '../components/shared/TutorCard';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import useAuth from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import api from '../services/api';

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
  const [queryError, setQueryError] = useState(null);
  const [querySuccessToast, setQuerySuccessToast] = useState(false);
  const { tokens, requireTokens } = useWallet();

  // ── API-first profile loading ───────────────────────────────────────────────
  // Security: backend already strips phone, email, bankAccount, aadhaarNumber,
  // kycDocumentIds from the public profile response.
  const [apiProfile, setApiProfile] = useState(null);
  const [apiClassrooms, setApiClassrooms] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Try loading from real backend first; fall back to static tutors data for demos
  const tutorData = tutors.find(t => t.id.toString() === profileId);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchApiProfile = async () => {
      setApiLoading(true);
      try {
        // Only attempt API fetch if profileId looks like a MongoDB ObjectId
        if (profileId && /^[a-f0-9]{24}$/i.test(profileId)) {
          const res = await api.user.getProfile(profileId);
          if (res && res.user) {
            setApiProfile(res);
            setApiClassrooms(res.activeClassrooms || res.classrooms || []);
            document.title = (res.user?.name || 'Teacher') + ' — TrueEd';
          }
        } else {
          // Static demo tutor — use tutorData
          const rawName = tutorData ? tutorData.name : 'Teacher';
          document.title = rawName + ' — TrueEd';
        }
      } catch (err) {
        console.warn('Could not load teacher API profile:', err.message);
        // Fall through to static data
        const rawName = tutorData ? tutorData.name : 'Teacher';
        document.title = rawName + ' — TrueEd';
      } finally {
        setApiLoading(false);
      }
    };
    fetchApiProfile();
  }, [profileId]);

  // Show loading state while fetching from API
  if (apiLoading && /^[a-f0-9]{24}$/i.test(profileId)) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky" />
          <p className="font-bold text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If it's a MongoDB ID but no profile was found, and no static tutorData either
  if (!apiProfile && !tutorData) {
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

  // ── Merge API data with static fallback (API takes priority) ──────────────
  // IMPORTANT: We NEVER display phone, email, bank account, or KYC details.
  // The backend already strips them server-side — this is a defence-in-depth check.
  const apiUser = apiProfile?.user || {};
  const apiProf = apiProfile?.profile || {};
  const apiStats = apiProfile?.stats || {};

  const teacher = {
    name: apiUser.name || tutorData?.name || 'Unknown Teacher',
    initials: (() => {
      const n = apiUser.name || tutorData?.name || '';
      const parts = n.trim().split(/\s+/);
      return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0]?.[0] || '?').toUpperCase();
    })(),
    subject: (apiProf.subjects?.[0]) || tutorData?.subject || 'Not specified',
    subjects: apiProf.subjects || (tutorData?.subject ? [tutorData.subject] : []),
    location: [apiUser.city, apiUser.state].filter(Boolean).join(', ') || tutorData?.location || 'Not specified',
    rating: apiStats.avgRating || tutorData?.rating || 0,
    reviews: apiStats.totalReviews || tutorData?.reviews || 0,
    experience: apiProf.experienceYears ? `${apiProf.experienceYears} years` : (tutorData?.experience || 'Not specified'),
    mode: tutorData?.mode || 'Online',
    verified: apiProf.verificationStatus === 'approved' || tutorData?.verified || apiProfile?.profile ? true : false,
    bio: apiProf.bio || tutorData?.bio || 'No bio available.',
    headline: apiProf.headline || tutorData?.headline || '',
    boards: apiProf.subjects || tutorData?.tags || [],
    languages: apiProf.languages || tutorData?.languages || [],
    achievements: tutorData?.achievements || [],
    introVideoUrl: apiProf.introVideoUrl || null,
    completionRate: apiProfile?.completionRate !== undefined ? apiProfile.completionRate : 100,
    activeClassrooms: apiProfile?.activeClassrooms || [],
    completedClassrooms: apiProfile?.completedClassrooms || [],
    // NOTE: phone, email, bankAccount, aadhaarNumber are intentionally excluded
  };

  const [actualReviews, setActualReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    avgRating: teacher.rating,
    totalReviews: teacher.reviews,
    starsBreakdown: [
      { stars: 5, pct: '0%' },
      { stars: 4, pct: '0%' },
      { stars: 3, pct: '0%' },
      { stars: 2, pct: '0%' },
      { stars: 1, pct: '0%' }
    ],
    categories: {
      teachingQuality: 0,
      subjectKnowledge: 0,
      communication: 0,
      punctuality: 0,
      doubtSolving: 0
    }
  });

  useEffect(() => {
    const reviewsRaw = localStorage.getItem('trueed_reviews');
    if (reviewsRaw) {
      const allReviews = JSON.parse(reviewsRaw);
      const teacherReviews = allReviews.filter(r => r.teacherId === profileId && r.verified);
      
      setActualReviews(teacherReviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

      if (teacherReviews.length > 0) {
        let sumRating = 0;
        let starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let catSums = { teachingQuality: 0, subjectKnowledge: 0, communication: 0, punctuality: 0, doubtSolving: 0 };
        
        teacherReviews.forEach(r => {
          sumRating += r.overallRating;
          starCounts[r.overallRating] = (starCounts[r.overallRating] || 0) + 1;
          
          if (r.categories) {
            catSums.teachingQuality += r.categories.teachingQuality || 0;
            catSums.subjectKnowledge += r.categories.subjectKnowledge || 0;
            catSums.communication += r.categories.communication || 0;
            catSums.punctuality += r.categories.punctuality || 0;
            catSums.doubtSolving += r.categories.doubtSolving || 0;
          }
        });

        const total = teacherReviews.length;
        setReviewStats({
          avgRating: (sumRating / total).toFixed(1),
          totalReviews: total,
          starsBreakdown: [
            { stars: 5, pct: `${(starCounts[5] / total * 100).toFixed(0)}%` },
            { stars: 4, pct: `${(starCounts[4] / total * 100).toFixed(0)}%` },
            { stars: 3, pct: `${(starCounts[3] / total * 100).toFixed(0)}%` },
            { stars: 2, pct: `${(starCounts[2] / total * 100).toFixed(0)}%` },
            { stars: 1, pct: `${(starCounts[1] / total * 100).toFixed(0)}%` },
          ],
          categories: {
            teachingQuality: (catSums.teachingQuality / total).toFixed(1),
            subjectKnowledge: (catSums.subjectKnowledge / total).toFixed(1),
            communication: (catSums.communication / total).toFixed(1),
            punctuality: (catSums.punctuality / total).toFixed(1),
            doubtSolving: (catSums.doubtSolving / total).toFixed(1),
          }
        });
      }
    }
  }, [profileId]);

  let dynamicSubjects = [];
  let dynamicLevels = [];
  let teacherClassrooms = [];
  if (apiClassrooms && apiClassrooms.length > 0) {
    teacherClassrooms = apiClassrooms.map(c => ({
      id: c._id || c.id,
      name: c.title,
      subject: c.subject,
      classLevel: c.skillLevel,
      price: c.feesRupees || (c.feesPaise / 100) || 0,
      mode: c.mode === 'online' ? 'Online' : (c.mode === 'offline' ? 'Offline' : 'Both'),
      status: c.status || 'active',
      scheduleDays: c.schedule?.map(s => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[s.day];
      }) || [],
      startTime: c.schedule?.[0]?.startTime || '--',
      endTime: c.schedule?.[0]?.endTime || '--',
      maxStudents: c.maxStudents || 20,
      students: c.stats?.enrolledStudents || 0
    }));
    dynamicSubjects = [...new Set(teacherClassrooms.map(c => c.subject).filter(Boolean))];
    dynamicLevels = [...new Set(teacherClassrooms.map(c => c.classLevel).filter(Boolean))];
  } else {
    const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
    if (classroomsRaw) {
      try {
        const classrooms = JSON.parse(classroomsRaw);
        teacherClassrooms = classrooms.filter(c => c.teacherId === profileId || c.teacher === teacher.name);
        // Only show active classrooms
        teacherClassrooms = teacherClassrooms.filter(c => c.status === 'active');
        if (teacherClassrooms.length > 0) {
          dynamicSubjects = [...new Set(teacherClassrooms.map(c => c.subject).filter(Boolean))];
          dynamicLevels = [...new Set(teacherClassrooms.map(c => c.classLevel).filter(Boolean))];
        }
      } catch (e) {}
    }
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
                <TeacherAvatar 
                  teacherId={profileId} 
                  name={teacher.name} 
                  initials={teacher.initials} 
                  className="w-24 h-24 mb-4 text-3xl" 
                />
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
                    <span className="font-bold text-navy">{reviewStats.avgRating}</span>
                    <span className="text-xs text-muted font-medium">({reviewStats.totalReviews})</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Mode</p>
                  <p className="font-semibold text-sm text-navy flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-slate-400" /> {teacher.mode}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Experience</p>
                  <p className="font-semibold text-sm text-navy flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {teacher.experience}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Completion Rate</p>
                  <p className="font-semibold text-sm text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {teacher.completionRate}%
                  </p>
                </div>
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
                <div className="animate-fade-in space-y-8">
                  {/* Active Classrooms */}
                  <div>
                    <h3 className="font-sora font-bold text-navy text-lg mb-4">Active Classrooms</h3>
                    {teacherClassrooms.filter(r => r.status === 'active').length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-slate-500 text-sm font-medium">No active classrooms available.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacherClassrooms.filter(r => r.status === 'active').map((room) => (
                          <div key={room.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-navy/30 transition-all shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">
                                {room.subject} • {room.classLevel || 'General'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                 ((room.students || 0) >= (room.maxStudents || 20) ? 'bg-red-50 text-error' : 'bg-green-50 text-success')
                               }`}>
                                {((room.students || 0) >= (room.maxStudents || 20) ? 'Full' : 'Active')}
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
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                <i className="fa-solid fa-users text-slate-400 w-3.5" /> 
                                {Math.max(0, (room.maxStudents || 20) - (room.students || 0))} Seats Available (Max: {room.maxStudents || 20})
                              </p>
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

                  {/* Completed Classrooms */}
                  <div>
                    <h3 className="font-sora font-bold text-navy text-lg mb-4">Completed Classrooms</h3>
                    {teacherClassrooms.filter(r => r.status === 'completed').length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-slate-500 text-sm font-medium">No completed classrooms.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacherClassrooms.filter(r => r.status === 'completed').map((room) => (
                          <div key={room.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm opacity-80">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider">
                                {room.subject} • {room.classLevel || 'General'}
                              </span>
                              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded-md uppercase tracking-wider">
                                Completed
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-700 text-base mb-2 line-clamp-2">{room.name}</h4>
                            
                            <div className="space-y-2 mb-4">
                              <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Completed on TrueEd
                              </p>
                              <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5 text-slate-400" /> {room.mode || 'Online'}
                              </p>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-slate-200 gap-2">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Enrolled</p>
                                <p className="font-sora font-extrabold text-slate-700">{room.students} Students</p>
                              </div>
                              <Link to={`/classroom/${room.id}`} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition">
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* ABOUT TAB */}
              {activeTab === 'About' && (
                <div className="animate-fade-in">
                  <h3 className="font-sora font-bold text-navy text-lg mb-3">About Me</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-8 font-medium">
                    {teacher.bio}
                  </p>

                  {teacher.introVideoUrl && (
                    <div className="mb-8">
                      <h4 className="font-bold text-navy text-sm mb-3">Teaching Style Video</h4>
                      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
                        {teacher.introVideoUrl.includes('youtube.com') || teacher.introVideoUrl.includes('youtu.be') ? (
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${
                              teacher.introVideoUrl.includes('watch?v=') 
                                ? teacher.introVideoUrl.split('watch?v=')[1]?.split('&')[0] 
                                : teacher.introVideoUrl.split('/').pop()
                            }`}
                            title="Intro Video"
                            allowFullScreen
                          />
                        ) : (
                          <video src={teacher.introVideoUrl} controls className="w-full h-full" />
                        )}
                      </div>
                    </div>
                  )}

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
                      <p className="font-sora font-extrabold text-5xl text-navy mb-2">{reviewStats.avgRating}</p>
                      <div className="flex gap-1 text-amber mb-1 justify-center md:justify-start">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(reviewStats.avgRating) ? 'fill-amber' : 'fill-slate-200 text-slate-200'}`} />)}
                      </div>
                      <p className="text-xs font-bold text-slate-500">Based on {reviewStats.totalReviews} verified reviews</p>
                    </div>
                    
                    <div className="flex-1 w-full space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 pr-0 md:pr-8">
                      {reviewStats.starsBreakdown.map((bar) => (
                        <div key={bar.stars} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 w-6">{bar.stars} ★</span>
                          <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber rounded-full" style={{ width: bar.pct }} />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-8 text-right">{bar.pct}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 w-full space-y-3 pl-0 md:pl-2 pt-6 md:pt-0">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Category Ratings</h4>
                      {[
                        { label: 'Teaching Quality', score: reviewStats.categories.teachingQuality },
                        { label: 'Subject Knowledge', score: reviewStats.categories.subjectKnowledge },
                        { label: 'Communication', score: reviewStats.categories.communication },
                        { label: 'Punctuality', score: reviewStats.categories.punctuality },
                        { label: 'Doubt Solving', score: reviewStats.categories.doubtSolving },
                      ].map(cat => (
                        <div key={cat.label} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>{cat.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-sky rounded-full" style={{ width: `${(cat.score / 5) * 100}%` }} />
                            </div>
                            <span className="w-6 text-right font-bold text-navy">{cat.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-6">
                    {actualReviews.length > 0 ? actualReviews.map(r => (
                      <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                              {r.studentInitials}
                            </div>
                            <div>
                              <h5 className="font-bold text-navy text-sm flex items-center gap-2">
                                {r.studentName} 
                                {r.verified && <span className="bg-sky/10 text-sky text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Student</span>}
                              </h5>
                              <p className="text-xs font-medium text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-amber">
                            {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= r.overallRating ? 'fill-amber text-amber' : 'text-slate-200 fill-slate-200'}`} />)}
                          </div>
                        </div>
                        {r.text && <p className="text-sm font-medium text-slate-600 pl-0 ml-0 sm:pl-13 sm:ml-13">{r.text}</p>}
                        
                        {r.reply && (
                          <div className="mt-4 ml-0 sm:ml-13 bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                            <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-50 border-t border-l border-slate-100 rotate-45"></div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-navy flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-slate-400" /> Teacher Reply
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-600">{r.reply}</p>
                          </div>
                        )}
                      </div>
                    )) : (
                      <p className="text-center text-slate-500 font-medium py-10">No reviews yet.</p>
                    )}
                  </div>
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



      {/* Success Toast */}
      {querySuccessToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Inquiry Sent Successfully!
        </div>
      )}

    </div>
  );
};

export default PublicTeacherProfile;
