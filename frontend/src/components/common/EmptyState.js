import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => (
  <div className="empty-state">
    {Icon && <Icon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export default EmptyState;