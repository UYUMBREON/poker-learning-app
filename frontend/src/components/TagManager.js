import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Tag, Palette } from 'lucide-react';
import { useTags } from '../hooks/useApi';
import { useTagForm } from '../hooks/useForm';
import { useTagSearch } from '../hooks/useSearch';
import { COLOR_PALETTE } from '../utils/constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import ColorPalette from './common/ColorPalette';
import Button from './common/Button';
import EmptyState from './common/EmptyState';
import SearchBox from './common/SearchBox';

const TagManager = () => {
  const { tags, loading, error, createTag, updateTag, deleteTag } = useTags();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null);
  
  // タグ検索機能を追加
  const {
    searchTerm,
    filteredTags,
    updateSearchTerm,
    clearSearch
  } = useTagSearch(tags);

  if (loading) {
    return <LoadingSpinner message="タグを読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="tag-manager">
      <TagManagerHeader />
      
      <CreateTagSection 
        isCreating={isCreating}
        onToggleCreate={() => setIsCreating(!isCreating)}
        onCreateTag={createTag}
        onCancel={() => setIsCreating(false)}
      />

      <TagsListSection 
        tags={filteredTags}
        searchTerm={searchTerm}
        totalTagsCount={tags.length}
        editingTagId={editingTagId}
        onStartEdit={setEditingTagId}
        onCancelEdit={() => setEditingTagId(null)}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
        onSearchChange={updateSearchTerm}
        onClearSearch={clearSearch}
      />
    </div>
  );
};

const TagManagerHeader = () => (
  <div className="tag-manager-header">
    <h2>
      <Tag size={24} style={{ marginRight: '8px' }} />
      タグ管理
    </h2>
    <p className="tag-manager-description">
      学習ページに使用するタグの作成・編集・削除ができます
    </p>
  </div>
);

const CreateTagSection = ({ isCreating, onToggleCreate, onCreateTag, onCancel }) => {
  const form = useTagForm();

  const handleSubmit = async () => {
    if (!form.validate()) return;

    try {
      await onCreateTag(form.values);
      form.reset();
      onCancel();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="create-tag-section">
      <div className="section-header">
        <h3>新しいタグを作成</h3>
        <Button
          variant="success"
          size="small"
          icon={isCreating ? X : Plus}
          onClick={onToggleCreate}
        >
          {isCreating ? 'キャンセル' : '新規作成'}
        </Button>
      </div>

      {isCreating && (
        <CreateTagForm 
          form={form}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

const CreateTagForm = ({ form, onSubmit, onCancel }) => (
  <div className="create-tag-form">
    <div className="form-row">
      <div className="form-group">
        <label>タグ名</label>
        <input
          type="text"
          name="name"
          value={form.values.name}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          placeholder="タグ名を入力..."
          className="tag-name-input"
          maxLength={20}
        />
        {form.touched.name && form.errors.name && (
          <span className="error-text">{form.errors.name}</span>
        )}
      </div>
      
      <div className="form-group">
        <label>色</label>
        <div className="color-selector">
          <div className="color-preview" style={{ backgroundColor: form.values.color }}>
            <Palette size={16} />
          </div>
          <ColorPalette
            colors={COLOR_PALETTE}
            selectedColor={form.values.color}
            onColorSelect={(color) => form.setValue('color', color)}
          />
        </div>
      </div>
    </div>
    
    <div className="form-actions">
      <Button
        variant="primary"
        icon={Save}
        onClick={onSubmit}
      >
        タグを作成
      </Button>
      <div className="tag-preview">
        <TagPreview name={form.values.name} color={form.values.color} />
      </div>
    </div>
  </div>
);

const TagsListSection = ({ 
  tags, 
  searchTerm,
  totalTagsCount,
  editingTagId, 
  onStartEdit, 
  onCancelEdit, 
  onUpdateTag, 
  onDeleteTag,
  onSearchChange,
  onClearSearch
}) => (
  <div className="tags-list-section">
    <div className="tags-list-header">
      <h3>タグ一覧 ({tags.length}件{tags.length !== totalTagsCount ? ` / 全${totalTagsCount}件` : ''})</h3>
      
      <div className="tags-search-container">
        <SearchBox
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="タグ名で検索..."
          onClear={onClearSearch}
        />
      </div>
    </div>
    
    {tags.length === 0 ? (
      searchTerm ? (
        <div className="no-search-results">
          <Tag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h4>「{searchTerm}」に一致するタグが見つかりませんでした</h4>
          <p>検索条件を変更してお試しください。</p>
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="まだタグが作成されていません"
          description="最初のタグを作成してみましょう！"
        />
      )
    ) : (
      <div className="tags-grid">
        {tags.map(tag => (
          <TagCard
            key={tag.id}
            tag={tag}
            isEditing={editingTagId === tag.id}
            onStartEdit={() => onStartEdit(tag.id)}
            onCancelEdit={onCancelEdit}
            onUpdateTag={onUpdateTag}
            onDeleteTag={onDeleteTag}
          />
        ))}
      </div>
    )}
  </div>
);

const TagCard = ({ 
  tag, 
  isEditing, 
  onStartEdit, 
  onCancelEdit, 
  onUpdateTag, 
  onDeleteTag 
}) => {
  const form = useTagForm(tag);

  const handleSave = async () => {
    if (!form.validate()) return;

    try {
      await onUpdateTag(tag.id, form.values);
      onCancelEdit();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      `タグ「${tag.name}」を削除してもよろしいですか？\n関連付けられたページからもタグが削除されます。`
    )) {
      return;
    }

    try {
      await onDeleteTag(tag.id);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="tag-card">
      {isEditing ? (
        <TagEditForm 
          form={form}
          onSave={handleSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <TagDisplay 
          tag={tag}
          onEdit={onStartEdit}
          onDelete={handleDelete}
        />
      )}
      <TagMeta tag={tag} />
    </div>
  );
};

const TagDisplay = ({ tag, onEdit, onDelete }) => (
  <div className="tag-display">
    <div className="tag-info">
      <span 
        className="tag-badge"
        style={{ 
          backgroundColor: tag.color,
          color: 'white'
        }}
      >
        {tag.name}
      </span>
      <span className="tag-color-code">{tag.color}</span>
    </div>
    <div className="tag-actions">
      <button
        className="edit-button"
        onClick={onEdit}
        title="編集"
      >
        <Edit2 size={16} />
      </button>
      <button
        className="delete-button"
        onClick={onDelete}
        title="削除"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

const TagEditForm = ({ form, onSave, onCancel }) => (
  <div className="tag-edit-form">
    <div className="edit-header">
      <input
        type="text"
        name="name"
        value={form.values.name}
        onChange={form.handleChange}
        className="edit-name-input"
        maxLength={20}
      />
      <div className="edit-actions">
        <button
          className="save-edit-button"
          onClick={onSave}
        >
          <Save size={14} />
        </button>
        <button
          className="cancel-edit-button"
          onClick={onCancel}
        >
          <X size={14} />
        </button>
      </div>
    </div>
    
    <div className="color-selector">
      <div className="current-color" style={{ backgroundColor: form.values.color }}>
        <Palette size={14} />
      </div>
      <ColorPalette
        colors={COLOR_PALETTE}
        selectedColor={form.values.color}
        onColorSelect={(color) => form.setValue('color', color)}
        size="small"
      />
    </div>
    
    <div className="edit-preview">
      <TagPreview name={form.values.name} color={form.values.color} />
    </div>
  </div>
);

const TagPreview = ({ name, color }) => (
  <span 
    className="preview-tag"
    style={{ 
      backgroundColor: color,
      color: 'white'
    }}
  >
    {name || 'プレビュー'}
  </span>
);

const TagMeta = ({ tag }) => (
  <div className="tag-meta">
    <span className="created-date">
      作成日: {new Date(tag.created_at).toLocaleDateString('ja-JP')}
    </span>
  </div>
);

export default TagManager;