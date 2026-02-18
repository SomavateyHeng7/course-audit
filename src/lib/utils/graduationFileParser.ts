/**
 * Graduation File Parser
 * 
 * Parses Excel/CSV files exported from the Course Audit system
 * and converts them to the JSON format required for graduation portal submission.
 * 
 * Supports the grouped format:
 * - Category headers with credits
 * - Active Credits row
 * - Course rows with: Title, Code, Credits, Grade, Status, Semester
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { SubmissionCourse } from '@/lib/api/laravel';

export interface ParseResult {
  success: boolean;
  courses: SubmissionCourse[];
  summary: {
    totalCourses: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    totalCredits: number;
  };
  errors: string[];
  warnings: string[];
  curriculumMetadata?: {
    id?: string;
    name?: string;
    year?: string;
  };
}

// Grade to status mapping
const GRADE_STATUS_MAP: Record<string, SubmissionCourse['status']> = {
  // Completed grades
  'A+': 'completed', 'A': 'completed', 'A-': 'completed',
  'B+': 'completed', 'B': 'completed', 'B-': 'completed',
  'C+': 'completed', 'C': 'completed', 'C-': 'completed',
  'D+': 'completed', 'D': 'completed', 'D-': 'completed',
  'S': 'completed', 'P': 'completed', 'PASS': 'completed',
  // Failed
  'F': 'failed', 'FAIL': 'failed', 'FAILED': 'failed',
  // Withdrawn
  'W': 'withdrawn', 'WD': 'withdrawn', 'WITHDRAWN': 'withdrawn', 'DROPPED': 'withdrawn',
  // In Progress
  'IP': 'in_progress', 'IN_PROGRESS': 'in_progress', 'INPROGRESS': 'in_progress',
  'TAKING': 'in_progress', 'CURRENT': 'in_progress', 'I': 'in_progress',
};

// Status label to status mapping
const STATUS_LABEL_MAP: Record<string, SubmissionCourse['status']> = {
  'completed': 'completed',
  'currently taking': 'in_progress',
  'in progress': 'in_progress',
  'planned': 'planned',
  'planning': 'planned',
  'failed': 'failed',
  'withdrawn': 'withdrawn',
  'pending': 'planned',
  'future': 'planned',
};

/**
 * Parse a file (Excel or CSV) and return course data
 */
export async function parseGraduationFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (['xlsx', 'xls'].includes(extension || '')) {
    return parseExcel(file);
  }
  
  return {
    success: false,
    courses: [],
    summary: { totalCourses: 0, byCategory: {}, byStatus: {}, totalCredits: 0 },
    errors: ['Unsupported file format. Please upload .xlsx, .xls, or .csv'],
    warnings: []
  };
}

/**
 * Parse Excel file
 */
function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get raw data as array of arrays
        const rawData: string[][] = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1, 
          defval: '' 
        });
        
        resolve(processRawData(rawData));
      } catch (error) {
        resolve({
          success: false,
          courses: [],
          summary: { totalCourses: 0, byCategory: {}, byStatus: {}, totalCredits: 0 },
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        courses: [],
        summary: { totalCourses: 0, byCategory: {}, byStatus: {}, totalCredits: 0 },
        errors: ['Failed to read file'],
        warnings: []
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file
 */
function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(processRawData(results.data as string[][]));
      },
      error: (error) => {
        resolve({
          success: false,
          courses: [],
          summary: { totalCourses: 0, byCategory: {}, byStatus: {}, totalCredits: 0 },
          errors: [`CSV parsing error: ${error.message}`],
          warnings: []
        });
      }
    });
  });
}

/**
 * Process raw 2D array data from Excel/CSV
 * Handles the grouped format with category headers
 */
function processRawData(data: string[][]): ParseResult {
  const courses: SubmissionCourse[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenCodes = new Set<string>();
  const curriculumMetadata: { id?: string; name?: string; year?: string } = {};
  
  let currentCategory = 'Uncategorized';
  let rowNum = 0;
  
  // Category pattern: "Category Name (X Credits)"
  const categoryPattern = /^(.+?)\s*\((\d+)\s*Credits?\)$/i;
  // Active Credits pattern: "Active Credits" or "Active Credits: X"
  const activeCreditsPattern = /^Active\s*Credits/i;
  // Overall credits pattern
  const overallPattern = /^Overall\s*(Active\s*)?Credits/i;
  
  for (const row of data) {
    rowNum++;
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
      continue;
    }
    
    const firstCell = String(row[0] || '').trim();
    const secondCell = row[1] ? String(row[1]).trim() : '';
    
    // Skip header rows like "course data"
    if (firstCell.toLowerCase() === 'course data') {
      continue;
    }
    
    // Extract curriculum metadata
    if (firstCell === 'CURRICULUM_ID' && secondCell) {
      curriculumMetadata.id = secondCell;
      continue;
    }
    if (firstCell === 'CURRICULUM_NAME' && secondCell) {
      curriculumMetadata.name = secondCell;
      continue;
    }
    if (firstCell === 'CURRICULUM_YEAR' && secondCell) {
      curriculumMetadata.year = secondCell;
      continue;
    }
    
    // Check if it's a category header
    const categoryMatch = firstCell.match(categoryPattern);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }
    
    // Skip "Active Credits" rows
    if (activeCreditsPattern.test(firstCell)) {
      continue;
    }
    
    // Skip "Overall Active Credits" rows
    if (overallPattern.test(firstCell)) {
      continue;
    }
    
    // Try to parse as a course row
    // Expected format: Title, Code, Credits, Grade, Status, Semester
    const course = parseCourseRow(row, currentCategory, rowNum);
    
    if (course) {
      // Check for duplicates
      if (seenCodes.has(course.code)) {
        warnings.push(`Row ${rowNum}: Duplicate course code '${course.code}' - skipped`);
        continue;
      }
      
      seenCodes.add(course.code);
      courses.push(course);
    }
  }
  
  if (courses.length === 0) {
    errors.push('No valid courses found in file. Please ensure the file follows the expected format.');
  }
  
  // Build summary
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalCredits = 0;
  
  for (const course of courses) {
    const cat = course.category || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    byStatus[course.status] = (byStatus[course.status] || 0) + 1;
    totalCredits += course.credits;
  }
  
  return {
    success: courses.length > 0 && errors.length === 0,
    courses,
    summary: {
      totalCourses: courses.length,
      byCategory,
      byStatus,
      totalCredits
    },
    errors,
    warnings,
    curriculumMetadata: Object.keys(curriculumMetadata).length > 0 ? curriculumMetadata : undefined
  };
}

/**
 * Parse a single course row
 * Format: [Title, Code, Credits, Grade, Status, Semester]
 */
function parseCourseRow(
  row: string[], 
  category: string, 
  rowNum: number
): SubmissionCourse | null {
  // Need at least 3 columns (Title, Code, Credits) to be a valid course row
  if (row.length < 3) {
    return null;
  }
  
  const title = String(row[0] || '').trim();
  const code = String(row[1] || '').trim().toUpperCase();
  const creditsRaw = row[2];
  const grade = String(row[3] || '').trim().toUpperCase();
  const statusLabel = String(row[4] || '').trim().toLowerCase();
  const semester = String(row[5] || '').trim();
  
  // Validate code - should have letters and possibly numbers
  if (!code || !/[A-Z]/.test(code)) {
    return null;
  }
  
  // Parse credits
  const credits = parseFloat(String(creditsRaw)) || 0;
  
  // Skip if no valid credits (likely a header row)
  if (credits === 0 && !grade && !statusLabel) {
    return null;
  }
  
  // Determine status
  let status: SubmissionCourse['status'] = 'planned';
  
  // First try status label
  if (statusLabel && STATUS_LABEL_MAP[statusLabel]) {
    status = STATUS_LABEL_MAP[statusLabel];
  }
  // Then try grade
  else if (grade && GRADE_STATUS_MAP[grade]) {
    status = GRADE_STATUS_MAP[grade];
  }
  // Check if grade looks like a letter grade
  else if (grade && /^[A-D][+-]?$/.test(grade)) {
    status = 'completed';
  }
  
  return {
    code,
    name: title || undefined,
    credits: credits > 0 ? credits : 3, // Default to 3 if no credits
    grade: grade || '',
    status,
    category: category !== 'Uncategorized' ? category : undefined,
    semester: semester || undefined
  };
}

/**
 * Map a grade string to a status
 */
export function mapGradeToStatus(grade: string): SubmissionCourse['status'] {
  const normalized = grade.toUpperCase().trim();
  
  if (GRADE_STATUS_MAP[normalized]) {
    return GRADE_STATUS_MAP[normalized];
  }
  
  // Check for letter grade pattern
  if (/^[A-D][+-]?$/.test(normalized)) {
    return 'completed';
  }
  
  return 'planned';
}

/**
 * Get display label for status
 */
export function getStatusDisplayLabel(status: SubmissionCourse['status']): string {
  const labels: Record<SubmissionCourse['status'], string> = {
    'completed': 'Completed',
    'in_progress': 'In Progress',
    'planned': 'Planned',
    'failed': 'Failed',
    'withdrawn': 'Withdrawn'
  };
  return labels[status] || status;
}

/**
 * Validate parsed courses before submission
 */
export function validateCoursesForSubmission(courses: SubmissionCourse[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (courses.length === 0) {
    errors.push('No courses to submit');
    return { valid: false, errors, warnings };
  }
  
  if (courses.length > 200) {
    errors.push('Maximum 200 courses allowed per submission');
    return { valid: false, errors, warnings };
  }
  
  // Check for required fields
  for (const course of courses) {
    if (!course.code) {
      errors.push(`Course with name "${course.name}" has no course code`);
    }
    if (course.credits <= 0) {
      warnings.push(`Course ${course.code} has invalid credits (${course.credits})`);
    }
  }
  
  // Check for completeness
  const completedCount = courses.filter(c => c.status === 'completed').length;
  if (completedCount === 0) {
    warnings.push('No completed courses found. Make sure grades are properly entered.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
