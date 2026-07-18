// src/context/LoadingContext.jsx
// Tracks how many "blocking" async actions are in flight app-wide and exposes
// a single boolean. apiClient.js increments/decrements this automatically for
// every mutating request (POST/PUT/PATCH/DELETE) via window events, so no
// individual page has to remember to wire it up.
//
// WHY: previously each button had its own local `loading` state, but nothing
// stopped the user from clicking a *different* button while the first request
// was still in flight — leading to double-submits, race conditions, and a
// laggy/broken feel. The <GlobalLoadingOverlay/> rendered from this context
// blocks all pointer input until the in-flight request finishes.
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const LoadingContext = createContext(null);

export const LOADING_START_EVENT = 'trueed:loading-start';
export const LOADING_END_EVENT   = 'trueed:loading-end';

export const LoadingProvider = ({ children }) => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Processing your request…');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const onStart = (e) => {
      if (e?.detail?.message) setMessage(e.detail.message);
      setCount((c) => c + 1);
    };
    const onEnd = () => setCount((c) => Math.max(0, c - 1));

    window.addEventListener(LOADING_START_EVENT, onStart);
    window.addEventListener(LOADING_END_EVENT, onEnd);
    return () => {
      window.removeEventListener(LOADING_START_EVENT, onStart);
      window.removeEventListener(LOADING_END_EVENT, onEnd);
    };
  }, []);

  // Safety valve: if something forgets to dispatch an "end" (e.g. a thrown
  // error outside the interceptor's reach), never let the overlay get stuck
  // forever — force-clear after 30s.
  useEffect(() => {
    if (count > 0) {
      timeoutRef.current = setTimeout(() => setCount(0), 30000);
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [count]);

  const value = { isLoading: count > 0, message };
  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useGlobalLoading must be used within LoadingProvider');
  return ctx;
};

// Helper for manual/non-axios async actions (e.g. Razorpay checkout popup
// flow) that still want the same blocking overlay + no-double-click guard.
export const beginGlobalLoading = (message) => {
  window.dispatchEvent(new CustomEvent(LOADING_START_EVENT, { detail: { message } }));
};
export const endGlobalLoading = () => {
  window.dispatchEvent(new CustomEvent(LOADING_END_EVENT));
};

export default LoadingContext;
