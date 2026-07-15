import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const subjectConfig = {
  mathematics: { emoji:"📐", bg:"bg-sky/5", arch1:"from-sky to-navy", arch2:"from-cream-warm to-sky", tagline:"For Exam Success & Academic Excellence", minFee:"₹300", teachers:"500+" },
  physics: { emoji:"⚛️", bg:"bg-indigo-50/50", arch1:"from-indigo-400 to-navy", arch2:"from-sky to-indigo-300", tagline:"For JEE NEET & Board Exams", minFee:"₹400", teachers:"300+" },
  chemistry: { emoji:"🧪", bg:"bg-emerald-50/50", arch1:"from-emerald-400 to-navy", arch2:"from-emerald-200 to-emerald-400", tagline:"For JEE NEET & Board Exams", minFee:"₹350", teachers:"250+" },
  biology: { emoji:"🌱", bg:"bg-emerald-50/50", arch1:"from-emerald-400 to-navy", arch2:"from-emerald-200 to-emerald-400", tagline:"For NEET & Board Exam Preparation", minFee:"₹300", teachers:"200+" },
  english: { emoji:"📖", bg:"bg-amber/5", arch1:"from-amber to-navy", arch2:"from-amber/30 to-amber-hover", tagline:"For Spoken English & Academic Writing", minFee:"₹250", teachers:"400+" },
  guitar: { emoji:"🎸", bg:"bg-coral/5", arch1:"from-coral to-navy", arch2:"from-coral/30 to-coral-dark", tagline:"For Beginners to Advanced Players", minFee:"₹300", teachers:"150+" },
  yoga: { emoji:"🧘", bg:"bg-pink-50/50", arch1:"from-pink-400 to-navy", arch2:"from-pink-200 to-pink-400", tagline:"For Fitness & Flexibility", minFee:"₹500", teachers:"200+" },
  fitness: { emoji:"🏋️", bg:"bg-coral/5", arch1:"from-coral to-navy", arch2:"from-coral/30 to-coral-dark", tagline:"For Health & Strength Training", minFee:"₹400", teachers:"180+" },
  chess: { emoji:"♟️", bg:"bg-slate-50", arch1:"from-slate-400 to-navy", arch2:"from-slate-200 to-slate-400", tagline:"For All Skill Levels", minFee:"₹200", teachers:"100+" },
  dance: { emoji:"💃", bg:"bg-pink-50/50", arch1:"from-pink-400 to-navy", arch2:"from-pink-200 to-pink-400", tagline:"For All Dance Forms", minFee:"₹300", teachers:"120+" },
  piano: { emoji:"🎹", bg:"bg-indigo-50/50", arch1:"from-indigo-400 to-navy", arch2:"from-indigo-200 to-indigo-400", tagline:"For Beginners to Concert Level", minFee:"₹350", teachers:"80+" },
  drawing: { emoji:"🎨", bg:"bg-rose-50/50", arch1:"from-rose-400 to-navy", arch2:"from-rose-200 to-rose-400", tagline:"For Creative Expression & Art", minFee:"₹250", teachers:"90+" },
  neet: { emoji:"🎯", bg:"bg-sky/5", arch1:"from-sky to-navy", arch2:"from-sky/30 to-sky", tagline:"For Medical Entrance Preparation", minFee:"₹500", teachers:"300+" },
  jee: { emoji:"📊", bg:"bg-sky/5", arch1:"from-sky to-navy", arch2:"from-sky/30 to-sky", tagline:"For Engineering Entrance Preparation", minFee:"₹500", teachers:"250+" },
  karate: { 
    emoji: "🥋", 
    bg: "bg-coral/5", 
    arch1: "from-coral to-navy", 
    arch2: "from-coral/30 to-coral-dark", 
    tagline: "Learn Self-Defense, Discipline & Fitness", 
    minFee: "₹400", 
    teachers: "100+",
    features: [
      { icon: "🥋", text: "Learn Karate from certified instructors" },
      { icon: "⏰", text: "Flexible online and offline classes" },
      { icon: "⭐", text: "Classes starting from ₹400/hr" },
      { icon: "🏆", text: "100+ verified Karate trainers" }
    ]
  }
};

const SubjectLandingPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [locationInput, setLocationInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const normalizedSubject = subject?.toLowerCase() || '';
  
  const config = subjectConfig[normalizedSubject] || {
    emoji: "📚",
    bg: "bg-cream",
    arch1: "from-sky to-navy",
    arch2: "from-cream-warm to-sky",
    tagline: `For The Best ${subject} Learning Experience`,
    minFee: "₹300",
    teachers: "100+"
  };

  const displaySubject = subject ? subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ') : '';

  const features = config.features || [
    { icon: config.emoji, text: `Start your ${displaySubject} class near me` },
    { icon: '🕐', text: `Flexible ${displaySubject} class at your preferred time` },
    { icon: '⭐', text: `${displaySubject} classes with fees from ${config.minFee}/hr` },
    { icon: '📍', text: `${config.teachers} verified ${displaySubject} teachers` }
  ];

  useEffect(() => {
    document.title = `${displaySubject} Classes Near Me - TrueEd`;
  }, [displaySubject]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const base = isAuthenticated ? '/student/discover' : '/discover';
    let url = `${base}?subject=${encodeURIComponent(normalizedSubject)}`;
    if (locationInput.trim()) {
      url += `&location=${encodeURIComponent(locationInput.trim())}`;
    }
    navigate(url);
  };

  const selectLocationOption = (val) => {
    setLocationInput(val);
    setShowDropdown(false);
  };

  return (
    <div className={`relative min-h-screen ${config.bg} overflow-hidden flex flex-col font-inter`}>
      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 pt-24 pb-16 flex flex-col lg:flex-row relative z-10 items-center justify-between">
        
        {/* Left Side (55%) */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center pr-0 lg:pr-10 z-20">
          <h1 className="text-3xl md:text-5xl font-black text-navy leading-tight mb-6 font-sora">
            {displaySubject} Classes Near Me <br />
            <span className="text-xl md:text-2xl font-extrabold opacity-90">{config.tagline}</span>
          </h1>

          <ul className="flex flex-col gap-3 mb-10">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start text-sm text-slate-700 font-semibold">
                <span className="mr-3">{feature.icon}</span> {feature.text}
              </li>
            ))}
          </ul>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-brand p-2.5 flex items-center w-full max-w-xl border border-slate-100 relative">
            <div className="flex items-center px-4 md:px-6 flex-shrink-0 w-1/3 min-w-[140px] truncate">
              <span className="text-xl mr-2">{config.emoji}</span>
              <span className="text-navy font-bold truncate text-sm">{displaySubject}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex-1 flex items-center relative" ref={dropdownRef}>
              <span className="text-slate-400 ml-2 mr-2">📍</span>
              <input 
                type="text" 
                placeholder="Address or Postcode" 
                className="w-full bg-transparent outline-none text-navy font-bold text-sm placeholder-slate-400 py-2"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              {/* Location Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-slide-up-sm">
                  <button 
                    onClick={() => selectLocationOption('Around me')}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-navy font-semibold flex items-center gap-3 transition"
                  >
                    <span className="text-lg">📍</span> Around me
                  </button>
                  <button 
                    onClick={() => selectLocationOption('Online')}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-navy font-semibold flex items-center gap-3 transition"
                  >
                    <span className="text-lg">🖥️</span> Online
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleSearch}
              className="bg-navy text-white rounded-xl px-6 py-2.5 ml-2 font-bold hover:bg-navy-hover transition hidden sm:block text-sm cursor-pointer"
            >
              Search
            </button>
          </div>
          
          <button 
            onClick={handleSearch}
            className="mt-4 bg-navy text-white rounded-xl px-6 py-3 w-full font-bold hover:bg-navy-hover transition sm:hidden text-sm cursor-pointer"
          >
            Search
          </button>

          {/* Mobile Floating Card */}
          <div className="mt-12 lg:hidden flex justify-center w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[20px] shadow-brand w-[220px] p-5 flex flex-col items-center text-center border border-slate-50"
            >
              <p className="text-navy font-bold text-sm mb-1">Excellent (4.8)</p>
              <div className="flex gap-1 text-[#FFB800] mb-2 text-xs">
                <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
              </div>
              <p className="text-slate-400 font-semibold text-[11px] leading-tight">2,000+ student reviews</p>
            </motion.div>
          </div>
        </div>

        {/* Right Side (45%) - Hidden on mobile */}
        <div className="hidden lg:flex w-[45%] relative h-[450px] items-center justify-center">
          <div className="relative w-full h-full flex items-end justify-center">
            
            {/* First Arch (Taller, behind) */}
            <div className={`absolute left-4 top-0 w-48 h-[380px] bg-gradient-to-br ${config.arch1} rounded-t-full rounded-b-3xl shadow-xl flex items-center justify-center overflow-hidden transform -rotate-6`}>
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-50"></div>
              <span className="text-7xl drop-shadow-2xl opacity-90">{config.emoji}</span>
            </div>

            {/* Second Arch (Shorter, overlapping in front) */}
            <div className={`absolute right-4 bottom-0 w-44 h-[320px] bg-gradient-to-br ${config.arch2} rounded-t-full rounded-b-3xl shadow-xl flex items-center justify-center overflow-hidden transform rotate-3 border-4 border-white/30 backdrop-blur-sm z-10`}>
              <div className="absolute inset-0 bg-white/30 blur-2xl opacity-60"></div>
              <span className="text-7xl drop-shadow-2xl">{config.emoji}</span>
            </div>
            
            {/* Desktop Floating Trust Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ 
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                opacity: { duration: 0.6, delay: 0.2 }
              }}
              whileHover={{ scale: 1.05 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-[20px] shadow-brand-lg w-[200px] p-4 flex flex-col items-center text-center border border-slate-50 cursor-default"
            >
              <p className="text-navy font-bold text-sm mb-0.5">Excellent (4.8)</p>
              <div className="flex gap-1 text-[#FFB800] mb-2 text-xs">
                <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
              </div>
              <p className="text-slate-400 font-semibold text-[11px] leading-tight">2,000+ student reviews</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectLandingPage;
