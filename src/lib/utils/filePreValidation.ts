/**
 * File Pre-Validation for Graduation Portal (REQ-3)
 *
 * Validates uploaded files client-side before submission:
 * - File format (.xlsx, .xls, .csv)
 * - File size (configurable, default 5MB)
 * - File parsing (corrupt file detection)
 * - Required column detection
 * - Data type validation per row
 * - Course code format hints
 * - Grade format validation
 *
 * Uses the existing graduationFileParser for actual parsing,
 * wrapping it with structured validation checks.
 */

import { parseGraduationFile, validateCoursesForSubmission, type ParseResult } from './graduationFileParser';

// ── Types ────────────────────────────────────────────────────────

export interface ValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  detail?: string;
}

export interface FileValidationIssue {
  type: 'format' | 'structure' | 'data';
  severity: 'error' | 'warning';
  message: string;
  row?: number;
  column?: string;
}

export interface PreValidationResult {
  checks: ValidationCheck[];
  issues: FileValidationIssue[];
  parseResult: ParseResult | null;
  canProceed: boolean;
}

export interface PreValidationOptions {
  acceptedFormats?: string[];
  maxSizeMb?: number;
}

// ── Constants ────────────────────────────────────────────────────

const DEFAULT_ACCEPTED_FORMATS = ['.xlsx', '.xls', '.csv'];
const DEFAULT_MAX_SIZE_MB = 5;

const VALID_GRADES = new Set([
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-',
  'D+', 'D', 'D-', 'F', 'S', 'U', 'P', 'W',
  'IP', 'I', 'PASS', 'FAIL', 'WITHDRAWN', 'DROPPED',
  'TAKING', 'CURRENT', 'IN_PROGRESS', 'INPROGRESS',
]);

// Course code: 2-4 uppercase letters, optional separator, 3-4 digits, optional letter suffix
const COURSE_CODE_PATTERN = /^[A-Z]{2,4}[\s\-]?\d{3,4}[A-Z]?$/i;

// ── Main function ────────────────────────────────────────────────

export async function preValidateGraduationFile(
  file: File,
  options?: PreValidationOptions
): Promise<PreValidationResult> {
  const acceptedFormats = options?.acceptedFormats || DEFAULT_ACCEPTED_FORMATS;
  const maxSizeMb = options?.maxSizeMb || DEFAULT_MAX_SIZE_MB;

  const checks: ValidationCheck[] = [];
  const issues: FileValidationIssue[] = [];
  let parseResult: ParseResult | null = null;

  // ── Check 1: File format ──────────────────────────────────────
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  if (acceptedFormats.includes(ext)) {
    checks.push({
      id: 'format',
      label: 'File format',
      status: 'pass',
      detail: `${ext} is an accepted format`,
    });
  } else {
    checks.push({
      id: 'format',
      label: 'File format',
      status: 'fail',
      detail: `${ext} is not accepted. Use: ${acceptedFormats.join(', ')}`,
    });
    issues.push({
      type: 'format',
      severity: 'error',
      message: `Invalid file format "${ext}". Accepted: ${acceptedFormats.join(', ')}`,
    });
    // Can't continue if format is wrong
    return { checks, issues, parseResult: null, canProceed: false };
  }

  // ── Check 2: File size ────────────────────────────────────────
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb <= maxSizeMb) {
    checks.push({
      id: 'size',
      label: 'File size',
      status: 'pass',
      detail: `${sizeMb.toFixed(2)} MB (max ${maxSizeMb} MB)`,
    });
  } else {
    checks.push({
      id: 'size',
      label: 'File size',
      status: 'fail',
      detail: `${sizeMb.toFixed(2)} MB exceeds the ${maxSizeMb} MB limit`,
    });
    issues.push({
      type: 'format',
      severity: 'error',
      message: `File is ${sizeMb.toFixed(2)} MB. Maximum allowed: ${maxSizeMb} MB`,
    });
    return { checks, issues, parseResult: null, canProceed: false };
  }

  // ── Check 3: File parsing ─────────────────────────────────────
  try {
    parseResult = await parseGraduationFile(file);
  } catch {
    checks.push({
      id: 'parse',
      label: 'File readable',
      status: 'fail',
      detail: 'File could not be opened — it may be corrupted',
    });
    issues.push({
      type: 'format',
      severity: 'error',
      message: 'Failed to parse file. The file may be corrupted or in an unsupported layout.',
    });
    return { checks, issues, parseResult: null, canProceed: false };
  }

  // Check if parser itself reported errors (e.g. corrupt Excel)
  if (parseResult.errors.length > 0 && parseResult.courses.length === 0) {
    checks.push({
      id: 'parse',
      label: 'File readable',
      status: 'fail',
      detail: parseResult.errors[0],
    });
    for (const err of parseResult.errors) {
      issues.push({ type: 'format', severity: 'error', message: err });
    }
    return { checks, issues, parseResult, canProceed: false };
  }

  checks.push({
    id: 'parse',
    label: 'File readable',
    status: 'pass',
    detail: 'File was parsed successfully',
  });

  // ── Check 4: Course data found ────────────────────────────────
  const courseCount = parseResult.courses.length;
  if (courseCount === 0) {
    checks.push({
      id: 'courses',
      label: 'Course data found',
      status: 'fail',
      detail: 'No course rows detected in the file',
    });
    issues.push({
      type: 'structure',
      severity: 'error',
      message: 'No valid course data found. Ensure the file follows the expected format (Title, Code, Credits, Grade, Status, Semester).',
    });
    return { checks, issues, parseResult, canProceed: false };
  }

  if (courseCount > 200) {
    checks.push({
      id: 'courses',
      label: 'Course data found',
      status: 'fail',
      detail: `${courseCount} courses exceed the 200-course limit`,
    });
    issues.push({
      type: 'data',
      severity: 'error',
      message: `File contains ${courseCount} courses. Maximum allowed is 200.`,
    });
    return { checks, issues, parseResult, canProceed: false };
  }

  checks.push({
    id: 'courses',
    label: 'Course data found',
    status: 'pass',
    detail: `${courseCount} course${courseCount !== 1 ? 's' : ''} detected`,
  });

  // ── Check 5: Row-level data validation ────────────────────────
  let dataErrors = 0;
  let dataWarnings = 0;

  for (let i = 0; i < parseResult.courses.length; i++) {
    const course = parseResult.courses[i];
    const rowNum = i + 2; // 1-based + header row

    // Course code presence
    if (!course.code || course.code.trim() === '') {
      issues.push({
        type: 'data',
        severity: 'error',
        message: `Missing course code`,
        row: rowNum,
        column: 'code',
      });
      dataErrors++;
    } else if (!COURSE_CODE_PATTERN.test(course.code)) {
      issues.push({
        type: 'data',
        severity: 'warning',
        message: `Unusual course code format: "${course.code}"`,
        row: rowNum,
        column: 'code',
      });
      dataWarnings++;
    }

    // Credits validation
    if (course.credits <= 0 || course.credits > 12) {
      issues.push({
        type: 'data',
        severity: 'warning',
        message: `Unusual credits value: ${course.credits}`,
        row: rowNum,
        column: 'credits',
      });
      dataWarnings++;
    }

    // Grade validation (only when grade is present and non-empty)
    if (course.grade && course.grade.trim() !== '') {
      const normalized = course.grade.toUpperCase().trim();
      if (!VALID_GRADES.has(normalized) && !/^[A-D][+-]?$/.test(normalized)) {
        issues.push({
          type: 'data',
          severity: 'warning',
          message: `Unrecognized grade: "${course.grade}"`,
          row: rowNum,
          column: 'grade',
        });
        dataWarnings++;
      }
    }
  }

  if (dataErrors > 0) {
    checks.push({
      id: 'data',
      label: 'Data validation',
      status: 'fail',
      detail: `${dataErrors} error${dataErrors !== 1 ? 's' : ''} found in course data`,
    });
  } else if (dataWarnings > 0) {
    checks.push({
      id: 'data',
      label: 'Data validation',
      status: 'warn',
      detail: `${dataWarnings} warning${dataWarnings !== 1 ? 's' : ''} — review recommended`,
    });
  } else {
    checks.push({
      id: 'data',
      label: 'Data validation',
      status: 'pass',
      detail: 'All course data looks good',
    });
  }

  // ── Check 6: Status distribution sanity check ─────────────────
  const byStatus = parseResult.summary.byStatus;
  const completed = byStatus['completed'] || 0;
  const inProgress = byStatus['in_progress'] || 0;
  const planned = byStatus['planned'] || 0;

  if (completed === 0 && inProgress === 0) {
    issues.push({
      type: 'data',
      severity: 'warning',
      message: 'No completed or in-progress courses found. Ensure grades are properly entered in your file.',
    });
    checks.push({
      id: 'status',
      label: 'Status distribution',
      status: 'warn',
      detail: 'No completed/in-progress courses detected',
    });
  } else {
    const parts: string[] = [];
    if (completed > 0) parts.push(`${completed} completed`);
    if (inProgress > 0) parts.push(`${inProgress} in progress`);
    if (planned > 0) parts.push(`${planned} planned`);
    checks.push({
      id: 'status',
      label: 'Status distribution',
      status: 'pass',
      detail: parts.join(', '),
    });
  }

  // ── Check 7: Duplicate detection ──────────────────────────────
  // The parser already deduplicates, but we can surface it via warnings
  if (parseResult.warnings.length > 0) {
    const duplicateWarnings = parseResult.warnings.filter(w => w.toLowerCase().includes('duplicate'));
    if (duplicateWarnings.length > 0) {
      for (const w of duplicateWarnings) {
        issues.push({ type: 'data', severity: 'warning', message: w });
      }
    }
    // Also surface any other parser warnings
    for (const w of parseResult.warnings) {
      if (!w.toLowerCase().includes('duplicate')) {
        issues.push({ type: 'data', severity: 'warning', message: w });
      }
    }
  }

  // ── Check 8: Submission-level validation ──────────────────────
  const submissionValidation = validateCoursesForSubmission(parseResult.courses);
  if (!submissionValidation.valid) {
    for (const err of submissionValidation.errors) {
      issues.push({ type: 'data', severity: 'error', message: err });
      dataErrors++;
    }
  }
  for (const warn of submissionValidation.warnings) {
    // Avoid duplicate warnings already surfaced
    if (!issues.some(i => i.message === warn)) {
      issues.push({ type: 'data', severity: 'warning', message: warn });
    }
  }

  // ── Overall verdict ───────────────────────────────────────────
  const hasErrors = issues.some(i => i.severity === 'error');
  const canProceed = !hasErrors;

  return { checks, issues, parseResult, canProceed };
}
