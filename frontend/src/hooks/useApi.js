import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// 基本的なAPIフック
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // optionsの文字列化を別変数に抽出
  const optionsString = JSON.stringify(options);
  
  // optionsをメモ化して無限ループを防ぐ
  const memoizedOptions = useMemo(() => options, [optionsString]);

  const fetchData = useCallback(async () => {
    // URLがnullまたは空の場合はリクエストを送らない
    if (!url) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(url, memoizedOptions);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'データの取得に失敗しました');
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setLoading(false);
    }
  }, [url, memoizedOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ページ関連API
export const usePages = () => {
  const { data: pages, loading, error, refetch } = useApi('/api/pages');
  
  const createPage = useCallback(async (pageData) => {
    try {
      const response = await axios.post('/api/pages', pageData);
      refetch(); // ページリストを再取得
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'ページの作成に失敗しました');
    }
  }, [refetch]);

  const updatePage = useCallback(async (id, pageData) => {
    try {
      const response = await axios.put(`/api/pages/${id}`, pageData);
      refetch(); // ページリストを再取得
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'ページの更新に失敗しました');
    }
  }, [refetch]);

  const deletePage = useCallback(async (id) => {
    try {
      await axios.delete(`/api/pages/${id}`);
      refetch(); // ページリストを再取得
    } catch (err) {
      throw new Error(err.response?.data?.error || 'ページの削除に失敗しました');
    }
  }, [refetch]);

  return {
    pages: pages || [],
    loading,
    error,
    createPage,
    updatePage,
    deletePage,
    refetch
  };
};

// 特定ページ取得
export const usePage = (id) => {
  // idがnullの場合はAPIを呼ばない
  const { data: page, loading, error, refetch } = useApi(id ? `/api/pages/${id}` : null);
  
  return {
    page,
    loading,
    error,
    refetch
  };
};

// タグ関連API
export const useTags = () => {
  const { data: tags, loading, error, refetch } = useApi('/api/tags');
  
  const createTag = useCallback(async (tagData) => {
    try {
      const response = await axios.post('/api/tags', tagData);
      refetch(); // タグリストを再取得
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'タグの作成に失敗しました';
      throw new Error(errorMessage);
    }
  }, [refetch]);

  const updateTag = useCallback(async (id, tagData) => {
    try {
      const response = await axios.put(`/api/tags/${id}`, tagData);
      refetch(); // タグリストを再取得
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'タグの更新に失敗しました';
      throw new Error(errorMessage);
    }
  }, [refetch]);

  const deleteTag = useCallback(async (id) => {
    try {
      await axios.delete(`/api/tags/${id}`);
      refetch(); // タグリストを再取得
    } catch (err) {
      throw new Error(err.response?.data?.error || 'タグの削除に失敗しました');
    }
  }, [refetch]);

  return {
    tags: tags || [],
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refetch
  };
};