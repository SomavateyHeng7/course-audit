'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { 
  parseTranscriptCSV, 
  parseExcelFile, 
  validateCourseData, 
  type CourseData, 
  type TranscriptParseResult 
} from '@/components/excel/ExcelUtils';
import { UnmatchedCourse } from './UnmatchedCoursesSection';
import { FreeElectiveCourse } from './FreeElectiveManager';

interface StudentTranscriptImportProps {
  curriculumId: string;
  departmentId: string;
  onCoursesImported: (result: {
    categorizedCourses: CategorizedCourses;
    unmatchedCourses: UnmatchedCourse[];
    freeElectives: FreeElectiveCourse[];
    electiveRules: any[];
  }) => void;
  onError?: (error: string) => void;
}

// NOTE: Current implementation focuses on:
// - Constraints validation
// - Elective rules processing
// - Course categories and grades
// Future implementation will include:
// - Concentration-specific requirements
// - Blacklist management

interface CourseStatus {
  status: 'not_completed' | 'completed' | 'taking' | 'planning';
  grade?: string;
}

interface CurriculumCourse {
  code: string;
  title: string;
  credits: number;
  category: string;
  isRequired: boolean;
}

interface CategorizedCourses {
  [category: string]: {
    code: string;
    title: string;
    credits: number;
    status: CourseStatus['status'];
    grade?: string;
    found: boolean; // Whether this course was in the imported transcript
  }[];
}

export default function StudentTranscriptImport({ 
  curriculumId, 
  departmentId, 
  onCoursesImported, 
  onError 
}: StudentTranscriptImportProps) {
  const [importResult, setImportResult] = useState<TranscriptParseResult | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<{
    categorizedCourses: CategorizedCourses;
    matchedCount: number;
    unmatchedCourses: CourseData[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Fetch curriculum structure to categorize courses
   */
  const fetchCurriculumStructure = async (): Promise<CurriculumCourse[]> => {
    try {
      // Fetch curriculum data from public API (includes constraints and courses)
      const response = await fetch(`/api/public-curricula?curriculumId=${curriculumId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch curriculum data');
      }

      const data = await response.json();
      const curriculum = data.curricula?.[0]; // Get the specific curriculum

      if (!curriculum) {
        throw new Error('Curriculum not found');
      }

      const courses: CurriculumCourse[] = [];

      // Process curriculum courses using their courseType for categorization
      const curriculumCourses = curriculum.curriculumCourses || [];

      console.log('Raw curriculum courses:', curriculumCourses.length);
      
      // Add curriculum courses using their departmentCourseTypes for categorization
      curriculumCourses.forEach((currCourse: any) => {
        const course = currCourse.course;
        if (course) {
          // Use the first departmentCourseType name as the category
          let category = 'General';
          if (course.departmentCourseTypes && course.departmentCourseTypes.length > 0) {
            category = course.departmentCourseTypes[0].courseType?.name || 'General';
          }
          
          console.log(`Course ${course.code}: departmentCourseTypes = ${JSON.stringify(course.departmentCourseTypes)}, category = ${category}`);
          
          courses.push({
            code: course.code,
            title: course.name,
            credits: course.creditHours || course.credits || 0,
            category,
            isRequired: true
          });
        }
      });

      console.log('Curriculum courses with categories:', courses.map(c => ({ code: c.code, category: c.category })));

      return courses;
    } catch (error) {
      console.error('Failed to fetch curriculum structure:', error);
      throw error;
    }
  };

  /**
   * Fetch course details by codes (DEPRECATED - using curriculum data instead)
   * Kept for potential future use if needed
   */
  const fetchCourseDetails = async (courseCodes: string[], departmentId: string) => {
    try {
      // NOTE: This endpoint may require authentication
      // Currently using curriculum data instead of this function
      const coursePromises = courseCodes.map(async (code) => {
        const response = await fetch(`/api/courses?departmentId=${departmentId}&code=${code}`);
        if (response.ok) {
          const courses = await response.json();
          return courses.find((c: any) => c.code === code);
        }
        return null;
      });

      const courseResults = await Promise.all(coursePromises);
      return courseResults.filter(Boolean);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
      return [];
    }
  };

  /**
   * Map constraint types to user-friendly categories
   */
  const mapConstraintTypeToCategory = (constraintType: string): string => {
    const mapping: { [key: string]: string } = {
      'core': 'Core Courses',
      'foundation': 'Foundation Courses', 
      'general_education': 'General Education',
      'major': 'Major',
      'major_elective': 'Major Elective',
      'free_elective': 'Free Elective'
    };
    
    return mapping[constraintType.toLowerCase()] || constraintType;
  };

  /**
   * Fetch elective rules for the curriculum
   */
  const fetchElectiveRules = async () => {
    try {
      const response = await fetch(`/api/public-curricula?curriculumId=${curriculumId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch curriculum data');
      }
      const data = await response.json();
      const curriculum = data.curricula?.[0];
      return curriculum?.electiveRules || [];
    } catch (error) {
      console.error('Error fetching elective rules:', error);
      return [];
    }
  };

  /**
   * Convert CourseData to UnmatchedCourse format
   */
  const convertToUnmatchedCourses = (courses: CourseData[]): UnmatchedCourse[] => {
    return courses.map(course => ({
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      grade: course.grade,
      semester: course.semester,
      status: course.grade && course.grade.trim() ? 'completed' : 'completed' // Default to completed for transcript courses
    }));
  };

  /**
   * Extract free electives from curriculum
   */
  const extractFreeElectives = (curriculumCourses: CurriculumCourse[]): FreeElectiveCourse[] => {
    return curriculumCourses
      .filter(course => course.category.toLowerCase().includes('free') || 
                       course.category.toLowerCase().includes('elective'))
      .map(course => ({
        courseCode: course.code,
        courseName: course.title,
        credits: course.credits,
        source: 'curriculum' as const,
        isRequired: course.isRequired
      }));
  };
  const categorizeCourses = async (importedCourses: CourseData[]): Promise<{
    categorizedCourses: CategorizedCourses;
    matchedCount: number;
    unmatchedCourses: CourseData[];
  }> => {
    const curriculumCourses = await fetchCurriculumStructure();
    
    console.log("=== CATEGORIZATION DEBUG ===");
    console.log("Imported course codes:", importedCourses.map(ic => ic.courseCode));
    console.log("Curriculum course codes:", curriculumCourses.map(cc => cc.code));
    
    const categorizedCourses: CategorizedCourses = {};
    const matchedCodes = new Set<string>();
    const unmatchedCourses: CourseData[] = [];

    // Initialize categories with curriculum courses
    curriculumCourses.forEach(course => {
      if (!categorizedCourses[course.category]) {
        categorizedCourses[course.category] = [];
      }

      // Check if this course was imported
      const importedCourse = importedCourses.find(ic => {
        const normalizedCurriculumCode = course.code.replace(/\s/g, '').toUpperCase();
        const normalizedImportedCode = ic.courseCode.replace(/\s/g, '').toUpperCase();
        const isMatch = normalizedCurriculumCode === normalizedImportedCode;
        
        if (isMatch) {
          console.log(`MATCH FOUND: Curriculum "${course.code}" matches Imported "${ic.courseCode}"`);
        }
        
        return isMatch;
      });
      
      if (importedCourse) {
        matchedCodes.add(importedCourse.courseCode); // Add the imported course code, not curriculum code
        
        // Auto-set status based on grade
        let status: CourseStatus['status'] = 'not_completed';
        if (importedCourse.grade && importedCourse.grade.trim()) {
          status = 'completed';
        } else if (importedCourse.status === 'IN_PROGRESS') {
          status = 'taking';
        }

        console.log(`Adding to category "${course.category}": ${course.code} (${status})`);

        categorizedCourses[course.category].push({
          code: course.code,
          title: course.title,
          credits: course.credits,
          status,
          grade: importedCourse.grade,
          found: true
        });
      } else {
        // Course not found in transcript
        categorizedCourses[course.category].push({
          code: course.code,
          title: course.title,
          credits: course.credits,
          status: 'not_completed',
          found: false
        });
      }
    });

    // Handle unmatched imported courses (potential free electives)
    importedCourses.forEach(course => {
      if (!matchedCodes.has(course.courseCode)) {
        unmatchedCourses.push(course);
      }
    });

    // Add unmatched courses to Free Elective category
    if (unmatchedCourses.length > 0) {
      if (!categorizedCourses['Free Elective']) {
        categorizedCourses['Free Elective'] = [];
      }

      unmatchedCourses.forEach(course => {
        let status: CourseStatus['status'] = 'not_completed';
        if (course.grade && course.grade.trim()) {
          status = 'completed';
        } else if (course.status === 'IN_PROGRESS') {
          status = 'taking';
        }

        categorizedCourses['Free Elective'].push({
          code: course.courseCode,
          title: course.courseName,
          credits: course.credits,
          status,
          grade: course.grade,
          found: true
        });
      });
    }

    return {
      categorizedCourses,
      matchedCount: matchedCodes.size,
      unmatchedCourses
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportError('');
    setAnalysisResult(null);

    try {
      let result: TranscriptParseResult;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        result = parseTranscriptCSV(text);
      } else {
        // Handle Excel files
        const excelData = await parseExcelFile(file);
        result = {
          courses: excelData.courses,
          summary: {
            totalCourses: excelData.courses.length,
            completedCourses: excelData.courses.filter(c => c.status === 'COMPLETED').length,
            inProgressCourses: excelData.courses.filter(c => c.status === 'IN_PROGRESS').length,
            pendingCourses: excelData.courses.filter(c => c.status === 'PENDING').length,
            totalCreditsCompleted: excelData.courses
              .filter(c => c.status === 'COMPLETED')
              .reduce((sum, c) => sum + c.credits, 0),
            categoriesFound: [...new Set(excelData.courses.map(c => c.category).filter(Boolean))] as string[]
          },
          warnings: []
        };
      }

      // Validate the parsed data
      const validation = validateCourseData(result.courses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Add validation warnings
      if (validation.warnings.length > 0) {
        result.warnings.push(...validation.warnings);
      }

      setImportResult(result);

      // Categorize courses according to curriculum
      const analysis = await categorizeCourses(result.courses);
      setAnalysisResult(analysis);
      
      setImportStatus('success');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import transcript';
      setImportError(errorMessage);
      setImportStatus('error');
      if (onError) {
        onError(errorMessage);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyImportedCourses = async () => {
    if (!analysisResult) return;

    try {
      // Fetch elective rules and curriculum structure
      const [electiveRules, curriculumCourses] = await Promise.all([
        fetchElectiveRules(),
        fetchCurriculumStructure()
      ]);

      // Convert unmatched courses
      const unmatchedCourses = convertToUnmatchedCourses(analysisResult.unmatchedCourses);
      
      // Extract free electives from curriculum
      const freeElectives = extractFreeElectives(curriculumCourses);

      // Call the enhanced callback
      onCoursesImported({
        categorizedCourses: analysisResult.categorizedCourses,
        unmatchedCourses,
        freeElectives,
        electiveRules
      });

      setImportResult(null);
      setAnalysisResult(null);
      setImportStatus('idle');
    } catch (error) {
      console.error('Error applying imported courses:', error);
      onError?.('Failed to apply imported courses');
    }
  };

  const clearImport = () => {
    setImportResult(null);
    setAnalysisResult(null);
    setImportStatus('idle');
    setImportError('');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Transcript
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Upload your transcript file (CSV or Excel) to automatically import completed courses.
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: CSV (transcript format), Excel (.xlsx, .xls)
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
            <p className="text-xs text-blue-700">
              <strong>Current Focus:</strong> This tool analyzes constraints, elective rules, and course categories with grades. 
              Concentration-specific and blacklist features will be added in future updates.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
            <p className="text-xs text-yellow-700">
              <strong>Known Issue:</strong> Parser currently reads only the first ~9 courses. 
              This may be due to course category titles interrupting the parsing flow between course groups.
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="student-transcript-upload"
          />
          <label htmlFor="student-transcript-upload">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={importStatus === 'loading'}
              asChild
            >
              <span>
                <FileText className="w-4 h-4 mr-2" />
                {importStatus === 'loading' ? 'Processing...' : 'Choose File'}
              </span>
            </Button>
          </label>
        </div>

        {/* Import Status */}
        {importStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Import Failed</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{importError}</p>
          </div>
        )}

        {/* Import Result with Course Analysis */}
        {importResult && analysisResult && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Import & Analysis Complete</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Total Courses:</span>
                <div className="text-lg">{importResult.summary.totalCourses}</div>
              </div>
              <div>
                <span className="font-medium">Matched:</span>
                <div className="text-lg text-green-600">{analysisResult.matchedCount}</div>
              </div>
              <div>
                <span className="font-medium">Unmatched:</span>
                <div className="text-lg text-blue-600">{analysisResult.unmatchedCourses.length}</div>
              </div>
              <div>
                <span className="font-medium">Credits Earned:</span>
                <div className="text-lg">{importResult.summary.totalCreditsCompleted}</div>
              </div>
            </div>

            {/* Course Categories Summary */}
            <div className="mb-4">
              <span className="font-medium text-sm">Course Categories:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {Object.entries(analysisResult.categorizedCourses).map(([category, courses]) => {
                  const foundCourses = courses.filter(c => c.found);
                  const completedCourses = courses.filter(c => c.status === 'completed');
                  
                  return (
                    <div key={category} className="p-2 bg-white dark:bg-gray-800 rounded border">
                      <div className="font-medium text-sm">{category}</div>
                      <div className="text-xs text-muted-foreground">
                        {foundCourses.length} found, {completedCourses.length} completed
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unmatched Courses (Free Electives) */}
            {analysisResult.unmatchedCourses.length > 0 && (
              <div className="mb-4">
                <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
                  Unmatched Courses (Added as Free Electives):
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.unmatchedCourses.map(course => (
                    <Badge key={course.courseCode} variant="outline" className="text-xs">
                      {course.courseCode}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div className="mb-4">
                <span className="font-medium text-sm text-yellow-800 dark:text-yellow-200">Warnings:</span>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  {importResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={applyImportedCourses} size="sm">
                <Search className="w-4 h-4 mr-1" />
                Apply Categorized Courses
              </Button>
              <Button variant="outline" onClick={clearImport} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}