import React from 'react';
import { X } from 'lucide-react';

const TagBadge = ({ tag, size = 'medium', removable = false, onRemove }) => {
  const sizeClasses = {
    small: 'tag-badge-small',
    medium: 'tag-badge',
    large: 'tag-badge-large'
  };

  return (
    <span 
      className={sizeClasses[size]}
      style={{ 
        backgroundColor: tag.color,
        color: 'white'
      }}
    >
      {tag.name}
      {removable && (
        <button 
          onClick={() => onRemove(tag.id)}
          className="tag-remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

export default TagBadge;