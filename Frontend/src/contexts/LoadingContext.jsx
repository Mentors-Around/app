// src/contexts/LoadingContext.jsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const LoadingContext = createContext(null);

/**
 * LoadingProvider wraps the entire app and provides a global loading counter.
 * Multiple concurrent API calls are tracked — the overlay only hides when ALL
 * requests complete (counter reaches 0), preventing flash-hide issues.
 */
export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const countRef = useRef(0);

  const startLoading = useCallback(() => {
    countRef.current += 1;
    setLoadingCount(countRef.current);
  }, []);

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    setLoadingCount(countRef.current);
  }, []);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
