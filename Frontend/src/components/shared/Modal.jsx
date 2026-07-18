import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-brand-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-expand-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="font-sora text-lg font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-muted">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 pt-0 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
};
export default Modal;
