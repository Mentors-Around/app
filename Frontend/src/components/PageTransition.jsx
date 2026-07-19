import React from 'react';

const PageTransition = ({ children }) => {
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
};

export default PageTransition;
