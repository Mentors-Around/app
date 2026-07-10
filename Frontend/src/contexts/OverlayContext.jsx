import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const OverlayContext = createContext();

export const OverlayProvider = ({ children }) => {
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const location = useLocation();
  const overlayRefs = useRef({}); // Stores DOM refs of overlay components
  const triggerRefs = useRef({}); // Stores DOM refs of triggers (buttons)

  // 1. Close overlay on route change
  useEffect(() => {
    setActiveOverlayId(null);
  }, [location.pathname]);

  // 2. Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeOverlayId !== null) {
        setActiveOverlayId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeOverlayId]);

  // 3. Handle outside clicks globally
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!activeOverlayId) return;

      const overlayRef = overlayRefs.current[activeOverlayId];
      const triggerRef = triggerRefs.current[activeOverlayId];

      // If click was inside the overlay or its trigger, do nothing
      if (overlayRef && overlayRef.contains(e.target)) return;
      if (triggerRef && triggerRef.contains(e.target)) return;

      // Otherwise, close it
      setActiveOverlayId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeOverlayId]);

  const toggleOverlay = (id) => {
    setActiveOverlayId((prevId) => (prevId === id ? null : id));
  };

  const closeOverlay = () => {
    setActiveOverlayId(null);
  };

  const registerOverlay = (id, ref) => {
    overlayRefs.current[id] = ref;
  };

  const unregisterOverlay = (id) => {
    delete overlayRefs.current[id];
  };

  const registerTrigger = (id, ref) => {
    triggerRefs.current[id] = ref;
  };

  const unregisterTrigger = (id) => {
    delete triggerRefs.current[id];
  };

  return (
    <OverlayContext.Provider value={{ 
      activeOverlayId, 
      toggleOverlay, 
      closeOverlay, 
      registerOverlay, 
      unregisterOverlay,
      registerTrigger,
      unregisterTrigger
    }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => useContext(OverlayContext);

export const useOverlayRefs = (id) => {
  const { registerOverlay, unregisterOverlay, registerTrigger, unregisterTrigger } = useOverlay();
  const triggerRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current) registerTrigger(id, triggerRef.current);
    if (overlayRef.current) registerOverlay(id, overlayRef.current);
    return () => {
      unregisterTrigger(id);
      unregisterOverlay(id);
    };
  }, [id, registerOverlay, unregisterOverlay, registerTrigger, unregisterTrigger]);

  return { triggerRef, overlayRef };
};
