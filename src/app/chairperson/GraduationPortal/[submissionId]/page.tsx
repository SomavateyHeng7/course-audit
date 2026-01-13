'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Download,
  Clock,
  GraduationCap,
  BookOpen,
  Target,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GiGraduateCap } from 'react-icons/gi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';

// Types
interface CourseData {
  code: string;
  title: string;
  credits: number;
  category: string;
  status: 'completed' | 'in_progress' | 'planned' | 'pending' | 'failed';
  grade?: string;
  semester?: string;
}

interface CategoryProgress {
  name: string;
  requiredCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  courses: CourseData[];
}

interface ValidationIssue {
  type: 'missing_course' | 'failed_course' | 'prerequisite' | 'credit_shortage' | 'blacklist';
  severity: 'error' | 'warning';
  message: string;
  courseCode?: string;
}

interface SubmissionDetail {
  id: string;
  portalId: string;
  portalName: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: 'pending' | 'processing' | 'validated' | 'has_issues' | 'approved' | 'rejected';
  curriculum: {
    id: string;
    name: string;
    totalCreditsRequired: number;
  };
  progress: {
    totalCredits: number;
    earnedCredits: number;
    inProgressCredits: number;
    plannedCredits: number;
    completedCourses: number;
    totalCourses: number;
    gpa: number;
  };
  categories: CategoryProgress[];
  issues: ValidationIssue[];
  warnings: string[];
  canGraduate: boolean;
}

// Mock Data - Comprehensive submission with curriculum data
const MOCK_SUBMISSION_DETAILS: Record<string, SubmissionDetail> = {
  'sub-1': {
    id: 'sub-1',
    portalId: 'portal-1',
    portalName: 'BSCS Batch 65 Graduation Check',
    fileName: 'graduation_roadmap_student_001.xlsx',
    fileSize: 45678,
    submittedAt: '2025-01-05T10:30:00Z',
    status: 'validated',
    curriculum: {
      id: 'curr-bscs-2022',
      name: 'BSCS 2022',
      totalCreditsRequired: 140,
    },
    progress: {
      totalCredits: 140,
      earnedCredits: 126,
      inProgressCredits: 9,
      plannedCredits: 5,
      completedCourses: 42,
      totalCourses: 50,
      gpa: 3.45,
    },
    categories: [
      {
        name: 'General Education',
        requiredCredits: 30,
        completedCredits: 30,
        inProgressCredits: 0,
        plannedCredits: 0,
        courses: [
          { code: 'GE 101', title: 'English Communication', credits: 3, category: 'General Education', status: 'completed', grade: 'A' },
          { code: 'GE 102', title: 'Filipino Communication', credits: 3, category: 'General Education', status: 'completed', grade: 'A-' },
          { code: 'GE 103', title: 'Mathematics in Modern World', credits: 3, category: 'General Education', status: 'completed', grade: 'B+' },
          { code: 'GE 104', title: 'Science, Technology & Society', credits: 3, category: 'General Education', status: 'completed', grade: 'A' },
          { code: 'GE 105', title: 'Ethics', credits: 3, category: 'General Education', status: 'completed', grade: 'B' },
          { code: 'GE 106', title: 'Readings in Philippine History', credits: 3, category: 'General Education', status: 'completed', grade: 'B+' },
          { code: 'GE 107', title: 'The Contemporary World', credits: 3, category: 'General Education', status: 'completed', grade: 'A-' },
          { code: 'GE 108', title: 'Art Appreciation', credits: 3, category: 'General Education', status: 'completed', grade: 'A' },
          { code: 'GE 109', title: 'Understanding the Self', credits: 3, category: 'General Education', status: 'completed', grade: 'B+' },
          { code: 'GE 110', title: 'Purposive Communication', credits: 3, category: 'General Education', status: 'completed', grade: 'A-' },
        ],
      },
      {
        name: 'Core Courses',
        requiredCredits: 45,
        completedCredits: 42,
        inProgressCredits: 3,
        plannedCredits: 0,
        courses: [
          { code: 'CS 101', title: 'Introduction to Computing', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A' },
          { code: 'CS 102', title: 'Computer Programming 1', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A' },
          { code: 'CS 103', title: 'Computer Programming 2', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A-' },
          { code: 'CS 201', title: 'Data Structures', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 202', title: 'Algorithms', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 203', title: 'Database Systems', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A' },
          { code: 'CS 204', title: 'Operating Systems', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B' },
          { code: 'CS 205', title: 'Computer Networks', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 301', title: 'Software Engineering', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A-' },
          { code: 'CS 302', title: 'Web Development', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A' },
          { code: 'CS 303', title: 'Mobile Development', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 304', title: 'Information Security', credits: 3, category: 'Core Courses', status: 'completed', grade: 'A-' },
          { code: 'CS 401', title: 'Machine Learning', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 402', title: 'Artificial Intelligence', credits: 3, category: 'Core Courses', status: 'in_progress', semester: '2/2025' },
          { code: 'CS 499', title: 'Capstone Project', credits: 3, category: 'Core Courses', status: 'in_progress', semester: '2/2025' },
        ],
      },

      {
        name: 'Major Electives',
        requiredCredits: 15,
        completedCredits: 12,
        inProgressCredits: 3,
        plannedCredits: 0,
        courses: [
          { code: 'CSE 301', title: 'Cloud Computing', credits: 3, category: 'Major Electives', status: 'completed', grade: 'A' },
          { code: 'CSE 302', title: 'Data Science', credits: 3, category: 'Major Electives', status: 'completed', grade: 'A-' },
          { code: 'CSE 303', title: 'Computer Vision', credits: 3, category: 'Major Electives', status: 'completed', grade: 'B+' },
          { code: 'CSE 304', title: 'Natural Language Processing', credits: 3, category: 'Major Electives', status: 'completed', grade: 'B' },
          { code: 'CSE 305', title: 'Deep Learning', credits: 3, category: 'Major Electives', status: 'in_progress', semester: '2/2025' },
        ],
      },
      {
        name: 'Mathematics',
        requiredCredits: 18,
        completedCredits: 18,
        inProgressCredits: 0,
        plannedCredits: 0,
        courses: [
          { code: 'MATH 101', title: 'College Algebra', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B+' },
          { code: 'MATH 102', title: 'Trigonometry', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B' },
          { code: 'MATH 201', title: 'Calculus 1', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B+' },
          { code: 'MATH 202', title: 'Calculus 2', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B' },
          { code: 'MATH 301', title: 'Discrete Mathematics', credits: 3, category: 'Mathematics', status: 'completed', grade: 'A-' },
          { code: 'MATH 302', title: 'Linear Algebra', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B+' },
        ],
      },
      {
        name: 'Science',
        requiredCredits: 12,
        completedCredits: 12,
        inProgressCredits: 0,
        plannedCredits: 0,
        courses: [
          { code: 'PHYS 101', title: 'Physics 1', credits: 3, category: 'Science', status: 'completed', grade: 'B' },
          { code: 'PHYS 102', title: 'Physics 2', credits: 3, category: 'Science', status: 'completed', grade: 'B+' },
          { code: 'CHEM 101', title: 'General Chemistry', credits: 3, category: 'Science', status: 'completed', grade: 'B' },
          { code: 'BIO 101', title: 'General Biology', credits: 3, category: 'Science', status: 'completed', grade: 'B+' },
        ],
      },
      {
        name: 'Free Electives',
        requiredCredits: 20,
        completedCredits: 12,
        inProgressCredits: 3,
        plannedCredits: 5,
        courses: [
          { code: 'PE 101', title: 'Physical Education 1', credits: 2, category: 'Free Electives', status: 'completed', grade: 'A' },
          { code: 'PE 102', title: 'Physical Education 2', credits: 2, category: 'Free Electives', status: 'completed', grade: 'A' },
          { code: 'NSTP 101', title: 'NSTP 1', credits: 3, category: 'Free Electives', status: 'completed', grade: 'S' },
          { code: 'NSTP 102', title: 'NSTP 2', credits: 3, category: 'Free Electives', status: 'completed', grade: 'S' },
          { code: 'ENTR 101', title: 'Entrepreneurship', credits: 2, category: 'Free Electives', status: 'completed', grade: 'A-' },
          { code: 'OJT 401', title: 'On-the-Job Training', credits: 3, category: 'Free Electives', status: 'in_progress', semester: '2/2025' },
          { code: 'SEMINAR', title: 'Industry Seminar', credits: 2, category: 'Free Electives', status: 'planned', semester: '1/2026' },
          { code: 'REVIEW', title: 'Board Exam Review', credits: 3, category: 'Free Electives', status: 'planned', semester: '1/2026' },
        ],
      },
    ],
    issues: [],
    warnings: ['2 courses are still in progress', 'OJT completion pending'],
    canGraduate: true,
  },

  'sub-2': {
    id: 'sub-2',
    portalId: 'portal-1',
    portalName: 'BSCS Batch 65 Graduation Check',
    fileName: 'my_courses_final.xlsx',
    fileSize: 52340,
    submittedAt: '2025-01-06T14:15:00Z',
    status: 'has_issues',
    curriculum: {
      id: 'curr-bscs-2022',
      name: 'BSCS 2022',
      totalCreditsRequired: 140,
    },
    progress: {
      totalCredits: 140,
      earnedCredits: 98,
      inProgressCredits: 12,
      plannedCredits: 18,
      completedCourses: 32,
      totalCourses: 50,
      gpa: 2.85,
    },
    categories: [
      {
        name: 'General Education',
        requiredCredits: 30,
        completedCredits: 27,
        inProgressCredits: 3,
        plannedCredits: 0,
        courses: [
          { code: 'GE 101', title: 'English Communication', credits: 3, category: 'General Education', status: 'completed', grade: 'B' },
          { code: 'GE 102', title: 'Filipino Communication', credits: 3, category: 'General Education', status: 'completed', grade: 'B-' },
          { code: 'GE 103', title: 'Mathematics in Modern World', credits: 3, category: 'General Education', status: 'completed', grade: 'C+' },
          { code: 'GE 104', title: 'Science, Technology & Society', credits: 3, category: 'General Education', status: 'completed', grade: 'B' },
          { code: 'GE 105', title: 'Ethics', credits: 3, category: 'General Education', status: 'completed', grade: 'B+' },
          { code: 'GE 106', title: 'Readings in Philippine History', credits: 3, category: 'General Education', status: 'completed', grade: 'B' },
          { code: 'GE 107', title: 'The Contemporary World', credits: 3, category: 'General Education', status: 'completed', grade: 'B-' },
          { code: 'GE 108', title: 'Art Appreciation', credits: 3, category: 'General Education', status: 'completed', grade: 'A-' },
          { code: 'GE 109', title: 'Understanding the Self', credits: 3, category: 'General Education', status: 'completed', grade: 'B' },
          { code: 'GE 110', title: 'Purposive Communication', credits: 3, category: 'General Education', status: 'in_progress', semester: '2/2025' },
        ],
      },
      {
        name: 'Core Courses',
        requiredCredits: 45,
        completedCredits: 30,
        inProgressCredits: 6,
        plannedCredits: 9,
        courses: [
          { code: 'CS 101', title: 'Introduction to Computing', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 102', title: 'Computer Programming 1', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B' },
          { code: 'CS 103', title: 'Computer Programming 2', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B-' },
          { code: 'CS 201', title: 'Data Structures', credits: 3, category: 'Core Courses', status: 'completed', grade: 'C+' },
          { code: 'CS 202', title: 'Algorithms', credits: 3, category: 'Core Courses', status: 'completed', grade: 'C' },
          { code: 'CS 203', title: 'Database Systems', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B' },
          { code: 'CS 204', title: 'Operating Systems', credits: 3, category: 'Core Courses', status: 'completed', grade: 'C+' },
          { code: 'CS 205', title: 'Computer Networks', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B-' },
          { code: 'CS 301', title: 'Software Engineering', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B' },
          { code: 'CS 302', title: 'Web Development', credits: 3, category: 'Core Courses', status: 'completed', grade: 'B+' },
          { code: 'CS 303', title: 'Mobile Development', credits: 3, category: 'Core Courses', status: 'in_progress', semester: '2/2025' },
          { code: 'CS 304', title: 'Information Security', credits: 3, category: 'Core Courses', status: 'in_progress', semester: '2/2025' },
          { code: 'CS 401', title: 'Machine Learning', credits: 3, category: 'Core Courses', status: 'planned', semester: '1/2026' },
          { code: 'CS 402', title: 'Artificial Intelligence', credits: 3, category: 'Core Courses', status: 'planned', semester: '1/2026' },
          { code: 'CS 499', title: 'Capstone Project', credits: 3, category: 'Core Courses', status: 'planned', semester: '2/2026' },
        ],
      },
      {
        name: 'Major Electives',
        requiredCredits: 15,
        completedCredits: 6,
        inProgressCredits: 3,
        plannedCredits: 6,
        courses: [
          { code: 'CSE 301', title: 'Cloud Computing', credits: 3, category: 'Major Electives', status: 'completed', grade: 'B' },
          { code: 'CSE 302', title: 'Data Science', credits: 3, category: 'Major Electives', status: 'completed', grade: 'B-' },
          { code: 'CSE 303', title: 'Computer Vision', credits: 3, category: 'Major Electives', status: 'in_progress', semester: '2/2025' },
          { code: 'CSE 304', title: 'Natural Language Processing', credits: 3, category: 'Major Electives', status: 'planned', semester: '1/2026' },
          { code: 'CSE 305', title: 'Deep Learning', credits: 3, category: 'Major Electives', status: 'planned', semester: '1/2026' },
        ],
      },

      {
        name: 'Mathematics',
        requiredCredits: 18,
        completedCredits: 15,
        inProgressCredits: 0,
        plannedCredits: 3,
        courses: [
          { code: 'MATH 101', title: 'College Algebra', credits: 3, category: 'Mathematics', status: 'completed', grade: 'C+' },
          { code: 'MATH 102', title: 'Trigonometry', credits: 3, category: 'Mathematics', status: 'completed', grade: 'C' },
          { code: 'MATH 201', title: 'Calculus 1', credits: 3, category: 'Mathematics', status: 'failed', grade: 'F' },
          { code: 'MATH 201', title: 'Calculus 1 (Retake)', credits: 3, category: 'Mathematics', status: 'completed', grade: 'C+' },
          { code: 'MATH 202', title: 'Calculus 2', credits: 3, category: 'Mathematics', status: 'completed', grade: 'C' },
          { code: 'MATH 301', title: 'Discrete Mathematics', credits: 3, category: 'Mathematics', status: 'completed', grade: 'B-' },
          { code: 'MATH 302', title: 'Linear Algebra', credits: 3, category: 'Mathematics', status: 'planned', semester: '1/2026' },
        ],
      },
      {
        name: 'Science',
        requiredCredits: 12,
        completedCredits: 9,
        inProgressCredits: 0,
        plannedCredits: 0,
        courses: [
          { code: 'PHYS 101', title: 'Physics 1', credits: 3, category: 'Science', status: 'completed', grade: 'C+' },
          { code: 'PHYS 102', title: 'Physics 2', credits: 3, category: 'Science', status: 'completed', grade: 'C' },
          { code: 'CHEM 101', title: 'General Chemistry', credits: 3, category: 'Science', status: 'completed', grade: 'C+' },
          { code: 'BIO 101', title: 'General Biology', credits: 3, category: 'Science', status: 'pending' },
        ],
      },
      {
        name: 'Free Electives',
        requiredCredits: 20,
        completedCredits: 11,
        inProgressCredits: 0,
        plannedCredits: 0,
        courses: [
          { code: 'PE 101', title: 'Physical Education 1', credits: 2, category: 'Free Electives', status: 'completed', grade: 'A' },
          { code: 'PE 102', title: 'Physical Education 2', credits: 2, category: 'Free Electives', status: 'completed', grade: 'A' },
          { code: 'NSTP 101', title: 'NSTP 1', credits: 3, category: 'Free Electives', status: 'completed', grade: 'S' },
          { code: 'NSTP 102', title: 'NSTP 2', credits: 3, category: 'Free Electives', status: 'completed', grade: 'S' },
          { code: 'ENTR 101', title: 'Entrepreneurship', credits: 1, category: 'Free Electives', status: 'completed', grade: 'B' },
          { code: 'OJT 401', title: 'On-the-Job Training', credits: 3, category: 'Free Electives', status: 'pending' },
          { code: 'SEMINAR', title: 'Industry Seminar', credits: 2, category: 'Free Electives', status: 'pending' },
          { code: 'REVIEW', title: 'Board Exam Review', credits: 3, category: 'Free Electives', status: 'pending' },
        ],
      },
    ],
    issues: [
      { type: 'credit_shortage', severity: 'error', message: 'Missing 12 credits to meet graduation requirement (128/140)' },
      { type: 'missing_course', severity: 'error', message: 'Required science course BIO 101 not completed', courseCode: 'BIO 101' },
      { type: 'failed_course', severity: 'warning', message: 'Course MATH 201 was previously failed (now retaken)', courseCode: 'MATH 201' },
      { type: 'missing_course', severity: 'error', message: 'Required course MATH 302 (Linear Algebra) not completed', courseCode: 'MATH 302' },
    ],
    warnings: [
      'GPA is below 3.0 - may affect honors eligibility',
      'Multiple courses still pending completion',
      'Consider retaking courses with C grades to improve GPA',
    ],
    canGraduate: false,
  },
};

// Helper functions
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'planned': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'planned': return 'Planned';
    case 'pending': return 'Pending';
    case 'failed': return 'Failed';
    default: return status;
  }
};

// Donut Chart Component
const DonutChart = ({ 
  completed, 
  inProgress,
  planned,
  total, 
  size = 100, 
  strokeWidth = 10 
}: { 
  completed: number; 
  inProgress?: number;
  planned?: number;
  total: number; 
  size?: number; 
  strokeWidth?: number;
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPercent = total > 0 ? ((inProgress || 0) / total) * 100 : 0;
  const plannedPercent = total > 0 ? ((planned || 0) / total) * 100 : 0;
  
  const completedOffset = circumference - (completedPercent / 100) * circumference;
  const inProgressOffset = circumference - ((completedPercent + inProgressPercent) / 100) * circumference;
  const plannedOffset = circumference - ((completedPercent + inProgressPercent + plannedPercent) / 100) * circumference;
  
  // Scale text size based on chart size
  const percentTextSize = size <= 60 ? 'text-[11px]' : size <= 80 ? 'text-xs' : 'text-sm';
  const fractionTextSize = size <= 60 ? 'text-[8px]' : size <= 80 ? 'text-[9px]' : 'text-[10px]';
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth - 2}
          className="dark:stroke-gray-700"
        />
        {/* Planned */}
        {plannedPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#818cf8"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={plannedOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        {/* In Progress */}
        {inProgressPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={inProgressOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        {/* Completed */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={completedOffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`${percentTextSize} font-bold leading-none`}>{Math.round(completedPercent + inProgressPercent + plannedPercent)}%</span>
        <span className={`${fractionTextSize} text-muted-foreground leading-none`}>{completed + (inProgress || 0) + (planned || 0)}/{total}</span>
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, isExpanded, onToggle }: { 
  category: CategoryProgress; 
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const totalProgress = category.completedCredits + category.inProgressCredits + category.plannedCredits;
  const progressPercent = category.requiredCredits > 0 
    ? Math.min(100, (totalProgress / category.requiredCredits) * 100) 
    : 0;
  const isComplete = category.completedCredits >= category.requiredCredits;

  return (
    <Card className="overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DonutChart
              completed={category.completedCredits}
              inProgress={category.inProgressCredits}
              planned={category.plannedCredits}
              total={category.requiredCredits}
              size={60}
              strokeWidth={6}
            />
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {category.name}
                {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category.completedCredits}/{category.requiredCredits} credits completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm hidden sm:block">
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {category.completedCredits} completed
              </div>
              {category.inProgressCredits > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {category.inProgressCredits} in progress
                </div>
              )}
              {category.plannedCredits > 0 && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {category.plannedCredits} planned
                </div>
              )}
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-muted/20">
          <div className="space-y-2">
            {category.courses.map((course, idx) => (
              <div 
                key={`${course.code}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(course.status)} variant="outline">
                    {course.code}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.credits} credits</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {course.grade && (
                    <span className={`text-sm font-medium ${
                      course.grade === 'F' ? 'text-red-500' : 
                      course.grade.startsWith('A') ? 'text-green-600' : 
                      course.grade.startsWith('B') ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {course.grade}
                    </span>
                  )}
                  {course.semester && (
                    <span className="text-xs text-muted-foreground">{course.semester}</span>
                  )}
                  <Badge className={getStatusColor(course.status)}>
                    {getStatusLabel(course.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Main Page Component
const SubmissionDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;
  
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSubmission = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = MOCK_SUBMISSION_DETAILS[submissionId];
      if (data) {
        setSubmission(data);
        // Auto-expand categories with issues
        const categoriesWithIssues = new Set<string>();
        data.categories.forEach(cat => {
          if (cat.courses.some(c => c.status === 'failed' || c.status === 'pending')) {
            categoriesWithIssues.add(cat.name);
          }
        });
        setExpandedCategories(categoriesWithIssues);
      }
      setLoading(false);
    };
    loadSubmission();
  }, [submissionId]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (submission) {
      setExpandedCategories(new Set(submission.categories.map(c => c.name)));
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-5xl text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested submission could not be found.</p>
          <Button onClick={() => router.push('/chairperson/GraduationPortal')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
        </div>
      </div>
    );
  }

  const { progress, curriculum } = submission;
  const completedPercent = Math.round((progress.earnedCredits / curriculum.totalCreditsRequired) * 100);
  const projectedPercent = Math.round(((progress.earnedCredits + progress.inProgressCredits + progress.plannedCredits) / curriculum.totalCreditsRequired) * 100);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/chairperson/GraduationPortal')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FileSpreadsheet className="w-7 h-7 text-primary" />
                Submission Review
              </h1>
              <p className="text-muted-foreground mt-1">
                {submission.portalName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
              {submission.canGraduate ? (
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Graduation
                </Button>
              ) : (
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* File Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">{submission.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(submission.fileSize)} • Submitted {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{curriculum.name}</Badge>
                <Badge className={submission.canGraduate 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }>
                  {submission.canGraduate ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Can Graduate</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Cannot Graduate</>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <DonutChart
                completed={progress.earnedCredits}
                inProgress={progress.inProgressCredits}
                planned={progress.plannedCredits}
                total={curriculum.totalCreditsRequired}
                size={80}
                strokeWidth={8}
              />
              <p className="text-xs text-muted-foreground mt-2">Total Credits</p>
              <p className="text-sm font-medium">{progress.earnedCredits + progress.inProgressCredits + progress.plannedCredits}/{curriculum.totalCreditsRequired}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-emerald-600">{progress.earnedCredits}</span>
              </div>
              <p className="text-xs text-muted-foreground">Earned Credits</p>
              <p className="text-sm font-medium text-emerald-600">{completedPercent}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-amber-600">{progress.inProgressCredits}</span>
              </div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-sm font-medium text-amber-600">Currently Taking</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-indigo-600">{progress.plannedCredits}</span>
              </div>
              <p className="text-xs text-muted-foreground">Planned</p>
              <p className="text-sm font-medium text-indigo-600">Future Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-blue-600">{progress.gpa.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">GPA</p>
              <p className="text-sm font-medium text-blue-600">
                {progress.gpa >= 3.5 ? 'Excellent' : progress.gpa >= 3.0 ? 'Good' : progress.gpa >= 2.5 ? 'Fair' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center relative h-20 mb-4 bg-gradient-to-r from-slate-50 via-emerald-50 to-emerald-100 dark:from-slate-900/40 dark:via-teal-900/20 dark:to-emerald-900/30 rounded-lg px-6 border border-emerald-100/60 dark:border-emerald-900/40">
              <div className="flex-1 relative h-4 bg-slate-200 dark:bg-slate-800/70 rounded-full overflow-hidden">
                {/* Completed */}
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700 rounded-l-full"
                  style={{ width: `${completedPercent}%` }}
                />
                {/* In Progress */}
                {progress.inProgressCredits > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                    style={{ 
                      left: `${completedPercent}%`, 
                      width: `${Math.round((progress.inProgressCredits / curriculum.totalCreditsRequired) * 100)}%` 
                    }}
                  />
                )}
                {/* Planned */}
                {progress.plannedCredits > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 transition-all duration-700"
                    style={{ 
                      left: `${completedPercent + Math.round((progress.inProgressCredits / curriculum.totalCreditsRequired) * 100)}%`, 
                      width: `${Math.round((progress.plannedCredits / curriculum.totalCreditsRequired) * 100)}%` 
                    }}
                  />
                )}
              </div>
              <div className="flex items-center ml-4 text-emerald-800 dark:text-emerald-200">
                <GiGraduateCap className="mr-2 text-emerald-700 dark:text-emerald-300" size={24} />
                <span className="font-semibold">Graduate!</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                <span>Completed: {progress.earnedCredits} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
                <span>In Progress: {progress.inProgressCredits} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"></div>
                <span>Planned: {progress.plannedCredits} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <span>Remaining: {Math.max(0, curriculum.totalCreditsRequired - progress.earnedCredits - progress.inProgressCredits - progress.plannedCredits)} credits</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues Section */}
        {submission.issues.length > 0 && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Issues Found ({submission.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submission.issues.map((issue, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg flex items-start gap-3 ${
                      issue.severity === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{issue.message}</p>
                      {issue.courseCode && (
                        <Badge variant="outline" className="mt-1">{issue.courseCode}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warnings Section */}
        {submission.warnings.length > 0 && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                Warnings & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {submission.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Progress by Category
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {submission.categories.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                isExpanded={expandedCategories.has(category.name)}
                onToggle={() => toggleCategory(category.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
