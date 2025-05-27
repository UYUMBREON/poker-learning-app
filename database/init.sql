-- データベース初期化SQL

-- ページテーブル
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    tree_data JSONB, -- 樹形図データをJSONで保存
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タグテーブル
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- デフォルトの青色
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ページとタグの中間テーブル
CREATE TABLE page_tags (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(page_id, tag_id)
);

-- 更新時刻を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ページテーブルに更新トリガーを設定
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ
INSERT INTO tags (name, color) VALUES 
    ('数学', '#EF4444'),
    ('プログラミング', '#10B981'),
    ('英語', '#8B5CF6'),
    ('物理', '#F59E0B');

INSERT INTO pages (title, content, tree_data) VALUES 
    ('はじめての学習ページ', 
     'ここに学習内容を記入してください。', 
     '{"nodes": [{"id": "1", "label": "導入", "x": 100, "y": 50}, {"id": "2", "label": "基礎", "x": 250, "y": 50}, {"id": "3", "label": "応用", "x": 400, "y": 50}], "edges": [{"id": "e1-2", "source": "1", "target": "2"}, {"id": "e2-3", "source": "2", "target": "3"}]}');

INSERT INTO page_tags (page_id, tag_id) VALUES (1, 1);