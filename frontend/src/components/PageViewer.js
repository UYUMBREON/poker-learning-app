import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, ArrowLeft, FileText, Tag, Clock, GitBranch } from 'lucide-react';
import { usePage } from '../hooks/useApi';
import { formatDateTime } from '../utils/constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import Button from './common/Button';
import TagBadge from './common/TagBadge';
import MarkdownViewer from './common/MarkdownViewer';
import TreeDiagramViewer from './TreeDiagramViewer';

const PageViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { page, loading, error } = usePage(id);

  if (loading) {
    return <LoadingSpinner message="ページを読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!page) {
    return <ErrorMessage message="ページが見つかりません" />;
  }

  // 樹形図データを解析
  let parsedTreeData = null;
  if (page.tree_data) {
    try {
      parsedTreeData = typeof page.tree_data === 'string' 
        ? JSON.parse(page.tree_data) 
        : page.tree_data;
    } catch (error) {
      console.error('樹形図データの解析に失敗しました:', error);
    }
  }

  return (
    <div className="page-viewer-with-tree">
      <ViewerHeader 
        page={page}
        onEdit={() => navigate(`/page/${id}/edit`)}
        onBack={() => navigate('/')}
      />

      <PageMeta page={page} />

      <div className="viewer-layout">
        {/* 左側: 樹形図セクション (1/3) */}
        <div className="tree-diagram-section">
          <div className="section-header">
            <h3 className="section-title">
              <GitBranch size={20} />
              樹形図
            </h3>
          </div>
          <TreeDiagramViewer treeData={parsedTreeData} />
        </div>

        {/* 右側: コンテンツ表示セクション (2/3) */}
        <div className="content-viewer-section">
          <div className="viewer-sections">
            <ContentViewerSection content={page.content} />
          </div>

          <TagsViewerSection tags={page.tags} />
        </div>
      </div>
    </div>
  );
};

const ViewerHeader = ({ page, onEdit, onBack }) => (
  <div className="viewer-header">
    <div className="viewer-title-section">
      <Button
        variant="secondary"
        size="small"
        icon={ArrowLeft}
        onClick={onBack}
      >
        戻る
      </Button>
      <h1 className="page-title">{page.title}</h1>
    </div>
    <div className="viewer-actions">
      <Button
        variant="primary"
        icon={Edit}
        onClick={onEdit}
      >
        編集
      </Button>
    </div>
  </div>
);

const PageMeta = ({ page }) => (
  <div className="page-meta-section">
    <div className="meta-item">
      <Clock size={16} />
      <span>作成: {formatDateTime(page.created_at)}</span>
    </div>
    <div className="meta-item">
      <Clock size={16} />
      <span>更新: {formatDateTime(page.updated_at)}</span>
    </div>
  </div>
);

const ContentViewerSection = ({ content }) => {
  return (
    <div className="viewer-section">
      <h2 className="section-title">
        <FileText size={20} />
        内容
      </h2>
      <div className="content-viewer-wrapper">
        {content && content.trim() ? (
          <MarkdownViewer content={content} className="page-content-viewer" />
        ) : (
          <div className="empty-content-message">
            <p>このページには内容が記録されていません。</p>
            <p>編集ボタンから内容を追加してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TagsViewerSection = ({ tags }) => (
  <div className="viewer-section">
    <h2 className="section-title">
      <Tag size={20} />
      タグ
    </h2>
    <div className="tags-display">
      {tags && tags.length > 0 ? (
        tags.map(tag => (
          <TagBadge key={tag.id} tag={tag} size="medium" />
        ))
      ) : (
        <span className="no-tags">タグが設定されていません</span>
      )}
    </div>
  </div>
);

export default PageViewer;