// src/components/shared/GlobalLoadingOverlay.jsx
// Renders on top of everything and swallows all clicks while a mutating
// request (POST/PUT/PATCH/DELETE) is in flight, so users can't fire a second
// action (double payment, double form submit, etc.) while the first is still
// processing. Driven by LoadingContext, which apiClient.js updates automatically.
import { useGlobalLoading } from '@/context/LoadingContext';
import Spinner from './Spinner';

const GlobalLoadingOverlay = () => {
  const { isLoading, message } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div
      role="alert"
      aria-busy="true"
      aria-live="assertive"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-slate-900/40 backdrop-blur-[2px]"
      // Swallow every pointer/keyboard interaction underneath while visible.
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl dark:bg-slate-800">
        <Spinner size="lg" className="text-indigo-600" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
