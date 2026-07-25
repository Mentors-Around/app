import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, BookOpen, GraduationCap, Clock, CheckCircle2, User, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function PublicStudentProfile() {
  const { studentId } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStudentProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.user.getProfile(studentId);
        if (res) {
          setProfileData(res);
          document.title = (res.user?.name || 'Student') + ' — TrueEd';
        }
      } catch (err) {
        console.warn('Could not load student profile:', err.message);
        setError(err.message || 'We couldn\'t load this student\'s profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky" />
          <p className="font-bold text-sm">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="font-sora font-extrabold text-2xl text-navy mb-3">Access Denied / Profile Not Found</h1>
          <p className="text-slate-500 font-medium mb-8">
            {error || "You do not have permission to view this profile or the student does not exist."}
          </p>
          <Link to="/" className="inline-block px-8 py-3.5 bg-navy text-white font-bold rounded-xl shadow-sm hover:shadow-md transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { user, attendancePercentage, classroomsEnrolled, walletBalanceRupees, queryTokens, classroomsCreated } = profileData;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'S';

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 hidden md:block">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-navy transition">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-navy">{user.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: Avatar and Quick Stats */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-sky/10 border-2 border-sky/30 flex items-center justify-center text-navy font-bold text-3xl mb-4 overflow-hidden shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <h1 className="font-sora font-extrabold text-2xl text-navy mb-1">{user.name}</h1>
              <span className="text-xs font-bold text-sky bg-sky/5 px-3 py-1 rounded-full mb-4">
                @{user.username || 'student'}
              </span>

              <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Role</span>
                  <span className="font-bold text-navy capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Location</span>
                  <span className="font-bold text-navy">{[user.city, user.state].filter(Boolean).join(', ') || 'Not specified'}</span>
                </div>
                {attendancePercentage !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Attendance</span>
                    <span className="font-bold text-emerald-600">{attendancePercentage}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Role Specific Details */}
          <div className="flex-1 space-y-6">
            {/* Admin view details */}
            {currentUser?.role === 'admin' && (
              <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <h2 className="font-sora font-bold text-navy text-xl border-b border-slate-100 pb-3 flex items-center gap-2">
                  <i className="fa-solid fa-lock text-red-500"></i> Admin View Controls
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-navy text-sm">{user.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="font-semibold text-navy text-sm">{user.phone || 'N/A'}</p>
                  </div>
                  {walletBalanceRupees !== undefined && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wallet Cash Balance</p>
                      <p className="font-extrabold text-emerald-600 text-base">₹{walletBalanceRupees}</p>
                    </div>
                  )}
                  {queryTokens !== undefined && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Token Balance</p>
                      <p className="font-extrabold text-amber-hover text-base">{queryTokens} Tokens</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky" /> Enrolled Classrooms
                  </h3>
                  {!classroomsEnrolled || classroomsEnrolled.length === 0 ? (
                    <p className="text-slate-500 font-medium text-sm italic">Not enrolled in any classrooms.</p>
                  ) : (
                    <div className="space-y-3">
                      {classroomsEnrolled.map((e, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                          <div>
                            <p className="font-bold text-navy text-sm">{e.classroomId?.title || 'Classroom'}</p>
                            <p className="text-xs text-slate-500">{e.classroomId?.subject} • {e.classroomId?.mode}</p>
                          </div>
                          <span className="text-xs font-bold bg-green-50 text-success px-2 py-1 rounded">
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teacher view details */}
            {currentUser?.role === 'teacher' && (
              <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                <h2 className="font-sora font-bold text-navy text-xl border-b border-slate-100 pb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-sky-500" /> Student Profile
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance</p>
                    <p className="font-extrabold text-navy text-lg">{attendancePercentage || 100}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <p className="font-extrabold text-emerald-600 text-lg">Active</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky" /> Classrooms Shared With You
                  </h3>
                  {profileData.myClassroomEnrollments?.length === 0 ? (
                    <p className="text-slate-500 font-medium text-sm italic">Not enrolled in any of your classrooms.</p>
                  ) : (
                    <div className="space-y-3">
                      {profileData.myClassroomEnrollments?.map((e, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-sky/20 bg-sky/5">
                          <div>
                            <p className="font-bold text-navy text-sm">{e.classroomId?.title || 'Classroom'}</p>
                            <p className="text-xs text-slate-500">{e.classroomId?.subject} • {e.classroomId?.mode}</p>
                          </div>
                          <span className="text-xs font-bold bg-green-50 text-success px-2 py-1 rounded">
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
