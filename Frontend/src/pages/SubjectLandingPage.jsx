import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const subjectConfig = {
  mathematics: { emoji:"📐", bg:"bg-blue-50", arch1:"from-blue-400 to-blue-600", arch2:"from-blue-200 to-blue-400", tagline:"For Exam Success & Academic Excellence", minFee:"₹300", teachers:"500+" },
  physics: { emoji:"⚛️", bg:"bg-purple-50", arch1:"from-purple-400 to-purple-600", arch2:"from-purple-200 to-purple-400", tagline:"For JEE NEET & Board Exams", minFee:"₹400", teachers:"300+" },
  chemistry: { emoji:"🧪", bg:"bg-green-50", arch1:"from-green-400 to-green-600", arch2:"from-green-200 to-green-400", tagline:"For JEE NEET & Board Exams", minFee:"₹350", teachers:"250+" },
  biology: { emoji:"🌱", bg:"bg-emerald-50", arch1:"from-emerald-400 to-emerald-600", arch2:"from-emerald-200 to-emerald-400", tagline:"For NEET & Board Exam Preparation", minFee:"₹300", teachers:"200+" },
  english: { emoji:"📖", bg:"bg-yellow-50", arch1:"from-yellow-400 to-yellow-600", arch2:"from-yellow-200 to-yellow-400", tagline:"For Spoken English & Academic Writing", minFee:"₹250", teachers:"400+" },
  guitar: { emoji:"🎸", bg:"bg-orange-50", arch1:"from-orange-400 to-orange-600", arch2:"from-orange-200 to-orange-400", tagline:"For Beginners to Advanced Players", minFee:"₹300", teachers:"150+" },
  yoga: { emoji:"🧘", bg:"bg-pink-50", arch1:"from-pink-400 to-pink-600", arch2:"from-pink-200 to-pink-400", tagline:"For Fitness & Flexibility", minFee:"₹500", teachers:"200+" },
  fitness: { emoji:"🏋️", bg:"bg-red-50", arch1:"from-red-400 to-red-600", arch2:"from-red-200 to-red-400", tagline:"For Health & Strength Training", minFee:"₹400", teachers:"180+" },
  chess: { emoji:"♟️", bg:"bg-gray-50", arch1:"from-gray-400 to-gray-600", arch2:"from-gray-200 to-gray-400", tagline:"For All Skill Levels", minFee:"₹200", teachers:"100+" },
  dance: { emoji:"💃", bg:"bg-fuchsia-50", arch1:"from-fuchsia-400 to-fuchsia-600", arch2:"from-fuchsia-200 to-fuchsia-400", tagline:"For All Dance Forms", minFee:"₹300", teachers:"120+" },
  piano: { emoji:"🎹", bg:"bg-indigo-50", arch1:"from-indigo-400 to-indigo-600", arch2:"from-indigo-200 to-indigo-400", tagline:"For Beginners to Concert Level", minFee:"₹350", teachers:"80+" },
  drawing: { emoji:"🎨", bg:"bg-rose-50", arch1:"from-rose-400 to-rose-600", arch2:"from-rose-200 to-rose-400", tagline:"For Creative Expression & Art", minFee:"₹250", teachers:"90+" },
  neet: { emoji:"🎯", bg:"bg-teal-50", arch1:"from-teal-400 to-teal-600", arch2:"from-teal-200 to-teal-400", tagline:"For Medical Entrance Preparation", minFee:"₹500", teachers:"300+" },
  jee: { emoji:"📊", bg:"bg-cyan-50", arch1:"from-cyan-400 to-cyan-600", arch2:"from-cyan-200 to-cyan-400", tagline:"For Engineering Entrance Preparation", minFee:"₹500", teachers:"250+" },
  karate: { 
    emoji: "🥋", 
    bg: "bg-orange-50", 
    arch1: "from-orange-500 to-orange-700", 
    arch2: "from-orange-300 to-orange-500", 
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
  const [locationInput, setLocationInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const normalizedSubject = subject?.toLowerCase() || '';
  
  const config = subjectConfig[normalizedSubject] || {
    emoji: "📚",
    bg: "bg-amber-50",
    arch1: "from-amber-400 to-amber-600",
    arch2: "from-amber-200 to-amber-400",
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
    let url = `/student/discover?subject=${encodeURIComponent(normalizedSubject)}`;
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
    <div className={`relative min-h-screen ${config.bg} overflow-hidden flex flex-col`}>
      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-6 pt-32 pb-16 flex flex-col lg:flex-row relative z-10 h-full">
        
        {/* Left Side (55%) */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center pr-0 lg:pr-10 z-20">
          <h1 className="text-4xl md:text-5xl font-black text-navy leading-tight mb-6">
            {displaySubject} Classes Near Me <br />
            <span className="text-3xl md:text-4xl font-extrabold opacity-90">{config.tagline}</span>
          </h1>

          <ul className="flex flex-col gap-3 mb-10">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start text-base text-gray-700 font-medium">
                <span className="mr-3">{feature.icon}</span> {feature.text}
              </li>
            ))}
          </ul>

          {/* Search Bar */}
          <div className="bg-white rounded-full shadow-lg p-2 flex items-center w-full max-w-xl border border-gray-100 relative">
            <div className="flex items-center px-4 md:px-6 flex-shrink-0 w-1/3 min-w-[140px] truncate">
              <span className="text-xl mr-2">{config.emoji}</span>
              <span className="text-navy font-bold truncate">{displaySubject}</span>
            </div>
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            
            <div className="flex-1 flex items-center relative" ref={dropdownRef}>
              <span className="text-gray-400 ml-2 mr-2">📍</span>
              <input 
                type="text" 
                placeholder="Address or Postcode" 
                className="w-full bg-transparent outline-none text-navy font-medium placeholder-gray-400 py-2"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              {/* Location Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up-sm">
                  <button 
                    onClick={() => selectLocationOption('Around me')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-navy font-medium flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">📍</span> Around me
                  </button>
                  <button 
                    onClick={() => selectLocationOption('Online')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-navy font-medium flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">🖥️</span> Online
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleSearch}
              className="bg-navy text-white rounded-full px-6 py-3 ml-2 font-bold hover:bg-navy-light transition-colors hidden sm:block"
            >
              Search
            </button>
          </div>
          
          <button 
            onClick={handleSearch}
            className="mt-4 bg-navy text-white rounded-full px-6 py-3 w-full font-bold hover:bg-navy-light transition-colors sm:hidden"
          >
            Search
          </button>

          {/* Mobile Floating Card */}
          <div className="mt-12 lg:hidden flex justify-center w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[220px] p-5 flex flex-col items-center text-center border border-gray-50"
            >
              <p className="text-navy font-bold text-base mb-1">Excellent (4.8)</p>
              <div className="flex gap-1 text-[#FFB800] mb-2 text-sm">
                <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
              </div>
              <p className="text-gray-500 font-medium text-[13px] leading-tight">2,000+ student reviews</p>
            </motion.div>
          </div>
        </div>

        {/* Right Side (45%) - Hidden on mobile */}
        <div className="hidden lg:flex w-[45%] relative h-full items-center justify-center">
          <div className="relative w-full h-[600px] flex items-end justify-center translate-y-12">
            
            {/* First Arch (Taller, behind) */}
            <div className={`absolute left-4 top-0 w-64 h-[550px] bg-gradient-to-br ${config.arch1} rounded-t-full rounded-b-3xl shadow-xl flex items-center justify-center overflow-hidden transform -rotate-6`}>
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-50"></div>
              <span className="text-8xl drop-shadow-2xl opacity-90">{config.emoji}</span>
            </div>

            {/* Second Arch (Shorter, overlapping in front) */}
            <div className={`absolute right-4 bottom-[-40px] w-56 h-[480px] bg-gradient-to-br ${config.arch2} rounded-t-full rounded-b-3xl shadow-xl flex items-center justify-center overflow-hidden transform rotate-3 border-4 border-white/30 backdrop-blur-sm z-10`}>
              <div className="absolute inset-0 bg-white/30 blur-2xl opacity-60"></div>
              <span className="text-8xl drop-shadow-2xl">{config.emoji}</span>
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
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-[20px] shadow-[0_12px_40px_rgb(0,0,0,0.15)] w-[220px] p-5 flex flex-col items-center text-center border border-gray-50 cursor-default"
            >
              <p className="text-navy font-bold text-base mb-1">Excellent (4.8)</p>
              <div className="flex gap-1 text-[#FFB800] mb-2 text-sm drop-shadow-sm">
                <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
              </div>
              <p className="text-gray-500 font-medium text-[13px] leading-tight">2,000+ student reviews</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectLandingPage;
