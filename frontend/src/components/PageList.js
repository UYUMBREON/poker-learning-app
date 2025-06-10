import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, BookOpen, Edit } from 'lucide-react';
import { usePages } from '../hooks/useApi';
import { formatDateTime } from '../utils/constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import EmptyState from './common/EmptyState';
import TagBadge from './common/TagBadge';

const PageList = () => {
  const { pages, loading, error } = usePages();

  if (loading) {
    return <LoadingSpinner message="ページを読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="page-list">
      <PageListHeader />
      <PageGrid pages={pages} />
    </div>
  );
};

const PageListHeader = () => (
  <div className="page-list-header">
    <h2>学習ページ一覧</h2>
    <Link to="/page/new" className="header-create-button">
      <Plus size={20} />
      新しいページを作成
    </Link>
  </div>
);

const PageGrid = ({ pages }) => {
  if (pages.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="まだページがありません"
        description="右上の「新しいページを作成」ボタンから最初のページを作成してみましょう！"
      />
    );
  }

  return (
    <div className="pages-grid">
      {pages.map(page => (
        <PageCard key={page.id} page={page} />
      ))}
    </div>
  );
};

const PageCard = ({ page }) => (
  <div className="page-card">
    <PageTitle page={page} />
    <PageContent content={page.content} />
    <PageMeta page={page} />
    <PageActions page={page} />
  </div>
);

const PageTitle = ({ page }) => (
  <Link 
    to={`/page/${page.id}`} 
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <h3>{page.title}</h3>
  </Link>
);

const PageContent = ({ content }) => (
  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
    {content 
      ? content.substring(0, 100) + (content.length > 100 ? '...' : '')
      : '内容なし'
    }
  </p>
);

const PageMeta = ({ page }) => (
  <div className="page-meta">
    <PageTags tags={page.tags} />
    <PageDate date={page.updated_at} />
  </div>
);

const PageTags = ({ tags }) => (
  <div className="page-tags">
    {tags && tags.map(tag => (
      <TagBadge key={tag.id} tag={tag} size="small" />
    ))}
  </div>
);

const PageDate = ({ date }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <Clock size={14} />
    {formatDateTime(date)}
  </div>
);

const PageActions = ({ page }) => (
  <div className="page-actions-row">
    <Link to={`/page/${page.id}`} className="action-link view-link">
      <BookOpen size={16} />
      閲覧
    </Link>
    <Link to={`/page/${page.id}/edit`} className="action-link edit-link">
      <Edit size={16} />
      編集
    </Link>
  </div>
);

export default PageList;