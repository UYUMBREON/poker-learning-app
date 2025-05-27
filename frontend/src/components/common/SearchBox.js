import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBox = ({ 
  value, 
  onChange, 
  placeholder = "検索...",
  onClear 
}) => (
  <div className="search-box">
    <Search size={20} className="search-icon" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="search-input"
    />
    {value && (
      <button 
        onClick={() => onChange('')}
        className="clear-search"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

export default SearchBox;