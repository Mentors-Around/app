import React, { useState, useRef } from 'react';
import { X, Crop, Check, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

export default function AvatarCropModal({ isOpen, onClose, imageSrc, onSaveSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const { updateUser } = useAuth();

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Perform canvas crop
      const canvas = document.createElement('canvas');
      const size = 400; // Cloudinary transformation crops to 400x400
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const img = imgRef.current;
      if (!img) throw new Error('Image reference not found');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const viewportSize = img.parentElement ? img.parentElement.clientWidth : 192;
      const renderedWidth = img.width || viewportSize;
      const renderedHeight = img.height || viewportSize;

      const displayedWidth = renderedWidth * zoom;
      const displayedHeight = renderedHeight * zoom;

      const cropDispX = displayedWidth / 2 - viewportSize / 2 - offset.x;
      const cropDispY = displayedHeight / 2 - viewportSize / 2 - offset.y;

      const scaleNatX = img.naturalWidth / displayedWidth;
      const scaleNatY = img.naturalHeight / displayedHeight;

      const sourceX = cropDispX * scaleNatX;
      const sourceY = cropDispY * scaleNatY;
      const sourceWidth = viewportSize * scaleNatX;
      const sourceHeight = viewportSize * scaleNatY;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        size,
        size
      );
      ctx.restore();

      // Get cropped Blob
      const croppedBlob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });

      if (croppedBlob.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5 MB.');
      }

      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.user.uploadAvatar(formData).catch(() => null);
      const newAvatarUrl = res?.avatarUrl || canvas.toDataURL('image/jpeg', 0.9);

      // Save locally to trigger instant avatar update across all pages
      localStorage.setItem('trueed_teacher_photo', newAvatarUrl);
      updateUser({ avatarUrl: newAvatarUrl });
      window.dispatchEvent(new Event('trueed_avatar_updated'));
      window.dispatchEvent(new Event('trueed_student_avatar_updated'));

      if (onSaveSuccess) onSaveSuccess(newAvatarUrl);
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
          type="button"
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
          <div 
            className="w-48 h-48 rounded-full border-4 border-sky-400 shadow-inner overflow-hidden relative cursor-move bg-slate-900 select-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Avatar Crop Preview" 
              className="max-w-none pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                maxHeight: '100%',
              }}
            />
          </div>
        </div>

        <div className="w-full mt-6 space-y-2 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-navy"
          />
        </div>

        <p className="text-xs text-center text-slate-500 mb-6 font-medium">
          Drag photo to adjust. Max limit is 5 MB.
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
