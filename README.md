# 学習アプリ

Dockerを用いた再現可能な学習管理アプリケーションです。

## 機能

- ✅ ページタイトル入力
- ✅ 樹形図作成機能（各ノードが章を表現）
- ✅ タグ付け機能
- ✅ ページ保存機能
- ✅ 文字列入力機能
- ✅ Dockerによる環境再現性

## 技術スタック

- **フロントエンド**: React 18, React Router, Lucide React
- **バックエンド**: Node.js, Express
- **データベース**: PostgreSQL
- **コンテナ**: Docker, Docker Compose

## セットアップ

### 前提条件
- Docker
- Docker Compose

### 起動手順

1. **プロジェクトをクローン**
```bash
git clone <repository-url>
cd learning-app
```

2. **ディレクトリ構造を作成**
```
learning-app/
├── docker-compose.yml
├── database/
│   └── init.sql
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.js
│       ├── App.css
│       └── components/
│           ├── Header.js
│           ├── PageList.js
│           ├── PageEditor.js
│           └── TreeEditor.js
└── README.md
```

3. **Docker Composeで起動**
```bash
docker-compose up --build
```

4. **ブラウザでアクセス**
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

## 使用方法

### 基本操作

1. **ページ作成**
   - ホーム画面で「新しいページを作成」をクリック
   - ページタイトルを入力

2. **樹形図の作成**
   - 「ノード追加」ボタンでノードを追加
   - ノードをダブルクリックして名前を編集
   - 2つのノードを順番にクリックして接続
   - ドラッグでノードを移動

3. **内容の入力**
   - 右側のテキストエリアにページ内容を記入

4. **タグ付け**
   - 下部のタグセクションでタグを選択
   - 複数のタグを組み合わせ可能

5. **保存**
   - 「保存」ボタンをクリックしてページを保存

### 樹形図エディターの操作

- **ノード追加**: 「ノード追加」ボタン
- **ノード編集**: ノードをダブルクリック
- **ノード移動**: ドラッグ&ドロップ
- **ノード接続**: 2つのノードを順番にクリック
- **ノード削除**: ノードを選択して表示される×ボタン

## データベース構造

### pages テーブル
- `id`: 主キー
- `title`: ページタイトル
- `content`: ページ内容
- `tree_data`: 樹形図データ（JSON）
- `created_at`: 作成日時
- `updated_at`: 更新日時

### tags テーブル
- `id`: 主キー
- `name`: タグ名
- `color`: タグの色
- `created_at`: 作成日時

### page_tags テーブル
- `id`: 主キー
- `page_id`: ページID（外部キー）
- `tag_id`: タグID（外部キー）

## API エンドポイント

- `GET /api/pages` - ページ一覧取得
- `GET /api/pages/:id` - 特定ページ取得
- `POST /api/pages` - ページ作成
- `PUT /api/pages/:id` - ページ更新
- `DELETE /api/pages/:id` - ページ削除
- `GET /api/tags` - タグ一覧取得
- `POST /api/tags` - タグ作成

## 開発

### 開発モードでの起動
```bash
# バックエンドのみ起動（開発用）
cd backend
npm install
npm run dev

# フロントエンドのみ起動（開発用）
cd frontend
npm install
npm start
```

### データベースの初期化
データベースは初回起動時に `database/init.sql` によって自動的に初期化されます。

## トラブルシューティング

### ポートが使用中の場合
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Docker Composeを停止
docker-compose down
```

### データベース接続エラー
```bash
# コンテナの状態を確認
docker-compose ps

# データベースログを確認
docker-compose logs postgres
```

### データのリセット
```bash
# 全てのコンテナとボリュームを削除
docker-compose down -v
docker-compose up --build
```

## ライセンス

MIT License