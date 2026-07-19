import React, { useState, useEffect } from 'react';

const StudentAvatar = ({ studentId, name, initials, className = '' }) => {
  const [photo, setPhoto] = useState(null);

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

  if (photo) {
    return (
      <img 
        src={photo} 
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
