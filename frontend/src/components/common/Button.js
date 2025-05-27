import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon: Icon,
  loading = false,
  disabled = false,
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span>処理中...</span>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;