'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  hideTextOnMobile?: boolean;
  stopPropagation?: boolean;
  children?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  onClick,
  variant = 'ghost',
  size = 'sm',
  tooltip,
  disabled = false,
  loading = false,
  className = "",
  hideTextOnMobile = false,
  stopPropagation = false,
  children
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 p-0',
    md: 'h-9 w-9 p-0',
    lg: 'h-10 w-10 p-0'
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    if (disabled || loading) {
      return;
    }

    onClick?.(event);
  };

  const buttonContent = (
    <Button
      onClick={handleClick}
      variant={variant}
      disabled={disabled || loading}
      className={`
        ${children ? 'px-2 sm:px-3 gap-1 sm:gap-2 w-auto' : sizeClasses[size]}
        touch-manipulation transition-colors
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : (
        icon
      )}
      {children && (
        <span className={hideTextOnMobile ? 'hidden sm:inline' : ''}>
          {children}
        </span>
      )}
    </Button>
  );

  if (tooltip && !children) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};