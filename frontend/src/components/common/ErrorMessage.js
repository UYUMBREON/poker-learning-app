import React from 'react';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="error">
    {message}
    {onRetry && (
      <button onClick={onRetry} className="retry-button">
        再試行
      </button>
    )}
  </div>
);

export default ErrorMessage;