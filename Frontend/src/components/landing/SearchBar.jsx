import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, MapPin, Star } from 'lucide-react';

const placeholders = [
  "Search for Mathematics tutor...",
  "Find Physics teacher in Bangalore...",
  "Search for Guitar lessons...",
  "Find NEET coaching..."
];

const trendingSearches = [
  "Mathematics", "Physics", "Guitar", "NEET", "Spoken English"
];

const dummyResults = [
  { id: 1, name: 'Kavita Verma', subject: 'Mathematics', city: 'Bangalore', rating: 4.8, color: 'bg-blue-500' },
  { id: 2, name: 'Arun Singh', subject: 'Physics', city: 'Delhi', rating: 4.5, color: 'bg-green-500' },
  { id: 3, name: 'Sneha R', subject: 'English', city: 'Mumbai', rating: 4.9, color: 'bg-purple-500' },
  { id: 4, name: 'Rahul Sharma', subject: 'Chemistry', city: 'Pune', rating: 4.7, color: 'bg-orange-500' },
  { id: 5, name: 'Priya Patel', subject: 'Biology', city: 'Ahmedabad', rating: 4.6, color: 'bg-teal-500' },
  { id: 6, name: 'Vikram Joshi', subject: 'Guitar', city: 'Jaipur', rating: 4.9, color: 'bg-red-500' },
  { id: 7, name: 'Neha Gupta', subject: 'NEET', city: 'Lucknow', rating: 4.8, color: 'bg-indigo-500' },
  { id: 8, name: 'Sanjay Reddy', subject: 'Spoken English', city: 'Chennai', rating: 4.7, color: 'bg-pink-500' }
];

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Typing animation for placeholder
  useEffect(() => {
    let timeout;
    if (charIndex < placeholders[placeholderIndex].length) {
      timeout = setTimeout(() => {
        setPlaceholder(prev => prev + placeholders[placeholderIndex][charIndex]);
        setCharIndex(prev => prev + 1);
      }, 50); // Typing speed
    } else {
      timeout = setTimeout(() => {
        setPlaceholder('');
        setCharIndex(0);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 3000); // Wait 3 seconds before next string
    }
    return () => clearTimeout(timeout);
  }, [charIndex, placeholderIndex]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('trueed_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) return;
    const newRecent = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('trueed_recent_searches', JSON.stringify(newRecent));
  };

  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(t => t !== termToRemove);
    setRecentSearches(newRecent);
    localStorage.setItem('trueed_recent_searches', JSON.stringify(newRecent));
  };

  const handleSearch = (term) => {
    if (!term.trim()) return;
    saveRecentSearch(term);
    setQuery(term);
    setIsFocused(false);
    
    if (onSearch) {
      onSearch({ subject: term, cls: '', topic: '' });
    } else {
      navigate(`/lessons/${term.trim().toLowerCase().replace(/\s+/g, '-')}/india`);
    }
  };

  const filteredResults = query.length >= 2 ? dummyResults.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.subject.toLowerCase().includes(query.toLowerCase())
  ) : [];

  const dropdownItemsCount = query.length >= 2 
    ? filteredResults.length 
    : recentSearches.length + trendingSearches.length;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }

    if (!isFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < dropdownItemsCount - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.length >= 2 && filteredResults.length > 0 && selectedIndex >= 0) {
        handleSearch(filteredResults[selectedIndex].subject);
      } else if (query.length < 2 && selectedIndex >= 0) {
        if (selectedIndex < recentSearches.length) {
          handleSearch(recentSearches[selectedIndex]);
        } else {
          handleSearch(trendingSearches[selectedIndex - recentSearches.length]);
        }
      } else {
        handleSearch(query);
      }
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-[680px] mx-auto mb-12 relative z-50">
      <div className={`relative bg-white rounded-2xl flex items-center shadow-brand-xl border-2 transition-all duration-300 ${isFocused ? 'border-sky shadow-sky/20' : 'border-transparent hover:border-sky/50'}`}>
        <Search className="w-6 h-6 text-slate-400 ml-4 flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none py-4 px-4 text-navy text-lg placeholder-slate-400 font-medium"
        />

        {query && (
          <button 
            onMouseDown={handleClear}
            className="mr-2 p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => handleSearch(query)}
          className="mr-2 my-2 py-3 px-8 bg-coral text-white rounded-xl font-sora font-semibold hover:bg-coral-hover transition-colors whitespace-nowrap hidden sm:block"
        >
          Search
        </button>
      </div>

      {/* Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-sm flex flex-col">
          {query.length < 2 ? (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Searches</h3>
                  {recentSearches.map((term, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => { e.preventDefault(); handleSearch(term); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedIndex === idx ? 'bg-sky/5' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-navy font-medium text-sm">{term}</span>
                      </div>
                      <button
                        onMouseDown={(e) => removeRecentSearch(term, e)}
                        className="p-1 text-slate-400 hover:text-error hover:bg-error/10 rounded-md transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Trending</h3>
                <div className="flex flex-wrap gap-2 px-4 py-2">
                  {trendingSearches.map((term, idx) => (
                    <div
                      key={term}
                      onMouseDown={(e) => { e.preventDefault(); handleSearch(term); }}
                      className={`px-4 py-2 rounded-full border cursor-pointer transition-colors text-sm font-medium ${selectedIndex === (recentSearches.length + idx) ? 'bg-sky text-white border-sky' : 'border-slate-200 text-slate-600 hover:border-sky hover:text-sky'}`}
                    >
                      {term}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
             <div className="py-2">
              <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Teachers</h3>
              {filteredResults.length > 0 ? (
                filteredResults.map((r, idx) => (
                  <div
                    key={r.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSearch(r.subject); }}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${selectedIndex === idx ? 'bg-sky/5' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.color}`}></div>
                      <div className="flex flex-col">
                        <span className="font-bold text-navy">{r.name}</span>
                        <span className="text-xs font-medium text-slate-500">{r.subject}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-coral" />
                        {r.city}
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {r.rating}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  No results found for "<span className="font-bold text-navy">{query}</span>"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
