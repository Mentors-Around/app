import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-brand-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-expand-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-sora text-lg font-bold text-navy dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-navy dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 pt-0 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
};
export default Modal;
