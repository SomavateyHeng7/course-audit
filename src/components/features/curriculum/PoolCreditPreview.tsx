'use client';

import React from 'react';
import {
  FaLayerGroup,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaChartPie,
  FaInfoCircle
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { PoolCreditPreviewProps, CurriculumPoolAttachmentWithCredits } from '@/types/creditPool';

/**
 * PoolCreditPreview Component
 * 
 * Displays a summary of all attached pools with credit breakdown:
 * - Shows each pool with required vs applied credits
 * - Displays total curriculum credits and free elective overflow
 * - Highlights pools below minimum (warning) or above maximum (overflow)
 * 
 * Requirements: 4.1, 4.3, 4.4
 */
export default function PoolCreditPreview({
  attachments,
  totalCurriculumCredits,
  freeElectiveOverflow
}: PoolCreditPreviewProps) {
  // Calculate summary statistics
  const totalRequiredCredits = attachments.reduce((sum, a) => sum + a.requiredCredits, 0);
  const totalAppliedCredits = attachments.reduce((sum, a) => sum + a.appliedCredits, 0);
  const totalOverflowCredits = attachments.reduce((sum, a) => sum + a.overflowCredits, 0);
  const satisfiedPools = attachments.filter(a => a.isSatisfied).length;
  const unsatisfiedPools = attachments.length - satisfiedPools;
  const poolsWithOverflow = attachments.filter(a => a.overflowCredits > 0).length;

  // Overall satisfaction percentage
  const overallProgress = totalRequiredCredits > 0
    ? Math.min(100, (totalAppliedCredits / totalRequiredCredits) * 100)
    : 100;

  // Determine overall status
  const allSatisfied = unsatisfiedPools === 0;

  return (
    <TooltipProvider>
      <Card className="border-gray-200 dark:border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaChartPie className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Credit Pool Summary</CardTitle>
            </div>
            <Badge
              variant={allSatisfied ? 'default' : 'secondary'}
              className={allSatisfied
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }
            >
              {satisfiedPools}/{attachments.length} pools satisfied
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
              <span className="font-medium">
                {totalAppliedCredits} / {totalRequiredCredits} credits
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryStatCard
              label="Total Curriculum"
              value={totalCurriculumCredits}
              unit="credits"
              icon={<FaLayerGroup className="h-3.5 w-3.5" />}
              variant="default"
            />
            <SummaryStatCard
              label="Applied to Pools"
              value={totalAppliedCredits}
              unit="credits"
              icon={<FaCheckCircle className="h-3.5 w-3.5" />}
              variant={allSatisfied ? 'success' : 'warning'}
            />
            <SummaryStatCard
              label="Free Elective Overflow"
              value={freeElectiveOverflow + totalOverflowCredits}
              unit="credits"
              icon={<FaArrowRight className="h-3.5 w-3.5" />}
              variant="info"
              tooltip="Credits that exceed pool maximums flow to Free Elective"
            />
          </div>

          {/* Pool Breakdown List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pool Breakdown
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {attachments.map((attachment, index) => (
                  <PoolBreakdownRow
                    key={attachment.id}
                    attachment={attachment}
                    position={index + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {attachments.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <FaLayerGroup className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pools attached to this curriculum</p>
              <p className="text-xs mt-1">Attach pools to see credit distribution</p>
            </div>
          )}

          {/* Warnings Section */}
          {(unsatisfiedPools > 0 || poolsWithOverflow > 0) && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-1.5">
                {unsatisfiedPools > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <FaExclamationTriangle className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {unsatisfiedPools} pool{unsatisfiedPools > 1 ? 's' : ''} below minimum credit requirement
                    </span>
                  </div>
                )}
                {poolsWithOverflow > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <FaInfoCircle className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {poolsWithOverflow} pool{poolsWithOverflow > 1 ? 's' : ''} with overflow credits routed to Free Elective
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


/**
 * SummaryStatCard - Internal component for displaying summary statistics
 */
interface SummaryStatCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'warning' | 'info';
  tooltip?: string;
}

function SummaryStatCard({ label, value, unit, icon, variant, tooltip }: SummaryStatCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
  };

  const content = (
    <div className={`rounded-lg p-3 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="text-lg font-bold">
        {value}
        <span className="text-xs font-normal ml-1">{unit}</span>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * PoolBreakdownRow - Internal component for displaying individual pool credit breakdown
 */
interface PoolBreakdownRowProps {
  attachment: CurriculumPoolAttachmentWithCredits;
  position: number;
}

function PoolBreakdownRow({ attachment, position }: PoolBreakdownRowProps) {
  const {
    pool,
    requiredCredits,
    maxCredits,
    appliedCredits,
    remainingCredits,
    overflowCredits,
    isSatisfied
  } = attachment;

  const poolName = pool?.name || `Pool ${position}`;
  const progressPercentage = requiredCredits > 0
    ? Math.min(100, (appliedCredits / requiredCredits) * 100)
    : 100;

  // Determine status styling
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

  const getBorderColor = () => {
    if (isSatisfied) return 'border-green-200 dark:border-green-800/50';
    return 'border-amber-200 dark:border-amber-800/50';
  };

  // Format credit range display
  const creditRangeDisplay = maxCredits !== null
    ? `${requiredCredits}–${maxCredits}`
    : `${requiredCredits}+`;

  return (
    <div className={`rounded-lg border ${getBorderColor()} bg-white dark:bg-card/50 p-3`}>
      <div className="flex items-center gap-2 mb-2">
        {/* Position indicator */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
          {position}
        </div>

        {/* Pool name and status */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium truncate">{poolName}</span>
          {isSatisfied ? (
            <FaCheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <FaExclamationTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCredits} credits remaining to satisfy pool</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Credit badge */}
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {creditRangeDisplay} cr
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Credit details */}
      <div className="flex items-center justify-between text-xs">
        <span className={getStatusColor()}>
          {appliedCredits} / {requiredCredits} applied
        </span>
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          {!isSatisfied && remainingCredits > 0 && (
            <span>{remainingCredits} remaining</span>
          )}
          {overflowCredits > 0 && (
            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <FaArrowRight className="h-2.5 w-2.5" />
              {overflowCredits} overflow
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
