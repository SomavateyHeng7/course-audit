'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertTriangle } from 'lucide-react';

type ValidationStatus = 'valid' | 'warning' | 'error';

export interface PlannedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  status: 'planning' | 'planned' | 'completed' | string;
  validationStatus?: ValidationStatus;
  validationNotes?: string[];
  semesterLabel?: string;
  prerequisites?: string[];
  corequisites?: string[];
}

interface PlannedCourseCardProps {
  course: PlannedCourse;
  onRemove: (courseId: string) => void;
  onStatusUpdate: (courseId: string, status: PlannedCourse['status']) => void;
}

export const PlannedCourseCard: React.FC<PlannedCourseCardProps> = ({
  course,
  onRemove,
  onStatusUpdate
}) => {
  return (
    <div className="bg-muted rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <span className="font-medium text-xs sm:text-sm truncate">{course.code}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {course.credits} cr
            </Badge>
            {course.semesterLabel && (
              <Badge variant="secondary" className="text-[10px] font-medium">
                {course.semesterLabel}
              </Badge>
            )}
            {course.validationStatus === 'valid' && (
              <CheckCircle size={14} className="text-green-600" />
            )}
            {course.validationStatus === 'warning' && (
              <AlertTriangle size={14} className="text-orange-600" />
            )}
            {course.validationStatus === 'error' && (
              <AlertTriangle size={14} className="text-red-600" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">{course.title}</p>
          
          {/* Prerequisites and Corequisites */}
          {(course.prerequisites && course.prerequisites.length > 0) && (
            <p className="text-[10px] text-muted-foreground/80">
              <span className="font-medium">Prerequisites:</span> {course.prerequisites.join(', ')}
            </p>
          )}
          {(course.corequisites && course.corequisites.length > 0) && (
            <p className="text-[10px] text-muted-foreground/80">
              <span className="font-medium">Corequisites:</span> {course.corequisites.join(', ')}
            </p>
          )}
          
          <Select
            value={course.status}
            onValueChange={(value) => onStatusUpdate(course.id, value as PlannedCourse['status'])}
          >
            <SelectTrigger className="h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(course.id)}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
        >
          ×
        </Button>
      </div>
      
      {course.validationNotes && course.validationNotes.length > 0 && (
        <Alert className="py-1 px-2">
          <AlertDescription className="text-xs">
            {course.validationNotes.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};