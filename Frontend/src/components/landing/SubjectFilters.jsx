import React, { useRef, useEffect, useState } from 'react';
import { categories } from '../../data/subjects';

const SubjectFilters = ({ activeCategory, setActiveCategory }) => {
  const containerRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 mb-12">
      {/* Left Fade */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      )}
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex items-center overflow-x-auto hide-scrollbar gap-3 scroll-smooth py-2"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
              activeCategory === cat 
                ? 'bg-[#163B70] text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#163B70] hover:text-[#163B70]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Right Fade */}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      )}
    </div>
  );
};

export default SubjectFilters;
