import React from 'react';

const ColorPalette = ({ 
  colors, 
  selectedColor, 
  onColorSelect, 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'color-option-small',
    medium: 'color-option',
    large: 'color-option-large'
  };

  return (
    <div className={`color-palette ${size === 'small' ? 'color-palette-small' : ''}`}>
      {colors.map(color => (
        <button
          key={color.code}
          className={`${sizeClasses[size]} ${selectedColor === color.code ? 'selected' : ''}`}
          style={{ backgroundColor: color.code }}
          onClick={() => onColorSelect(color.code)}
          title={color.name}
        />
      ))}
    </div>
  );
};

export default ColorPalette;