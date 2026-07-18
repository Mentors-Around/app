import React, { useState, useEffect } from 'react';

export default function ProcessingOverlay() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const handleStart = () => setActiveRequests(prev => prev + 1);
    const handleEnd = () => setActiveRequests(prev => Math.max(0, prev - 1));

    window.addEventListener('trueed:api-start', handleStart);
    window.addEventListener('trueed:api-end', handleEnd);

    return () => {
      window.removeEventListener('trueed:api-start', handleStart);
      window.removeEventListener('trueed:api-end', handleEnd);
    };
  }, []);

  if (activeRequests === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none">
      <div className="h-1 w-full bg-sky/20 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-sky-400 via-navy to-indigo-600 animate-pulse w-full transform origin-left transition-all duration-300" />
      </div>
    </div>
  );
}
