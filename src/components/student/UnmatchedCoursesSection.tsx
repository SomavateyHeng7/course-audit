'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  BookX, 
  GraduationCap, 
  CheckCircle2,
  ArrowRight,
  Info,
  Square,
  CheckSquare
} from 'lucide-react';

export interface UnmatchedCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  semester?: string;
  year?: number;
  status: 'completed' | 'failed' | 'withdrawn';
}

interface UnmatchedCoursesSectionProps {
  unmatchedCourses: UnmatchedCourse[];
  freeElectiveRequirement?: number; // Total free elective credits required
  currentFreeElectiveCredits?: number; // Already assigned free elective credits
  onAssignToFreeElective: (courseCode: string) => void;
  onRemoveFromFreeElective: (courseCode: string) => void;
  assignedFreeElectives: Set<string>; // Course codes assigned as free electives
}

export default function UnmatchedCoursesSection({
  unmatchedCourses,
  freeElectiveRequirement = 0,
  currentFreeElectiveCredits = 0,
  onAssignToFreeElective,
  onRemoveFromFreeElective,
  assignedFreeElectives
}: UnmatchedCoursesSectionProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

  // Calculate credits for assigned free electives
  const assignedFreeElectiveCredits = unmatchedCourses
    .filter(course => assignedFreeElectives.has(course.courseCode))
    .reduce((total, course) => total + course.credits, 0);

  // Calculate remaining free elective credits needed
  const totalFreeElectiveCredits = currentFreeElectiveCredits + assignedFreeElectiveCredits;
  const remainingCredits = Math.max(0, freeElectiveRequirement - totalFreeElectiveCredits);
  const excessCredits = Math.max(0, totalFreeElectiveCredits - freeElectiveRequirement);

  // Filter courses by completion status
  const completedCourses = unmatchedCourses.filter(course => course.status === 'completed');
  const failedCourses = unmatchedCourses.filter(course => course.status === 'failed');
  const withdrawnCourses = unmatchedCourses.filter(course => course.status === 'withdrawn');

  const handleCourseSelection = (courseCode: string, isSelected: boolean) => {
    const newSelected = new Set(selectedCourses);
    if (isSelected) {
      newSelected.add(courseCode);
    } else {
      newSelected.delete(courseCode);
    }
    setSelectedCourses(newSelected);
  };

  const handleBulkAssignToFreeElective = () => {
    selectedCourses.forEach(courseCode => {
      if (!assignedFreeElectives.has(courseCode)) {
        onAssignToFreeElective(courseCode);
      }
    });
    setSelectedCourses(new Set());
  };

  const handleToggleFreeElective = (courseCode: string) => {
    if (assignedFreeElectives.has(courseCode)) {
      onRemoveFromFreeElective(courseCode);
    } else {
      onAssignToFreeElective(courseCode);
    }
  };

  if (unmatchedCourses.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            All Courses Matched
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All courses from your transcript have been successfully matched to your curriculum requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  const CourseList = ({ courses, title, icon, variant }: {
    courses: UnmatchedCourse[];
    title: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'secondary';
  }) => {
    if (courses.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 font-medium text-sm">
          {icon}
          {title} ({courses.length})
        </h4>
        <div className="space-y-2">
          {courses.map((course) => {
            const isSelected = selectedCourses.has(course.courseCode);
            const isAssignedToFreeElective = assignedFreeElectives.has(course.courseCode);
            
            return (
              <div
                key={course.courseCode}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isAssignedToFreeElective 
                    ? 'bg-blue-50 border-blue-200' 
                    : isSelected 
                      ? 'bg-accent' 
                      : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {variant !== 'destructive' && (
                    <button
                      onClick={() => handleCourseSelection(course.courseCode, !isSelected)}
                      disabled={isAssignedToFreeElective}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{course.courseCode}</span>
                      <Badge variant={variant} className="text-xs">
                        {course.credits} credits
                      </Badge>
                      {course.grade && (
                        <Badge variant="outline" className="text-xs">
                          Grade: {course.grade}
                        </Badge>
                      )}
                      {isAssignedToFreeElective && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          Free Elective
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.courseName}
                    </p>
                    {course.semester && course.year && (
                      <p className="text-xs text-muted-foreground">
                        {course.semester} {course.year}
                      </p>
                    )}
                  </div>
                </div>
                {variant !== 'destructive' && (
                  <Button
                    size="sm"
                    variant={isAssignedToFreeElective ? "outline" : "secondary"}
                    onClick={() => handleToggleFreeElective(course.courseCode)}
                    className="ml-2"
                  >
                    {isAssignedToFreeElective ? "Remove" : "Assign to Free Elective"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <BookX className="h-5 w-5" />
          Courses Unspecified in Curriculum ({unmatchedCourses.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These courses from your transcript don't match any courses in your curriculum. 
          You can assign eligible courses as free electives.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Free Elective Summary */}
        {freeElectiveRequirement > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Free Elective Credits</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Required:</span>
                    <span className="font-medium">{freeElectiveRequirement} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Curriculum courses:</span>
                    <span>{currentFreeElectiveCredits} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned from transcript:</span>
                    <span>{assignedFreeElectiveCredits} credits</span>
                  </div>
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{totalFreeElectiveCredits} credits</span>
                    </div>
                  </div>
                </div>
                
                {remainingCredits > 0 && (
                  <Alert className="mt-3 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      You need {remainingCredits} more free elective credits to meet requirements.
                    </AlertDescription>
                  </Alert>
                )}
                
                {excessCredits > 0 && (
                  <Alert className="mt-3 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      You have {excessCredits} excess free elective credits beyond requirements.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCourses.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
            <span className="text-sm font-medium">
              {selectedCourses.size} course(s) selected
            </span>
            <Button
              size="sm"
              onClick={handleBulkAssignToFreeElective}
              className="ml-auto"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Assign to Free Electives
            </Button>
          </div>
        )}

        {/* Course Lists */}
        <div className="space-y-6">
          <CourseList
            courses={completedCourses}
            title="Completed Courses"
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            variant="default"
          />
          
          <CourseList
            courses={failedCourses}
            title="Failed Courses"
            icon={<AlertCircle className="h-4 w-4 text-red-600" />}
            variant="destructive"
          />
          
          <CourseList
            courses={withdrawnCourses}
            title="Withdrawn Courses"
            icon={<BookX className="h-4 w-4 text-gray-600" />}
            variant="secondary"
          />
        </div>

        {/* Info Note */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Only completed courses can be assigned as free electives. 
            Failed and withdrawn courses are shown for reference but cannot count toward credit requirements.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}