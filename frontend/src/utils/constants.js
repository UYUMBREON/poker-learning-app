// カラーパレット定数
export const COLOR_PALETTE = [
  { code: '#EF4444', name: '赤' },
  { code: '#F59E0B', name: '黄' },
  { code: '#10B981', name: '緑' },
  { code: '#3B82F6', name: '青' },
  { code: '#8B5CF6', name: '紫' },
  { code: '#EC4899', name: 'ピンク' },
  { code: '#06B6D4', name: 'シアン' },
  { code: '#84CC16', name: 'ライム' },
  { code: '#F97316', name: 'オレンジ' },
  { code: '#6366F1', name: 'インディゴ' },
  { code: '#14B8A6', name: 'ティール' },
  { code: '#A855F7', name: 'バイオレット' }
];

// デフォルト値
export const DEFAULTS = {
  TAG_COLOR: '#3B82F6',
  TAG_NAME_MAX_LENGTH: 20
};

// API エンドポイント
export const API_ENDPOINTS = {
  PAGES: '/api/pages',
  TAGS: '/api/tags',
  PAGE_BY_ID: (id) => `/api/pages/${id}`,
  TAG_BY_ID: (id) => `/api/tags/${id}`
};

// ユーティリティ関数
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// バリデーション関数
export const validateTagName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'タグ名は必須です' };
  }
  if (name.length > DEFAULTS.TAG_NAME_MAX_LENGTH) {
    return { isValid: false, error: `タグ名は${DEFAULTS.TAG_NAME_MAX_LENGTH}文字以内で入力してください` };
  }
  return { isValid: true, error: null };
};

export const validatePageTitle = (title) => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'ページタイトルは必須です' };
  }
  return { isValid: true, error: null };
};

// 検索・フィルタリングユーティリティ
export const filterPagesByTitle = (pages, searchTerm) => {
  if (!searchTerm.trim()) return pages;
  return pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const filterPagesByTags = (pages, selectedTagIds) => {
  if (selectedTagIds.length === 0) return pages;
  return pages.filter(page =>
    page.tags && page.tags.some(tag => selectedTagIds.includes(tag.id))
  );
};

export const filterPages = (pages, searchTerm, selectedTagIds) => {
  let filtered = filterPagesByTitle(pages, searchTerm);
  filtered = filterPagesByTags(filtered, selectedTagIds);
  return filtered;
};

// エラーメッセージ
export const ERROR_MESSAGES = {
  FETCH_PAGES: 'ページの取得に失敗しました',
  FETCH_TAGS: 'タグの取得に失敗しました',
  CREATE_PAGE: 'ページの作成に失敗しました',
  UPDATE_PAGE: 'ページの更新に失敗しました',
  DELETE_PAGE: 'ページの削除に失敗しました',
  CREATE_TAG: 'タグの作成に失敗しました',
  UPDATE_TAG: 'タグの更新に失敗しました',
  DELETE_TAG: 'タグの削除に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  GENERIC_ERROR: '予期しないエラーが発生しました'
};