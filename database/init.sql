-- データベース初期化SQL

-- ページテーブル（tree_data列を追加）
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    tree_data JSONB, -- 樹形図データを保存するためのJSON列
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

-- 樹形図データ用のインデックス（パフォーマンス向上のため）
CREATE INDEX idx_pages_tree_data ON pages USING gin (tree_data);

-- サンプルデータ
INSERT INTO tags (name, color) VALUES 
    ('数学', '#EF4444'),
    ('プログラミング', '#10B981'),
    ('英語', '#8B5CF6'),
    ('物理', '#F59E0B'),
    ('歴史', '#EC4899'),
    ('化学', '#06B6D4');

-- サンプル樹形図データ（階層エリア付き）
INSERT INTO pages (title, content, tree_data) VALUES 
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
```',
     '{
       "id": "root",
       "label": "学習の基礎",
       "color": "#3B82F6",
       "size": 60,
       "children": [
         {
           "id": "node_1",
           "label": "理論",
           "color": "#10B981",
           "size": 50,
           "children": [
             {
               "id": "node_1_1",
               "label": "基本概念",
               "color": "#EF4444",
               "size": 40,
               "children": []
             },
             {
               "id": "node_1_2",
               "label": "応用理論",
               "color": "#F59E0B",
               "size": 40,
               "children": []
             }
           ]
         },
         {
           "id": "node_2",
           "label": "実践",
           "color": "#8B5CF6",
           "size": 50,
           "children": [
             {
               "id": "node_2_1",
               "label": "演習問題",
               "color": "#EC4899",
               "size": 40,
               "children": []
             }
           ]
         }
       ],
       "layers": [
         {
           "id": "layer_foundation",
           "name": "基礎レベル",
           "startLevel": 2,
           "endLevel": 2,
           "startY": 250,
           "endY": 450,
           "color": "#10B981",
           "opacity": 0.1
         },
         {
           "id": "layer_advanced",
           "name": "応用レベル",
           "startLevel": 3,
           "endLevel": 3,
           "startY": 450,
           "endY": 650,
           "color": "#8B5CF6",
           "opacity": 0.15
         }
       ]
     }');

INSERT INTO page_tags (page_id, tag_id) VALUES (1, 1);