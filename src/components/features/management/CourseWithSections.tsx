'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Info, AlertTriangle, Plus, CheckCircle } from 'lucide-react';

interface CourseSection {
  id: string;
  section: string;
  instructor?: string;
  days?: string[];
  timeStart?: string;
  timeEnd?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
}

interface PrerequisiteValidation {
  valid: boolean;
  missingPrereqs?: string[];
  reason?: string;
}

interface BannedValidation {
  valid: boolean;
  blockingCourse?: string;
  reason?: string;
}

interface CourseWithSectionsProps {
  course: {
    code: string;
    title: string;
    credits: string | number;
    description?: string;
    prerequisites?: string[];
    corequisites?: string[];
    category?: string;
    requiresPermission?: boolean;
    summerOnly?: boolean;
    requiresSeniorStanding?: boolean;
    sections?: CourseSection[];
  };
  onAddToPlan: (course: any, section?: CourseSection) => void;
  prerequisiteValidation?: PrerequisiteValidation;
  bannedValidation?: BannedValidation;
  selectedSemester?: string;
}

const mapDayToFull = (day: string): string => {
  const dayMap: Record<string, string> = {
    'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 
    'Th': 'Thursday', 'F': 'Friday', 'S': 'Saturday', 'Su': 'Sunday',
    'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
    'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
  };
  return dayMap[day] || day;
};

export function CourseWithSections({
  course,
  onAddToPlan,
  prerequisiteValidation = { valid: true },
  bannedValidation = { valid: true },
  selectedSemester
}: CourseWithSectionsProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);

  const parseCredits = (creditsStr: string | number): number => {
    if (typeof creditsStr === 'number') return creditsStr;
    const firstNumber = creditsStr.split('-')[0];
    const parsed = parseInt(firstNumber, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const credits = parseCredits(course.credits);
  const hasSections = course.sections && course.sections.length > 0;
  const hasFlags = course.summerOnly || course.requiresPermission || course.requiresSeniorStanding;

  const handleAddClick = () => {
    if (hasSections && selectedSection) {
      onAddToPlan(course, selectedSection);
    } else {
      onAddToPlan(course);
    }
  };

  const isAddDisabled = !prerequisiteValidation.valid || !bannedValidation.valid || (hasSections && !selectedSection);

  return (
    <Card className={`transition-all ${expanded ? 'shadow-lg' : ''}`}>
      <CardContent className="p-4">
        {/* Course Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-base">{course.code}</h3>
              <Badge variant="secondary">{credits} credits</Badge>
              {course.category && (
                <Badge variant="outline" className="text-xs">
                  {course.category}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.title}
            </p>
            
            {/* Course Flags */}
            {hasFlags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {course.summerOnly && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-blue-700 dark:text-blue-300">Summer only</span>
                  </div>
                )}
                {course.requiresPermission && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-orange-700 dark:text-orange-300">Permission required</span>
                  </div>
                )}
                {course.requiresSeniorStanding && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-purple-700 dark:text-purple-300">Senior standing</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {hasSections && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? 'Hide' : 'View'} Sections
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAddClick}
              disabled={isAddDisabled}
              className="whitespace-nowrap"
            >
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Validation Messages */}
        {!prerequisiteValidation.valid && prerequisiteValidation.missingPrereqs && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Missing Prerequisites:</div>
                <div className="text-yellow-700 dark:text-yellow-300">
                  {prerequisiteValidation.missingPrereqs.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {!bannedValidation.valid && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-red-700 dark:text-red-300">{bannedValidation.reason}</div>
            </div>
          </div>
        )}

        {/* Sections List */}
        {expanded && hasSections && (
          <div className="mt-4 space-y-2 border-t pt-3">
            <div className="text-sm font-medium mb-2">Available Sections:</div>
            {course.sections!.map(section => {
              const isFull = section.capacity && section.enrolled 
                ? section.enrolled >= section.capacity 
                : false;
              const isSelected = selectedSection?.id === section.id;

              return (
                <div
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isSelected ? 'default' : 'outline'}>
                        Section {section.section}
                      </Badge>
                      {isFull && <Badge variant="secondary" className="text-xs">Full</Badge>}
                      {isSelected && (
                        <CheckCircle size={16} className="text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {section.days && section.days.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Days:</span>
                        <span className="font-medium">
                          {section.days.map(mapDayToFull).join(', ')}
                        </span>
                      </div>
                    )}

                    {section.timeStart && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-muted-foreground" />
                        <span>{section.timeStart} - {section.timeEnd}</span>
                      </div>
                    )}

                    {section.instructor && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-muted-foreground">Instructor:</span>{' '}
                        <span className="font-medium">{section.instructor}</span>
                      </div>
                    )}

                    {section.room && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-muted-foreground" />
                        <span>{section.room}</span>
                      </div>
                    )}

                    {section.capacity && (
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-muted-foreground" />
                        <span>
                          {section.enrolled || 0} / {section.capacity} enrolled
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {hasSections && !selectedSection && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                <Info size={12} className="inline mr-1" />
                Please select a section before adding this course
              </div>
            )}
          </div>
        )}

        {/* Description (collapsible) */}
        {course.description && expanded && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">{course.description}</p>
          </div>
        )}

        {/* Prerequisites & Corequisites */}
        {expanded && (course.prerequisites || course.corequisites) && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="text-xs">
                <span className="font-medium text-muted-foreground">Prerequisites:</span>{' '}
                <span>{course.prerequisites.join(', ')}</span>
              </div>
            )}
            {course.corequisites && course.corequisites.length > 0 && (
              <div className="text-xs">
                <span className="font-medium text-muted-foreground">Corequisites:</span>{' '}
                <span>{course.corequisites.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
