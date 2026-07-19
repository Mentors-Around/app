import React from 'react';
import SearchBar from '../landing/SearchBar';

const AnimatedSearchBar = ({ onSearch }) => {
  return (
    <div className="bg-gradient-to-r from-navy to-navy-light rounded-brand-lg p-8 md:p-12 text-center text-white mb-8">
      <h2 className="font-sora text-2xl md:text-3xl font-bold mb-6">Find your perfect tutor</h2>
      <SearchBar onSearch={onSearch} />
    </div>
  );
};
export default AnimatedSearchBar;
