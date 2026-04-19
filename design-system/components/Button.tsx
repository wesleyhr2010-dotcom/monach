import React from 'react';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', disabled, children, ...rest }) => {
  const className = [
    'ds-btn',
    variant ? `ds-btn--${variant}` : '',
    size ? `ds-btn--${size}` : '',
    disabled ? 'ds-btn--disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <button className={className} disabled={disabled} {...rest}>
      {children}
    </button>
  );
};

export default Button;
