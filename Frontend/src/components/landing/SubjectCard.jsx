import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

const SubjectCard = ({ subject, index }) => {
  const IconComponent = Icons[subject.icon] || Icons.BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="flex-shrink-0 w-48 sm:w-56 mx-3 snap-start"
    >
      <Link
        to={`/lessons/${subject.name.toLowerCase().replace(/\s+/g, '-')}`}
        className="block bg-white border border-gray-100 rounded-[20px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(22,59,112,0.15)] transition-shadow duration-300 relative overflow-hidden group h-full"
      >
        {/* Popular Badge */}
        {subject.trending && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-[20px] shadow-sm z-10">
            POPULAR
          </div>
        )}

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#163B70] flex items-center justify-center group-hover:bg-[#163B70] group-hover:text-white transition-colors duration-300">
            <IconComponent size={32} strokeWidth={1.5} />
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{subject.name}</h3>
            <p className="text-sm font-medium text-gray-500">{subject.tutors.toLocaleString()} Tutors</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SubjectCard;
