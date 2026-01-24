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
  Hash
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
import {
  getCacheSubmission,
  validateCacheSubmission,
  approveCacheSubmission,
  rejectCacheSubmission,
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
  courses: SubmissionCourse[];
}

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
      setSubmission(prev => prev ? {
        ...prev,
        status: response.validation.can_graduate ? 'validated' : 'has_issues',
        validationResult: response.validation
      } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Validation failed');
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load submission</h2>
        <p className="text-muted-foreground">{error || 'Submission not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const categories = groupCoursesByCategory(submission.courses || []);
  const validation = submission.validation_result;
  
  // Calculate totals
  const totalCredits = categories.reduce((sum, c) => sum + c.totalCredits, 0);
  const completedCredits = categories.reduce((sum, c) => sum + c.completedCredits, 0);
  const inProgressCredits = categories.reduce((sum, c) => sum + c.inProgressCredits, 0);
  const totalCourses = submission.courses?.length || 0;
  const completedCourses = (submission.courses || []).filter(c => c.status === 'completed').length;

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
              <p className="text-xl font-semibold">{submission.studentIdentifier || 'Anonymous'}</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCourses}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCredits}</p>
                  <p className="text-xs text-muted-foreground">Credits Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCredits}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
      </div>

      {/* Approve Dialog */}
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
