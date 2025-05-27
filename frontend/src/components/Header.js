import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Home, Table } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>
          <BookOpen size={32} style={{ display: 'inline', marginRight: '12px' }} />
          学習アプリ
        </h1>
        <nav className="header-nav">
          <Link to="/">
            <Home size={16} style={{ display: 'inline', marginRight: '6px' }} />
            ホーム
          </Link>
          <Link to="/summary">
            <Table size={16} style={{ display: 'inline', marginRight: '6px' }} />
            まとめ
          </Link>
          <Link to="/page/new">
            <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />
            新規作成
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;