import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, GitBranch, FileText, Tag } from 'lucide-react';
import axios from 'axios';
import TreeEditor from './TreeEditor';

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPage = !id;

  const [page, setPage] = useState({
    title: '',
    content: '',
    tree_data: { nodes: [], edges: [] },
    tags: []
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTags();
    if (!isNewPage) {
      fetchPage();
    }
  }, [id, isNewPage]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/pages/${id}`);
      const pageData = response.data;
      setPage({
        title: pageData.title,
        content: pageData.content || '',
        tree_data: pageData.tree_data || { nodes: [], edges: [] },
        tags: pageData.tags || []
      });
      setSelectedTags(pageData.tags ? pageData.tags.map(tag => tag.id) : []);
    } catch (err) {
      setError('ページの取得に失敗しました');
      console.error('Error fetching page:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      setAvailableTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleSave = async () => {
    if (!page.title.trim()) {
      alert('ページタイトルを入力してください');
      return;
    }

    try {
      setSaving(true);
      const pageData = {
        title: page.title,
        content: page.content,
        tree_data: page.tree_data,
        tags: selectedTags
      };

      if (isNewPage) {
        const response = await axios.post('/api/pages', pageData);
        navigate(`/page/${response.data.id}`);
      } else {
        await axios.put(`/api/pages/${id}`, pageData);
        alert('保存しました！');
      }
    } catch (err) {
      alert('保存に失敗しました');
      console.error('Error saving page:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('このページを削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`/api/pages/${id}`);
      navigate('/');
    } catch (err) {
      alert('削除に失敗しました');
      console.error('Error deleting page:', err);
    }
  };

  const handleTitleChange = (e) => {
    setPage(prev => ({ ...prev, title: e.target.value }));
  };

  const handleContentChange = (e) => {
    setPage(prev => ({ ...prev, content: e.target.value }));
  };

  const handleTreeDataChange = (newTreeData) => {
    setPage(prev => ({ ...prev, tree_data: newTreeData }));
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-editor">
      <div className="editor-header">
        <h2>{isNewPage ? '新しいページ' : 'ページ編集'}</h2>
        <div className="editor-actions">
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
          {!isNewPage && (
            <button 
              className="save-button delete-button" 
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              削除
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        className="title-input"
        placeholder="ページタイトルを入力してください"
        value={page.title}
        onChange={handleTitleChange}
      />

      <div className="editor-sections">
        <div className="tree-section">
          <h3 className="section-title">
            <GitBranch size={20} />
            樹形図エディター
          </h3>
          <TreeEditor 
            treeData={page.tree_data}
            onChange={handleTreeDataChange}
          />
        </div>

        <div className="content-section">
          <h3 className="section-title">
            <FileText size={20} />
            内容
          </h3>
          <textarea
            className="content-textarea"
            placeholder="ページの内容を入力してください..."
            value={page.content}
            onChange={handleContentChange}
          />
        </div>
      </div>

      <div className="tags-section">
        <h3 className="section-title">
          <Tag size={20} />
          タグ
        </h3>
        <div className="tag-selector">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              className={`tag-option ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
              onClick={() => handleTagToggle(tag.id)}
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'white',
                borderColor: tag.color,
                color: selectedTags.includes(tag.id) ? 'white' : tag.color
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageEditor;