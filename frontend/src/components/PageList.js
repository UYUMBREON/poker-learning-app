import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';

const PageList = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pages');
      setPages(response.data);
    } catch (err) {
      setError('ページの取得に失敗しました');
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-list">
      <h2>学習ページ一覧</h2>
      
      <Link to="/page/new" className="create-button">
        <Plus size={20} />
        新しいページを作成
      </Link>

      {pages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>まだページがありません。最初のページを作成してみましょう！</p>
        </div>
      ) : (
        pages.map(page => (
          <Link key={page.id} to={`/page/${page.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="page-card">
              <h3>{page.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                {page.content ? page.content.substring(0, 100) + (page.content.length > 100 ? '...' : '') : '内容なし'}
              </p>
              <div className="page-meta">
                <div className="page-tags">
                  {page.tags && page.tags.map(tag => (
                    <span key={tag.id} className="tag" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {formatDate(page.updated_at)}
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default PageList;