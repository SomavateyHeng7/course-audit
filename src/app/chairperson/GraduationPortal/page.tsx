'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Copy,
  Calendar,
  GraduationCap,
  AlertTriangle,
  XCircle,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';

// Types
interface Portal {
  id: string;
  name: string;
  description: string;
  batch: string;
  curriculum: string;
  curriculumId: string;
  deadline: string;
  status: 'active' | 'closed';
  pin: string;
  acceptedFormats: string[];
  submissionsCount: number;
  createdAt: string;
}

interface Submission {
  id: string;
  portalId: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: 'pending' | 'processing' | 'validated' | 'has_issues' | 'approved' | 'rejected';
  validationResult?: ValidationResult;
}

interface ValidationResult {
  canGraduate: boolean;
  totalCredits: number;
  requiredCredits: number;
  completedCourses: number;
  totalCourses: number;
  missingCourses: string[];
  issues: ValidationIssue[];
  warnings: string[];
}

interface ValidationIssue {
  type: 'missing_course' | 'failed_course' | 'prerequisite' | 'credit_shortage' | 'blacklist';
  severity: 'error' | 'warning';
  message: string;
  courseCode?: string;
}

// Mock Data
const MOCK_PORTALS: Portal[] = [
  {
    id: 'portal-1',
    name: 'BSCS Batch 65 Graduation Check',
    description: 'Submit your graduation roadmap for validation. Please ensure all courses are properly listed.',
    batch: '65',
    curriculum: 'BSCS 2022',
    curriculumId: 'curr-bscs-2022',
    deadline: '2026-03-15',
    status: 'active',
    pin: 'GRAD2026',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    submissionsCount: 2,
    createdAt: '2025-01-01',
  },
];

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    portalId: 'portal-1',
    fileName: 'graduation_roadmap_student_001.xlsx',
    fileSize: 45678,
    submittedAt: '2025-01-05T10:30:00Z',
    status: 'validated',
    validationResult: {
      canGraduate: true,
      totalCredits: 142,
      requiredCredits: 140,
      completedCourses: 48,
      totalCourses: 50,
      missingCourses: ['CS 499', 'CS 498'],
      issues: [],
      warnings: ['2 courses are still in progress'],
    },
  },
  {
    id: 'sub-2',
    portalId: 'portal-1',
    fileName: 'my_courses_final.xlsx',
    fileSize: 52340,
    submittedAt: '2025-01-06T14:15:00Z',
    status: 'has_issues',
    validationResult: {
      canGraduate: false,
      totalCredits: 128,
      requiredCredits: 140,
      completedCourses: 42,
      totalCourses: 50,
      missingCourses: ['CS 301', 'CS 302', 'CS 401', 'CS 402', 'MATH 201', 'CS 499', 'CS 498', 'PHYS 101'],
      issues: [
        { type: 'credit_shortage', severity: 'error', message: 'Missing 12 credits to meet graduation requirement' },
        { type: 'missing_course', severity: 'error', message: 'Required core course CS 301 not completed', courseCode: 'CS 301' },
        { type: 'missing_course', severity: 'error', message: 'Required core course CS 302 not completed', courseCode: 'CS 302' },
        { type: 'failed_course', severity: 'error', message: 'Course MATH 201 was failed and needs to be retaken', courseCode: 'MATH 201' },
      ],
      warnings: ['Consider retaking MATH 201 in the next semester'],
    },
  },
];

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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

const getStatusColor = (status: Submission['status']) => {
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

const getStatusIcon = (status: Submission['status']) => {
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

const getStatusLabel = (status: Submission['status']) => {
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

// Progress Donut Chart Component
const DonutChart = ({ 
  completed, 
  total, 
  size = 80, 
  strokeWidth = 8,
  color = '#10b981'
}: { 
  completed: number; 
  total: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;
  
  // Scale text size based on chart size
  const percentTextSize = size <= 40 ? 'text-[9px]' : size <= 60 ? 'text-[11px]' : size <= 80 ? 'text-xs' : 'text-sm';
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth - 2}
          className="dark:stroke-gray-700"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${percentTextSize} font-bold leading-none`}>{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

// Create Portal Modal Component
const CreatePortalModal = ({ 
  open, 
  onClose,
  onSubmit
}: { 
  open: boolean; 
  onClose: () => void;
  onSubmit: (data: Partial<Portal>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      id: `portal-${Date.now()}`,
      status: 'active',
      pin: `GRAD${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      acceptedFormats: ['.xlsx', '.xls', '.csv'],
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Portal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Portal Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., BSCS Batch 65 Graduation Check"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instructions for students..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Deadline</label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.name}>
            Create Portal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Page Component
const GraduationPortalChairpersonPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Simulate loading
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setPortals(MOCK_PORTALS);
      setSubmissions(MOCK_SUBMISSIONS);
      setSelectedPortal(MOCK_PORTALS[0]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    if (selectedPortal && sub.portalId !== selectedPortal.id) return false;
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (searchTerm && !sub.fileName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter(s => s.status === 'pending').length,
    validated: filteredSubmissions.filter(s => s.status === 'validated').length,
    hasIssues: filteredSubmissions.filter(s => s.status === 'has_issues').length,
  };

  const handleCreatePortal = (data: Partial<Portal>) => {
    const newPortal = data as Portal;
    setPortals([...portals, newPortal]);
    setSelectedPortal(newPortal);
  };

  const handleViewSubmission = (submission: Submission) => {
    router.push(`/chairperson/GraduationPortal/${submission.id}`);
  };

  const handleBatchProcess = async () => {
    // Simulate batch processing
    setSubmissions(prev => prev.map(sub => {
      if (sub.status === 'pending') {
        return { ...sub, status: 'processing' as const };
      }
      return sub;
    }));

    await new Promise(resolve => setTimeout(resolve, 2000));

    setSubmissions(prev => prev.map(sub => {
      if (sub.status === 'processing') {
        // Randomly assign validated or has_issues for demo
        return { 
          ...sub, 
          status: Math.random() > 0.5 ? 'validated' as const : 'has_issues' as const,
          validationResult: {
            canGraduate: Math.random() > 0.5,
            totalCredits: Math.floor(Math.random() * 20) + 130,
            requiredCredits: 140,
            completedCourses: Math.floor(Math.random() * 10) + 40,
            totalCourses: 50,
            missingCourses: ['CS 499', 'CS 498'],
            issues: [],
            warnings: [],
          }
        };
      }
      return sub;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              Graduation Portal Management
            </h1>
            <p className="text-muted-foreground">
              Manage graduation roadmap submissions and validate student progress
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Portal
          </Button>
        </div>

        {/* Portal Selector */}
        {portals.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Active Portal</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between mt-1">
                          {selectedPortal?.name || 'Select Portal'}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-80">
                        {portals.map(portal => (
                          <DropdownMenuItem 
                            key={portal.id}
                            onClick={() => setSelectedPortal(portal)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{portal.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Batch {portal.batch} • {portal.submissionsCount} submissions
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {selectedPortal && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Deadline: {formatDate(selectedPortal.deadline)}</span>
                    </div>
                    <Badge variant={selectedPortal.status === 'active' ? 'default' : 'secondary'}>
                      {selectedPortal.status === 'active' ? 'Active' : 'Closed'}
                    </Badge>
                    <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                      <span className="text-muted-foreground">PIN:</span>
                      <code className="font-mono font-medium">{selectedPortal.pin}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Submissions</p>
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
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
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
                  <p className="text-2xl font-bold">{stats.validated}</p>
                  <p className="text-xs text-muted-foreground">Can Graduate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hasIssues}</p>
                  <p className="text-xs text-muted-foreground">Has Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Submissions
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                {/* Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      {statusFilter === 'all' ? 'All Status' : getStatusLabel(statusFilter as Submission['status'])}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('validated')}>Can Graduate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('has_issues')}>Has Issues</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Batch Process */}
                <Button onClick={handleBatchProcess} disabled={stats.pending === 0}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process All Pending
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <EmptyState
                icon={<FileSpreadsheet size={32} />}
                title="No submissions yet"
                description="Students will appear here once they submit their graduation roadmaps"
              />
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                  <div className="col-span-2">File</div>
                  <div>Submitted</div>
                  <div>Status</div>
                  <div>Progress</div>
                  <div>Actions</div>
                </div>

                {/* Submission Rows */}
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleViewSubmission(submission)}
                  >
                    <div className="lg:grid lg:grid-cols-6 gap-4 lg:items-center">
                      {/* File Info */}
                      <div className="col-span-2 flex items-center gap-3 mb-3 lg:mb-0">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{submission.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(submission.fileSize)}</p>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="mb-2 lg:mb-0">
                        <p className="text-sm">{formatDateTime(submission.submittedAt)}</p>
                      </div>

                      {/* Status */}
                      <div className="mb-2 lg:mb-0">
                        <Badge className={`${getStatusColor(submission.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(submission.status)}
                          <span>{getStatusLabel(submission.status)}</span>
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="mb-3 lg:mb-0">
                        {submission.validationResult ? (
                          <div className="flex items-center gap-2">
                            <DonutChart
                              completed={submission.validationResult.totalCredits}
                              total={submission.validationResult.requiredCredits}
                              size={40}
                              strokeWidth={4}
                              color={submission.validationResult.canGraduate ? '#10b981' : '#ef4444'}
                            />
                            <div className="text-xs">
                              <p className="font-medium">{submission.validationResult.totalCredits}/{submission.validationResult.requiredCredits}</p>
                              <p className="text-muted-foreground">credits</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSubmission(submission);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {submission.status === 'validated' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle approve action
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {submission.status === 'has_issues' && (
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreatePortalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePortal}
      />
    </div>
  );
};

export default GraduationPortalChairpersonPage;
