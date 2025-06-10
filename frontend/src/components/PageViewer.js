import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, ArrowLeft, GitBranch, FileText, Tag, Clock } from 'lucide-react';
import { usePage } from '../hooks/useApi';
import { formatDateTime } from '../utils/constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import Button from './common/Button';
import TagBadge from './common/TagBadge';
import MarkdownViewer from './common/MarkdownViewer';
import TreeViewer from './TreeViewer';

const PageViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { page, loading, error } = usePage(id);

  // 見出しへのスクロール機能
  const scrollToHeading = (headingText) => {
    console.log('PageViewer scrollToHeading called with:', headingText);
    
    const attemptScroll = () => {
      console.log('PageViewer attemptScroll開始');
      
      // 複数の可能なセレクターでコンテナを検索
      const possibleSelectors = [
        '.content-viewer-wrapper .markdown-viewer',
        '.content-viewer-wrapper',
        '.page-content-viewer',
        '.markdown-viewer',
        '[class*="markdown"]'
      ];
      
      let markdownViewer = null;
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`PageViewer: 要素が見つかりました (${selector}):`, element);
          markdownViewer = element;
          break;
        }
      }
      
      if (markdownViewer) {
        console.log('PageViewer: ターゲットコンテナ:', markdownViewer);
        console.log('PageViewer: コンテナのクラス:', markdownViewer.className);
        
        // 見出し要素を検索
        const headingSelectors = [
          'h1, h2, h3, h4, h5, h6',
          '[class*="markdown-h"]',
          '.markdown-h1, .markdown-h2, .markdown-h3, .markdown-h4, .markdown-h5, .markdown-h6'
        ];
        
        let headings = [];
        for (const selector of headingSelectors) {
          headings = markdownViewer.querySelectorAll(selector);
          if (headings.length > 0) {
            console.log(`PageViewer: 見出し要素が見つかりました (${selector}):`, headings.length, '個');
            break;
          }
        }
        
        console.log('PageViewer: 見つかった見出し要素数:', headings.length);
        
        if (headings.length === 0) {
          // 見出し要素が見つからない場合、全要素をテキストで検索
          const allElements = markdownViewer.querySelectorAll('*');
          console.log('PageViewer: 全要素数:', allElements.length);
          
          for (const element of allElements) {
            if (element.textContent && element.textContent.trim() === headingText.trim()) {
              console.log('PageViewer: テキスト一致要素が見つかりました:', element);
              headings = [element];
              break;
            }
          }
        }
        
        let foundHeading = null;
        for (const heading of headings) {
          const headingText_clean = heading.textContent?.trim() || '';
          const targetText_clean = headingText.trim();
          console.log(`PageViewer: 見出し比較: "${headingText_clean}" vs "${targetText_clean}"`);
          
          if (headingText_clean === targetText_clean) {
            foundHeading = heading;
            console.log('PageViewer: 一致する見出しが見つかりました:', foundHeading);
            break;
          }
        }
        
        if (foundHeading) {
          console.log('PageViewer: スクロール実行開始');
          
          // スクロール実行
          try {
            foundHeading.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            console.log('PageViewer: scrollIntoView実行完了');
          } catch (error) {
            console.log('PageViewer: scrollIntoViewエラー:', error);
            // フォールバック: ウィンドウスクロール
            try {
              const rect = foundHeading.getBoundingClientRect();
              window.scrollTo({
                top: window.scrollY + rect.top - 100,
                behavior: 'smooth'
              });
              console.log('PageViewer: ウィンドウスクロール実行完了');
            } catch (error2) {
              console.log('PageViewer: ウィンドウスクロールエラー:', error2);
            }
          }
          
          // 視覚的フィードバック
          foundHeading.style.backgroundColor = '#fef3c7';
          foundHeading.style.border = '2px solid #f59e0b';
          foundHeading.style.borderRadius = '4px';
          foundHeading.style.transition = 'all 0.3s ease';
          setTimeout(() => {
            foundHeading.style.backgroundColor = '';
            foundHeading.style.border = '';
            foundHeading.style.borderRadius = '';
          }, 2000);
          
        } else {
          console.log('PageViewer: 該当する見出しが見つかりませんでした');
          console.log('PageViewer: 利用可能な見出し一覧:');
          headings.forEach((h, i) => {
            console.log(`  ${i}: "${h.textContent?.trim() || 'テキストなし'}" (タグ: ${h.tagName})`);
          });
        }
      } else {
        console.log('PageViewer: コンテンツビューアが見つかりません');
        console.log('PageViewer: ページ内の全要素:');
        const allElements = document.querySelectorAll('[class*="markdown"], [class*="viewer"], [class*="content"]');
        allElements.forEach((el, i) => {
          console.log(`  ${i}: ${el.className} - ${el.tagName}`);
        });
      }
    };
    
    // 複数回試行（DOM更新のタイミングを考慮）
    setTimeout(attemptScroll, 100);
    setTimeout(attemptScroll, 300);
  };

  // ノードクリックによる見出しスクロール
  const handleNodeClickScroll = (node) => {
    scrollToHeading(node.label);
  };

  if (loading) {
    return <LoadingSpinner message="ページを読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!page) {
    return <ErrorMessage message="ページが見つかりません" />;
  }

  return (
    <div className="page-viewer">
      <ViewerHeader 
        page={page}
        onEdit={() => navigate(`/page/${id}/edit`)}
        onBack={() => navigate('/')}
      />

      <PageMeta page={page} />

      <div className="viewer-sections">
        <TreeViewerSection 
          treeData={page.tree_data} 
          onNodeClickScroll={handleNodeClickScroll}
        />
        <ContentViewerSection content={page.content} />
      </div>

      <TagsViewerSection tags={page.tags} />
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

const TreeViewerSection = ({ treeData, onNodeClickScroll }) => {
  if (!treeData || (!treeData.nodes?.length && !treeData.hierarchyLevels?.length)) {
    return (
      <div className="viewer-section">
        <h2 className="section-title">
          <GitBranch size={20} />
          学習構造
        </h2>
        <div className="empty-tree-viewer">
          <p>学習構造が設定されていません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-section">
      <h2 className="section-title">
        <GitBranch size={20} />
        学習構造
      </h2>
      <TreeViewer 
        treeData={treeData} 
        onNodeClickScroll={onNodeClickScroll}
      />
    </div>
  );
};

const ContentViewerSection = ({ content }) => {
  console.log('ContentViewerSection content:', content); // デバッグ用

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