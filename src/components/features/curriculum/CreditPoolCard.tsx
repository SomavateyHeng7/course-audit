'use client';

import React from 'react';
import { FaGripVertical, FaEdit, FaTrash, FaLayerGroup } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreditPoolCardProps } from '@/types/creditPool';

/**
 * CreditPoolCard Component
 * 
 * Displays a credit pool with its name, description, credit range (min-max),
 * and source count. Includes drag handle for reordering and edit/delete actions.
 * 
 * Requirements: 1.3, 1.4
 */
export default function CreditPoolCard({
  pool,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  showDragHandle = true
}: CreditPoolCardProps) {
  const sourceCount = pool.sources?.length ?? 0;
  
  // Format credit range display
  const creditRangeDisplay = pool.maxCredits !== null
    ? `${pool.minCredits}–${pool.maxCredits} credits`
    : `${pool.minCredits}+ credits`;

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, pool.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(e, pool.id);
    }
  };

  return (
    <div
      className={`
        rounded-lg border border-gray-200 dark:border-border 
        bg-white dark:bg-card 
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95 shadow-lg' : 'hover:shadow-md'}
      `}
      draggable={showDragHandle}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {showDragHandle && (
            <div 
              className="mt-1 cursor-grab text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="Drag to reorder"
            >
              <FaGripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Pool Icon */}
          <div className="mt-0.5 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FaLayerGroup className="h-4 w-4" />
            </div>
          </div>

          {/* Pool Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {pool.name}
              </h3>
              {pool.allowNonCurriculum && (
                <Badge variant="secondary" className="text-xs">
                  Non-curriculum
                </Badge>
              )}
            </div>

            {pool.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {pool.description}
              </p>
            )}

            {/* Credit Range and Source Count */}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center text-xs font-medium text-primary">
                {creditRangeDisplay}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-primary"
              onClick={() => onEdit(pool)}
              title="Edit pool"
            >
              <FaEdit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-destructive"
              onClick={() => onDelete(pool.id)}
              title="Delete pool"
            >
              <FaTrash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
