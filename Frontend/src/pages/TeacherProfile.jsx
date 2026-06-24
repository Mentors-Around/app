import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/shared/Spinner';

const TeacherProfile = () => {
  const { user } = useAuth();
  useEffect(() => { document.title = 'Teacher Profile — TrueEd'; }, []);
  const [available, setAvailable] = useState(true);

  const [profileForm, setProfileForm] = useState({
    bio: 'Experienced educator passionate about teaching.',
    subjects: 'Mathematics, Physics',
    rate: 800,
    location: 'Bangalore',
    qualification: 'M.Sc. Physics, B.Ed',
    experience: 8,
    languages: 'English, Hindi, Kannada',
  });

  const [availability, setAvailability] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '17:00',
    endTime: '21:00',
    maxSessions: 4,
    mode: 'Online',
    timezone: 'IST (Asia/Kolkata)'
  });

  const [classroomPrefs, setClassroomPrefs] = useState({
    oneToOne: true,
    groupClasses: true,
    maxStudents: 10
  });
  
  const [verificationStatus] = useState('Verified');

  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [rateError, setRateError] = useState('');

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

  const handleSaveProfile = () => {
    const rateNum = Number(profileForm.rate);
    if (rateNum < 100 || rateNum > 10000) {
      setRateError('Rate must be between ₹100 and ₹10,000');
      return;
    }
    setRateError('');
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-[800px] mx-auto relative pb-12">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Teacher Profile</h1>
      
      {/* Success Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${successToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-success text-white px-6 py-3 rounded-full font-semibold shadow-brand-xl flex items-center gap-2">
          <i className="fa-solid fa-circle-check" /> Profile updated successfully!
        </div>
      </div>
      
      {/* Verification Status */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          <i className="fa-solid fa-shield-check text-lg"></i>
          <span className="font-bold text-sm">Verified Teacher</span>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Professional Information */}
        <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <i className="fa-solid fa-user-tie text-sky"></i> Professional Information
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted">Available for bookings:</span>
              <button onClick={() => setAvailable(!available)} className={`w-12 h-6 rounded-full p-1 transition-colors ${available ? 'bg-success' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${available ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Bio</label>
              <textarea
                rows="3"
                maxLength={500}
                value={profileForm.bio}
                onChange={e => {
                  if (e.target.value.length <= 500) {
                    setProfileForm({ ...profileForm, bio: e.target.value });
                  }
                }}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky resize-none transition font-medium text-navy"
              />
              <p className="text-xs text-muted mt-1">{profileForm.bio.length}/500</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Subjects Taught (comma separated)</label>
              <input
                type="text"
                maxLength={100}
                value={profileForm.subjects}
                onChange={e => {
                  if (e.target.value.length <= 100) {
                    setProfileForm({ ...profileForm, subjects: e.target.value });
                  }
                }}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Qualification</label>
                <input
                  type="text"
                  value={profileForm.qualification}
                  onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  value={profileForm.experience}
                  onChange={e => setProfileForm({ ...profileForm, experience: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Languages Known</label>
                <input
                  type="text"
                  value={profileForm.languages}
                  onChange={e => setProfileForm({ ...profileForm, languages: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={profileForm.rate}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      setProfileForm({ ...profileForm, rate: val });
                      setRateError('');
                    }
                  }}
                  className={`w-full py-2.5 px-3 border rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition ${rateError ? 'border-red-400' : 'border-slate-200'}`}
                />
                {rateError && <p className="text-xs text-red-500 mt-1">{rateError}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Location</label>
              <input
                type="text"
                maxLength={30}
                value={profileForm.location}
                onChange={e => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 30) {
                    setProfileForm({ ...profileForm, location: val });
                  }
                }}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
              />
            </div>
          </div>
        </div>

        {/* Teaching Availability */}
        <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <i className="fa-regular fa-calendar-check text-purple-500"></i> Teaching Availability
            </h2>
          </div>
          <div className="space-y-6">
            {/* Working Days */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${availability.workingDays.includes(day) ? 'border-sky bg-sky-50 text-sky-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox" 
                      checked={availability.workingDays.includes(day)}
                      onChange={() => handleWorkingDayToggle(day)}
                      className="w-4 h-4 text-sky rounded focus:ring-sky"
                    />
                    <span className="text-sm font-bold">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Start Time</label>
                <input 
                  type="time" 
                  value={availability.startTime}
                  onChange={(e) => setAvailability({...availability, startTime: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">End Time</label>
                <input 
                  type="time" 
                  value={availability.endTime}
                  onChange={(e) => setAvailability({...availability, endTime: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Max Sessions / Day</label>
                <input 
                  type="number" 
                  min="1" max="20"
                  value={availability.maxSessions}
                  onChange={(e) => setAvailability({...availability, maxSessions: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Teaching Mode</label>
                <select 
                  value={availability.mode}
                  onChange={(e) => setAvailability({...availability, mode: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition bg-white"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Timezone</label>
                <select 
                  value={availability.timezone}
                  onChange={(e) => setAvailability({...availability, timezone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition bg-white"
                >
                  <option value="IST (Asia/Kolkata)">IST (Asia/Kolkata)</option>
                  <option value="UTC">UTC</option>
                  <option value="EST (US/Eastern)">EST (US/Eastern)</option>
                  <option value="PST (US/Pacific)">PST (US/Pacific)</option>
                </select>
              </div>
            </div>

            {/* Weekly Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-navy mb-3">Weekly Schedule Preview</h3>
              <div className="space-y-2">
                {availability.workingDays.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No working days selected.</p>
                ) : (
                  availability.workingDays.map(day => (
                    <div key={day} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0 text-sm">
                      <span className="font-bold text-slate-700 w-24">{day}</span>
                      <span className="text-slate-600 font-medium">
                        {formatTime12hr(availability.startTime)} - {formatTime12hr(availability.endTime)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Classroom Preferences */}
        <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <i className="fa-solid fa-users-rectangle text-amber-500"></i> Classroom Preferences
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-navy">One-to-One Classes</p>
                <p className="text-xs text-slate-500">Offer private tutoring sessions</p>
              </div>
              <button 
                onClick={() => setClassroomPrefs({...classroomPrefs, oneToOne: !classroomPrefs.oneToOne})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${classroomPrefs.oneToOne ? 'bg-success' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${classroomPrefs.oneToOne ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-navy">Group Classes</p>
                <p className="text-xs text-slate-500">Offer group learning sessions</p>
              </div>
              <button 
                onClick={() => setClassroomPrefs({...classroomPrefs, groupClasses: !classroomPrefs.groupClasses})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${classroomPrefs.groupClasses ? 'bg-success' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${classroomPrefs.groupClasses ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="py-3">
              <label className="block text-sm font-semibold text-navy mb-1.5">Max Students Per Classroom (Group)</label>
              <input 
                type="number" 
                min="2" max="50"
                value={classroomPrefs.maxStudents}
                disabled={!classroomPrefs.groupClasses}
                onChange={(e) => setClassroomPrefs({...classroomPrefs, maxStudents: e.target.value})}
                className={`w-full max-w-[200px] px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky font-medium text-navy transition ${!classroomPrefs.groupClasses ? 'bg-slate-50 text-slate-400' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="py-3 px-8 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition shadow-brand hover:shadow-brand-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] text-lg"
          >
            {saving ? (
              <><Spinner size="sm" /> <span className="ml-2">Saving Profile...</span></>
            ) : (
              <><i className="fa-regular fa-floppy-disk mr-2"></i> Save Profile</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeacherProfile;
