import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, GitBranch, FileText, Tag } from 'lucide-react';
import { usePage, usePages, useTags } from '../hooks/useApi';
import { usePageForm } from '../hooks/useForm';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import Button from './common/Button';
import TreeEditor from './TreeEditor';
import TagSelector from './TagSelector';

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPage = !id;
  const contentTextareaRef = useRef(null);
  
  // 新規ページの場合はAPIを呼ばない
  const { page, loading: pageLoading, error: pageError } = usePage(isNewPage ? null : id);
  const { createPage, updatePage, deletePage } = usePages();
  const { tags, loading: tagsLoading } = useTags();
  const [saving, setSaving] = useState(false);

  const form = usePageForm(page);

  // 章へのフォーカス機能
  const handleChapterFocus = (node) => {
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
  };

  // ページデータが読み込まれたらフォームを更新（新規ページの場合は実行しない）
  useEffect(() => {
    if (page && !isNewPage) {
      // setValue関数を直接呼び出すのではなく、個別に設定
      form.setValue('title', page.title);
      form.setValue('content', page.content || '');
      form.setValue('tree_data', page.tree_data || { nodes: [], edges: [] });
      form.setValue('tags', page.tags?.map(tag => tag.id) || []);
    }
  }, [page, isNewPage]); // form全体を依存配列から除外

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
        alert('保存しました！');
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
        />
        <ContentSection 
          content={form.values.content}
          onChange={(value) => form.setValue('content', value)}
          textareaRef={contentTextareaRef}
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

const EditorHeader = ({ isNewPage, saving, onSave, onDelete }) => (
  <div className="editor-header">
    <h2>{isNewPage ? '新しいページ' : 'ページ編集'}</h2>
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

const TreeSection = ({ treeData, onChange, onChapterFocus }) => (
  <div className="tree-section">
    <h3 className="section-title">
      <GitBranch size={20} />
      学習構造エディター
    </h3>
    <TreeEditor 
      treeData={treeData}
      onChange={onChange}
      onChapterFocus={onChapterFocus}
    />
  </div>
);

const ContentSection = ({ content, onChange, textareaRef }) => (
  <div className="content-section">
    <h3 className="section-title">
      <FileText size={20} />
      内容
    </h3>
    <textarea
      ref={textareaRef}
      className="content-textarea"
      placeholder="ページの内容を入力してください...&#10;&#10;## 章タイトル&#10;各章の内容をここに記述します。"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

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