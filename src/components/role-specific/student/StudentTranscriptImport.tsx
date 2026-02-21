'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Search, Lightbulb } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { 
  parseTranscriptCSV, 
  parseExcelFile, 
  validateCourseData, 
  type CourseData, 
  type TranscriptParseResult,
  type FileMetadata
} from '@/components/features/excel/ExcelUtils';
import { API_BASE, getPublicCurricula } from '@/lib/api/laravel';
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
  /** Called immediately after parsing so the parent can auto-fill dropdowns */
  onMetadataExtracted?: (metadata: FileMetadata) => void;
}

// NOTE: Current implementation focuses on:
// - Constraints validation
// - Elective rules processing
// - Course categories and grades
// Future implementation will include:
// - Concentration-specific requirements
// - Blacklist management

interface CourseStatus {
  status: 'pending' | 'not_completed' | 'completed' | 'taking' | 'planning';
  grade?: string;
  plannedSemester?: string;
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
    plannedSemester?: string;
  }[];
}

// Tips Carousel Component
function TipsCarousel() {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: <Lightbulb className="w-4 h-4" />,
      title: "Data Entry Tips",
      content: "Upload your transcript CSV/Excel file to automatically import completed courses. Review and categorize unmatched courses before proceeding.",
      color: "bg-blue-50 border-blue-200 text-blue-700"
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: "Course Planning",
      content: "Use the Course Planning page to select future courses and plan your academic path. View concentration progress and requirements.",
      color: "bg-green-50 border-green-200 text-green-700"
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: "Progress Tracking",
      content: "Monitor your degree progress with detailed breakdowns by category. Track completed, current, and planned courses.",
      color: "bg-purple-50 border-purple-200 text-purple-700"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Export Features",
      content: "Download your course plan as Excel to share with advisors or save for records. All data syncs across pages automatically.",
      color: "bg-amber-50 border-amber-200 text-amber-700"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, [tips.length]);

  const currentTipData = tips[currentTip];

  return (
    <div className={`${currentTipData.color} border rounded-md p-3 mt-2 transition-all duration-500`}>
      <div className="flex items-start gap-2">
        {currentTipData.icon}
        <div className="flex-1">
          <p className="text-xs font-medium">{currentTipData.title}</p>
          <p className="text-xs mt-1">{currentTipData.content}</p>
        </div>
        <div className="flex gap-1">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentTip ? 'bg-current' : 'bg-current opacity-30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StudentTranscriptImport({ 
  curriculumId, 
  departmentId, 
  onCoursesImported, 
  onError,
  onMetadataExtracted,
}: StudentTranscriptImportProps) {
  const { success, error: showError, warning, info } = useToastHelpers();
  const [importResult, setImportResult] = useState<TranscriptParseResult | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    categorizedCourses: CategorizedCourses;
    matchedCount: number;
    unmatchedCourses: CourseData[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [curriculumCache, setCurriculumCache] = useState<any | null>(null);
  /** Curriculum UUID extracted directly from the imported file (new format CURRICULUM_ID row).
   *  Used as a fallback when the curriculumId prop hasn't been updated yet by the parent. */
  const [fileMetadataCurriculumId, setFileMetadataCurriculumId] = useState<string>('');

  useEffect(() => {
    setCurriculumCache(null);
  }, [curriculumId, fileMetadataCurriculumId]);

  const fetchActiveCurriculum = async () => {
    // Prefer the prop (set by parent dropdowns), fall back to the UUID embedded in the file
    const effectiveId = curriculumId || fileMetadataCurriculumId;
    if (!effectiveId) {
      throw new Error('No curriculum selected');
    }

    if (curriculumCache) {
      return curriculumCache;
    }

    const data = await getPublicCurricula();
    const curricula = data.curricula || [];
    const found = curricula.find((curr: any) => curr.id === effectiveId);

    if (!found) {
      throw new Error('Curriculum not found');
    }

    setCurriculumCache(found);
    return found;
  };

  /**
   * Fetch curriculum structure to categorize courses
   */
  const fetchCurriculumStructure = async (): Promise<CurriculumCourse[]> => {
    try {
      const curriculum = await fetchActiveCurriculum();

      const courses: CurriculumCourse[] = [];

      // Process curriculum courses using their courseType for categorization
      const curriculumCourses = curriculum.curriculumCourses || curriculum.curriculum_courses || [];

      console.log('Raw curriculum courses:', curriculumCourses.length);
      
      // Add curriculum courses using category provided by API response
      curriculumCourses.forEach((currCourse: any) => {
        const course = currCourse.course;
        if (course) {
          const category =
            course.category ||
            currCourse.category ||
            currCourse.courseType ||
            'Uncategorized';
          
          console.log(`Course ${course.code}: category = ${category}`);
          
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
      showError('Failed to load curriculum structure. Please try again.');
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
        const response = await fetch(`${API_BASE}/courses?departmentId=${departmentId}&code=${code}`, {
          credentials: 'include',
        });
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
      const curriculum = await fetchActiveCurriculum();
      const electiveRules = curriculum?.electiveRules || curriculum?.elective_rules || [];
      return electiveRules;
    } catch (error) {
      console.error('Error fetching elective rules:', error);
      warning('Could not load elective rules. Some features may be limited.');
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
        let status: CourseStatus['status'] = 'pending';
        if (importedCourse.grade && importedCourse.grade.trim()) {
          status = 'completed';
        } else if (importedCourse.status === 'IN_PROGRESS') {
          status = 'taking';
        } else if (importedCourse.status === 'PLANNING') {
          status = 'planning';
        }

        console.log(`Adding to category "${course.category}": ${course.code} (${status})`);

        categorizedCourses[course.category].push({
          code: course.code,
          title: course.title,
          credits: course.credits,
          status,
          grade: importedCourse.grade,
          found: true,
          plannedSemester: importedCourse.semester
        });
      } else {
        // Course not found in transcript
        categorizedCourses[course.category].push({
          code: course.code,
          title: course.title,
          credits: course.credits,
          status: 'pending',
          found: false,
          plannedSemester: undefined
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
        let status: CourseStatus['status'] = 'pending';
        if (course.grade && course.grade.trim()) {
          status = 'completed';
        } else if (course.status === 'IN_PROGRESS') {
          status = 'taking';
        } else if (course.status === 'PLANNING') {
          status = 'planning';
        }

        categorizedCourses['Free Elective'].push({
          code: course.courseCode,
          title: course.courseName,
          credits: course.credits,
          status,
          grade: course.grade,
          found: true,
          plannedSemester: course.semester
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

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    setImportStatus('loading');
    setImportError('');
    setAnalysisResult(null);

    try {
      let result: TranscriptParseResult;
      
      const fileName = file.name.toLowerCase();
      console.log('Processing file:', fileName);
      
      if (fileName.endsWith('.csv')) {
        console.log('Parsing as CSV file');
        const text = await file.text();
        result = parseTranscriptCSV(text);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        console.log('Parsing as Excel file');
        // Handle Excel files
        const excelData = await parseExcelFile(file);
        result = {
          courses: excelData.courses,
          metadata: excelData.metadata,
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
      } else {
        throw new Error('Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.');
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

      // Stash the UUID from the file so fetchActiveCurriculum can use it as fallback
      if (result.metadata?.curriculumId) {
        setFileMetadataCurriculumId(result.metadata.curriculumId);
      }

      // Emit metadata immediately so parent can auto-fill dropdowns before categorization
      if (result.metadata && onMetadataExtracted) {
        onMetadataExtracted(result.metadata);
      }

      // Only categorize if a curriculum is already selected; otherwise the user
      // will click "Apply" after the dropdowns have been auto-filled.
      if (curriculumId) {
        const analysis = await categorizeCourses(result.courses);
        setAnalysisResult(analysis);
      }
      
      setImportStatus('success');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import transcript';
      setImportError(errorMessage);
      setImportStatus('error');
      showError(errorMessage, 'Import Failed');
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
    if (!importResult) return;

    const effectiveCurriculumId = curriculumId || fileMetadataCurriculumId;
    if (!effectiveCurriculumId) {
      showError('Please select a curriculum using the dropdowns above, then click Apply.', 'No Curriculum Selected');
      return;
    }

    setIsApplying(true);
    try {
      // Run categorization now if it was skipped during upload (no curriculum at that time)
      let analysis = analysisResult;
      if (!analysis) {
        analysis = await categorizeCourses(importResult.courses);
        setAnalysisResult(analysis);
      }

      // Fetch elective rules and curriculum structure
      const [electiveRules, curriculumCourses] = await Promise.all([
        fetchElectiveRules(),
        fetchCurriculumStructure()
      ]);

      // Convert unmatched courses
      const unmatchedCourses = convertToUnmatchedCourses(analysis.unmatchedCourses);
      
      // Extract free electives from curriculum
      const freeElectives = extractFreeElectives(curriculumCourses);

      // Call the enhanced callback
      onCoursesImported({
        categorizedCourses: analysis.categorizedCourses,
        unmatchedCourses,
        freeElectives,
        electiveRules
      });

      setImportResult(null);
      setAnalysisResult(null);
      setImportStatus('idle');
      success('Courses imported and categorized successfully!', 'Import Complete');
    } catch (error) {
      console.error('Error applying imported courses:', error);
      showError('Failed to apply imported courses. Please try again.');
      onError?.('Failed to apply imported courses');
    } finally {
      setIsApplying(false);
    }
  };

  const clearImport = () => {
    setImportResult(null);
    setAnalysisResult(null);
    setImportStatus('idle');
    setImportError('');
    setFileMetadataCurriculumId('');
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
          <p className="text-sm text-muted-foreground text-teal-500 mb-1">
            Upload your transcript file (CSV or Excel) to automatically import completed courses...            
          </p>
          <p className="text-sm text-muted-foreground text-teal-500 mb-1">
            Manually add few courses and generate an excel file to see how the system works!
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: CSV (transcript format), Excel (.xlsx, .xls)
          </p>
          
          {/* Tips and Tricks Carousel */}
          <TipsCarousel />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileUpload}
            className="hidden"
            id="student-transcript-upload"
          />
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={importStatus === 'loading'}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-4 h-4 mr-2" />
            {importStatus === 'loading' ? 'Processing...' : 'Choose File'}
          </Button>
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
        {importResult && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                {analysisResult ? 'Import & Analysis Complete' : 'File Parsed Successfully'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Total Courses:</span>
                <div className="text-lg">{importResult.summary.totalCourses}</div>
              </div>
              {analysisResult ? (
                <>
                  <div>
                    <span className="font-medium">Matched:</span>
                    <div className="text-lg text-green-600">{analysisResult.matchedCount}</div>
                  </div>
                  <div>
                    <span className="font-medium">Unmatched:</span>
                    <div className="text-lg text-blue-600">{analysisResult.unmatchedCourses.length}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-medium">Completed:</span>
                    <div className="text-lg text-green-600">{importResult.summary.completedCourses}</div>
                  </div>
                  <div>
                    <span className="font-medium">Pending:</span>
                    <div className="text-lg text-blue-600">{importResult.summary.pendingCourses}</div>
                  </div>
                </>
              )}
              <div>
                <span className="font-medium">Credits Earned:</span>
                <div className="text-lg">{importResult.summary.totalCreditsCompleted}</div>
              </div>
            </div>

            {/* Curriculum auto-fill notice when no analysis yet */}
            {!analysisResult && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-200">
                {curriculumId
                  ? 'Curriculum selected. Click "Apply Categorized Courses" to categorize and apply your courses.'
                  : importResult.metadata?.curriculumId || importResult.metadata?.curriculum
                    ? 'Your curriculum was detected from the file and has been auto-selected above. Click "Apply Categorized Courses" to proceed.'
                    : 'Please select your curriculum using the dropdowns above, then click "Apply Categorized Courses".'}
              </div>
            )}

            {/* Course Categories Summary (only when analysis is done) */}
            {analysisResult && (
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
            )}

            {/* Unmatched Courses (Free Electives) — only when analysis done */}
            {analysisResult && analysisResult.unmatchedCourses.length > 0 && (
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
              <Button 
                onClick={applyImportedCourses} 
                size="sm" 
                disabled={isApplying}
              >
                <Search className="w-4 h-4 mr-1" />
                {isApplying ? 'Applying...' : 'Apply Categorized Courses'}
              </Button>
              <Button variant="outline" onClick={clearImport} size="sm" disabled={isApplying}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}