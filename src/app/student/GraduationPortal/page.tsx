'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileSpreadsheet, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Building,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  X,
  FileText,
  Clock,
  AlertTriangle,
  Loader2,
  BookOpen,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getPublicGraduationPortals, 
  verifyGraduationPortalPin,
  submitGraduationCourses,
  getPortalCurricula,
  getPublicFaculties,
  getPublicDepartments,
  type GraduationPortal,
  type GraduationSession,
  type SubmissionCourse,
  type PortalCurriculum
} from '@/lib/api/laravel';
import { 
  parseGraduationFile, 
  validateCoursesForSubmission,
  getStatusDisplayLabel,
  type ParseResult 
} from '@/lib/utils/graduationFileParser';

type SubmissionStep = 'select' | 'pin' | 'curriculum' | 'upload' | 'preview' | 'success';

interface SessionState {
  token: string;
  expiresAt: Date;
  portalId: string;
  curriculumId: string;
}

const GraduationPortalPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Portal list state
  const [portals, setPortals] = useState<GraduationPortal[]>([]);
  const [isLoadingPortals, setIsLoadingPortals] = useState(true);
  const [portalsError, setPortalsError] = useState<string | null>(null);
  
  // Selected portal and step
  const [selectedPortal, setSelectedPortal] = useState<GraduationPortal | null>(null);
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('select');
  
  // PIN state
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinAttemptsRemaining, setPinAttemptsRemaining] = useState<number | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  
  // Session state
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  
  // File and parsing state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Submission state
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionExpiresAt, setSubmissionExpiresAt] = useState<string | null>(null);
  
  // Drag state
  const [dragOver, setDragOver] = useState(false);

  // Curriculum selection state
  const [curricula, setCurricula] = useState<PortalCurriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<PortalCurriculum | null>(null);
  const [isLoadingCurricula, setIsLoadingCurricula] = useState(false);
  const [curriculaError, setCurriculaError] = useState<string | null>(null);
  const [curriculumSearch, setCurriculumSearch] = useState('');
  // Fallback selection (when portal has no department)
  const [faculties, setFaculties] = useState<Array<{ id: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; faculty_id: string }>>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [needsFallbackSelection, setNeedsFallbackSelection] = useState(false);

  // Load portals on mount
  useEffect(() => {
    loadPortals();
  }, []);

  // Session countdown timer
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      setSessionTimeRemaining(remaining);
      
      if (remaining === 0) {
        // Session expired
        handleSessionExpired();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  const loadPortals = async () => {
    setIsLoadingPortals(true);
    setPortalsError(null);
    
    try {
      const response = await getPublicGraduationPortals();
      setPortals(response.portals);
    } catch (error) {
      setPortalsError(error instanceof Error ? error.message : 'Failed to load portals');
    } finally {
      setIsLoadingPortals(false);
    }
  };

  const handleSelectPortal = (portal: GraduationPortal) => {
    if (portal.status === 'closed') return;
    setSelectedPortal(portal);
    setCurrentStep('pin');
    setPin('');
    setPinError('');
    setPinAttemptsRemaining(null);
  };

  const handlePinSubmit = async () => {
    if (!selectedPortal || pin.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    
    setIsVerifyingPin(true);
    setPinError('');
    
    try {
      const response = await verifyGraduationPortalPin(selectedPortal.id, pin);
      
      // Store session (curriculum_id will be set after curriculum selection)
      const expiresAt = new Date(response.session.expires_at);
      
      setSession({
        token: response.session.token,
        expiresAt,
        portalId: selectedPortal.id,
        curriculumId: '' // Will be set after curriculum selection
      });
      setSessionTimeRemaining(response.session.expires_in_minutes * 60);
      
      // Load curricula for selection
      await loadCurricula(selectedPortal.id);
      
      setCurrentStep('curriculum');
    } catch (error) {
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          setPinError(errorData.message || 'Invalid PIN');
          if (errorData.attempts_remaining !== undefined) {
            setPinAttemptsRemaining(errorData.attempts_remaining);
          }
          if (errorData.code === 'RATE_LIMITED') {
            setPinError(`Too many attempts. Please try again in ${Math.ceil(errorData.retry_after / 60)} minutes.`);
          }
        } catch {
          setPinError(error.message || 'PIN verification failed');
        }
      } else {
        setPinError('PIN verification failed');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const loadCurricula = async (portalId: string, departmentId?: string) => {
    setIsLoadingCurricula(true);
    setCurriculaError(null);
    setCurriculumSearch(''); // Reset search when loading new curricula
    
    try {
      const response = await getPortalCurricula(portalId, departmentId ? { department_id: departmentId } : undefined);
      
      if (response.total === 0 && !response.portal_department_id) {
        // Portal has no department - need fallback selection
        setNeedsFallbackSelection(true);
        await loadFaculties();
      } else {
        setCurricula(response.curricula);
        // Pre-select default curriculum
        const defaultCurr = response.curricula.find(c => c.is_default) || response.curricula[0];
        if (defaultCurr) {
          setSelectedCurriculum(defaultCurr);
        }
        setNeedsFallbackSelection(false);
      }
    } catch (error) {
      setCurriculaError(error instanceof Error ? error.message : 'Failed to load curricula');
    } finally {
      setIsLoadingCurricula(false);
    }
  };

  const loadFaculties = async () => {
    try {
      const response = await getPublicFaculties();
      setFaculties(response.faculties);
    } catch (error) {
      setCurriculaError('Failed to load faculties');
    }
  };

  const handleFacultySelect = async (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setSelectedDepartmentId(null);
    setDepartments([]);
    setCurricula([]);
    setSelectedCurriculum(null);
    
    try {
      const response = await getPublicDepartments(facultyId);
      setDepartments(response.departments);
    } catch (error) {
      setCurriculaError('Failed to load departments');
    }
  };

  const handleDepartmentSelect = async (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setCurricula([]);
    setSelectedCurriculum(null);
    
    if (selectedPortal) {
      await loadCurricula(selectedPortal.id, departmentId);
    }
  };

  const handleCurriculumSelect = (curriculum: PortalCurriculum) => {
    setSelectedCurriculum(curriculum);
    // Update session with selected curriculum
    if (session) {
      setSession({ ...session, curriculumId: curriculum.id });
    }
  };

  const handleCurriculumContinue = () => {
    if (!selectedCurriculum) {
      alert('Please select a curriculum');
      return;
    }
    // Ensure session has curriculum_id
    if (session) {
      setSession({ ...session, curriculumId: selectedCurriculum.id });
    }
    setCurrentStep('upload');
  };

  const handleSessionExpired = () => {
    setSession(null);
    setCurrentStep('pin');
    setPinError('Session expired. Please enter PIN again.');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = selectedPortal?.acceptedFormats || ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file format. Accepted formats: ${validExtensions.join(', ')}`);
      return;
    }
    
    // Check file size
    const maxSizeMb = selectedPortal?.maxFileSizeMb || 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File too large. Maximum size: ${maxSizeMb}MB`);
      return;
    }
    
    setUploadedFile(file);
    setIsParsing(true);
    
    try {
      const result = await parseGraduationFile(file);
      setParseResult(result);
      
      if (result.success) {
        setCurrentStep('preview');
      }
    } catch (error) {
      setParseResult({
        success: false,
        courses: [],
        summary: { totalCourses: 0, byCategory: {}, byStatus: {}, totalCredits: 0 },
        errors: [error instanceof Error ? error.message : 'Failed to parse file'],
        warnings: []
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!session || !parseResult || !selectedPortal) return;
    
    // Validate student identifier
    if (!studentIdentifier.trim()) {
      alert('Please enter your student ID or name');
      return;
    }
    
    // Validate curriculum_id
    if (!session.curriculumId) {
      alert('Cannot submit: No curriculum is assigned to this portal. Please contact your department.');
      return;
    }
    
    // Validate courses
    const validation = validateCoursesForSubmission(parseResult.courses);
    if (!validation.valid) {
      alert(`Cannot submit: ${validation.errors.join(', ')}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await submitGraduationCourses(
        selectedPortal.id,
        session.token,
        {
          student_identifier: studentIdentifier.trim(),
          curriculum_id: session.curriculumId,
          courses: parseResult.courses,
          metadata: {
            parsed_at: new Date().toISOString(),
            file_name: uploadedFile?.name,
            total_courses: parseResult.courses.length
          }
        }
      );
      
      setSubmissionId(response.submission.id);
      setSubmissionExpiresAt(response.submission.expires_at);
      setCurrentStep('success');
    } catch (error) {
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.code === 'SESSION_EXPIRED') {
            handleSessionExpired();
            return;
          }
          alert(errorData.message || 'Submission failed');
        } catch {
          alert(error.message || 'Submission failed');
        }
      } else {
        alert('Submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedPortal(null);
    setCurrentStep('select');
    setPin('');
    setPinError('');
    setPinAttemptsRemaining(null);
    setUploadedFile(null);
    setParseResult(null);
    setSession(null);
    setStudentIdentifier('');
    setSubmissionId(null);
    setSubmissionExpiresAt(null);
    // Reset curriculum state
    setCurricula([]);
    setSelectedCurriculum(null);
    setFaculties([]);
    setDepartments([]);
    setSelectedFacultyId(null);
    setSelectedDepartmentId(null);
    setNeedsFallbackSelection(false);
    setCurriculaError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-background dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Graduation Roadmap Portal
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Submit your graduation roadmap for validation by your department chairperson. 
            Select a portal, enter the access PIN, and upload your file.
          </p>
        </div>

        {/* Session Timer (when active) */}
        {session && currentStep !== 'success' && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            sessionTimeRemaining < 120 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Session: {formatSessionTime(sessionTimeRemaining)}
            </span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {['Select Portal', 'Enter PIN', 'Curriculum', 'Upload File', 'Preview', 'Complete'].map((step, index) => {
              const stepKeys: SubmissionStep[] = ['select', 'pin', 'curriculum', 'upload', 'preview', 'success'];
              const isActive = stepKeys.indexOf(currentStep) >= index;
              const isCurrent = stepKeys[index] === currentStep;
              
              return (
                <React.Fragment key={step}>
                  <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCurrent ? 'bg-primary text-white' : isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${isCurrent ? 'font-medium' : ''}`}>{step}</span>
                  </div>
                  {index < 5 && (
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step 1: Portal Selection */}
        {currentStep === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available Portals</h2>
              <Badge variant="outline" className="text-xs">
                {portals.filter(p => p.status === 'active').length} Active
              </Badge>
            </div>
            
            {isLoadingPortals ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading portals...</p>
              </Card>
            ) : portalsError ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Failed to Load Portals</h3>
                <p className="text-muted-foreground mb-4">{portalsError}</p>
                <Button onClick={loadPortals}>Try Again</Button>
              </Card>
            ) : portals.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Active Portals</h3>
                <p className="text-muted-foreground">
                  There are no graduation portals available at the moment. 
                  Please check back later or contact your department.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {portals.map((portal) => {
                  const daysLeft = portal.daysRemaining ?? getDaysUntilDeadline(portal.deadline);
                  const isUrgent = daysLeft <= 7 && daysLeft > 0;
                  
                  return (
                    <Card 
                      key={portal.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        portal.status === 'closed' 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'hover:border-primary'
                      }`}
                      onClick={() => handleSelectPortal(portal)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                portal.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <FileSpreadsheet className={`w-5 h-5 ${
                                  portal.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-lg">{portal.name}</h3>
                                  <Badge variant={portal.status === 'active' ? 'default' : 'secondary'}>
                                    {portal.status === 'active' ? 'Open' : 'Closed'}
                                  </Badge>
                                  {isUrgent && portal.status === 'active' && (
                                    <Badge variant="destructive" className="text-xs">
                                      {daysLeft} days left
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{portal.description}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{portal.department?.name ?? 'Unknown Department'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Batch {portal.batch}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{portal.curriculum?.name ?? 'Unknown Curriculum'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Deadline</p>
                              <p className="font-medium">{formatDate(portal.deadline)}</p>
                            </div>
                            {portal.status === 'active' && (
                              <Button size="sm" className="mt-2">
                                Select <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: PIN Entry */}
        {currentStep === 'pin' && selectedPortal && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Enter Access PIN</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Enter the PIN provided by your chairperson to access this portal
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium">{selectedPortal.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPortal.department?.name ?? 'Unknown Department'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Access PIN</label>
                <div className="relative">
                  <Input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter PIN"
                    className={`pr-10 ${pinError ? 'border-red-500' : ''}`}
                    onKeyDown={(e) => e.key === 'Enter' && !isVerifyingPin && handlePinSubmit()}
                    disabled={isVerifyingPin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {pinError}
                  </p>
                )}
                {pinAttemptsRemaining !== null && pinAttemptsRemaining > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {pinAttemptsRemaining} attempts remaining
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleReset} className="flex-1" disabled={isVerifyingPin}>
                  Back
                </Button>
                <Button onClick={handlePinSubmit} className="flex-1" disabled={!pin || isVerifyingPin}>
                  {isVerifyingPin ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Your submission is anonymous. The PIN is only used to verify you have access to this portal.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Curriculum Selection */}
        {currentStep === 'curriculum' && selectedPortal && (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Select Your Curriculum</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Choose the curriculum that applies to your batch
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium">{selectedPortal.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPortal.department?.name ?? 'Unknown Department'}</p>
              </div>

              {isLoadingCurricula ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading curricula...</p>
                </div>
              ) : curriculaError ? (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{curriculaError}</AlertDescription>
                </Alert>
              ) : needsFallbackSelection ? (
                // Fallback: Faculty -> Department -> Curriculum selection
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Faculty</label>
                    <select
                      value={selectedFacultyId || ''}
                      onChange={(e) => handleFacultySelect(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Choose a faculty...</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedFacultyId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Department</label>
                      <select
                        value={selectedDepartmentId || ''}
                        onChange={(e) => handleDepartmentSelect(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="">Choose a department...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedDepartmentId && curricula.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Curriculum</label>
                      <div className="grid gap-2">
                        {curricula.map(curr => (
                          <div
                            key={curr.id}
                            onClick={() => handleCurriculumSelect(curr)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedCurriculum?.id === curr.id
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{curr.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Year: {curr.year} • {curr.total_credits_required} credits required
                                </p>
                              </div>
                              {curr.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Normal: Show curriculum cards with search for longer lists
                <div className="space-y-3">
                  {curricula.length > 4 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={curriculumSearch}
                        onChange={(e) => setCurriculumSearch(e.target.value)}
                        placeholder="Search curricula..."
                        className="pl-9"
                      />
                    </div>
                  )}
                  <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                    {curricula
                      .filter(c => 
                        !curriculumSearch || 
                        c.name.toLowerCase().includes(curriculumSearch.toLowerCase()) ||
                        c.year?.toString().includes(curriculumSearch)
                      )
                      .map(curr => (
                        <div
                          key={curr.id}
                          onClick={() => handleCurriculumSelect(curr)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedCurriculum?.id === curr.id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary'
                              : 'hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{curr.name}</p>
                                {curr.is_default && (
                                  <Badge variant="secondary" className="text-xs shrink-0">Recommended</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>Year {curr.year}</span>
                                <span>{curr.total_credits_required} credits</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedCurriculum?.id === curr.id 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {selectedCurriculum?.id === curr.id && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {curricula.length > 0 && curriculumSearch && 
                      !curricula.some(c => 
                        c.name.toLowerCase().includes(curriculumSearch.toLowerCase()) ||
                        c.year?.toString().includes(curriculumSearch)
                      ) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No curricula match your search
                      </p>
                    )}
                  </div>
                  {curricula.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {curricula.length} curricula available
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('pin')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleCurriculumContinue} 
                  className="flex-1" 
                  disabled={!selectedCurriculum}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: File Upload */}
        {currentStep === 'upload' && selectedPortal && (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Upload Your Roadmap</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your graduation roadmap file exported from the Course Audit system
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium">{selectedPortal.name}</p>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: {selectedPortal.acceptedFormats.join(', ')} | Max size: {selectedPortal.maxFileSizeMb}MB
                </p>
              </div>

              {/* Student Identifier */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Student ID or Name</label>
                <Input
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="e.g., 6512345 or John Doe"
                />
                <p className="text-xs text-muted-foreground">
                  This helps the chairperson identify your submission
                </p>
              </div>
              
              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {isParsing ? (
                  <div className="space-y-3">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Parsing file...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                      <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {parseResult && !parseResult.success && (
                      <Alert variant="destructive" className="text-left">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          {parseResult.errors.join('. ')}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setParseResult(null);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drop your file here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={selectedPortal.acceptedFormats.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setCurrentStep('curriculum')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => parseResult?.success && setCurrentStep('preview')}
                  className="flex-1" 
                  disabled={!parseResult?.success || !studentIdentifier.trim()}
                >
                  Preview <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Preview */}
        {currentStep === 'preview' && selectedPortal && parseResult && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Review Your Submission
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Verify the parsed data before submitting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{parseResult.summary.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{parseResult.summary.totalCredits}</p>
                  <p className="text-xs text-muted-foreground">Total Credits</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {parseResult.summary.byStatus['completed'] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {parseResult.summary.byStatus['in_progress'] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {parseResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Course Preview by Category */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {Object.entries(parseResult.summary.byCategory).map(([category, count]) => (
                  <div key={category} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline">{count} courses</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {parseResult.courses
                        .filter(c => c.category === category)
                        .slice(0, 6)
                        .map((course, i) => (
                          <div key={i} className="bg-muted/50 rounded px-2 py-1 truncate">
                            {course.code}
                          </div>
                        ))}
                      {parseResult.courses.filter(c => c.category === category).length > 6 && (
                        <div className="text-muted-foreground px-2 py-1">
                          +{parseResult.courses.filter(c => c.category === category).length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submission Info */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p><strong>Student:</strong> {studentIdentifier}</p>
                <p><strong>Portal:</strong> {selectedPortal.name}</p>
                <p><strong>Curriculum:</strong> {selectedCurriculum?.name ?? 'Unknown Curriculum'}</p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Submission data is temporary and will expire after 30 minutes. 
                  Your chairperson will review it during this window.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setCurrentStep('upload')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit <CheckCircle className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success */}
        {currentStep === 'success' && selectedPortal && (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your graduation roadmap has been submitted to {selectedPortal.department?.name ?? 'your department'}.
              </p>
              
              {submissionId && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-left text-sm">
                  <p><strong>Submission ID:</strong> {submissionId.slice(0, 8)}...</p>
                  {submissionExpiresAt && (
                    <p className="text-amber-600 dark:text-amber-400 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Data expires: {new Date(submissionExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Your file has been received by the department
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    The chairperson will validate your courses within 30 minutes
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Results will be communicated according to department policy
                  </li>
                </ul>
              </div>
              
              <Button onClick={handleReset} className="w-full">
                Submit Another File
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GraduationPortalPage;
