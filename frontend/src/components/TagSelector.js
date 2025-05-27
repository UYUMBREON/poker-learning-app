import React from 'react';

const TagSelector = ({ tags = [], selectedTags = [], onToggle }) => {
  if (tags.length === 0) {
    return (
      <div className="tag-selector-empty">
        <p>利用可能なタグがありません。</p>
        <p>タグ管理画面で新しいタグを作成してください。</p>
      </div>
    );
  }

  return (
    <div className="tag-selector">
      {tags.map(tag => (
        <TagOption
          key={tag.id}
          tag={tag}
          isSelected={selectedTags.includes(tag.id)}
          onToggle={() => onToggle(tag.id)}
        />
      ))}
    </div>
  );
};

const TagOption = ({ tag, isSelected, onToggle }) => (
  <button
    className={`tag-option ${isSelected ? 'selected' : ''}`}
    onClick={onToggle}
    style={{
      backgroundColor: isSelected ? tag.color : 'white',
      borderColor: tag.color,
      color: isSelected ? 'white' : tag.color
    }}
  >
    {tag.name}
  </button>
);

export default TagSelector;