import { useState, useCallback, useMemo } from 'react';
import { filterPages } from '../utils/constants';

export const useSearch = (pages = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // フィルターされたページを計算
  const filteredPages = useMemo(() => {
    return filterPages(pages, searchTerm, selectedTags);
  }, [pages, searchTerm, selectedTags]);

  // 検索条件をクリア
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTags([]);
  }, []);

  // タグの選択/選択解除を切り替え
  const toggleTag = useCallback((tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  // 検索語句の更新
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // フィルターが適用されているかどうか
  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || selectedTags.length > 0;
  }, [searchTerm, selectedTags]);

  return {
    searchTerm,
    selectedTags,
    filteredPages,
    hasActiveFilters,
    updateSearchTerm,
    toggleTag,
    clearFilters
  };
};

// タグ管理用の検索機能
export const useTagSearch = (tags = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return tags;
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    filteredTags,
    updateSearchTerm,
    clearSearch
  };
};