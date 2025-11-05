'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/chairperson/EmptyState';
import { Pagination } from '@/components/chairperson/Pagination';

interface Column<T> {
  key: keyof T | string;
  label: string;
  className?: string;
  mobileLabel?: string; // For mobile display
  hideOnMobile?: boolean;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode | string;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  cardMode?: boolean; // Show as cards on mobile
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyState,
  pagination,
  onRowClick,
  className = "",
  cardMode = true
}: DataTableProps<T>) {
  const visibleColumns = columns.filter(col => !col.hideOnMobile);
  const mobileColumns = columns.filter(col => col.hideOnMobile);

  if (loading) {
    return (
      <Card className={className}>
        <LoadingSpinner size="lg" text="Loading data..." className="py-12" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        {emptyState ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
            className="py-12"
          />
        ) : (
          <EmptyState
            icon="📋"
            title="No data available"
            description="There are no items to display at the moment."
            className="py-12"
          />
        )}
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden lg:block">
          <div className="grid gap-4 p-4 border-b border-border bg-muted/50 font-medium text-sm text-muted-foreground">
            {columns.map((column, index) => (
              <div 
                key={String(column.key)} 
                className={column.className || 'flex-1'}
                style={{ gridColumn: index + 1 }}
              >
                {column.label}
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
          {data.map((item, index) => (
            <div
              key={item.id || index}
              className={`
                ${cardMode ? 'p-4 lg:grid lg:gap-4 lg:items-center' : 'lg:grid lg:gap-4 lg:items-center lg:p-4'}
                ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                transition-colors
              `}
              style={{ 
                gridTemplateColumns: columns.map(col => col.className || '1fr').join(' ') 
              }}
              onClick={() => onRowClick?.(item, index)}
            >
              {cardMode ? (
                // Mobile Card Layout
                <div className="lg:contents">
                  <div className="lg:hidden space-y-3">
                    {/* Main visible columns */}
                    {visibleColumns.map((column) => (
                      <div key={String(column.key)} className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground font-medium">
                          {column.mobileLabel || column.label}:
                        </span>
                        <div className="text-sm font-medium text-right">
                          {column.render 
                            ? column.render(item, index)
                            : item[column.key]
                          }
                        </div>
                      </div>
                    ))}
                    
                    {/* Hidden columns shown as badges or secondary info */}
                    {mobileColumns.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                        {mobileColumns.map((column) => (
                          <Badge key={String(column.key)} variant="outline" className="text-xs">
                            {column.mobileLabel || column.label}: {
                              column.render 
                                ? column.render(item, index)
                                : item[column.key]
                            }
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desktop Grid Layout */}
                  {columns.map((column) => (
                    <div key={String(column.key)} className="hidden lg:block">
                      {column.render ? column.render(item, index) : item[column.key]}
                    </div>
                  ))}
                </div>
              ) : (
                // Traditional Table Layout
                columns.map((column) => (
                  <div key={String(column.key)} className="p-4">
                    <div className="lg:hidden text-xs text-muted-foreground mb-1">
                      {column.mobileLabel || column.label}
                    </div>
                    <div>
                      {column.render ? column.render(item, index) : item[column.key]}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
            onItemsPerPageChange={pagination.onItemsPerPageChange}
          />
        )}
      </Card>
    </div>
  );
}