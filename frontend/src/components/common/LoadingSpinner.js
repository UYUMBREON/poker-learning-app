import React from 'react';

const LoadingSpinner = ({ message = "読み込み中..." }) => (
  <div className="loading">
    {message}
  </div>
);

export default LoadingSpinner;