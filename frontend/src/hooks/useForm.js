import { useState, useCallback } from 'react';

// 基本的なフォームフック
export const useForm = (initialValues = {}, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // バリデーション実行
    if (validators[name]) {
      const validation = validators[name](value);
      setErrors(prev => ({
        ...prev,
        [name]: validation.isValid ? null : validation.error
      }));
    }
  }, [validators]);

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

    Object.keys(validators).forEach(name => {
      const validation = validators[name](values[name]);
      if (!validation.isValid) {
        newErrors[name] = validation.error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validators]);

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

// ページエディター用フォーム
export const usePageForm = (initialPage = null) => {
  const initialValues = {
    title: initialPage?.title || '',
    content: initialPage?.content || '',
    tree_data: initialPage?.tree_data || { nodes: [], edges: [] },
    tags: initialPage?.tags?.map(tag => tag.id) || []
  };

  const validators = {
    title: (value) => {
      if (!value || !value.trim()) {
        return { isValid: false, error: 'ページタイトルは必須です' };
      }
      return { isValid: true, error: null };
    }
  };

  const form = useForm(initialValues, validators);

  const updateTreeData = useCallback((newTreeData) => {
    form.setValue('tree_data', newTreeData);
  }, [form]);

  const toggleTag = useCallback((tagId) => {
    const currentTags = form.values.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    form.setValue('tags', newTags);
  }, [form]);

  return {
    ...form,
    updateTreeData,
    toggleTag
  };
};

// タグフォーム
export const useTagForm = (initialTag = null) => {
  const initialValues = {
    name: initialTag?.name || '',
    color: initialTag?.color || '#3B82F6'
  };

  const validators = {
    name: (value) => {
      if (!value || !value.trim()) {
        return { isValid: false, error: 'タグ名は必須です' };
      }
      if (value.length > 20) {
        return { isValid: false, error: 'タグ名は20文字以内で入力してください' };
      }
      return { isValid: true, error: null };
    }
  };

  return useForm(initialValues, validators);
};