'use client';

import * as XLSX from 'xlsx';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { FreeElectiveCourse } from '@/components/role-specific/student/FreeElectiveManager';
import type { CourseStatus } from './types';

interface CurriculumCourse {
  code: string;
  title: string;
  credits: number;
}

interface ExportDataMenuProps {
  selectedCurriculum: string;
  courseTypeOrder: string[];
  curriculumCourses: Record<string, Record<string, CurriculumCourse[]>>;
  completedCourses: Record<string, CourseStatus>;
  assignedFreeElectives: FreeElectiveCourse[];
  freeElectives: { code: string; title: string; credits: number }[];
  warning: (message: string) => void;
}

type GraduationExportRow = {
  Title: string;
  Code: string;
  Credits: number;
  Category: string;
  Grade: string;
  Status: string;
  RawStatus: CourseStatus['status'] | 'pending';
  Semester: string;
};

const normalizeExportStatus = (status?: CourseStatus['status'] | 'pending') => {
  if (!status) return 'pending';
  if (status === 'not_completed') return 'pending';
  return status;
};

const getExportStatusLabel = (status?: CourseStatus['status'] | 'pending') => {
  const normalized = normalizeExportStatus(status);
  switch (normalized) {
    case 'completed':
      return 'Completed';
    case 'planning':
      return 'Planned';
    case 'failed':
      return 'Failed';
    case 'withdrawn':
      return 'Withdrawn';
    case 'in_progress':
      return 'Currently Taking';
    default:
      return 'Pending';
  }
};

const shouldHighlightRow = (status?: CourseStatus['status'] | 'pending') => {
  const normalized = normalizeExportStatus(status);
  return normalized !== 'pending';
};

const calculateActiveCredits = (courses: GraduationExportRow[]) => {
  return courses.reduce((sum, course) => {
    if (normalizeExportStatus(course.RawStatus) === 'pending') return sum;
    return sum + (course.Credits || 0);
  }, 0);
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const stringValue = value === null || typeof value === 'undefined' ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const formatSemesterForCsvValue = (value?: string) => {
  if (!value) return '';
  return `="${value}"`;
};

const formatCsvRow = (values: Array<string | number | null | undefined>) => {
  return values.map(escapeCsvValue).join(',');
};

export default function ExportDataMenu({
  selectedCurriculum,
  courseTypeOrder,
  curriculumCourses,
  completedCourses,
  assignedFreeElectives,
  freeElectives,
  warning,
}: ExportDataMenuProps) {
  const buildGraduationExportRows = (): GraduationExportRow[] => {
    const rows: GraduationExportRow[] = [];
    const seenCodes = new Set<string>();

    const pushRow = (row: GraduationExportRow) => {
      const trimmedCode = (row.Code || '').trim();
      const safeRow = { ...row, Code: trimmedCode };
      rows.push(safeRow);
      if (trimmedCode) {
        seenCodes.add(trimmedCode);
      }
    };

    courseTypeOrder.forEach(category => {
      const categoryCourses = curriculumCourses[selectedCurriculum]?.[category] || [];
      categoryCourses.forEach(course => {
        const courseState = completedCourses[course.code];
        const normalizedStatus = normalizeExportStatus(courseState?.status || 'pending');
        pushRow({
          Title: course.title,
          Code: course.code,
          Credits: course.credits,
          Category: category,
          Grade: courseState?.grade || '',
          Status: getExportStatusLabel(normalizedStatus),
          RawStatus: normalizedStatus,
          Semester: courseState?.plannedSemester || '',
        });
      });
    });

    const addFreeElectiveRow = (code?: string, title?: string, credits?: number) => {
      const normalizedCode = (code || '').trim();
      if (!normalizedCode || seenCodes.has(normalizedCode)) {
        return;
      }
      const normalizedCredits = typeof credits === 'number' ? credits : Number(credits) || 0;
      const courseState = completedCourses[normalizedCode];
      const normalizedStatus = normalizeExportStatus(courseState?.status || 'pending');
      pushRow({
        Title: title || normalizedCode,
        Code: normalizedCode,
        Credits: normalizedCredits,
        Category: 'Free Elective',
        Grade: courseState?.grade || '',
        Status: getExportStatusLabel(normalizedStatus),
        RawStatus: normalizedStatus,
        Semester: courseState?.plannedSemester || '',
      });
    };

    assignedFreeElectives.forEach(course => {
      addFreeElectiveRow(course.courseCode, course.courseName, course.credits);
    });

    freeElectives.forEach(course => {
      addFreeElectiveRow(course.code, course.title, course.credits);
    });

    Object.entries(completedCourses).forEach(([code, courseState]) => {
      const normalizedCode = (code || '').trim();
      if (!normalizedCode || seenCodes.has(normalizedCode)) {
        return;
      }
      const normalizedStatus = normalizeExportStatus(courseState?.status || 'pending');
      pushRow({
        Title: normalizedCode,
        Code: normalizedCode,
        Credits: 0,
        Category: 'Unassigned',
        Grade: courseState?.grade || '',
        Status: getExportStatusLabel(normalizedStatus),
        RawStatus: normalizedStatus,
        Semester: courseState?.plannedSemester || '',
      });
    });

    return rows;
  };

  const exportToExcel = () => {
    const graduationRows = buildGraduationExportRows();
    if (graduationRows.length === 0) {
      warning('No course data available to export yet.');
      return;
    }

    const worksheetData: any[][] = [];
    const highlightRowIndices: number[] = [];

    worksheetData.push(['course data']);
    worksheetData.push([]);

    const groupedCourses: Record<string, GraduationExportRow[]> = {};
    graduationRows.forEach(course => {
      const categoryKey = course.Category || 'Uncategorized';
      if (!groupedCourses[categoryKey]) {
        groupedCourses[categoryKey] = [];
      }
      groupedCourses[categoryKey].push(course);
    });

    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      const activeCredits = calculateActiveCredits(courses);
      worksheetData.push([`${category} (${totalCredits} Credits)`]);
      worksheetData.push([`Active Credits: ${activeCredits}`]);

      courses.forEach(course => {
        worksheetData.push([
          course.Title,
          course.Code,
          course.Credits,
          course.Grade,
          course.Status,
          course.Semester || '',
        ]);
        if (shouldHighlightRow(course.RawStatus)) {
          highlightRowIndices.push(worksheetData.length);
        }
      });

      worksheetData.push([]);
    });

    const totalActiveCredits = calculateActiveCredits(graduationRows);
    worksheetData.push([`Overall Active Credits: ${totalActiveCredits}`]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();

    if (highlightRowIndices.length > 0) {
      const highlightStyle = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FFF6DB' },
        },
      };
      const columnCount = 6;
      highlightRowIndices.forEach(rowIndex => {
        for (let colIdx = 0; colIdx < columnCount; colIdx++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIdx });
          const cell = ws[cellAddress];
          if (cell) {
            (cell as any).s = highlightStyle;
          }
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Course Data');
    XLSX.writeFile(wb, 'course data.xlsx');
  };

  const exportToCSV = () => {
    const graduationRows = buildGraduationExportRows();
    if (graduationRows.length === 0) {
      warning('No course data available to export yet.');
      return;
    }

    const csvLines: string[] = [];
    csvLines.push('course data');
    csvLines.push('');

    const groupedCourses: Record<string, GraduationExportRow[]> = {};
    graduationRows.forEach(course => {
      const categoryKey = course.Category || 'Uncategorized';
      if (!groupedCourses[categoryKey]) {
        groupedCourses[categoryKey] = [];
      }
      groupedCourses[categoryKey].push(course);
    });

    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      const activeCredits = calculateActiveCredits(courses);
      csvLines.push(formatCsvRow([`${category} (${totalCredits} Credits)`]));
      csvLines.push(formatCsvRow(['Active Credits', activeCredits]));

      courses.forEach(course => {
        csvLines.push(formatCsvRow([
          course.Title,
          course.Code,
          course.Credits,
          course.Grade,
          course.Status,
          formatSemesterForCsvValue(course.Semester || ''),
        ]));
      });

      csvLines.push('');
    });

    const totalActiveCredits = calculateActiveCredits(graduationRows);
    csvLines.push(formatCsvRow(['Overall Active Credits', totalActiveCredits]));

    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'course data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className="bg-purple-600 hover:bg-purple-600/90 text-white min-w-[180px] shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Export Data
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Download as XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Download as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
