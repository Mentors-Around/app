// src/pages/teacher/TeacherProfile.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Camera, CheckCircle2, Shield, Edit2, Video, Briefcase,
  GraduationCap, Languages, MapPin, BookOpen, AlertCircle,
  Clock, XCircle, Loader2, Save, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/user.service';
import teacherService from '@/services/teacher.service';
import Spinner from '@/components/shared/Spinner';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const KYCSection = ({ kycStatus }) => {
  const statuses = {
    approved: {
      bg: 'border-emerald-200 bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      Icon: CheckCircle2, iconColor: 'text-emerald-500',
      label: 'Verified Teacher',
      heading: 'Your identity has been successfully verified.',
      body: 'You can now create classrooms, receive payments, and withdraw earnings.',
    },
    pending: {
      bg: 'border-amber-200 bg-amber-50',
      badge: 'bg-amber-100 text-amber-700 border-amber-300',
      Icon: Clock, iconColor: 'text-amber-500',
      label: 'Pending Review',
      heading: 'Your documents have been submitted.',
      body: 'The TrueEd team is reviewing your KYC. This usually takes 24–48 hours.',
    },
    under_review: {
      bg: 'border-sky-200 bg-sky-50',
      badge: 'bg-sky-100 text-sky-700 border-sky-300',
      Icon: Clock, iconColor: 'text-sky-500',
      label: 'Under Review',
      heading: 'Your documents are under review.',
      body: 'Our team is currently verifying your submitted documents.',
    },
    rejected: {
      bg: 'border-red-200 bg-red-50',
      badge: 'bg-red-100 text-red-700 border-red-300',
      Icon: XCircle, iconColor: 'text-red-500',
      label: 'Verification Rejected',
      heading: 'There was an issue with your verification.',
      body: 'Please review the reason and resubmit your documents.',
    },
  };

  const s = statuses[kycStatus] || statuses.pending;
  const { Icon } = s;

  return (
    <div className={`rounded-brand border p-6 relative overflow-hidden ${s.bg}`}>
      <div className="absolute top-4 right-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border flex items-center gap-1 ${s.badge}`}>
          <Icon className={`w-3.5 h-3.5 ${s.iconColor}`} /> {s.label}
        </span>
      </div>
      <h3 className="font-bold text-navy text-lg mb-2 mt-1">{s.heading}</h3>
      <p className="text-sm font-medium text-slate-600 mb-4">{s.body}</p>
      {(kycStatus !== 'approved' && kycStatus !== 'pending' && kycStatus !== 'under_review') && (
        <Link to="/teacher/kyc" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-hover transition shadow-sm">
          Complete KYC Verification
        </Link>
      )}
      {kycStatus === 'rejected' && (
        <Link to="/teacher/kyc" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-sm">
          Resubmit Documents
        </Link>
      )}
    </div>
  );
};

const TeacherProfile = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [availability, setAvailability] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '17:00',
    endTime: '21:00',
    maxSessions: 4,
    mode: 'online',
  });
  const [savingAvail, setSavingAvail] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => { document.title = 'My Profile — TrueEd'; }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await userService.getMe();
      const me = data?.data ?? data;
      setProfileData(me);

      // Pre-fill edit form
      setEditForm({
        bio: me.bio || '',
        qualification: me.qualification || '',
        experience: me.experience || '',
        languages: Array.isArray(me.languages) ? me.languages.join(', ') : (me.languages || ''),
        subjects: Array.isArray(me.subjects) ? me.subjects.join(', ') : (me.subjects || ''),
        city: me.city || '',
        state: me.state || '',
        demoVideoUrl: me.demoVideoUrl || '',
      });

      // Pre-fill availability
      if (me.availability) {
        setAvailability({
          workingDays: me.availability.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: me.availability.startTime || '17:00',
          endTime: me.availability.endTime || '21:00',
          maxSessions: me.availability.maxSessions || 4,
          mode: me.availability.mode || 'online',
        });
      }
    } catch (err) {
      toast.error('Could not load your profile');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        bio: editForm.bio,
        qualification: editForm.qualification,
        experience: Number(editForm.experience) || undefined,
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        subjects: editForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
        city: editForm.city,
        state: editForm.state,
        demoVideoUrl: editForm.demoVideoUrl,
      };
      await userService.updateMe(payload);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await load();
      refreshUser?.();
    } catch (err) {
      toast.error(err?.message || 'Could not save profile');
    } finally { setSaving(false); }
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    try {
      await teacherService.updateAvailability({ availability });
      toast.success('Availability updated!');
    } catch (err) {
      toast.error(err?.message || 'Could not update availability');
    } finally { setSavingAvail(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await userService.uploadAvatar(formData);
      const updated = data?.data ?? data;
      updateUser?.({ avatarUrl: updated?.avatarUrl || updated?.avatar });
      toast.success('Profile photo updated!');
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not upload photo');
    } finally { setUploadingAvatar(false); }
  };

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)),
    }));
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const kycStatus = profileData?.kycStatus || profileData?.verificationStatus || 'pending';
  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

  return (
    <div className="max-w-[900px] mx-auto pb-12 space-y-8">
      <h1 className="font-sora text-2xl font-bold text-navy">Teacher Profile</h1>

      {/* Avatar / Header Card */}
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-slate-100">
        <div className="relative group shrink-0">
          {profileData?.avatarUrl ? (
            <img src={profileData.avatarUrl} alt={profileData.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-navy text-white flex items-center justify-center text-4xl font-bold shadow-md">
              {initials(profileData?.name)}
            </div>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-navy/40 backdrop-blur-[2px] rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingAvatar ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : (
              <>
                <Camera className="w-8 h-8 text-white mb-1" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
              </>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/jpeg,image/png,image/webp" className="hidden" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="font-sora font-bold text-2xl text-navy mb-1">{profileData?.name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3 flex-wrap">
            {kycStatus === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Teacher
              </span>
            )}
            {profileData?.city && (
              <span className="text-sm font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {profileData.city}{profileData.state && `, ${profileData.state}`}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition"
          >
            Upload Photo
          </button>
        </div>
      </div>

      {/* KYC Status */}
      <div className="bg-white rounded-brand shadow-brand p-6 border border-slate-100">
        <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-500" /> Identity Verification (KYC)
        </h2>
        <KYCSection kycStatus={kycStatus} />
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-500" /> Professional Information
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition border border-slate-200 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-navy transition">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* Bio */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bio</p>
            {isEditing ? (
              <>
                <textarea rows={3} maxLength={500} value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky resize-none transition" />
                <p className="text-xs text-slate-400 mt-1">{editForm.bio.length}/500</p>
              </>
            ) : (
              <p className="font-semibold text-slate-700 text-sm leading-relaxed border-b border-slate-100 pb-2">
                {profileData?.bio || <span className="text-slate-400 italic">No bio added</span>}
              </p>
            )}
          </div>

          {/* Subjects */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Subjects Taught</p>
            {isEditing ? (
              <input type="text" value={editForm.subjects}
                onChange={e => setEditForm({ ...editForm, subjects: e.target.value })}
                placeholder="e.g. Mathematics, Physics, Chemistry"
                className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
            ) : (
              <p className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
                {Array.isArray(profileData?.subjects) ? profileData.subjects.join(', ') : (profileData?.subjects || <span className="text-slate-400 italic">Not specified</span>)}
              </p>
            )}
          </div>

          {/* Qualification */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Qualification</p>
            {isEditing ? (
              <input type="text" value={editForm.qualification}
                onChange={e => setEditForm({ ...editForm, qualification: e.target.value })}
                placeholder="e.g. M.Sc. Physics, B.Ed"
                className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
            ) : (
              <p className="font-semibold text-slate-700 border-b border-slate-100 pb-2">{profileData?.qualification || <span className="text-slate-400 italic">Not specified</span>}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Years of Experience</p>
            {isEditing ? (
              <input type="number" min={0} value={editForm.experience}
                onChange={e => setEditForm({ ...editForm, experience: e.target.value })}
                className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
            ) : (
              <p className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
                {profileData?.experience ? `${profileData.experience} years` : <span className="text-slate-400 italic">Not specified</span>}
              </p>
            )}
          </div>

          {/* Languages */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Languages Known</p>
            {isEditing ? (
              <input type="text" value={editForm.languages}
                onChange={e => setEditForm({ ...editForm, languages: e.target.value })}
                placeholder="e.g. English, Hindi, Kannada"
                className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
            ) : (
              <p className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
                {Array.isArray(profileData?.languages) ? profileData.languages.join(', ') : (profileData?.languages || <span className="text-slate-400 italic">Not specified</span>)}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</p>
            {isEditing ? (
              <div className="flex gap-2">
                <input type="text" value={editForm.city}
                  onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                  className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
                <input type="text" value={editForm.state}
                  onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="State"
                  className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
              </div>
            ) : (
              <p className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
                {[profileData?.city, profileData?.state].filter(Boolean).join(', ') || <span className="text-slate-400 italic">Not specified</span>}
              </p>
            )}
          </div>

          {/* Demo Video */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Teaching Demo Video</p>
            {isEditing ? (
              <input type="text" value={editForm.demoVideoUrl}
                onChange={e => setEditForm({ ...editForm, demoVideoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky transition" />
            ) : (
              <div className="border-b border-slate-100 pb-2">
                {profileData?.demoVideoUrl ? (
                  <a href={profileData.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:underline text-sm">
                    {profileData.demoVideoUrl}
                  </a>
                ) : <span className="text-slate-400 italic text-sm">No video added</span>}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
            <button onClick={handleSaveProfile} disabled={saving}
              className="px-6 py-2.5 bg-navy hover:bg-navy-hover text-white font-bold rounded-xl transition shadow-sm disabled:opacity-70 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Teaching Availability */}
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8 border border-slate-100">
        <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-purple-500" /> Teaching Availability
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">Working Days</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map(day => (
                <label key={day} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${availability.workingDays.includes(day) ? 'border-sky bg-sky-50 text-sky-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={availability.workingDays.includes(day)}
                    onChange={() => toggleDay(day)} className="w-4 h-4 text-sky rounded focus:ring-sky" />
                  <span className="text-sm font-bold">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Start Time</label>
              <input type="time" value={availability.startTime}
                onChange={e => setAvailability({ ...availability, startTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">End Time</label>
              <input type="time" value={availability.endTime}
                onChange={e => setAvailability({ ...availability, endTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Max Sessions / Day</label>
              <input type="number" min={1} max={20} value={availability.maxSessions}
                onChange={e => setAvailability({ ...availability, maxSessions: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Teaching Mode</label>
              <select value={availability.mode}
                onChange={e => setAvailability({ ...availability, mode: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition bg-white">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSaveAvailability} disabled={savingAvail}
              className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-hover transition shadow-sm flex items-center gap-2 disabled:opacity-70">
              {savingAvail && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Save Availability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
