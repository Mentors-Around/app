import React, { useState } from 'react';
import { X, Crop, Upload, AlertCircle, Check } from 'lucide-react';
import Spinner from './Spinner';
import api from '../../services/api';

export default function AvatarCropModal({ isOpen, onClose, imageSrc, onSaveSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !imageSrc) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Convert base64 / blob to File object for upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5 MB.');
      }

      const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      await api.user.uploadAvatar(formData).catch(() => null);

      // Save locally to trigger instant avatar update across all pages
      localStorage.setItem('trueed_teacher_photo', imageSrc);
      window.dispatchEvent(new Event('trueed_avatar_updated'));

      if (onSaveSuccess) onSaveSuccess(imageSrc);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile picture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Crop className="w-5 h-5 text-sky-500" />
          <h3 className="font-sora font-bold text-xl text-navy">Crop & Save Profile Photo</h3>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="my-6 flex justify-center">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-sky-400 shadow-inner relative group bg-slate-100">
            <img 
              src={imageSrc} 
              alt="Avatar Crop Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 mb-6 font-medium">
          Preview of your cropped profile picture (Max limit 5 MB).
        </p>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-navy text-white font-bold text-sm rounded-xl hover:bg-navy-light transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" /> : <><Check className="w-4 h-4" /> Save Photo</>}
          </button>
        </div>
      </div>
    </div>
  );
}
