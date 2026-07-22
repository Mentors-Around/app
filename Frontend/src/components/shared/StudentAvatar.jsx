import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';

const StudentAvatar = ({ studentId, name, initials, className = '', avatarUrl }) => {
  const [photo, setPhoto] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleStorageChange = () => {
      if (studentId) {
        const storedPhoto = localStorage.getItem(`trueed_student_photo_${studentId}`);
        setPhoto(storedPhoto);
      }
    };

    // Initial check
    handleStorageChange();

    // Listen for cross-tab or manual window dispatch events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trueed_student_avatar_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trueed_student_avatar_updated', handleStorageChange);
    };
  }, [studentId]);

  // Priority 1: explicitly passed avatarUrl prop
  // Priority 2: logged-in user's avatar from auth context (if matching studentId)
  // Priority 3: photo state (from localStorage)
  const currentPhoto = avatarUrl || 
    ((user?._id === studentId || user?.id === studentId) ? user?.avatarUrl : null) || 
    photo;

  if (currentPhoto) {
    return (
      <img 
        src={currentPhoto} 
        alt={name || 'Student Avatar'} 
        className={`rounded-full object-cover shadow-sm ${className}`}
      />
    );
  }

  // Fallback to initials if no photo
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-sora font-bold bg-gradient-to-br from-indigo-500 to-sky-600 shadow-sm ${className}`}>
      {initials || (name ? name.charAt(0).toUpperCase() : 'S')}
    </div>
  );
};

export default StudentAvatar;
