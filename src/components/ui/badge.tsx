import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  children?: React.ReactNode;
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
    secondary: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    outline: 'border border-gray-200 bg-transparent text-gray-900 dark:border-gray-600 dark:text-gray-100',
    destructive: 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-400',
  };
  
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}