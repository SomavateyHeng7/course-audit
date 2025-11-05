'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  className = "",
  overlay = false,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6 sm:h-8 sm:w-8',
    lg: 'h-10 w-10 sm:h-12 sm:w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl'
  };

  const containerClasses = `
    flex flex-col items-center justify-center gap-3 sm:gap-4
    ${fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50' : ''}
    ${overlay ? 'absolute inset-0 bg-background/50 backdrop-blur-sm z-10' : ''}
    ${!fullScreen && !overlay ? 'py-8 sm:py-12' : ''}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && (
        <p className={`text-muted-foreground font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};