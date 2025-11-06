'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ""
}) => {
  return (
    <div className={`text-center py-8 sm:py-12 px-4 ${className}`}>
      {icon && (
        <div className="mb-4 sm:mb-6">
          {typeof icon === 'string' ? (
            <div className="text-4xl sm:text-6xl opacity-50 mb-2">
              {icon}
            </div>
          ) : (
            <div className="flex justify-center text-muted-foreground/50 mb-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16">
                {icon}
              </div>
            </div>
          )}
        </div>
      )}
      
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="px-4 sm:px-6 py-2 sm:py-3"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="px-4 sm:px-6 py-2 sm:py-3"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};