'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Power,
  Key,
  Trash2,
  Edit,
  Loader2,
  Settings,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';
import { useToastHelpers } from '@/hooks/useToast';
import {
  getGraduationPortals,
  createGraduationPortal,
  updateGraduationPortal,
  deleteGraduationPortal,
  closeGraduationPortal,
  regeneratePortalPin,
  getCacheSubmissions,
  validateCacheSubmission,
  approveCacheSubmission,
  rejectCacheSubmission,
  batchValidateSubmissions,
  GRACE_PERIOD_DAYS,
  type GraduationPortal,
  type CacheSubmission,
  type ValidationResult
} from '@/lib/api/laravel';
import { getCurricula } from '@/lib/api/laravel';
import type { Curriculum } from '@/components/role-specific/chairperson/management/types';

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTimeRemaining = (expiresAt: string) => {
  if (!expiresAt) return { minutes: 0, seconds: 0, expired: true };
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
  const percentTextSize = size <= 40 ? 'text-[9px]' : size <= 60 ? 'text-[11px]' : size <= 80 ? 'text-xs' : 'text-sm';
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth - 2} className="dark:stroke-gray-700" />
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${percentTextSize} font-bold leading-none`}>{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

// Expiry/Retention Timer Component
const RetentionTimer = ({ expiresAt, deletionDate }: { expiresAt: string; deletionDate?: string }) => {
  const [time, setTime] = useState(getTimeRemaining(expiresAt || ''));
  
  // If we have a deletion date (new system - 7 days after deadline), show that
  if (deletionDate) {
    const deletionDateTime = new Date(deletionDate);
    const now = new Date();
    const isExpired = deletionDateTime < now;
    
    if (isExpired) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    
    const daysUntilDeletion = Math.ceil((deletionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Badge variant="outline" className={`text-xs ${daysUntilDeletion <= 2 ? 'border-orange-500 text-orange-600' : 'border-gray-300'}`}>
        <Calendar className="w-3 h-3 mr-1" />
        {daysUntilDeletion <= 0 ? 'Today' : `${daysUntilDeletion} day${daysUntilDeletion > 1 ? 's' : ''} left`}
      </Badge>
    );
  }
  
  // Fallback to old countdown timer (for backwards compatibility)
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setTime(getTimeRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  if (!expiresAt || time.expired) {
    return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  }
  
  return (
    <Badge variant="outline" className={`text-xs ${time.minutes < 5 ? 'border-red-500 text-red-500' : ''}`}>
      <Clock className="w-3 h-3 mr-1" />
      {time.minutes}:{time.seconds.toString().padStart(2, '0')}
    </Badge>
  );
};

// Legacy alias for backwards compatibility
const ExpiryTimer = RetentionTimer;

// Create Portal Modal Component
const CreatePortalModal = ({ 
  open, 
  onClose,
  onSubmit,
  isLoading
}: { 
  open: boolean; 
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    batch: string;
    deadline: string;
    accepted_formats: string[];
    max_file_size_mb: number;
  }) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    batch: '',
    deadline: '',
    accepted_formats: ['.xlsx', '.xls', '.csv'],
    max_file_size_mb: 5
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.deadline || !formData.batch) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Portal</DialogTitle>
          <DialogDescription>
            Create a graduation portal for students to submit their roadmaps. Students will select their curriculum when submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Portal Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., BSCS Batch 65 Graduation Check"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instructions for students..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch</Label>
              <Input
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="e.g., 65"
              />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max File Size (MB)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={formData.max_file_size_mb}
                onChange={(e) => setFormData({ ...formData, max_file_size_mb: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div>
              <Label>Accepted Formats</Label>
              <Input
                value={formData.accepted_formats.join(', ')}
                onChange={(e) => setFormData({ ...formData, accepted_formats: e.target.value.split(',').map(s => s.trim()) })}
                placeholder=".xlsx, .csv"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.name || !formData.deadline || !formData.batch}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              'Create Portal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Confirm Dialog Component
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  variant = 'default',
  isLoading = false
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'} 
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Main Page Component
const GraduationPortalChairpersonPage: React.FC = () => {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // Data
  const [portals, setPortals] = useState<GraduationPortal[]>([]);
  const [submissions, setSubmissions] = useState<CacheSubmission[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedPortal, setSelectedPortal] = useState<GraduationPortal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Confirm dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'default' | 'destructive';
    onConfirm: () => void;
  } | null>(null);

  // Auto-refresh submissions every 10 seconds
  useEffect(() => {
    if (!selectedPortal) return;
    
    const interval = setInterval(() => {
      loadSubmissions(selectedPortal.id);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedPortal]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load submissions when portal changes
  useEffect(() => {
    if (selectedPortal) {
      loadSubmissions(selectedPortal.id);
    }
  }, [selectedPortal?.id]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [portalsRes, curriculaRes] = await Promise.all([
        getGraduationPortals(),
        getCurricula()
      ]);
      
      // Debug logging for API response
      console.log('Graduation portals API response:', portalsRes);
      
      // Handle different response structures from backend
      const portalsList = portalsRes.data || (Array.isArray(portalsRes) ? portalsRes : []);
      console.log('Parsed portals list:', portalsList);
      
      setPortals(portalsList);
      setCurricula(curriculaRes.curricula || curriculaRes.data || curriculaRes);
      
      // Select first active portal by default
      const activePortal = portalsList.find((p: GraduationPortal) => p.status === 'active');
      if (activePortal) {
        setSelectedPortal(activePortal);
      } else if (portalsList.length > 0) {
        setSelectedPortal(portalsList[0]);
      }
    } catch (err) {
      console.error('Failed to load graduation portal data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (portalId: string) => {
    try {
      const response = await getCacheSubmissions(portalId);
      // Normalize submission data from backend
      const normalizedSubmissions = (response.submissions || []).map(sub => ({
        ...sub,
        studentIdentifier: sub.studentIdentifier || sub.student_identifier,
        submittedAt: sub.submittedAt || sub.submitted_at,
        expiresAt: sub.expiresAt || sub.expires_at,
      }));
      setSubmissions(normalizedSubmissions);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const handleRefresh = async () => {
    if (!selectedPortal) return;
    setIsRefreshing(true);
    await loadSubmissions(selectedPortal.id);
    setIsRefreshing(false);
  };

  const handleCreatePortal = async (data: {
    name: string;
    description: string;
    batch: string;
    deadline: string;
    accepted_formats: string[];
    max_file_size_mb: number;
  }) => {
    setIsCreatingPortal(true);
    try {
      // Add required curriculum_id field - use empty string or first curriculum
      const curriculum_id = curricula && curricula.length > 0 ? curricula[0].id : '';
      const response = await createGraduationPortal({
        ...data,
        curriculum_id
      });
      setPortals(prev => [...prev, response.portal]);
      setSelectedPortal(response.portal);
      setShowCreateModal(false);
      showSuccess(`Portal "${data.name}" created successfully`, 'Portal Created');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create portal', 'Error');
    } finally {
      setIsCreatingPortal(false);
    }
  };

  const handleClosePortal = async (portalId: string) => {
    setIsProcessingAction(true);
    try {
      await closeGraduationPortal(portalId);
      showSuccess('Portal closed successfully', 'Portal Closed');
      // Refresh page after short delay to let toast show
      setTimeout(() => {
        window.location.href = '/chairperson/GraduationPortal';
      }, 500);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to close portal', 'Error');
      setIsProcessingAction(false);
      setConfirmDialog(null);
    }
  };

  const handleRegeneratePin = async (portalId: string) => {
    setIsProcessingAction(true);
    try {
      const response = await regeneratePortalPin(portalId);
      setPortals(prev => prev.map(p => p.id === portalId ? { ...p, pin: response.pin } : p));
      if (selectedPortal?.id === portalId) {
        setSelectedPortal(prev => prev ? { ...prev, pin: response.pin } : null);
      }
      showSuccess(`New PIN: ${response.pin}`, 'PIN Regenerated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to regenerate PIN', 'Error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeletePortal = async (portalId: string) => {
    setIsProcessingAction(true);
    try {
      const portalName = portals.find(p => p.id === portalId)?.name || 'Portal';
      await deleteGraduationPortal(portalId);
      showSuccess(`Portal "${portalName}" deleted successfully`, 'Portal Deleted');
      // Refresh page after short delay to let toast show
      setTimeout(() => {
        window.location.href = '/chairperson/GraduationPortal';
      }, 500);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete portal', 'Error');
      setIsProcessingAction(false);
      setConfirmDialog(null);
    }
  };

  const handleValidateSubmission = async (submissionId: string) => {
    try {
      const response = await validateCacheSubmission(selectedPortal!.id, submissionId);
      const canGraduate = response.validation?.can_graduate ?? response.submission?.validation_result?.canGraduate ?? false;
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, status: canGraduate ? 'validated' : 'has_issues', validationResult: response.validation || response.submission?.validation_result }
          : s
      ));
      showSuccess(canGraduate ? 'Student can graduate!' : 'Validation complete - issues found', 'Validated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to validate submission', 'Error');
    }
  };

  const handleApproveSubmission = async (submissionId: string, notes?: string) => {
    try {
      await approveCacheSubmission(selectedPortal!.id, submissionId, notes);
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status: 'approved' } : s
      ));
      showSuccess('Submission approved', 'Approved');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to approve submission', 'Error');
    }
  };

  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    try {
      await rejectCacheSubmission(selectedPortal!.id, submissionId, reason);
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status: 'rejected' } : s
      ));
      showSuccess('Submission rejected', 'Rejected');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reject submission', 'Error');
    }
  };

  const handleBatchValidate = async () => {
    if (!selectedPortal) return;
    const pendingIds = submissions.filter(s => s.status === 'pending').map(s => s.id);
    if (pendingIds.length === 0) return;
    
    setIsProcessingAction(true);
    try {
      const response = await batchValidateSubmissions(selectedPortal.id, pendingIds);
      // Reload submissions to get updated statuses
      await loadSubmissions(selectedPortal.id);
      showSuccess(`Validated ${pendingIds.length} submission(s)`, 'Batch Validation Complete');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to batch validate', 'Error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleViewSubmission = (submission: CacheSubmission) => {
    router.push(`/chairperson/GraduationPortal/${submission.id}?portalId=${selectedPortal?.id}`);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    showSuccess('PIN copied to clipboard', 'Copied');
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (searchTerm && !sub.studentIdentifier?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    validated: submissions.filter(s => s.status === 'validated').length,
    hasIssues: submissions.filter(s => s.status === 'has_issues').length,
    approved: submissions.filter(s => s.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load data</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadInitialData}>Try Again</Button>
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
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active Portal</label>
                  {portals.length > 0 ? (
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{portal.name}</span>
                                <Badge variant={portal.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {portal.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Batch {portal.batch} • {portal.curriculum?.name || 'Unknown Curriculum'}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No portals available. Create one to get started.</p>
                  )}
                </div>
              </div>

              {selectedPortal && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => selectedPortal.pin && handleCopyPin(selectedPortal.pin)}
                        disabled={!selectedPortal.pin}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Portal Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRegeneratePin(selectedPortal.id)}>
                          <Key className="w-4 h-4 mr-2" />
                          Regenerate PIN
                        </DropdownMenuItem>
                        {selectedPortal.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: 'Close Portal',
                              description: 'This will prevent new submissions. Existing submissions will still be visible.',
                              confirmText: 'Close Portal',
                              variant: 'default',
                              onConfirm: () => handleClosePortal(selectedPortal.id)
                            })}
                          >
                            <Power className="w-4 h-4 mr-2" />
                            Close Portal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setConfirmDialog({
                            open: true,
                            title: 'Delete Portal',
                            description: 'This will permanently delete the portal and all associated data. This action cannot be undone.',
                            confirmText: 'Delete',
                            variant: 'destructive',
                            onConfirm: () => handleDeletePortal(selectedPortal.id)
                          })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Portal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
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
                  <p className="text-xs text-muted-foreground">Pending</p>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        {selectedPortal && (
          <Alert className="mb-6">
            <Clock className="w-4 h-4" />
            <AlertDescription>
              Submissions are retained during the <strong>Grace Period</strong> ({GRACE_PERIOD_DAYS} days after the portal deadline).
              Students can still submit during this period. Data is auto-deleted once the Grace Period ends.
              Auto-refreshing every 10 seconds.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Submissions
                {isRefreshing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student ID..."
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
                      {statusFilter === 'all' ? 'All Status' : getStatusLabel(statusFilter as CacheSubmission['status'])}
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
                {/* Refresh */}
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {/* Batch Process */}
                <Button 
                  onClick={handleBatchValidate} 
                  disabled={stats.pending === 0 || isProcessingAction}
                >
                  {isProcessingAction ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Validate All Pending
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPortal ? (
              <EmptyState
                icon={<GraduationCap size={32} />}
                title="No portal selected"
                description="Select a portal from the dropdown above or create a new one"
              />
            ) : filteredSubmissions.length === 0 ? (
              <EmptyState
                icon={<FileSpreadsheet size={32} />}
                title="No submissions yet"
                description="Students will appear here once they submit their graduation roadmaps"
              />
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                  <div className="col-span-2">Student</div>
                  <div>Submitted</div>
                  <div>Status</div>
                  <div>Expires</div>
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
                      {/* Student Info */}
                      <div className="col-span-2 flex items-center gap-3 mb-3 lg:mb-0">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{submission.studentIdentifier || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.courses?.length || 0} courses • {submission.metadata?.total_credits || '-'} credits
                          </p>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="mb-2 lg:mb-0">
                        <p className="text-sm">{formatDateTime(submission.submittedAt || submission.submitted_at)}</p>
                      </div>

                      {/* Status */}
                      <div className="mb-2 lg:mb-0">
                        <Badge className={`${getStatusColor(submission.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(submission.status)}
                          <span>{getStatusLabel(submission.status)}</span>
                        </Badge>
                      </div>

                      {/* Expiry/Retention */}
                      <div className="mb-3 lg:mb-0">
                        <ExpiryTimer 
                          expiresAt={submission.expiresAt || submission.expires_at} 
                          deletionDate={submission.deletion_date}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewSubmission(submission)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {submission.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateSubmission(submission.id)}
                          >
                            Validate
                          </Button>
                        )}
                        
                        {submission.status === 'validated' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApproveSubmission(submission.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSubmission(submission)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {submission.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleValidateSubmission(submission.id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Validate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(submission.status === 'validated' || submission.status === 'has_issues') && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  const reason = prompt('Reason for rejection:');
                                  if (reason) handleRejectSubmission(submission.id, reason);
                                }}
                              >
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
        isLoading={isCreatingPortal}
      />

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          isLoading={isProcessingAction}
        />
      )}
    </div>
  );
};

export default GraduationPortalChairpersonPage;
