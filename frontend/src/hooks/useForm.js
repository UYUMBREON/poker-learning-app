import { useState, useCallback, useMemo } from 'react';

// 基本的なフォームフック
export const useForm = (initialValues = {}, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // validatorsをメモ化
  const memoizedValidators = useMemo(() => validators, [validators]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // バリデーション実行
    if (memoizedValidators[name]) {
      const validation = memoizedValidators[name](value);
      setErrors(prev => ({
        ...prev,
        [name]: validation.isValid ? null : validation.error
      }));
    }
  }, [memoizedValidators]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValue(name, value);
  }, [setValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
  }, [setFieldTouched]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(memoizedValidators).forEach(name => {
      const validation = memoizedValidators[name](values[name]);
      if (!validation.isValid) {
        newErrors[name] = validation.error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, memoizedValidators]);

  return {
    values,
    errors,
    touched,
    setValue,
    handleChange,
    handleBlur,
    reset,
    validate
  };
};

// ページエディター用フォーム（樹形図機能を削除）
export const usePageForm = (initialPage = null) => {
  const initialValues = useMemo(() => ({
    title: initialPage?.title || '',
    content: initialPage?.content || '',
    tags: initialPage?.tags?.map(tag => tag.id) || []
  }), [initialPage]);

  const validators = useMemo(() => ({
    title: (value) => {
      if (!value || !value.trim()) {
        return { isValid: false, error: 'ページタイトルは必須です' };
      }
      return { isValid: true, error: null };
    }
  }), []);

  const form = useForm(initialValues, validators);

  const toggleTag = useCallback((tagId) => {
    const currentTags = form.values.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    form.setValue('tags', newTags);
  }, [form.setValue, form.values.tags]);

  return {
    ...form,
    toggleTag
  };
};

// タグフォーム
export const useTagForm = (initialTag = null) => {
  const initialValues = useMemo(() => ({
    name: initialTag?.name || '',
    color: initialTag?.color || '#3B82F6'
  }), [initialTag]);

  const validators = useMemo(() => ({
    name: (value) => {
      if (!value || !value.trim()) {
        return { isValid: false, error: 'タグ名は必須です' };
      }
      if (value.length > 20) {
        return { isValid: false, error: 'タグ名は20文字以内で入力してください' };
      }
      return { isValid: true, error: null };
    }
  }), []);

  return useForm(initialValues, validators);
};