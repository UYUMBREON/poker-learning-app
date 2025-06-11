import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, FileText, Tag, Eye, Edit, ArrowLeft, GitBranch } from 'lucide-react';
import { usePage, usePages, useTags } from '../hooks/useApi';
import { usePageForm } from '../hooks/useForm';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import Button from './common/Button';
import TagSelector from './TagSelector';
import MarkdownViewer from './common/MarkdownViewer';
import TreeDiagramEditor from './TreeDiagramEditor';

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPage = !id;
  const contentTextareaRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [treeData, setTreeData] = useState(null);
  
  // 新規ページの場合はAPIを呼ばない
  const { page, loading: pageLoading, error: pageError } = usePage(isNewPage ? null : id);
  const { createPage, updatePage, deletePage } = usePages();
  const { tags, loading: tagsLoading } = useTags();
  const [saving, setSaving] = useState(false);

  const form = usePageForm(page);

  // ページデータが読み込まれたらフォームを更新（新規ページの場合は実行しない）
  useEffect(() => {
    if (page && !isNewPage) {
      form.setValue('title', page.title);
      form.setValue('content', page.content || '');
      form.setValue('tags', page.tags?.map(tag => tag.id) || []);
      
      // 樹形図データを復元
      if (page.tree_data) {
        try {
          const parsedTreeData = typeof page.tree_data === 'string' 
            ? JSON.parse(page.tree_data) 
            : page.tree_data;
          setTreeData(parsedTreeData);
        } catch (error) {
          console.error('樹形図データの解析に失敗しました:', error);
          setTreeData(null);
        }
      }
    }
  }, [page, isNewPage]);

  // 樹形図データ変更ハンドラー
  const handleTreeDataChange = (newTreeData) => {
    setTreeData(newTreeData);
  };

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
        tags: form.values.tags,
        tree_data: treeData ? JSON.stringify(treeData) : null
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
    <div className="page-editor-with-tree">
      <EditorHeader 
        isNewPage={isNewPage}
        saving={saving}
        onSave={handleSave}
        onDelete={!isNewPage ? handleDelete : undefined}
        onBack={handleBackToView}
      />

      <div className="editor-layout">
        {/* 左側: 樹形図エディター (1/3) */}
        <div className="tree-diagram-section">
          <div className="section-header">
            <h3 className="section-title">
              <GitBranch size={20} />
              樹形図
            </h3>
          </div>
          <TreeDiagramEditor 
            treeData={treeData}
            onTreeDataChange={handleTreeDataChange}
          />
        </div>

        {/* 右側: コンテンツエディター (2/3) */}
        <div className="content-editor-section">
          <TitleInput 
            value={form.values.title}
            onChange={(value) => form.setValue('title', value)}
            error={form.touched.title && form.errors.title}
          />

          <div className="editor-sections">
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
      </div>
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