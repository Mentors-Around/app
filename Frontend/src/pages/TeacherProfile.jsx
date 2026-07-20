import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/shared/Spinner';
import { Camera, CheckCircle2, Mail, Phone, Edit2, Shield, ChevronDown, ChevronRight, User, Video, Briefcase, GraduationCap, Languages, MapPin, BookOpen, AlertCircle, Clock, XCircle } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import ProfileCompletionCard from '../components/shared/ProfileCompletionCard';
import AvatarCropModal from '../components/shared/AvatarCropModal';
import api from '../services/api.js';

const TeacherProfile = () => {
  const { user, kycStatus } = useAuth();
  useEffect(() => { document.title = 'Teacher Profile — TrueEd'; window.scrollTo(0, 0); }, []);
  
  const [available, setAvailable] = useState(true);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [profileForm, setProfileForm] = useState({
    bio: 'Experienced educator passionate about teaching.',
    subjects: 'Mathematics, Physics',
    location: 'Bangalore',
    qualification: 'M.Sc. Physics, B.Ed',
    experience: 8,
    languages: 'English, Hindi, Kannada',
    demoVideo: ''
  });

  const [availability, setAvailability] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '17:00', endTime: '21:00', maxSessions: 4, mode: 'Online', timezone: 'IST (Asia/Kolkata)'
  });

  const [hasPhoto, setHasPhoto] = useState(!!localStorage.getItem(`trueed_teacher_photo`));
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const data = await api.user.getMe();
        if (data) {
          setProfileForm(p => ({
            ...p,
            bio: data.bio || p.bio,
            location: data.city || p.location,
            qualification: Array.isArray(data.education) ? data.education.join(', ') : (data.education || p.qualification),
            experience: data.experienceYears || p.experience,
            subjects: Array.isArray(data.subjects) ? data.subjects.join(', ') : (data.subjects || p.subjects),
            languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || p.languages),
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch profile details:', err.message);
      }
    };
    fetchTeacherProfile();
  }, []);

  const handleWorkingDayToggle = (day) => {
    setAvailability(p => ({
      ...p,
      workingDays: p.workingDays.includes(day) 
        ? p.workingDays.filter(d => d !== day) 
        : [...p.workingDays, day].sort((a, b) => {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return days.indexOf(a) - days.indexOf(b);
          })
    }));
  };

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const handleEditProfileClick = () => {
    setEditForm({ ...profileForm });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const subjectsArray = editForm.subjects.split(',').map(s => s.trim()).filter(Boolean);
      await api.teacher.submitProfile({
        bio: editForm.bio,
        subjects: subjectsArray.length > 0 ? subjectsArray : ['General'],
        experienceYears: Number(editForm.experience || 0),
        city: editForm.location,
      }).catch(() => null);

      await api.user.updateMe({
        bio: editForm.bio,
        city: editForm.location,
      }).catch(() => null);

      setProfileForm(editForm);
      setIsEditing(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.warn('Error saving profile:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      await api.teacher.updateAvailability(availability).catch(() => null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.warn('Error updating availability:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5 MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    localStorage.removeItem(`trueed_teacher_photo`);
    window.dispatchEvent(new Event('trueed_avatar_updated'));
  };



  const completionFields = [
    { name: 'Profile Photo', isComplete: hasPhoto, id: 'avatar-section' },
    { name: 'Bio', isComplete: !!profileForm.bio, id: 'prof-info' },
    { name: 'Qualification', isComplete: !!profileForm.qualification, id: 'prof-info' },
    { name: 'Experience', isComplete: !!profileForm.experience, id: 'prof-info' },
    { name: 'Subjects', isComplete: !!profileForm.subjects, id: 'prof-info' },
    { name: 'Languages', isComplete: !!profileForm.languages, id: 'prof-info' },
    { name: 'Location', isComplete: !!profileForm.location, id: 'prof-info' },
    { name: 'Teaching Demo Video', isComplete: !!profileForm.demoVideo, id: 'prof-info' }
  ];

  const handleFieldClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-sky', 'ring-offset-4', 'rounded-xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-sky', 'ring-offset-4', 'rounded-xl'), 2000);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto relative pb-12 px-4 sm:px-0">
      <h1 className="font-sora text-2xl font-bold text-navy mb-4">Teacher Profile</h1>
      
      {/* Success Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${successToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-success text-white px-6 py-3 rounded-full font-semibold shadow-brand-xl flex items-center gap-2">
          <i className="fa-solid fa-circle-check" /> Profile updated successfully!
        </div>
      </div>



      <div className="space-y-8">
        
        {/* Profile Header */}
        <div id="avatar-section" className="bg-white rounded-brand shadow-brand p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative border border-slate-100 transition-all duration-300">
          <div className="relative group">
            <TeacherAvatar teacherId={user?.id || '1'} name={user?.name} initials={user?.initials} className="w-32 h-32 text-4xl" />
            <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-navy/40 backdrop-blur-[2px] rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white mb-1" />
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/jpeg, image/png, image/webp" className="hidden" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="font-sora font-bold text-2xl text-navy mb-1">{user?.name || 'Hari Prasad L'}</h2>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              {kycStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Teacher
                </span>
              )}
              <span className="text-sm font-semibold text-slate-500">
                <MapPin className="w-4 h-4 inline mr-1" /> {profileForm.location}
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition">Upload Photo</button>
              {hasPhoto && <button onClick={handleRemovePhoto} className="px-4 py-2 text-error text-sm font-bold hover:bg-red-50 rounded-lg transition">Remove</button>}
            </div>
          </div>
        </div>

        <ProfileCompletionCard type="teacher" fields={completionFields} onFieldClick={handleFieldClick} />



        {/* Professional Information */}
        <div id="prof-info" className="bg-white rounded-brand shadow-brand p-6 md:p-8 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-sky-500" /> Professional Information
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm font-semibold text-muted">Available for bookings:</span>
                <button onClick={() => setAvailable(!available)} className={`w-12 h-6 rounded-full p-1 transition-colors ${available ? 'bg-success' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${available ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              {!isEditing && (
                <button onClick={handleEditProfileClick} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition border border-slate-200 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="group md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bio</p>
              {isEditing ? (
                <div>
                  <textarea rows="3" maxLength={500} value={editForm.bio} onChange={e => { if (e.target.value.length <= 500) setEditForm({ ...editForm, bio: e.target.value }); }} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky resize-none transition font-medium text-navy" />
                  <p className="text-xs text-muted mt-1">{editForm.bio.length}/500</p>
                </div>
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800 text-sm leading-relaxed">{profileForm.bio}</p>
                </div>
              )}
            </div>

            <div className="group md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Subjects Taught</p>
              {isEditing ? (
                <input type="text" maxLength={100} value={editForm.subjects} onChange={e => { if (e.target.value.length <= 100) setEditForm({ ...editForm, subjects: e.target.value }); }} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800">{profileForm.subjects}</p>
                </div>
              )}
            </div>

            <div className="group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Qualification</p>
              {isEditing ? (
                <input type="text" value={editForm.qualification} onChange={e => setEditForm({ ...editForm, qualification: e.target.value })} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800">{profileForm.qualification}</p>
                </div>
              )}
            </div>

            <div className="group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Years of Experience</p>
              {isEditing ? (
                <input type="number" value={editForm.experience} onChange={e => setEditForm({ ...editForm, experience: e.target.value })} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800">{profileForm.experience}</p>
                </div>
              )}
            </div>

            <div className="group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Languages Known</p>
              {isEditing ? (
                <input type="text" value={editForm.languages} onChange={e => setEditForm({ ...editForm, languages: e.target.value })} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800">{profileForm.languages}</p>
                </div>
              )}
            </div>

            <div className="group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</p>
              {isEditing ? (
                <input type="text" maxLength={30} value={editForm.location} onChange={e => { const val = e.target.value; if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 30) setEditForm({ ...editForm, location: val }); }} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-semibold text-slate-800">{profileForm.location}</p>
                </div>
              )}
            </div>

            <div className="group md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Teaching Demo Video</p>
              {isEditing ? (
                <input type="text" placeholder="https://youtube.com/watch?v=..." value={editForm.demoVideo} onChange={e => setEditForm({ ...editForm, demoVideo: e.target.value })} className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              ) : (
                <div className="border-b border-slate-100 pb-2">
                  {profileForm.demoVideo ? (
                    <a href={profileForm.demoVideo} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:underline">{profileForm.demoVideo}</a>
                  ) : (
                    <p className="font-semibold text-slate-400 italic">No video added</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
              <button onClick={handleCancelEdit} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">
                Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-sm disabled:opacity-70 flex items-center gap-2">
                {saving && <Spinner size="sm" />} Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Teaching Availability */}
        <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <i className="fa-regular fa-calendar-check text-purple-500"></i> Teaching Availability
            </h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${availability.workingDays.includes(day) ? 'border-sky bg-sky-50 text-sky-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={availability.workingDays.includes(day)} onChange={() => handleWorkingDayToggle(day)} className="w-4 h-4 text-sky rounded focus:ring-sky" />
                    <span className="text-sm font-bold">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Start Time</label>
                <input type="time" value={availability.startTime} onChange={(e) => setAvailability({...availability, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">End Time</label>
                <input type="time" value={availability.endTime} onChange={(e) => setAvailability({...availability, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Max Sessions / Day</label>
                <input type="number" min="1" max="20" value={availability.maxSessions} onChange={(e) => setAvailability({...availability, maxSessions: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Teaching Mode</label>
                <select value={availability.mode} onChange={(e) => setAvailability({...availability, mode: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition bg-white">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Timezone</label>
                <select value={availability.timezone} onChange={(e) => setAvailability({...availability, timezone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition bg-white">
                  <option value="IST (Asia/Kolkata)">IST (Asia/Kolkata)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <AvatarCropModal 
        isOpen={cropModalOpen} 
        onClose={() => setCropModalOpen(false)} 
        imageSrc={cropImageSrc} 
        onSaveSuccess={() => {
          setHasPhoto(true);
          setSuccessToast(true);
          setTimeout(() => setSuccessToast(false), 3000);
        }}
      />
    </div>
  );
};

export default TeacherProfile;
