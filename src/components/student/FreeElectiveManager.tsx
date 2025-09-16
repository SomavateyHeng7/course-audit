'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  Plus,
  Target
} from 'lucide-react';

export interface FreeElectiveCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  source: 'curriculum' | 'transcript'; // Where this course came from
  isRequired: boolean; // If from curriculum, is it required or elective
}

interface ElectiveRule {
  category: string;
  requiredCredits: number;
  description?: string;
}

interface FreeElectiveManagerProps {
  curriculumId: string;
  departmentId: string;
  electiveRules: ElectiveRule[];
  curriculumFreeElectives: FreeElectiveCourse[]; // Free electives defined in curriculum
  assignedFreeElectives: FreeElectiveCourse[]; // Courses assigned from transcript
  onRemoveAssignedCourse: (courseCode: string) => void;
  onUpdateElectiveRules?: (rules: ElectiveRule[]) => void;
}

export default function FreeElectiveManager({
  curriculumId,
  departmentId,
  electiveRules,
  curriculumFreeElectives,
  assignedFreeElectives,
  onRemoveAssignedCourse,
  onUpdateElectiveRules
}: FreeElectiveManagerProps) {
  const [totalRequiredCredits, setTotalRequiredCredits] = useState(0);

  // Calculate total required free elective credits
  useEffect(() => {
    const freeElectiveRule = electiveRules.find(rule => 
      rule.category.toLowerCase().includes('free') || 
      rule.category.toLowerCase().includes('elective')
    );
    setTotalRequiredCredits(freeElectiveRule?.requiredCredits || 0);
  }, [electiveRules]);

  // Calculate current credits
  const curriculumCredits = curriculumFreeElectives.reduce((total, course) => total + course.credits, 0);
  const assignedCredits = assignedFreeElectives.reduce((total, course) => total + course.credits, 0);
  const totalCredits = curriculumCredits + assignedCredits;

  // Calculate remaining and excess credits
  const remainingCredits = Math.max(0, totalRequiredCredits - totalCredits);
  const excessCredits = Math.max(0, totalCredits - totalRequiredCredits);
  const progressPercentage = totalRequiredCredits > 0 ? (totalCredits / totalRequiredCredits) * 100 : 0;

  // Determine status
  const getStatus = () => {
    if (totalRequiredCredits === 0) return 'no-requirement';
    if (totalCredits < totalRequiredCredits) return 'insufficient';
    if (totalCredits === totalRequiredCredits) return 'complete';
    return 'excess';
  };

  const status = getStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'complete': return 'text-green-700';
      case 'insufficient': return 'text-amber-700';
      case 'excess': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'insufficient': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'excess': return <Plus className="h-5 w-5 text-blue-600" />;
      default: return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const CourseCard = ({ course, showRemove = false }: { 
    course: FreeElectiveCourse; 
    showRemove?: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{course.courseCode}</span>
          <Badge variant="outline" className="text-xs">
            {course.credits} credits
          </Badge>
          {course.grade && (
            <Badge variant="secondary" className="text-xs">
              {course.grade}
            </Badge>
          )}
          <Badge 
            variant={course.source === 'curriculum' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {course.source === 'curriculum' ? 'Curriculum' : 'Transcript'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {course.courseName}
        </p>
      </div>
      {showRemove && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRemoveAssignedCourse(course.courseCode)}
          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (totalRequiredCredits === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <GraduationCap className="h-5 w-5" />
            Free Elective Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No free elective requirements found for this curriculum. 
              All course requirements are specific to curriculum courses.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          Free Elective Credits
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your progress toward free elective credit requirements
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {totalCredits} / {totalRequiredCredits} credits
            </span>
          </div>
          
          <Progress 
            value={Math.min(progressPercentage, 100)} 
            className="h-3"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">{totalRequiredCredits}</div>
              <div className="text-blue-700 text-xs">Required</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">{curriculumCredits}</div>
              <div className="text-green-700 text-xs">Curriculum</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">{assignedCredits}</div>
              <div className="text-purple-700 text-xs">Assigned</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{totalCredits}</div>
              <div className="text-gray-700 text-xs">Total</div>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {status === 'insufficient' && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You need <strong>{remainingCredits} more credits</strong> to meet free elective requirements. 
              Consider assigning additional completed courses from your unmatched courses.
            </AlertDescription>
          </Alert>
        )}

        {status === 'complete' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Congratulations! You have met all free elective credit requirements.
            </AlertDescription>
          </Alert>
        )}

        {status === 'excess' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Plus className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You have <strong>{excessCredits} excess credits</strong> beyond requirements. 
              These additional credits may count toward your overall degree requirements.
            </AlertDescription>
          </Alert>
        )}

        {/* Curriculum Free Electives */}
        {curriculumFreeElectives.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Curriculum Free Electives ({curriculumCredits} credits)
            </h4>
            <div className="space-y-2">
              {curriculumFreeElectives.map((course) => (
                <CourseCard key={course.courseCode} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Assigned Free Electives */}
        {assignedFreeElectives.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Assigned from Transcript ({assignedCredits} credits)
            </h4>
            <div className="space-y-2">
              {assignedFreeElectives.map((course) => (
                <CourseCard 
                  key={course.courseCode} 
                  course={course} 
                  showRemove={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {curriculumFreeElectives.length === 0 && assignedFreeElectives.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              No free elective courses assigned yet.
            </p>
            <p className="text-xs mt-1">
              Assign eligible courses from your unmatched courses section above.
            </p>
          </div>
        )}

        {/* Elective Rules Info */}
        {electiveRules.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Elective Requirements</h5>
            <div className="space-y-1 text-xs text-gray-600">
              {electiveRules.map((rule, index) => (
                <div key={index} className="flex justify-between">
                  <span>{rule.category}:</span>
                  <span>{rule.requiredCredits} credits</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}