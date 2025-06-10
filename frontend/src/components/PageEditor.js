import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, GitBranch, FileText, Tag, Eye, Edit, ArrowLeft } from 'lucide-react';
import { usePage, usePages, useTags } from '../hooks/useApi';
import { usePageForm } from '../hooks/useForm';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import Button from './common/Button';
import TreeEditor from './TreeEditor';
import TagSelector from './TagSelector';
import MarkdownViewer from './common/MarkdownViewer';

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPage = !id;
  const contentTextareaRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // 新規ページの場合はAPIを呼ばない
  const { page, loading: pageLoading, error: pageError } = usePage(isNewPage ? null : id);
  const { createPage, updatePage, deletePage } = usePages();
  const { tags, loading: tagsLoading } = useTags();
  const [saving, setSaving] = useState(false);

  const form = usePageForm(page);

  // 見出しへのスクロール機能
  const scrollToHeading = (headingText) => {
    console.log('scrollToHeading called with:', headingText, 'isPreviewMode:', isPreviewMode);
    
    if (contentTextareaRef.current && !isPreviewMode) {
      const content = form.values.content;
      const lines = content.split('\n');
      let targetLineIndex = -1;
      
      // 見出しパターンを検索（## 見出し、### 見出し など）
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // H1-H6の見出しパターンをチェック
        const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
        if (headingMatch && headingMatch[1].trim() === headingText.trim()) {
          targetLineIndex = i;
          break;
        }
      }
      
      if (targetLineIndex !== -1) {
        // 行番号から文字位置を計算
        const beforeLines = lines.slice(0, targetLineIndex);
        const position = beforeLines.join('\n').length + (targetLineIndex > 0 ? 1 : 0);
        
        // テキストエリアにフォーカスしてカーソル位置を設定
        contentTextareaRef.current.focus();
        contentTextareaRef.current.setSelectionRange(position, position);
        
        // スクロール位置を調整
        const textarea = contentTextareaRef.current;
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const scrollTop = (targetLineIndex * lineHeight) - (textarea.clientHeight / 4);
        textarea.scrollTop = Math.max(0, scrollTop);
      }
    } else if (isPreviewMode) {
      console.log('プレビューモードでのスクロール処理開始');
      
      // プレビューモードの場合は該当見出しにスクロール
      const attemptScroll = () => {
        console.log('attemptScroll開始');
        
        // 複数の可能なセレクターでコンテナを検索
        const possibleSelectors = [
          '.content-preview .markdown-viewer',
          '.content-preview',
          '.markdown-viewer',
          '[class*="markdown"]',
          '.content-section .content-preview'
        ];
        
        let previewContainer = null;
        let markdownViewer = null;
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            console.log(`要素が見つかりました (${selector}):`, element);
            if (selector.includes('markdown-viewer')) {
              markdownViewer = element;
            } else {
              previewContainer = element;
            }
            break;
          }
        }
        
        // markdownViewerが見つからない場合、previewContainer内を検索
        if (!markdownViewer && previewContainer) {
          markdownViewer = previewContainer.querySelector('.markdown-viewer') || 
                          previewContainer.querySelector('[class*="markdown"]') ||
                          previewContainer;
        }
        
        const targetContainer = markdownViewer || previewContainer;
        
        if (targetContainer) {
          console.log('ターゲットコンテナ:', targetContainer);
          console.log('コンテナのクラス:', targetContainer.className);
          console.log('コンテナの内容 (最初の100文字):', targetContainer.textContent.substring(0, 100));
          
          // 見出し要素を検索
          const headingSelectors = [
            'h1, h2, h3, h4, h5, h6',
            '[class*="markdown-h"]',
            '.markdown-h1, .markdown-h2, .markdown-h3, .markdown-h4, .markdown-h5, .markdown-h6'
          ];
          
          let headings = [];
          for (const selector of headingSelectors) {
            headings = targetContainer.querySelectorAll(selector);
            if (headings.length > 0) {
              console.log(`見出し要素が見つかりました (${selector}):`, headings.length, '個');
              break;
            }
          }
          
          console.log('見つかった見出し要素数:', headings.length);
          
          if (headings.length === 0) {
            // 見出し要素が見つからない場合、divやspanも検索
            const allElements = targetContainer.querySelectorAll('*');
            console.log('全要素数:', allElements.length);
            
            // テキスト内容で検索
            for (const element of allElements) {
              if (element.textContent && element.textContent.trim() === headingText.trim()) {
                console.log('テキスト一致要素が見つかりました:', element);
                headings = [element];
                break;
              }
            }
          }
          
          let foundHeading = null;
          for (const heading of headings) {
            const headingText_clean = heading.textContent?.trim() || '';
            const targetText_clean = headingText.trim();
            console.log(`見出し比較: "${headingText_clean}" vs "${targetText_clean}"`);
            
            if (headingText_clean === targetText_clean) {
              foundHeading = heading;
              console.log('一致する見出しが見つかりました:', foundHeading);
              break;
            }
          }
          
          if (foundHeading) {
            console.log('スクロール実行開始');
            
            // 複数のスクロール方法を試行
            const scrollMethods = [
              // 方法1: scrollIntoView
              () => {
                foundHeading.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start',
                  inline: 'nearest'
                });
              },
              // 方法2: 親コンテナのscrollTop設定
              () => {
                const rect = foundHeading.getBoundingClientRect();
                const containerRect = targetContainer.getBoundingClientRect();
                const offset = rect.top - containerRect.top;
                targetContainer.scrollTop = targetContainer.scrollTop + offset - 50;
              },
              // 方法3: ウィンドウスクロール
              () => {
                const rect = foundHeading.getBoundingClientRect();
                window.scrollTo({
                  top: window.scrollY + rect.top - 100,
                  behavior: 'smooth'
                });
              }
            ];
            
            // 最初の方法を試行
            try {
              scrollMethods[0]();
              console.log('scrollIntoView実行完了');
            } catch (error) {
              console.log('scrollIntoViewエラー:', error);
              // フォールバック
              try {
                scrollMethods[1]();
                console.log('手動スクロール実行完了');
              } catch (error2) {
                console.log('手動スクロールエラー:', error2);
                scrollMethods[2]();
                console.log('ウィンドウスクロール実行完了');
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
            console.log('該当する見出しが見つかりませんでした');
            console.log('利用可能な見出し一覧:');
            headings.forEach((h, i) => {
              console.log(`  ${i}: "${h.textContent?.trim() || 'テキストなし'}" (タグ: ${h.tagName})`);
            });
          }
        } else {
          console.log('プレビューコンテナが見つかりません');
          console.log('ページ内の全markdown関連要素:');
          const allMarkdownElements = document.querySelectorAll('[class*="markdown"], [class*="preview"], [class*="content"]');
          allMarkdownElements.forEach((el, i) => {
            console.log(`  ${i}: ${el.className} - ${el.tagName}`);
          });
        }
      };
      
      // 複数回試行（DOM更新のタイミングを考慮）
      setTimeout(attemptScroll, 100);
      setTimeout(attemptScroll, 300);
      setTimeout(attemptScroll, 500);
    }
  };

  // 章へのフォーカス機能（既存）
  const handleChapterFocus = (node) => {
    // プレビューモードの場合は編集モードに切り替え
    if (isPreviewMode) {
      setIsPreviewMode(false);
    }

    // 次のtickでテキストエリアにフォーカス
    setTimeout(() => {
      if (contentTextareaRef.current) {
        const content = form.values.content;
        const chapterMarker = `## ${node.label}`;
        
        // 既存の章マーカーを探す
        let chapterIndex = content.indexOf(chapterMarker);
        
        if (chapterIndex === -1) {
          // 章マーカーが存在しない場合は作成
          const newContent = content + (content ? '\n\n' : '') + `${chapterMarker}\n\n`;
          form.setValue('content', newContent);
          
          // 次のtickで新しいコンテンツでフォーカス
          setTimeout(() => {
            const updatedContent = form.values.content;
            const newChapterIndex = updatedContent.indexOf(chapterMarker);
            if (newChapterIndex !== -1) {
              const position = newChapterIndex + chapterMarker.length;
              contentTextareaRef.current.focus();
              contentTextareaRef.current.setSelectionRange(position, position);
              contentTextareaRef.current.scrollTop = 
                contentTextareaRef.current.scrollHeight * (position / updatedContent.length);
            }
          }, 100);
        } else {
          // 既存の章マーカーにフォーカス
          const position = chapterIndex + chapterMarker.length;
          contentTextareaRef.current.focus();
          contentTextareaRef.current.setSelectionRange(position, position);
          contentTextareaRef.current.scrollTop = 
            contentTextareaRef.current.scrollHeight * (position / content.length);
        }
      }
    }, 100);
  };

  // 新しい機能：ノードクリックによる見出しスクロール
  const handleNodeClickScroll = (node) => {
    scrollToHeading(node.label);
  };

  // ページデータが読み込まれたらフォームを更新（新規ページの場合は実行しない）
  useEffect(() => {
    if (page && !isNewPage) {
      form.setValue('title', page.title);
      form.setValue('content', page.content || '');
      form.setValue('tree_data', page.tree_data || { nodes: [], edges: [] });
      form.setValue('tags', page.tags?.map(tag => tag.id) || []);
    }
  }, [page, isNewPage]);

  const handleSave = async () => {
    if (!form.validate()) {
      alert('ページタイトルを入力してください');
      return;
    }

    try {
      setSaving(true);
      const pageData = {
        title: form.values.title,
        content: form.values.content,
        tree_data: form.values.tree_data,
        tags: form.values.tags
      };

      if (isNewPage) {
        const newPage = await createPage(pageData);
        navigate(`/page/${newPage.id}`);
      } else {
        await updatePage(id, pageData);
        navigate(`/page/${id}`);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('このページを削除してもよろしいですか？')) {
      return;
    }

    try {
      await deletePage(id);
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBackToView = () => {
    if (!isNewPage) {
      navigate(`/page/${id}`);
    } else {
      navigate('/');
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // ローディング状態の判定を修正
  const loading = (!isNewPage && pageLoading) || tagsLoading;

  if (loading) {
    return <LoadingSpinner message="ページを読み込んでいます..." />;
  }

  // 新規ページの場合はpageErrorをチェックしない
  if (!isNewPage && pageError) {
    return <ErrorMessage message={pageError} />;
  }

  return (
    <div className="page-editor">
      <EditorHeader 
        isNewPage={isNewPage}
        saving={saving}
        onSave={handleSave}
        onDelete={!isNewPage ? handleDelete : undefined}
        onBack={handleBackToView}
      />

      <TitleInput 
        value={form.values.title}
        onChange={(value) => form.setValue('title', value)}
        error={form.touched.title && form.errors.title}
      />

      <div className="editor-sections">
        <TreeSection 
          treeData={form.values.tree_data}
          onChange={form.updateTreeData}
          onChapterFocus={handleChapterFocus}
          onNodeClickScroll={handleNodeClickScroll}
        />
        <ContentSection 
          content={form.values.content}
          onChange={(value) => form.setValue('content', value)}
          textareaRef={contentTextareaRef}
          isPreviewMode={isPreviewMode}
          onTogglePreview={togglePreview}
        />
      </div>

      <TagsSection 
        tags={tags}
        selectedTags={form.values.tags}
        onToggleTag={form.toggleTag}
      />
    </div>
  );
};

const EditorHeader = ({ isNewPage, saving, onSave, onDelete, onBack }) => (
  <div className="editor-header">
    <div className="editor-title-section">
      <Button
        variant="secondary"
        size="small"
        icon={ArrowLeft}
        onClick={onBack}
      >
        戻る
      </Button>
      <h2>{isNewPage ? '新しいページ' : 'ページ編集'}</h2>
    </div>
    <div className="editor-actions">
      <Button
        variant="primary"
        icon={Save}
        loading={saving}
        onClick={onSave}
      >
        {saving ? '保存中...' : '保存'}
      </Button>
      {onDelete && (
        <Button
          variant="danger"
          icon={Trash2}
          onClick={onDelete}
        >
          削除
        </Button>
      )}
    </div>
  </div>
);

const TitleInput = ({ value, onChange, error }) => (
  <div className="title-input-container">
    <input
      type="text"
      className="title-input"
      placeholder="ページタイトルを入力してください"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

const TreeSection = ({ treeData, onChange, onChapterFocus, onNodeClickScroll }) => (
  <div className="tree-section">
    <h3 className="section-title">
      <GitBranch size={20} />
      学習構造エディター
    </h3>
    <TreeEditor 
      treeData={treeData}
      onChange={onChange}
      onChapterFocus={onChapterFocus}
      onNodeClickScroll={onNodeClickScroll}
    />
  </div>
);

const ContentSection = ({ content, onChange, textareaRef, isPreviewMode, onTogglePreview }) => {
  return (
    <div className="content-section">
      <div className="content-header">
        <h3 className="section-title">
          <FileText size={20} />
          内容 {isPreviewMode ? '(プレビュー)' : '(編集)'}
        </h3>
        <div className="content-mode-toggle">
          <Button
            variant={!isPreviewMode ? "primary" : "secondary"}
            size="small"
            icon={Edit}
            onClick={() => !isPreviewMode || onTogglePreview()}
          >
            編集
          </Button>
          <Button
            variant={isPreviewMode ? "primary" : "secondary"}
            size="small"
            icon={Eye}
            onClick={() => isPreviewMode || onTogglePreview()}
          >
            プレビュー
          </Button>
        </div>
      </div>
      
      {isPreviewMode ? (
        <div className="content-preview">
          <MarkdownViewer content={content} />
        </div>
      ) : (
        <div className="content-editor">
          <textarea
            ref={textareaRef}
            className="content-textarea"
            placeholder="ページの内容をMarkdown形式で入力してください...&#10;&#10;## 章タイトル&#10;各章の内容をここに記述します。&#10;&#10;### サブセクション&#10;**太字**や*斜体*、`コード`なども使用できます。&#10;&#10;- リスト項目1&#10;- リスト項目2&#10;&#10;> 重要な引用や注意事項&#10;&#10;```javascript&#10;// コードブロックも記述可能&#10;console.log('Hello, World!');&#10;```"
            value={content}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="markdown-help">
            <p>
              <strong>Markdownヘルプ:</strong> 
              ## 見出し、**太字**、*斜体*、`コード`、[リンク](URL)、
              ```コードブロック```、- リスト、> 引用 などが使用できます
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const TagsSection = ({ tags, selectedTags, onToggleTag }) => (
  <div className="tags-section">
    <h3 className="section-title">
      <Tag size={20} />
      タグ
    </h3>
    <TagSelector 
      tags={tags}
      selectedTags={selectedTags}
      onToggle={onToggleTag}
    />
  </div>
);

export default PageEditor;