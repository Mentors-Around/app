import { useState, useRef } from 'react';
import { X, Crop, Upload, Check, AlertCircle } from 'lucide-react';

export default function ImageCropModal({ isOpen, imageSrc, onClose, onCropComplete }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

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

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    if (!img) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = (img.naturalWidth / img.width) * zoom;
    const cropX = (img.width / 2 - offset.x / zoom - 100) * scale;
    const cropY = (img.height / 2 - offset.y / zoom - 100) * scale;
    const cropSize = 200 * scale;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropSize,
      cropSize,
      0,
      0,
      size,
      size
    );
    ctx.restore();

    canvas.toBlob((blob) => {
      onCropComplete(blob, canvas.toDataURL('image/jpeg', 0.9));
      onClose();
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-sora font-bold text-lg text-navy flex items-center gap-2">
            <Crop className="w-5 h-5 text-sky-500" />
            Crop & Adjust Photo
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div 
            className="w-64 h-64 rounded-full border-4 border-navy shadow-inner overflow-hidden relative cursor-move bg-slate-900 select-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              className="max-w-none pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                maxHeight: '100%',
              }}
            />
          </div>

          <div className="w-full mt-6 space-y-2">
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
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-md flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Save Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
}
