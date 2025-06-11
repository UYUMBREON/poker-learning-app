-- データベース初期化SQL

-- ページテーブル（tree_data列を削除）
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
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
    ('物理', '#F59E0B'),
    ('歴史', '#EC4899'),
    ('化学', '#06B6D4');

INSERT INTO pages (title, content) VALUES 
    ('はじめての学習ページ', 
     'ここに学習内容を記入してください。

## 第1章 基礎知識
この章では基本的な概念について学習します。

### 1.1 導入
まずは基本的な考え方を理解しましょう。

### 1.2 重要なポイント
- ポイント1: 基本概念の理解
- ポイント2: 実践的な応用
- ポイント3: 発展的な内容

## 第2章 応用
基礎知識を活用した応用例を学習します。

> 重要: 実際に手を動かして確認することが大切です。

```javascript
// サンプルコード
function example() {
    console.log("Hello, Learning!");
}
```');

INSERT INTO page_tags (page_id, tag_id) VALUES (1, 1);