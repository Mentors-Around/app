import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { allSubjects } from '../../data/subjects';
import SubjectCard from './SubjectCard';
import SubjectFilters from './SubjectFilters';
import { useNavigate } from 'react-router-dom';

const SubjectCarousel = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const navigate = useNavigate();

  // Filter subjects based on category
  const filteredSubjects = useMemo(() => {
    if (activeCategory === 'All') return allSubjects;
    return allSubjects.filter(sub => sub.category === activeCategory);
  }, [activeCategory]);

  // Duplicate items for infinite scrolling effect if we have enough items
  // Otherwise, just use the original list
  const displaySubjects = filteredSubjects.length > 3 
    ? [...filteredSubjects, ...filteredSubjects] 
    : filteredSubjects;

  const handleDragEnd = (e, { offset, velocity }) => {
    const swipe = offset.x;
    if (swipe < -50) {
      scrollDirection(1);
    } else if (swipe > 50) {
      scrollDirection(-1);
    }
  };

  const scrollDirection = (dir) => {
    if (containerRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 250 : 300;
      containerRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    let interval;
    if (!isHovered && containerRef.current && displaySubjects.length > 4) {
      interval = setInterval(() => {
        if (containerRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
          // If we reach the end, instantly snap back to middle or beginning for infinite feel
          if (scrollLeft + clientWidth >= scrollWidth - 50) {
            containerRef.current.scrollTo({ left: 0, behavior: 'instant' });
          } else {
            containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
          }
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isHovered, displaySubjects.length]);

  return (
    <section className="py-20 bg-[#F5F8FC] overflow-hidden relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#163B70] mb-4 font-sora">
            Explore Subjects
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Find expert teachers for every subject, skill, language, and competitive exam.
          </p>
        </motion.div>
      </div>

      <SubjectFilters activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

      <div 
        className="relative max-w-[1400px] mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Arrows */}
        <button 
          onClick={() => scrollDirection(-1)}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#163B70] hover:bg-[#163B70] hover:text-white transition-colors duration-300 hidden md:flex group"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>

        <button 
          onClick={() => scrollDirection(1)}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#163B70] hover:bg-[#163B70] hover:text-white transition-colors duration-300 hidden md:flex group"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Carousel Container */}
        <div 
          ref={containerRef}
          className="overflow-x-auto hide-scrollbar snap-x snap-mandatory px-4 sm:px-12 pb-12 pt-4 flex cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <motion.div 
            ref={sliderRef}
            className="flex"
            drag="x"
            dragConstraints={containerRef}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x }}
          >
            {displaySubjects.map((subject, idx) => (
              <SubjectCard key={`${subject.name}-${idx}`} subject={subject} index={idx % 10} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="text-center mt-6">
        <button 
          onClick={() => navigate('/student/discover')}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-[#163B70] text-[#163B70] rounded-full font-bold hover:bg-[#163B70] hover:text-white transition-colors duration-300 shadow-sm"
        >
          <LayoutGrid className="w-5 h-5" />
          View All Subjects
        </button>
      </div>
    </section>
  );
};

export default SubjectCarousel;
