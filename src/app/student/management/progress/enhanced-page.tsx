"use client";

import { useProgressContext } from "../data-entry/page";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  validateStudentProgress, 
  calculateCurriculumProgress,
  type StudentCourseData,
  type ValidationResult,
  type CurriculumProgress,
  type CourseRecommendation
} from "@/lib/validation/courseValidation";
import { parseExcelFile, type CourseData } from "@/components/features/excel/ExcelUtils";
import { 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Award, 
  TrendingUp, 
  FileDown,
  Lightbulb,
  Clock,
  GraduationCap
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function EnhancedProgressPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);
  const {
    completedCourses,
    selectedDepartment,
    selectedCurriculum,
    selectedConcentration,
    freeElectives,
  } = useProgressContext();

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Convert local course data to StudentCourseData format
  const convertToStudentCourseData = (): StudentCourseData[] => {
    const courses: StudentCourseData[] = [];
    
    // Convert completed courses
    Object.entries(completedCourses).forEach(([code, courseInfo]) => {
      let status: StudentCourseData['status'];
      switch (courseInfo.status) {
        case 'completed':
          status = 'COMPLETED';
          break;
        case 'failed':
        case 'withdrawn':
        case 'not_completed':
          status = 'PENDING';
          break;
        default:
          status = 'PENDING';
      }

      courses.push({
        courseCode: code,
        courseName: `Course ${code}`, // Would be fetched from API in real implementation
        credits: 3, // Default, would be fetched from API
        status,
        grade: courseInfo.grade
      });
    });

    // Add free electives
    freeElectives.forEach(elective => {
      courses.push({
        courseCode: elective.code,
        courseName: elective.title,
        credits: elective.credits,
        status: 'COMPLETED' // Assuming free electives are completed when added
      });
    });

    return courses;
  };

  // Load validation and progress data
  useEffect(() => {
    const loadProgressData = async () => {
      if (!selectedCurriculum || !selectedDepartment) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const studentCourses = convertToStudentCourseData();
        
        // For demo purposes, use mock curriculum ID
        const curriculumId = `${selectedCurriculum}-${selectedConcentration}`;
        const departmentId = selectedDepartment;

        // Validate student progress and calculate curriculum progress
        const [validation, progress] = await Promise.all([
          validateStudentProgress(studentCourses, curriculumId, departmentId),
          calculateCurriculumProgress(studentCourses, curriculumId)
        ]);

        setValidationResult(validation);
        setCurriculumProgress(progress);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress data');
        console.error('Progress loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [selectedCurriculum, selectedDepartment, selectedConcentration, completedCourses, freeElectives]);

  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`progress-report-${selectedCurriculum}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const handleBackToDataEntry = () => {
    router.push('/management/data-entry');
  };

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Analyzing your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error Loading Progress</span>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
            <Button onClick={handleBackToDataEntry} className="mt-4">
              Back to Data Entry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedCurriculum) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a curriculum in the data entry page first.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={handleBackToDataEntry}>
                Go to Data Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6" ref={pdfRef}>
      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={handleBackToDataEntry}>
            Back to Data Entry
          </Button>
          <Button variant="outline" onClick={downloadPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Report</h1>
          <p className="text-muted-foreground">
            {selectedCurriculum.toUpperCase()} - {selectedConcentration || 'No Concentration'}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      {curriculumProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Total Progress</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">
                  {curriculumProgress.totalCreditsCompleted}/{curriculumProgress.totalCreditsRequired}
                </div>
                <p className="text-sm text-muted-foreground">Credits Completed</p>
                <Progress 
                  value={(curriculumProgress.totalCreditsCompleted / curriculumProgress.totalCreditsRequired) * 100}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium">In Progress</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">
                  {curriculumProgress.totalCreditsInProgress}
                </div>
                <p className="text-sm text-muted-foreground">Credits This Semester</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="font-medium">GPA</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-purple-600">
                  {/* Calculate GPA from completed courses */}
                  N/A
                </div>
                <p className="text-sm text-muted-foreground">Current GPA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Graduation</span>
              </div>
              <div className="mt-2">
                <div className={`text-2xl font-bold ${curriculumProgress.graduationEligibility.eligible ? 'text-green-600' : 'text-orange-600'}`}>
                  {curriculumProgress.graduationEligibility.eligible ? 'Ready' : 'Pending'}
                </div>
                <p className="text-sm text-muted-foreground">Eligibility Status</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="mb-6">
          {validationResult.errors.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5" />
                  Validation Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-red-700 dark:text-red-300">
                      • {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {validationResult.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-700 dark:text-yellow-300">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Category Progress */}
      {curriculumProgress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(curriculumProgress.categoryProgress).map(([category, progress]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{category}</h3>
                    <Badge variant={progress.remaining === 0 ? "default" : "secondary"}>
                      {progress.completed}/{progress.required} credits
                    </Badge>
                  </div>
                  <Progress 
                    value={(progress.completed / progress.required) * 100}
                    className="mb-2"
                  />
                  <div className="text-sm text-muted-foreground">
                    {progress.remaining > 0 && (
                      <span className="text-orange-600">
                        {progress.remaining} credits remaining
                      </span>
                    )}
                    {progress.inProgress > 0 && (
                      <span className="text-blue-600 ml-2">
                        {progress.inProgress} credits in progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Recommendations */}
      {validationResult && validationResult.recommendations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommended Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResult.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{rec.courseCode}: {rec.courseName}</h4>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority} priority
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{rec.credits} credits</p>
                    </div>
                  </div>
                  {rec.prerequisites && rec.prerequisites.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Prerequisites: {rec.prerequisites.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graduation Requirements */}
      {curriculumProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Graduation Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {curriculumProgress.graduationEligibility.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {req.satisfied ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <span className="font-medium">{req.name}</span>
                      <p className="text-sm text-muted-foreground">{req.details}</p>
                    </div>
                  </div>
                  <Badge variant={req.satisfied ? "default" : "secondary"}>
                    {req.satisfied ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
