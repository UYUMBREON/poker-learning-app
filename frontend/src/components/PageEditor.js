import React, { useEffect, useState } from 'react';
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
        />
        <ContentSection 
          content={form.values.content}
          onChange={(value) => form.setValue('content', value)}
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

const TreeSection = ({ treeData, onChange }) => (
  <div className="tree-section">
    <h3 className="section-title">
      <GitBranch size={20} />
      樹形図エディター
    </h3>
    <TreeEditor 
      treeData={treeData}
      onChange={onChange}
    />
  </div>
);

const ContentSection = ({ content, onChange }) => (
  <div className="content-section">
    <h3 className="section-title">
      <FileText size={20} />
      内容
    </h3>
    <textarea
      className="content-textarea"
      placeholder="ページの内容を入力してください..."
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