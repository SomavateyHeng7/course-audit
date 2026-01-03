'use client';

import React from 'react';
import { FaEdit, FaTrash, FaList, FaEye } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PoolListCardProps } from '@/types/creditPool';

/**
 * PoolListCard Component
 * 
 * Displays a pool list with its name, description, and course count badge.
 * Includes edit, delete, and view courses action buttons.
 * 
 * Requirements: 2.4
 */
export default function PoolListCard({
  poolList,
  onEdit,
  onDelete,
  onViewCourses
}: PoolListCardProps) {
  const courseCount = poolList.courses?.length ?? 0;

  return (
    <div
      className="
        rounded-lg border border-gray-200 dark:border-border 
        bg-white dark:bg-card 
        transition-all duration-200
        hover:shadow-md
      "
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* List Icon */}
          <div className="mt-0.5 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FaList className="h-4 w-4" />
            </div>
          </div>

          {/* List Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {poolList.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {courseCount} {courseCount === 1 ? 'course' : 'courses'}
              </Badge>
            </div>

            {poolList.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {poolList.description}
              </p>
            )}

            {/* Default Credits Info */}
            {poolList.defaultRequiredCredits !== undefined && poolList.defaultRequiredCredits > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Default: {poolList.defaultRequiredCredits} credits
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-blue-600"
              onClick={() => onViewCourses(poolList)}
              title="View courses"
            >
              <FaEye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-primary"
              onClick={() => onEdit(poolList)}
              title="Edit list"
            >
              <FaEdit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-destructive"
              onClick={() => onDelete(poolList.id)}
              title="Delete list"
            >
              <FaTrash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
