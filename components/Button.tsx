import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = `
    flex items-center justify-center gap-2.5
    px-6 py-3 text-base font-semibold rounded-full
    focus:outline-none focus-visible:ring-4
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-300 ease-in-out
    transform active:scale-[0.97]
    will-change-transform
  `;

  const variantClasses = {
    primary: `bg-primary text-background font-bold shadow-lg shadow-primary/30 
              hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5
              focus-visible:ring-primary/50`,
    secondary: `bg-white/5 border border-white/10 text-text-primary backdrop-blur-sm 
              hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5
              focus-visible:ring-white/30`,
    danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30'
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};