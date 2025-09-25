import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Updated interface to match StudentCourse status enum and data-entry page statuses
export interface CourseData {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  semester?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PLANNING' | 'WITHDRAWN' | 'TAKING' | 'DROPPED' | 'PENDING';
  category?: string; // Course category from transcript sections
}

export interface ExcelData {
  courses: CourseData[];
  students: any[];
  programs: any[];
  studentId?: string;
  faculty?: string;
  department?: string;
  curriculum?: string;
}

// New interface for transcript-specific parsing
export interface TranscriptParseResult {
  courses: CourseData[];
  summary: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    pendingCourses: number;
    totalCreditsCompleted: number;
    categoriesFound: string[];
  };
  warnings: string[];
}

/**
 * Standardize course codes by removing spaces and normalizing format
 */
function standardizeCourseCode(code: string): string {
  if (!code) return '';
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Clean course names by removing credit hour information and extra formatting
 */
function cleanCourseName(name: string): string {
  if (!name) return '';
  
  // Remove patterns like "(3-0-6)", "(*)", etc.
  return name
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract category name from section headers
 */
function extractCategoryName(headerText: string): string {
  if (!headerText) return '';
  
  // Extract from patterns like "General Education Courses (30 Credits)"
  const match = headerText.match(/^(.+?)\s*\(\d+\s*Credits?\)/i);
  return match ? match[1].trim() : headerText.split('(')[0].trim();
}

/**
 * Determine course status based on grade and remark fields
 */
function determineStatus(grade?: string, remark?: string): CourseData['status'] {
  // Check for explicit status indicators first - handle progress page export statuses
  if (remark?.toLowerCase().includes('planning')) return 'PLANNING';
  if (remark?.toLowerCase().includes('taking')) return 'IN_PROGRESS';
  if (remark?.toLowerCase().includes('failed')) return 'FAILED';
  if (remark?.toLowerCase().includes('dropped')) return 'DROPPED';
  if (remark?.toLowerCase().includes('withdrawn')) return 'WITHDRAWN';
  
  // Handle exact status matches (case-insensitive) from progress page exports
  const remarkLower = remark?.toLowerCase();
  if (remarkLower === 'planning') return 'PLANNING';
  if (remarkLower === 'taking') return 'IN_PROGRESS'; // Handle "taking" status
  if (remarkLower === 'completed') return 'COMPLETED';
  if (remarkLower === 'failed') return 'FAILED';
  if (remarkLower === 'withdrawn') return 'WITHDRAWN';
  if (remarkLower === 'not_completed') return 'PENDING';
  
  // If no explicit status and grade is present and valid, course is completed
  if (!remark || remark.trim() === '') {
    if (grade && grade.trim() && !['', '-', 'N/A'].includes(grade.trim())) {
      return 'COMPLETED';
    }
  }
  
  // Default to pending
  return 'PENDING';
}

/**
 * Parse transcript CSV with the specific format from the sample
 */
export function parseTranscriptCSV(csvText: string): TranscriptParseResult {
  const courses: CourseData[] = [];
  const warnings: string[] = [];
  const categoriesFound: string[] = [];
  let currentCategory = '';
  
  try {
    const lines = csvText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV row (handling commas within quotes)
      const row = line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      const [courseName, code, credits, grade, remark] = row;
      
      // Check if this is a category header
      if (courseName && courseName.includes('Credits)')) {
        currentCategory = extractCategoryName(courseName);
        if (currentCategory && !categoriesFound.includes(currentCategory)) {
          categoriesFound.push(currentCategory);
        }
        continue;
      }
      
      // Skip empty rows or rows with just notation numbers
      if (!code || !courseName) continue;
      
      // Skip rows that are just index numbers (E1, E2, etc.)
      if (courseName.match(/^[A-Z]\d+$/)) continue;
      
      // Skip total/summary rows
      if (courseName.toLowerCase().includes('total')) continue;
      
      // Parse course data
      const courseCode = standardizeCourseCode(code);
      const cleanedName = cleanCourseName(courseName);
      const creditValue = parseInt(credits) || 0;
      const status = determineStatus(grade, remark);
      
      // Debug logging for planning courses
      if (remark?.toLowerCase() === 'planning') {
        console.log(`🔍 CSV DEBUG: Planning course found - ${courseName} (${code})`);
        console.log(`🔍 CSV DEBUG: Raw row:`, row);
        console.log(`🔍 CSV DEBUG: grade='${grade}', remark='${remark}'`);
        console.log(`🔍 CSV DEBUG: Determined status:`, status);
      }
      
      // Validate essential fields
      if (!courseCode || !cleanedName) {
        warnings.push(`Skipped invalid course entry at line ${i + 1}: missing code or name`);
        continue;
      }
      
      courses.push({
        courseCode,
        courseName: cleanedName,
        credits: creditValue,
        grade: grade?.trim() || undefined,
        status,
        category: currentCategory
      });
    }
    
    // Calculate summary statistics
    const completedCourses = courses.filter(c => c.status === 'COMPLETED').length;
    const inProgressCourses = courses.filter(c => c.status === 'IN_PROGRESS').length;
    const pendingCourses = courses.filter(c => c.status === 'PENDING').length;
    const totalCreditsCompleted = courses
      .filter(c => c.status === 'COMPLETED')
      .reduce((sum, c) => sum + c.credits, 0);
    
    return {
      courses,
      summary: {
        totalCourses: courses.length,
        completedCourses,
        inProgressCourses,
        pendingCourses,
        totalCreditsCompleted,
        categoriesFound
      },
      warnings
    };
    
  } catch (error) {
    throw new Error(`Failed to parse transcript CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Excel/CSV file for course data with transcript format support
 */
export function parseExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        if (typeof data === 'string') {
          // Handle CSV files with transcript format
          if (file.name.toLowerCase().includes('credit') || 
              file.name.toLowerCase().includes('transcript')) {
            const transcriptResult = parseTranscriptCSV(data);
            resolve({
              courses: transcriptResult.courses,
              students: [],
              programs: []
            });
            return;
          }
          
          // Regular CSV parsing
          const result = Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
          });
          
          const courses = result.data.map((row: any) => ({
            courseCode: standardizeCourseCode(row.course_code || row.code || ''),
            courseName: cleanCourseName(row.course_name || row.name || ''),
            credits: parseInt(row.credits || row.credit_hours || '0') || 0,
            grade: row.grade?.trim() || undefined,
            status: determineStatus(row.grade, row.remark || row.status)
          })).filter(course => course.courseCode && course.courseName);
          
          resolve({ courses, students: [], programs: [] });
          
        } else {
          // Handle Excel files
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const courses = jsonData.map((row: any) => ({
            courseCode: standardizeCourseCode(row['Course Code'] || row['Code'] || ''),
            courseName: cleanCourseName(row['Course Name'] || row['Name'] || ''),
            credits: parseInt(row['Credits'] || row['Credit Hours'] || '0') || 0,
            grade: row['Grade']?.trim() || undefined,
            status: determineStatus(row['Grade'], row['Remark'] || row['Status'])
          })).filter(course => course.courseCode && course.courseName);
          
          resolve({ courses, students: [], programs: [] });
        }
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

/**
 * Validate course data against common requirements
 */
export function validateCourseData(courses: CourseData[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!courses || courses.length === 0) {
    errors.push('No course data found');
    return { isValid: false, errors, warnings };
  }
  
  courses.forEach((course, index) => {
    // Essential field validation
    if (!course.courseCode) {
      errors.push(`Course at row ${index + 1}: Missing course code`);
    }
    
    if (!course.courseName) {
      errors.push(`Course at row ${index + 1}: Missing course name`);
    }
    
    if (course.credits <= 0) {
      warnings.push(`Course ${course.courseCode}: Invalid or missing credit hours (${course.credits})`);
    }
    
    // Course code format validation
    if (course.courseCode && !/^[A-Z]{2,4}\d{3,4}[A-Z]?$/i.test(course.courseCode)) {
      warnings.push(`Course ${course.courseCode}: Unusual course code format`);
    }
    
    // Grade validation
    if (course.grade && !/^[A-F][+-]?$|^PASS$|^FAIL$/i.test(course.grade)) {
      warnings.push(`Course ${course.courseCode}: Unusual grade format (${course.grade})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Group courses by category for better organization
 */
export function groupCoursesByCategory(courses: CourseData[]): Record<string, CourseData[]> {
  return courses.reduce((groups, course) => {
    const category = course.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(course);
    return groups;
  }, {} as Record<string, CourseData[]>);
}

/**
 * Calculate progress statistics for a list of courses
 */
export function calculateProgressStats(courses: CourseData[]) {
  const stats = {
    total: courses.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    failed: 0,
    dropped: 0,
    totalCredits: 0,
    completedCredits: 0,
    gpa: 0
  };
  
  let gradePoints = 0;
  let gradeCredits = 0;
  
  courses.forEach(course => {
    stats.totalCredits += course.credits;
    
    switch (course.status) {
      case 'COMPLETED':
        stats.completed++;
        stats.completedCredits += course.credits;
        
        // Calculate GPA if grade is available
        if (course.grade) {
          const points = getGradePoints(course.grade);
          if (points >= 0) {
            gradePoints += points * course.credits;
            gradeCredits += course.credits;
          }
        }
        break;
      case 'IN_PROGRESS':
        stats.inProgress++;
        break;
      case 'PENDING':
        stats.pending++;
        break;
      case 'FAILED':
        stats.failed++;
        break;
      case 'DROPPED':
        stats.dropped++;
        break;
    }
  });
  
  stats.gpa = gradeCredits > 0 ? gradePoints / gradeCredits : 0;
  
  return stats;
}

/**
 * Convert grade to grade points for GPA calculation
 */
function getGradePoints(grade: string): number {
  const gradeMap: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  return gradeMap[grade.toUpperCase()] ?? -1;
} 