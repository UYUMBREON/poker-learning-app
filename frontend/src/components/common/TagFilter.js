import React from 'react';
import { Filter } from 'lucide-react';

const TagFilter = ({ 
  tags, 
  selectedTags, 
  onToggle, 
  title = "タグで絞り込み" 
}) => (
  <div className="tag-filters">
    <h4>
      <Filter size={16} style={{ marginRight: '6px' }} />
      {title}
    </h4>
    <div className="tag-filter-list">
      {tags.map(tag => (
        <button
          key={tag.id}
          className={`tag-filter ${selectedTags.includes(tag.id) ? 'active' : ''}`}
          onClick={() => onToggle(tag.id)}
          style={{
            backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'white',
            borderColor: tag.color,
            color: selectedTags.includes(tag.id) ? 'white' : tag.color
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  </div>
);

export default TagFilter;