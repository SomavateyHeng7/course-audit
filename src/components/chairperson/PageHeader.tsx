'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  backButton?: {
    label?: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  breadcrumbs?: Array<{
    label: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  backButton,
  actions = [],
  breadcrumbs = [],
  className = ""
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {/* Back Button */}
      {backButton && (
        <Button
          variant="outline"
          onClick={backButton.onClick}
          className="flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base"
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline">{backButton.label || 'Back'}</span>
          <span className="xs:hidden">Back</span>
        </Button>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-3 sm:mb-4">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={index}>
              {breadcrumb.onClick ? (
                <button
                  onClick={breadcrumb.onClick}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span>{breadcrumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="mx-1">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              {title}
            </h1>
            {badge && (
              <Badge variant={badge.variant || 'default'} className="text-xs sm:text-sm">
                {badge.text}
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                disabled={action.disabled}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
              >
                {action.icon}
                <span className="whitespace-nowrap">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};