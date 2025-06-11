import React from 'react';
import { Search, X } from 'lucide-react';
import SearchBox from './common/SearchBox';

const TagSelector = ({ 
  tags = [], 
  allTags = [],
  searchTerm = '',
  selectedTags = [], 
  onToggle,
  onSearchChange,
  onClearSearch
}) => {
  // 表示するタグを決定（検索中は filteredTags、そうでなければ allTags）
  const displayTags = searchTerm ? tags : allTags;
  const totalTags = allTags.length;

  if (totalTags === 0) {
    return (
      <div className="tag-selector-empty">
        <p>利用可能なタグがありません。</p>
        <p>タグ管理画面で新しいタグを作成してください。</p>
      </div>
    );
  }

  return (
    <div className="tag-selector">
      {/* 検索機能が必要な場合（タグが5個以上）のみ表示 */}
      {totalTags >= 5 && onSearchChange && (
        <div className="tag-selector-search">
          <SearchBox
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="タグを検索..."
            onClear={onClearSearch}
          />
        </div>
      )}

      {/* タグ表示エリア */}
      <div className="tag-options-container">
        {displayTags.length === 0 ? (
          <div className="no-tags-found">
            <p>「{searchTerm}」に一致するタグが見つかりませんでした。</p>
          </div>
        ) : (
          <div className="tag-options-grid">
            {displayTags.map(tag => (
              <TagOption
                key={tag.id}
                tag={tag}
                isSelected={selectedTags.includes(tag.id)}
                onToggle={() => onToggle(tag.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 検索時の結果情報 */}
      {searchTerm && onSearchChange && (
        <div className="tag-search-info">
          <span>{displayTags.length}件のタグが見つかりました</span>
          {displayTags.length !== totalTags && (
            <span> (全{totalTags}件中)</span>
          )}
        </div>
      )}
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