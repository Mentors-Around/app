import { useState, useEffect } from 'react';
import { Camera, Edit2, Mail, Phone, MapPin, BookOpen, User, CheckCircle, X, Shield, ArrowRight, Target, LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import StudentAvatar from '../components/shared/StudentAvatar';
import ProfileCompletionCard from '../components/shared/ProfileCompletionCard';
import api from '../services/api';

import ImageCropModal from '../components/shared/ImageCropModal';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    isUsernameChanged: !!user?.isUsernameChanged,
    city: user?.city || '',
    createdAt: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently',
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.title = 'My Profile — TrueEd';
    window.scrollTo(0, 0);
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        isUsernameChanged: !!user.isUsernameChanged,
        city: user.city || '',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently',
      });
      setAvatarUrl(user.avatarUrl || null);
      setNewUsername(user.username || '');
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEditProfileClick = () => {
    setEditForm({
      name: profile.name,
      city: profile.city,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.user.updateMe(editForm);
      updateUser(res);
      setIsEditing(false);
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.message || "Failed to update profile.");
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const res = await api.user.updateUsername(newUsername);
      updateUser({ username: res.username, isUsernameChanged: true });
      setShowUsernameModal(false);
      showToast("Username updated successfully.");
    } catch (err) {
      showToast(err.message || "Failed to update username.");
    }
  };

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob, croppedDataUrl) => {
    try {
      setAvatarUrl(croppedDataUrl);
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const res = await api.user.uploadAvatar(formData).catch(() => null);
      if (res?.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        updateUser({ avatarUrl: res.avatarUrl });
      } else {
        updateUser({ avatarUrl: croppedDataUrl });
      }
      showToast("Profile picture updated successfully.");
    } catch (err) {
      showToast(err.message || "Failed to update profile picture.");
    }
  };

  const completionFields = [
    { name: 'Name', isComplete: !!profile.name, id: 'personal-info' },
    { name: 'Email', isComplete: !!profile.email, id: 'personal-info' },
    { name: 'Username', isComplete: !!profile.username, id: 'personal-info' },
    { name: 'City', isComplete: !!profile.city, id: 'personal-info' },
    { name: 'Profile Photo', isComplete: !!avatarUrl, id: 'avatar-section' },
  ];

  const handleFieldClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8 animate-fadeIn relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 z-[100] animate-slide-up-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-navy to-sky-600"></div>
        
        <div className="relative pt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar Section */}
            <div id="avatar-section" className="relative group transition-all duration-300 rounded-full">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-4xl font-bold text-navy shadow-lg overflow-hidden relative z-10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <StudentAvatar 
                    studentId={user?.id || 'student-1'} 
                    name={profile.name} 
                    className="w-full h-full text-4xl" 
                  />
                )}
                <label className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white cursor-pointer backdrop-blur-sm">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-semibold">Update Photo</span>
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageFileSelect} />
                </label>
              </div>
            </div>

            <div className="text-center md:text-left mb-2">
              <h1 className="font-sora text-3xl font-extrabold text-slate-900">{profile.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                  @{profile.username || 'username'}
                </span>
                {!profile.isUsernameChanged && (
                  <button 
                    onClick={() => setShowUsernameModal(true)}
                    className="text-xs font-bold text-slate-400 hover:text-navy underline"
                  >
                    Change (1 time left)
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-2">Member since {profile.createdAt}</p>
            </div>
          </div>
        </div>
      </div>

      <ProfileCompletionCard type="student" fields={completionFields} onFieldClick={handleFieldClick} />

      {/* Personal Information */}
      <div id="personal-info" className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm transition-all duration-300 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sora text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" />
            Personal Information
          </h2>
          {!isEditing && (
            <button onClick={handleEditProfileClick} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition border border-slate-200 flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</p>
            {isEditing ? (
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition" />
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="font-semibold text-slate-800">{profile.name}</p>
              </div>
            )}
          </div>

          <div className="group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</p>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="font-semibold text-slate-800">{profile.email}</p>
            </div>
          </div>

          <div className="group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</p>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="font-semibold text-slate-800">{profile.phone || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
          </div>

          <div className="group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> City</p>
            {isEditing ? (
              <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition" />
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="font-semibold text-slate-800">{profile.city || <span className="text-slate-400 italic">Not set</span>}</p>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-sm">
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-sora text-xl font-bold text-navy">Change Username</h3>
            <p className="text-xs text-slate-500 font-medium">You can change your username ONLY ONCE across TrueEd. Make sure to choose carefully.</p>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Username</label>
              <input 
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. olivia_2026"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-navy"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowUsernameModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUsernameUpdate}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition shadow-sm"
              >
                Save Username
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
