import React from 'react';
import { Link } from 'react-router-dom';
import { Search, X, BookOpen, Filter, Table } from 'lucide-react';
import { usePages, useTags } from '../hooks/useApi';
import { useSearch } from '../hooks/useSearch';
import { formatDate } from '../utils/constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import SearchBox from './common/SearchBox';
import TagFilter from './common/TagFilter';

const PageSummary = () => {
  const { pages, loading: pagesLoading, error: pagesError } = usePages();
  const { tags, loading: tagsLoading } = useTags();
  
  const {
    searchTerm,
    selectedTags,
    filteredPages,
    hasActiveFilters,
    updateSearchTerm,
    toggleTag,
    clearFilters
  } = useSearch(pages);

  const loading = pagesLoading || tagsLoading;

  if (loading) {
    return <LoadingSpinner message="データを読み込んでいます..." />;
  }

  if (pagesError) {
    return <ErrorMessage message={pagesError} />;
  }

  return (
    <div className="page-summary">
      <SummaryHeader />
      
      <FiltersSection
        searchTerm={searchTerm}
        selectedTags={selectedTags}
        tags={tags}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={updateSearchTerm}
        onTagToggle={toggleTag}
        onClearFilters={clearFilters}
      />

      <ResultsInfo 
        filteredCount={filteredPages.length}
        totalCount={pages.length}
        hasActiveFilters={hasActiveFilters}
      />

      <PagesTable pages={filteredPages} />
    </div>
  );
};

const SummaryHeader = () => (
  <div className="summary-header">
    <h2>
      <Table size={24} style={{ marginRight: '8px' }} />
      学習ページまとめ
    </h2>
    <p className="summary-description">
      全ての学習ページをタイトルとタグで一覧表示します
    </p>
  </div>
);

const FiltersSection = ({
  searchTerm,
  selectedTags,
  tags,
  hasActiveFilters,
  onSearchChange,
  onTagToggle,
  onClearFilters
}) => (
  <div className="filters-section">
    <SearchBox
      value={searchTerm}
      onChange={onSearchChange}
      placeholder="ページタイトルで検索..."
    />

    <TagFilter
      tags={tags}
      selectedTags={selectedTags}
      onToggle={onTagToggle}
    />

    {hasActiveFilters && (
      <button onClick={onClearFilters} className="clear-filters">
        <X size={16} />
        フィルターをクリア
      </button>
    )}
  </div>
);

const ResultsInfo = ({ filteredCount, totalCount, hasActiveFilters }) => (
  <div className="results-info">
    <span className="results-count">
      {filteredCount}件のページが見つかりました
      {hasActiveFilters && ` (全${totalCount}件中)`}
    </span>
  </div>
);

const PagesTable = ({ pages }) => {
  if (pages.length === 0) {
    return <NoResults />;
  }

  return (
    <div className="pages-table-container">
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
          {pages.map(page => (
            <PageRow key={page.id} page={page} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PageRow = ({ page }) => (
  <tr className="page-row">
    <td className="page-title">
      <Link to={`/page/${page.id}`} className="title-link">
        {page.title}
      </Link>
    </td>
    <td className="page-tags-cell">
      <PageTags tags={page.tags} />
    </td>
    <td className="page-date">
      {formatDate(page.created_at)}
    </td>
    <td className="page-date">
      {formatDate(page.updated_at)}
    </td>
    <td className="page-actions">
      <Link to={`/page/${page.id}`} className="edit-link">
        編集
      </Link>
    </td>
  </tr>
);

const PageTags = ({ tags }) => (
  <div className="tags-container">
    {tags && tags.length > 0 ? (
      tags.map(tag => (
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
);

const NoResults = () => (
  <div className="no-results">
    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
    <p>検索条件に一致するページが見つかりませんでした。</p>
  </div>
);

export default PageSummary;