import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Tag, Palette } from 'lucide-react';
import axios from 'axios';

const TagManager = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [isCreating, setIsCreating] = useState(false);

  // カラーパレット
  const colorPalette = [
    '#EF4444', // 赤
    '#F59E0B', // 黄
    '#10B981', // 緑
    '#3B82F6', // 青
    '#8B5CF6', // 紫
    '#EC4899', // ピンク
    '#06B6D4', // シアン
    '#84CC16', // ライム
    '#F97316', // オレンジ
    '#6366F1', // インディゴ
    '#14B8A6', // ティール
    '#A855F7'  // バイオレット
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tags');
      setTags(response.data);
    } catch (err) {
      setError('タグの取得に失敗しました');
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      alert('タグ名を入力してください');
      return;
    }

    try {
      const response = await axios.post('/api/tags', newTag);
      setTags([...tags, response.data]);
      setNewTag({ name: '', color: '#3B82F6' });
      setIsCreating(false);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('unique')) {
        alert('同じ名前のタグが既に存在します');
      } else {
        alert('タグの作成に失敗しました');
      }
      console.error('Error creating tag:', err);
    }
  };

  const handleUpdateTag = async (tagId, updatedData) => {
    if (!updatedData.name.trim()) {
      alert('タグ名を入力してください');
      return;
    }

    try {
      const response = await axios.put(`/api/tags/${tagId}`, updatedData);
      setTags(tags.map(tag => tag.id === tagId ? response.data : tag));
      setEditingTag(null);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('unique')) {
        alert('同じ名前のタグが既に存在します');
      } else {
        alert('タグの更新に失敗しました');
      }
      console.error('Error updating tag:', err);
    }
  };

  const handleDeleteTag = async (tagId, tagName) => {
    if (!window.confirm(`タグ「${tagName}」を削除してもよろしいですか？\n関連付けられたページからもタグが削除されます。`)) {
      return;
    }

    try {
      await axios.delete(`/api/tags/${tagId}`);
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (err) {
      alert('タグの削除に失敗しました');
      console.error('Error deleting tag:', err);
    }
  };

  const startEditing = (tag) => {
    setEditingTag({ ...tag });
  };

  const cancelEditing = () => {
    setEditingTag(null);
  };

  const saveEditing = () => {
    handleUpdateTag(editingTag.id, {
      name: editingTag.name,
      color: editingTag.color
    });
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="tag-manager">
      <div className="tag-manager-header">
        <h2>
          <Tag size={24} style={{ marginRight: '8px' }} />
          タグ管理
        </h2>
        <p className="tag-manager-description">
          学習ページに使用するタグの作成・編集・削除ができます
        </p>
      </div>

      {/* 新規タグ作成セクション */}
      <div className="create-tag-section">
        <div className="section-header">
          <h3>新しいタグを作成</h3>
          <button
            className="toggle-create-button"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? <X size={16} /> : <Plus size={16} />}
            {isCreating ? 'キャンセル' : '新規作成'}
          </button>
        </div>

        {isCreating && (
          <div className="create-tag-form">
            <div className="form-row">
              <div className="form-group">
                <label>タグ名</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="タグ名を入力..."
                  className="tag-name-input"
                  maxLength={20}
                />
              </div>
              <div className="form-group">
                <label>色</label>
                <div className="color-selector">
                  <div className="color-preview" style={{ backgroundColor: newTag.color }}>
                    <Palette size={16} />
                  </div>
                  <div className="color-palette">
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        className={`color-option ${newTag.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTag({ ...newTag, color })}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="create-button"
                onClick={handleCreateTag}
              >
                <Save size={16} />
                タグを作成
              </button>
              <div className="tag-preview">
                <span 
                  className="preview-tag"
                  style={{ 
                    backgroundColor: newTag.color,
                    color: 'white'
                  }}
                >
                  {newTag.name || 'プレビュー'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 既存タグ一覧 */}
      <div className="tags-list-section">
        <h3>既存のタグ ({tags.length}件)</h3>
        
        {tags.length === 0 ? (
          <div className="no-tags">
            <Tag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>まだタグが作成されていません。</p>
            <p>最初のタグを作成してみましょう！</p>
          </div>
        ) : (
          <div className="tags-grid">
            {tags.map(tag => (
              <div key={tag.id} className="tag-card">
                {editingTag && editingTag.id === tag.id ? (
                  // 編集モード
                  <div className="tag-edit-form">
                    <div className="edit-header">
                      <input
                        type="text"
                        value={editingTag.name}
                        onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                        className="edit-name-input"
                        maxLength={20}
                      />
                      <div className="edit-actions">
                        <button
                          className="save-edit-button"
                          onClick={saveEditing}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          className="cancel-edit-button"
                          onClick={cancelEditing}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="color-selector">
                      <div className="current-color" style={{ backgroundColor: editingTag.color }}>
                        <Palette size={14} />
                      </div>
                      <div className="color-palette-small">
                        {colorPalette.map(color => (
                          <button
                            key={color}
                            className={`color-option-small ${editingTag.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingTag({ ...editingTag, color })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="edit-preview">
                      <span 
                        className="preview-tag-small"
                        style={{ 
                          backgroundColor: editingTag.color,
                          color: 'white'
                        }}
                      >
                        {editingTag.name || 'プレビュー'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // 表示モード
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
                        onClick={() => startEditing(tag)}
                        title="編集"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="tag-meta">
                  <span className="created-date">
                    作成日: {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManager;