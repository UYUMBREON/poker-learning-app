const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ミドルウェア
app.use(cors());
app.use(express.json());

// データベース接続テスト
pool.connect((err, client, release) => {
  if (err) {
    console.error('データベース接続エラー:', err.stack);
  } else {
    console.log('データベースに接続しました');
    release();
  }
});

// ページ一覧取得
app.get('/api/pages', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, array_agg(
        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
      ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM pages p
      LEFT JOIN page_tags pt ON p.id = pt.page_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('ページ取得エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 特定ページ取得
app.get('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, array_agg(
        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
      ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM pages p
      LEFT JOIN page_tags pt ON p.id = pt.page_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ページが見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('ページ取得エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ページ作成
app.post('/api/pages', async (req, res) => {
  try {
    const { title, content, tree_data, tags } = req.body;
    
    // ページを作成
    const pageResult = await pool.query(
      'INSERT INTO pages (title, content, tree_data) VALUES ($1, $2, $3) RETURNING *',
      [title, content || '', JSON.stringify(tree_data || {})]
    );
    
    const pageId = pageResult.rows[0].id;
    
    // タグを関連付け
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query(
          'INSERT INTO page_tags (page_id, tag_id) VALUES ($1, $2)',
          [pageId, tagId]
        );
      }
    }
    
    res.status(201).json(pageResult.rows[0]);
  } catch (err) {
    console.error('ページ作成エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ページ更新
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tree_data, tags } = req.body;
    
    // ページを更新
    const result = await pool.query(
      'UPDATE pages SET title = $1, content = $2, tree_data = $3 WHERE id = $4 RETURNING *',
      [title, content, JSON.stringify(tree_data), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ページが見つかりません' });
    }
    
    // 既存のタグ関連付けを削除
    await pool.query('DELETE FROM page_tags WHERE page_id = $1', [id]);
    
    // 新しいタグを関連付け
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query(
          'INSERT INTO page_tags (page_id, tag_id) VALUES ($1, $2)',
          [id, tagId]
        );
      }
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('ページ更新エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ページ削除
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ページが見つかりません' });
    }
    
    res.json({ message: 'ページが削除されました' });
  } catch (err) {
    console.error('ページ削除エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// タグ一覧取得
app.get('/api/tags', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('タグ取得エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// タグ作成
app.post('/api/tags', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'タグ名は必須です' });
    }
    
    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name.trim(), color || '#3B82F6']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('タグ作成エラー:', err);
    if (err.code === '23505') { // PostgreSQL unique violation
      res.status(400).json({ error: 'そのタグ名は既に存在します' });
    } else {
      res.status(500).json({ error: 'サーバーエラー' });
    }
  }
});

// タグ更新
app.put('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'タグ名は必須です' });
    }
    
    const result = await pool.query(
      'UPDATE tags SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name.trim(), color || '#3B82F6', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'タグが見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('タグ更新エラー:', err);
    if (err.code === '23505') { // PostgreSQL unique violation
      res.status(400).json({ error: 'そのタグ名は既に存在します' });
    } else {
      res.status(500).json({ error: 'サーバーエラー' });
    }
  }
});

// タグ削除
app.delete('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // まず関連するpage_tagsを削除（ON DELETE CASCADEで自動削除されるが、明示的に行う）
    await pool.query('DELETE FROM page_tags WHERE tag_id = $1', [id]);
    
    // タグを削除
    const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'タグが見つかりません' });
    }
    
    res.json({ message: 'タグが削除されました', deleted_tag: result.rows[0] });
  } catch (err) {
    console.error('タグ削除エラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`サーバーがポート${port}で起動しました`);
});