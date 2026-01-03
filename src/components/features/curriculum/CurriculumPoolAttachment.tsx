'use client';

import React from 'react';
import { 
  FaGripVertical, 
  FaEdit, 
  FaTimes, 
  FaLayerGroup,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowRight
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import type { 
  CreditPool, 
  CurriculumPoolAttachment as CurriculumPoolAttachmentType 
} from '@/types/creditPool';

/**
 * CurriculumPoolAttachmentComponentProps
 * Props for the CurriculumPoolAttachment component
 */
export interface CurriculumPoolAttachmentComponentProps {
  pool: CreditPool;
  attachment: CurriculumPoolAttachmentType;
  appliedCredits: number;
  overflowCredits: number;
  onUpdate: (attachment: CurriculumPoolAttachmentType) => void;
  onDetach: (attachmentId: string) => void;
  onDragStart?: (e: React.DragEvent, attachmentId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetAttachmentId: string) => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
  position?: number;
}

/**
 * CurriculumPoolAttachment Component
 * 
 * Displays a credit pool attached to a curriculum with:
 * - Pool name and curriculum-specific credits (required/max)
 * - Applied credits, remaining credits, and satisfaction status
 * - Warning indicator for unsatisfied pools
 * - Overflow credits when applicable
 * - Drag handle for reordering
 * 
 * Requirements: 3.3, 4.1, 4.3, 4.4
 */
export default function CurriculumPoolAttachment({
  pool,
  attachment,
  appliedCredits,
  overflowCredits,
  onUpdate,
  onDetach,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  showDragHandle = true,
  position
}: CurriculumPoolAttachmentComponentProps) {
  // Calculate remaining credits needed
  const remainingCredits = Math.max(0, attachment.requiredCredits - appliedCredits);
  
  // Determine if pool is satisfied
  const isSatisfied = appliedCredits >= attachment.requiredCredits;
  
  // Calculate progress percentage (capped at 100% for display)
  const progressPercentage = attachment.requiredCredits > 0 
    ? Math.min(100, (appliedCredits / attachment.requiredCredits) * 100)
    : 100;

  // Format credit display strings
  const creditRangeDisplay = attachment.maxCredits !== null
    ? `${attachment.requiredCredits}–${attachment.maxCredits}`
    : `${attachment.requiredCredits}+`;

  // Determine if there's overflow (applied exceeds max)
  const hasOverflow = overflowCredits > 0;

  // Determine status color
  const getStatusColor = () => {
    if (isSatisfied) return 'text-green-600 dark:text-green-400';
    if (appliedCredits > 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    if (isSatisfied) return 'bg-green-500';
    if (appliedCredits > 0) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, attachment.id);
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
      onDrop(e, attachment.id);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={`
          rounded-lg border 
          ${isSatisfied 
            ? 'border-green-200 dark:border-green-800/50' 
            : 'border-amber-200 dark:border-amber-800/50'
          }
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

            {/* Position Number */}
            {position !== undefined && (
              <div className="mt-0.5 flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {position}
                </div>
              </div>
            )}

            {/* Pool Icon with Status */}
            <div className="mt-0.5 flex-shrink-0 relative">
              <div className={`
                flex h-8 w-8 items-center justify-center rounded-lg 
                ${isSatisfied 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                }
              `}>
                <FaLayerGroup className="h-4 w-4" />
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1">
                {isSatisfied ? (
                  <FaCheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <FaExclamationTriangle className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pool not satisfied: {remainingCredits} credits remaining</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Pool Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {pool.name}
                </h3>
                <Badge 
                  variant={isSatisfied ? 'default' : 'secondary'} 
                  className={`text-xs ${isSatisfied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}
                >
                  {creditRangeDisplay} credits
                </Badge>
              </div>

              {pool.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {pool.description}
                </p>
              )}

              {/* Credit Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={getStatusColor()}>
                    {appliedCredits} / {attachment.requiredCredits} credits applied
                  </span>
                  {!isSatisfied && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {remainingCredits} remaining
                    </span>
                  )}
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Overflow Credits Display */}
              {hasOverflow && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                  <FaArrowRight className="h-3 w-3" />
                  <span>
                    {overflowCredits} credits overflow to Free Elective
                  </span>
                </div>
              )}

              {/* Credit Details Row */}
              <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Required: <span className="font-medium text-foreground">{attachment.requiredCredits}</span>
                </span>
                {attachment.maxCredits !== null && (
                  <span>
                    Max: <span className="font-medium text-foreground">{attachment.maxCredits}</span>
                  </span>
                )}
                <span>
                  Applied: <span className={`font-medium ${getStatusColor()}`}>{appliedCredits}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-primary"
                    onClick={() => onUpdate(attachment)}
                    title="Edit attachment"
                  >
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit credit requirements</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-destructive"
                    onClick={() => onDetach(attachment.id)}
                    title="Detach pool"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Detach pool from curriculum</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
