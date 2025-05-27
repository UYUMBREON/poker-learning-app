import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, BookOpen, Filter, Table } from 'lucide-react';
import axios from 'axios';

const PageSummary = () => {
  const [pages, setPages] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPages();
    fetchTags();
  }, []);

  useEffect(() => {
    filterPages();
  }, [pages, selectedTags, searchTerm]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pages');
      setPages(response.data);
    } catch (err) {
      setError('ページの取得に失敗しました');
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      setAvailableTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const filterPages = () => {
    let filtered = pages;

    // タグでフィルタ
    if (selectedTags.length > 0) {
      filtered = filtered.filter(page => 
        page.tags && page.tags.some(tag => selectedTags.includes(tag.id))
      );
    }

    // タイトルで検索
    if (searchTerm.trim()) {
      filtered = filtered.filter(page =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPages(filtered);
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-summary">
      <div className="summary-header">
        <h2>
          <Table size={24} style={{ marginRight: '8px' }} />
          学習ページまとめ
        </h2>
        <p className="summary-description">
          全ての学習ページをタイトルとタグで一覧表示します
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="ページタイトルで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="tag-filters">
          <h4>
            <Filter size={16} style={{ marginRight: '6px' }} />
            タグで絞り込み
          </h4>
          <div className="tag-filter-list">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                className={`tag-filter ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag.id)}
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
          {(selectedTags.length > 0 || searchTerm) && (
            <button onClick={clearFilters} className="clear-filters">
              <X size={16} />
              フィルターをクリア
            </button>
          )}
        </div>
      </div>

      {/* 結果表示 */}
      <div className="results-info">
        <span className="results-count">
          {filteredPages.length}件のページが見つかりました
          {(selectedTags.length > 0 || searchTerm) && ` (全${pages.length}件中)`}
        </span>
      </div>

      {/* ページ一覧テーブル */}
      <div className="pages-table-container">
        {filteredPages.length === 0 ? (
          <div className="no-results">
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>
              {pages.length === 0 
                ? 'まだページがありません。最初のページを作成してみましょう！'
                : '検索条件に一致するページが見つかりませんでした。'
              }
            </p>
          </div>
        ) : (
          <table className="pages-table">
            <thead>
              <tr>
                <th>ページタイトル</th>
                <th>タグ</th>
                <th>作成日</th>
                <th>更新日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map(page => (
                <tr key={page.id} className="page-row">
                  <td className="page-title">
                    <Link to={`/page/${page.id}`} className="title-link">
                      {page.title}
                    </Link>
                  </td>
                  <td className="page-tags-cell">
                    <div className="tags-container">
                      {page.tags && page.tags.length > 0 ? (
                        page.tags.map(tag => (
                          <span 
                            key={tag.id} 
                            className="table-tag"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="no-tags">タグなし</span>
                      )}
                    </div>
                  </td>
                  <td className="page-date">
                    {formatDate(page.created_at)}
                  </td>
                  <td className="page-date">
                    {formatDate(page.updated_at)}
                  </td>
                  <td className="page-actions">
                    <Link 
                      to={`/page/${page.id}`} 
                      className="edit-link"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PageSummary;