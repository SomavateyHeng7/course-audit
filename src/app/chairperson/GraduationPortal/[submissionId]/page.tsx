'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Clock,
  GraduationCap,
  BookOpen,
  Target,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Calendar,
  Hash,
  Percent,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { useToastHelpers } from '@/hooks/useToast';

// Simple Donut Chart Component for Credit Progress
const DonutChart = ({ 
  completed, 
  inProgress,
  planned, 
  total, 
  size = 180 
}: { 
  completed: number; 
  inProgress?: number;
  planned?: number; 
  total: number; 
  size?: number; 
}) => {
  const center = size / 2;
  const radius = center - 15;
  const circumference = 2 * Math.PI * radius;
  
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPercent = total > 0 ? ((inProgress || 0) / total) * 100 : 0;
  const plannedPercent = total > 0 ? ((planned || 0) / total) * 100 : 0;
  
  const completedOffset = circumference - (completedPercent / 100) * circumference;
  const inProgressOffset = circumference - ((completedPercent + inProgressPercent) / 100) * circumference;
  const plannedOffset = circumference - ((completedPercent + inProgressPercent + plannedPercent) / 100) * circumference;

  const displayPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="15"
          fill="transparent"
        />
        
        {/* Completed segment */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#22c55e"
          strokeWidth="15"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={completedOffset}
          strokeLinecap="round"
        />
        
        {/* In Progress segment */}
        {inProgress && inProgress > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#3b82f6"
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={inProgressOffset}
            strokeLinecap="round"
          />
        )}
        
        {/* Planned segment */}
        {planned && planned > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#a855f7"
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={plannedOffset}
            strokeLinecap="round"
          />
        )}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{displayPercent}%</span>
        <span className="text-sm text-muted-foreground">Complete</span>
      </div>
    </div>
  );
};

import {
  getCacheSubmission,
  validateCacheSubmission,
  approveCacheSubmission,
  rejectCacheSubmission,
  GRACE_PERIOD_DAYS,
  type CacheSubmission,
  type ValidationResult,
  type SubmissionCourse
} from '@/lib/api/laravel';

// Types for display
interface CategoryProgress {
  name: string;
  totalCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  failedCredits: number;
  courses: SubmissionCourse[];
}

// GPA Mapping (standard 4.0 scale)
const GRADE_GPA_MAP: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

/** Calculate GPA from submission courses */
const calculateGPA = (courses: SubmissionCourse[]): { gpa: number; gradedCredits: number } => {
  let totalPoints = 0;
  let gradedCredits = 0;
  for (const course of courses) {
    if (course.grade && course.status === 'completed') {
      const gradeUpper = course.grade.toUpperCase().trim();
      if (GRADE_GPA_MAP[gradeUpper] !== undefined) {
        totalPoints += GRADE_GPA_MAP[gradeUpper] * course.credits;
        gradedCredits += course.credits;
      }
    }
  }
  return {
    gpa: gradedCredits > 0 ? totalPoints / gradedCredits : 0,
    gradedCredits
  };
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

const getTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const remaining = Math.max(0, expires - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { minutes, seconds, expired: remaining <= 0 };
};

const getStatusColor = (status: CacheSubmission['status']) => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'validated': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'has_issues': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: CacheSubmission['status']) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />;
    case 'validated': return <CheckCircle className="w-4 h-4" />;
    case 'has_issues': return <AlertTriangle className="w-4 h-4" />;
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <XCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getStatusLabel = (status: CacheSubmission['status']) => {
  switch (status) {
    case 'pending': return 'Pending Review';
    case 'processing': return 'Processing';
    case 'validated': return 'Can Graduate';
    case 'has_issues': return 'Has Issues';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
  }
};

const getCourseStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'planned': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Progress bar component
const ProgressBar = ({ 
  value, 
  max, 
  color = 'bg-primary',
  showLabel = true
}: { 
  value: number; 
  max: number; 
  color?: string;
  showLabel?: boolean;
}) => {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        {showLabel && <span>{value} / {max} credits</span>}
        <span className="font-medium">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// Segmented progress bar (matching the progress page style)
const SegmentedProgressBar = ({
  completed,
  inProgress,
  planned,
  total,
}: {
  completed: number;
  inProgress: number;
  planned: number;
  total: number;
}) => {
  const completedPct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.min(100 - completedPct, (inProgress / total) * 100) : 0;
  const plannedPct = total > 0 ? Math.min(100 - completedPct - inProgressPct, (planned / total) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{completed + inProgress + planned} / {total} credits</span>
        <span className="font-medium">{Math.round(completedPct + inProgressPct + plannedPct)}% projected</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden flex">
        {completedPct > 0 && (
          <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500" style={{ width: `${completedPct}%` }} />
        )}
        {inProgressPct > 0 && (
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500" style={{ width: `${inProgressPct}%` }} />
        )}
        {plannedPct > 0 && (
          <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500" style={{ width: `${plannedPct}%` }} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed ({completed})</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress ({inProgress})</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Planned ({planned})</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted"></span> Remaining ({Math.max(0, total - completed - inProgress - planned)})</span>
      </div>
    </div>
  );
};

// Expiry Timer Component
const ExpiryTimer = ({ expiresAt, large = false }: { expiresAt: string; large?: boolean }) => {
  const [time, setTime] = useState(getTimeRemaining(expiresAt));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  if (time.expired) {
    return <Badge variant="destructive" className={large ? 'text-base px-4 py-1' : 'text-xs'}>Expired</Badge>;
  }
  
  const isUrgent = time.minutes < 5;
  
  return (
    <Badge 
      variant="outline" 
      className={`${large ? 'text-base px-4 py-1' : 'text-xs'} ${isUrgent ? 'border-red-500 text-red-500 animate-pulse' : ''}`}
    >
      <Clock className={`${large ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
      {time.minutes}:{time.seconds.toString().padStart(2, '0')} remaining
    </Badge>
  );
};

// Category Card Component
const CategoryCard = ({ 
  category, 
  expanded, 
  onToggle 
}: { 
  category: CategoryProgress; 
  expanded: boolean;
  onToggle: () => void;
}) => {
  const completionPercent = category.totalCredits > 0 
    ? Math.round((category.completedCredits / category.totalCredits) * 100) 
    : 0;
  const isComplete = category.completedCredits >= category.totalCredits;
  
  return (
    <Card className="overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
              {isComplete ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.courses.length} courses • {category.completedCredits}/{category.totalCredits} credits
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className={`text-lg font-bold ${isComplete ? 'text-green-600' : ''}`}>
                {completionPercent}%
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <ProgressBar 
            value={category.completedCredits} 
            max={category.totalCredits}
            color={isComplete ? 'bg-green-500' : 'bg-primary'}
            showLabel={false}
          />
        </div>
      </div>
      
      {expanded && (
        <div className="border-t">
          <div className="p-4 bg-muted/20">
            <div className="grid gap-2">
              {category.courses.map((course, index) => (
                <div 
                  key={`${course.code}-${index}`}
                  className="flex items-center justify-between p-2 bg-background rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {course.code}
                    </Badge>
                    <span className="text-sm">{course.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{course.credits} cr</span>
                    <Badge className={getCourseStatusColor(course.status)}>
                      {course.status === 'in_progress' ? 'In Progress' : 
                       course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                    {course.grade && (
                      <Badge variant="outline" className="font-medium">{course.grade}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Main Component
const SubmissionDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const submissionId = params.submissionId as string;
  const portalId = searchParams.get('portalId');
  
  // Toast notifications
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<CacheSubmission | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialog, setApproveDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    if (submissionId && portalId) {
      loadSubmission();
    } else {
      setError('Missing submission or portal ID');
      setLoading(false);
    }
  }, [submissionId, portalId]);

  const loadSubmission = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCacheSubmission(portalId!, submissionId);
      setSubmission(response.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!portalId) return;
    setIsValidating(true);
    
    try {
      const response = await validateCacheSubmission(portalId, submissionId);
      const canGraduate = response.validation.can_graduate;
      setSubmission(prev => prev ? {
        ...prev,
        status: canGraduate ? 'validated' : 'has_issues',
        validationResult: response.validation
      } : null);
      showSuccess(
        canGraduate ? 'Student meets all graduation requirements!' : 'Validation complete - some issues found',
        canGraduate ? 'Can Graduate' : 'Issues Found'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Validation failed', 'Error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApprove = async () => {
    if (!portalId) return;
    setIsProcessing(true);
    
    try {
      await approveCacheSubmission(portalId, submissionId, approvalNotes || undefined);
      setSubmission(prev => prev ? { ...prev, status: 'approved' } : null);
      setApproveDialog(false);
      setApprovalNotes('');
      showSuccess('Graduation submission has been approved', 'Approved');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Approval failed', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!portalId || !rejectReason.trim()) return;
    setIsProcessing(true);
    
    try {
      await rejectCacheSubmission(portalId, submissionId, rejectReason);
      setSubmission(prev => prev ? { ...prev, status: 'rejected' } : null);
      setRejectDialog(false);
      setRejectReason('');
      showSuccess('Graduation submission has been rejected', 'Rejected');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Rejection failed', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (submission) {
      const categories = groupCoursesByCategory(submission.courses || []);
      setExpandedCategories(new Set(categories.map(c => c.name)));
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Group courses by category
  const groupCoursesByCategory = (courses: SubmissionCourse[]): CategoryProgress[] => {
    const categoryMap = new Map<string, CategoryProgress>();
    
    courses.forEach(course => {
      const category = course.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          totalCredits: 0,
          completedCredits: 0,
          inProgressCredits: 0,
          plannedCredits: 0,
          failedCredits: 0,
          courses: []
        });
      }
      
      const cat = categoryMap.get(category)!;
      cat.courses.push(course);
      cat.totalCredits += course.credits;
      
      switch (course.status) {
        case 'completed':
          cat.completedCredits += course.credits;
          break;
        case 'in_progress':
          cat.inProgressCredits += course.credits;
          break;
        case 'planned':
          cat.plannedCredits += course.credits;
          break;
        case 'failed':
          cat.failedCredits += course.credits;
          break;
      }
    });
    
    return Array.from(categoryMap.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-semibold">Failed to load submission</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {error || 'Submission not found'}
        </p>
        {!portalId && (
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The portal ID is missing from the URL. Please navigate to this submission through the Graduation Portal page.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/chairperson/GraduationPortal')}>
            <GraduationCap className="w-4 h-4 mr-2" />
            Go to Graduation Portal
          </Button>
        </div>
      </div>
    );
  }

  const categories = groupCoursesByCategory(submission.courses || []);
  const validation = submission.validation_result;
  
  // Calculate totals
  const allCourses = submission.courses || [];
  const totalCredits = categories.reduce((sum, c) => sum + c.totalCredits, 0);
  const completedCredits = categories.reduce((sum, c) => sum + c.completedCredits, 0);
  const inProgressCredits = categories.reduce((sum, c) => sum + c.inProgressCredits, 0);
  const plannedCredits = categories.reduce((sum, c) => sum + c.plannedCredits, 0);
  const failedCredits = categories.reduce((sum, c) => sum + c.failedCredits, 0);
  const totalCourses = allCourses.length;
  const completedCourses = allCourses.filter(c => c.status === 'completed').length;
  const inProgressCourses = allCourses.filter(c => c.status === 'in_progress').length;
  const plannedCoursesList = allCourses.filter(c => c.status === 'planned');
  const failedCoursesList = allCourses.filter(c => c.status === 'failed');
  const withdrawnCoursesList = allCourses.filter(c => c.status === 'withdrawn');

  // Calculate GPA
  const { gpa, gradedCredits } = calculateGPA(allCourses);
  
  // Requirements from validation result (if available)
  const requiredCredits = validation?.summary?.totalCreditsRequired || 0;
  const remainingCredits = Math.max(0, requiredCredits - completedCredits - inProgressCredits);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-primary" />
                Submission Review
              </h1>
              <p className="text-muted-foreground mt-1">
                Review and validate graduation roadmap submission
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {submission.expiresAt && <ExpiryTimer expiresAt={submission.expiresAt} large />}
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {submission.expiresAt && getTimeRemaining(submission.expiresAt).minutes < 10 && !getTimeRemaining(submission.expiresAt).expired && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              This submission will expire soon! Review and take action before the data is automatically deleted.
            </AlertDescription>
          </Alert>
        )}

        {/* Status and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Badge className={`${getStatusColor(submission.status)} text-base px-4 py-2 flex items-center gap-2`}>
                  {getStatusIcon(submission.status)}
                  {getStatusLabel(submission.status)}
                </Badge>
                
                {validation && (
                  <Badge variant={validation.canGraduate ? 'default' : 'destructive'} className="text-base px-4 py-2">
                    {validation.canGraduate ? (
                      <><CheckCircle className="w-4 h-4 mr-1" /> Eligible to Graduate</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1" /> Not Eligible</>
                    )}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-3">
                {submission.status === 'pending' && (
                  <Button onClick={handleValidate} disabled={isValidating}>
                    {isValidating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Validate</>
                    )}
                  </Button>
                )}
                
                {(submission.status === 'validated' || submission.status === 'has_issues') && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => setRejectDialog(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setApproveDialog(true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{submission.studentIdentifier || submission.student_identifier || 'Anonymous'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDateTime(submission.submittedAt || submission.submitted_at || '')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" /> Submission ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono">{submission.id.slice(0, 12)}...</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Segmented Progress Bar */}
            <SegmentedProgressBar
              completed={completedCredits}
              inProgress={inProgressCredits}
              planned={plannedCredits}
              total={requiredCredits > 0 ? requiredCredits : completedCredits + inProgressCredits + plannedCredits}
            />

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{totalCourses}</p>
                <p className="text-xs text-muted-foreground">Total Courses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCourses}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCourses}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{plannedCoursesList.length}</p>
                <p className="text-xs text-muted-foreground">Planned</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/5">
                <p className="text-2xl font-bold">{completedCredits}<span className="text-sm font-normal text-muted-foreground">/{requiredCredits > 0 ? requiredCredits : '?'}</span></p>
                <p className="text-xs text-muted-foreground">Credits Earned</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{gpa > 0 ? gpa.toFixed(2) : 'N/A'}</p>
                <p className="text-xs text-muted-foreground">GPA{gradedCredits > 0 ? ` (${gradedCredits} cr)` : ''}</p>
              </div>
            </div>

            {/* Donut Chart + Credit Breakdown Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <DonutChart
                  completed={completedCredits}
                  inProgress={inProgressCredits}
                  planned={plannedCredits + failedCredits}
                  total={completedCredits + inProgressCredits + plannedCredits + failedCredits + remainingCredits}
                  size={180}
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Credit Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Completed Credits
                    </span>
                    <span className="font-semibold">{completedCredits}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> In Progress Credits
                    </span>
                    <span className="font-semibold">{inProgressCredits}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Planned Credits
                    </span>
                    <span className="font-semibold">{plannedCredits}</span>
                  </div>
                  {failedCredits > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Failed Credits
                      </span>
                      <span className="font-semibold text-red-600">{failedCredits}</span>
                    </div>
                  )}
                  {requiredCredits > 0 && (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b">
                        <span className="text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Remaining Credits
                        </span>
                        <span className="font-semibold text-muted-foreground">{remainingCredits}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 font-semibold">
                        <span className="text-sm">Total Required</span>
                        <span>{requiredCredits}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Issues */}
        {validation && (validation.errors?.length || validation.warnings?.length) && (
          <Card className="mb-6 border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Validation Issues ({(validation.errors?.length || 0) + (validation.warnings?.length || 0)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validation.errors?.map((message: string, index: number) => (
                  <div 
                    key={`error-${index}`}
                    className="p-3 rounded-lg flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{message}</p>
                    </div>
                  </div>
                ))}
                {validation.warnings?.map((message: string, index: number) => (
                  <div 
                    key={`warning-${index}`}
                    className="p-3 rounded-lg flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Courses by Category
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map(category => (
                <CategoryCard
                  key={category.name}
                  category={category}
                  expanded={expandedCategories.has(category.name)}
                  onToggle={() => toggleCategory(category.name)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Course Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Completed Courses */}
          {allCourses.filter(c => c.status === 'completed').length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Completed Courses ({allCourses.filter(c => c.status === 'completed').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {allCourses.filter(c => c.status === 'completed').map((course, i) => (
                    <div key={`comp-${i}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-20 flex-shrink-0">{course.code}</span>
                        <span className="truncate">{course.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                        {course.grade && (
                          <Badge className={`text-xs ${
                            ['A', 'B+', 'B'].includes(course.grade) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            ['C+', 'C'].includes(course.grade) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            ['D+', 'D'].includes(course.grade) ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {course.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* In Progress Courses */}
          {allCourses.filter(c => c.status === 'in_progress').length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  In Progress Courses ({allCourses.filter(c => c.status === 'in_progress').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {allCourses.filter(c => c.status === 'in_progress').map((course, i) => (
                    <div key={`ip-${i}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-20 flex-shrink-0">{course.code}</span>
                        <span className="truncate">{course.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                        {course.semester && (
                          <Badge variant="secondary" className="text-xs">{course.semester}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Planned Courses */}
          {plannedCoursesList.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Planned Courses ({plannedCoursesList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {plannedCoursesList.map((course, i) => (
                    <div key={`plan-${i}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-20 flex-shrink-0">{course.code}</span>
                        <span className="truncate">{course.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                        {course.semester && (
                          <Badge variant="secondary" className="text-xs">{course.semester}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed / Withdrawn Courses */}
          {(failedCoursesList.length > 0 || withdrawnCoursesList.length > 0) && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  Failed / Withdrawn ({failedCoursesList.length + withdrawnCoursesList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {[...failedCoursesList, ...withdrawnCoursesList].map((course, i) => (
                    <div key={`fail-${i}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-20 flex-shrink-0">{course.code}</span>
                        <span className="truncate">{course.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                        <Badge variant="destructive" className="text-xs">{course.status === 'failed' ? course.grade || 'F' : 'W'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Validation Requirements Summary */}
        {validation?.requirements && validation.requirements.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Graduation Requirements Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validation.requirements.map((req: { met?: boolean; fulfilled?: boolean; label?: string; description?: string; message?: string; name?: string; earned?: number; required?: number }, index: number) => {
                  const isMet = req.met ?? req.fulfilled ?? false;
                  const displayText = req.label || req.description || req.message || req.name || 'Requirement';
                  const detail = (req.earned != null && req.required != null) ? `${req.earned} / ${req.required}` : null;
                  return (
                    <div
                      key={`req-${index}`}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        isMet
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {isMet ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{displayText}</p>
                        {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail} credits</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Summary from Backend */}
        {validation?.summary && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Validation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {validation.summary.totalCreditsRequired > 0 && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{validation.summary.totalCreditsRequired}</p>
                    <p className="text-xs text-muted-foreground">Required Credits</p>
                  </div>
                )}
                {validation.summary.totalCreditsEarned != null && (
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{validation.summary.totalCreditsEarned}</p>
                    <p className="text-xs text-muted-foreground">Credits Earned</p>
                  </div>
                )}
                {validation.summary.matchedCourses != null && (
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{validation.summary.matchedCourses}</p>
                    <p className="text-xs text-muted-foreground">Matched Courses</p>
                  </div>
                )}
                {validation.summary.unmatchedCourses != null && (
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{validation.summary.unmatchedCourses}</p>
                    <p className="text-xs text-muted-foreground">Unmatched Courses</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Approve this student&apos;s graduation roadmap. You can optionally add notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Any notes or comments..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rejection *</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this submission is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" /> Reject</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionDetailPage;
