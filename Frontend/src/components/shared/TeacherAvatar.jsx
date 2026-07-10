import React, { useState, useEffect } from 'react';

const TeacherAvatar = ({ teacherId, name, initials, className = '' }) => {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const handleStorageChange = () => {
      if (teacherId) {
        const storedPhoto = localStorage.getItem(`trueed_teacher_photo_${teacherId}`);
        setPhoto(storedPhoto);
      }
    };

    // Initial check
    handleStorageChange();

    // Listen for cross-tab or manual window dispatch events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trueed_avatar_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trueed_avatar_updated', handleStorageChange);
    };
  }, [teacherId]);

  if (photo) {
    return (
      <img 
        src={photo} 
        alt={name || 'Teacher Avatar'} 
        className={`rounded-full object-cover shadow-sm ${className}`}
      />
    );
  }

  // Fallback to initials if no photo
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-sora font-bold bg-gradient-to-br from-navy to-blue-600 shadow-sm ${className}`}>
      {initials || (name ? name.charAt(0).toUpperCase() : '?')}
    </div>
  );
};

export default TeacherAvatar;
