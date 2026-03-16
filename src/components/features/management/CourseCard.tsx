'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';

export interface AvailableCourse {
  id?: string;
  code: string;
  category: string;
  credits: string | number;
  title: string;
  description?: string;
  summerOnly?: boolean;
  requiresPermission?: boolean;
  requiresSeniorStanding?: boolean;
  minCreditThreshold?: number;
  prerequisites?: string[];
  corequisites?: string[];
}

interface CourseCardProps {
  course: AvailableCourse;
  onAddToPlan: (course: AvailableCourse) => void;
  selectedSemester: string;
  prerequisiteValidation: { valid: boolean; missing: string[] };
  bannedValidation: { valid: boolean; blockingCourse?: string; reason?: string };
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onAddToPlan,
  selectedSemester,
  prerequisiteValidation,
  bannedValidation
}) => {
  const hasBlockingIssues = !prerequisiteValidation.valid || !bannedValidation.valid;
  const parseCredits = (credits: string | number): number => {
    if (typeof credits === 'number') return credits;
    if (typeof credits === 'string') {
      const normalized = credits.trim();
      if (!normalized.includes('-')) {
        const direct = Number.parseInt(normalized.replace(/[^\d-]/g, ''), 10);
        return Number.isNaN(direct) ? 0 : direct;
      }

      const parts = normalized
        .split('-')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((value) => Number.isFinite(value));

      if (parts.length === 0) return 0;

      const first = parts[0] ?? 0;
      const last = parts[parts.length - 1] ?? 0;
      if (first === 0 && last > 0) return last;
      return first > 0 ? first : Math.max(0, last);
    }
    return 0;
  };

  return (
    <div 
      className={`border rounded-lg p-3 sm:p-4 transition-colors ${
        hasBlockingIssues 
          ? 'border-red-200 bg-red-50/50 hover:bg-red-50' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{course.code}</h3>
            
            {/* Course Flag Indicators */}
            <div className="flex items-center gap-1">
              {course.summerOnly && (
                <div 
                  className="w-2 h-2 rounded-full bg-blue-500" 
                  title="Summer only"
                />
              )}
              {course.requiresPermission && (
                <div 
                  className="w-2 h-2 rounded-full bg-orange-500" 
                  title="Permission required"
                />
              )}
              {course.requiresSeniorStanding && (
                <div 
                  className="w-2 h-2 rounded-full bg-purple-500" 
                  title={`Senior standing (${course.minCreditThreshold || 90}+ credits)`}
                />
              )}
            </div>
            
            <Badge variant="outline">{course.category}</Badge>
            <Badge variant="secondary">{parseCredits(course.credits)} credits</Badge>
            {!bannedValidation.valid && (
              <Badge variant="destructive" className="text-xs">
                🚫 Blocked
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium mb-1">{course.title}</p>
          {course.description && (
            <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
          )}
          
          {/* Prerequisites info */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              Prerequisites: {course.prerequisites.join(', ')}
              {!prerequisiteValidation.valid && (
                <span className="text-orange-600 ml-2">
                  (Missing: {prerequisiteValidation.missing.join(', ')})
                </span>
              )}
            </div>
          )}
          
          {/* Corequisites info */}
          {course.corequisites && course.corequisites.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              Corequisites: {course.corequisites.join(', ')}
            </div>
          )}
          
          {/* Banned combinations warning */}
          {!bannedValidation.valid && (
            <div className="text-xs text-red-600 mb-1">
              ⚠️ Cannot be taken with: {bannedValidation.blockingCourse}
              {bannedValidation.reason && (
                <span className="block text-xs mt-1">
                  {bannedValidation.reason}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1 sm:gap-2 ml-2 sm:ml-4 shrink-0">
          <Button
            size="sm"
            onClick={() => onAddToPlan(course)}
            disabled={!selectedSemester || hasBlockingIssues}
            className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            variant={hasBlockingIssues ? "secondary" : "default"}
          >
            <Plus size={12} className="hidden xs:inline-block sm:w-3.5 sm:h-3.5" />
            <span className="xs:hidden">{hasBlockingIssues ? "Blocked" : "Add"}</span>
            <span className="hidden xs:inline">{hasBlockingIssues ? "Blocked" : "Add to Plan"}</span>
          </Button>
          {!prerequisiteValidation.valid && (
            <div className="text-xs text-orange-600 text-center">
              ⚠️ Missing Prerequisites
            </div>
          )}
          {!bannedValidation.valid && (
            <div className="text-xs text-red-600 text-center">
              🚫 Banned Combination
            </div>
          )}
        </div>
      </div>
    </div>
  );
};