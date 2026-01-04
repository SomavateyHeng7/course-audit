'use client';

import React, { useState, useRef } from 'react';
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
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock data for available portals (created by chairpersons)
const MOCK_PORTALS = [
  {
    id: 'portal-1',
    name: 'BSCS Batch 65 Graduation Check',
    chairperson: 'Dr. Maria Santos',
    faculty: 'Faculty of Engineering',
    department: 'Computer Science',
    batch: '65',
    curriculum: 'BSCS 2022',
    deadline: '2026-03-15',
    status: 'active',
    description: 'Submit your graduation roadmap for validation. Please ensure all courses are properly listed.',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    createdAt: '2025-01-01',
  },
  {
    id: 'portal-2',
    name: 'BSIT Batch 65 Progress Review',
    chairperson: 'Prof. Juan Dela Cruz',
    faculty: 'Faculty of Engineering',
    department: 'Information Technology',
    batch: '65',
    curriculum: 'BSIT 2022',
    deadline: '2026-03-20',
    status: 'active',
    description: 'Annual progress review submission portal for BSIT students.',
    acceptedFormats: ['.xlsx', '.csv'],
    createdAt: '2025-01-05',
  },
  {
    id: 'portal-3',
    name: 'BBA Batch 66 Graduation Audit',
    chairperson: 'Dr. Ana Reyes',
    faculty: 'Faculty of Business',
    department: 'Business Administration',
    batch: '66',
    curriculum: 'BBA 2023',
    deadline: '2026-02-28',
    status: 'closed',
    description: 'Graduation audit for BBA students. Portal is currently closed.',
    acceptedFormats: ['.xlsx'],
    createdAt: '2025-01-10',
  },
];

interface Portal {
  id: string;
  name: string;
  chairperson: string;
  faculty: string;
  department: string;
  batch: string;
  curriculum: string;
  deadline: string;
  status: 'active' | 'closed';
  description: string;
  acceptedFormats: string[];
  createdAt: string;
}

type SubmissionStep = 'select' | 'pin' | 'upload' | 'success';

const GraduationPortalPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('select');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Handlers
  const handleSelectPortal = (portal: Portal) => {
    if (portal.status === 'closed') return;
    setSelectedPortal(portal);
    setCurrentStep('pin');
    setPin('');
    setPinError('');
  };

  const handlePinSubmit = () => {
    // Mock PIN validation (in real app, this would validate against backend)
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    // For demo, accept any PIN with 4+ characters
    setPinError('');
    setCurrentStep('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = selectedPortal?.acceptedFormats || ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file format. Accepted formats: ${validExtensions.join(', ')}`);
      return;
    }
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;
    
    setIsSubmitting(true);
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setCurrentStep('success');
  };

  const handleReset = () => {
    setSelectedPortal(null);
    setCurrentStep('select');
    setPin('');
    setPinError('');
    setUploadedFile(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-background dark:to-gray-900">
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
            Select a portal, enter the access PIN, and upload your file anonymously.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {['Select Portal', 'Enter PIN', 'Upload File', 'Complete'].map((step, index) => {
              const stepKeys: SubmissionStep[] = ['select', 'pin', 'upload', 'success'];
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
                  {index < 3 && (
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
                {MOCK_PORTALS.filter(p => p.status === 'active').length} Active
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {MOCK_PORTALS.map((portal) => {
                const daysLeft = getDaysUntilDeadline(portal.deadline);
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
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{portal.chairperson}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{portal.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Batch {portal.batch}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{portal.curriculum}</span>
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
            
            {MOCK_PORTALS.filter(p => p.status === 'active').length === 0 && (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Active Portals</h3>
                <p className="text-muted-foreground">
                  There are no graduation portals available at the moment. 
                  Please check back later or contact your department.
                </p>
              </Card>
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
                <p className="text-xs text-muted-foreground">{selectedPortal.department}</p>
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
                    onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
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
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePinSubmit} className="flex-1" disabled={!pin}>
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
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

        {/* Step 3: File Upload */}
        {currentStep === 'upload' && selectedPortal && (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Upload Your Roadmap</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your graduation roadmap file for validation
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium">{selectedPortal.name}</p>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: {selectedPortal.acceptedFormats.join(', ')}
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
                {uploadedFile ? (
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setUploadedFile(null)}
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
                <Button variant="outline" onClick={() => setCurrentStep('pin')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1" 
                  disabled={!uploadedFile || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Submitting...
                    </>
                  ) : (
                    <>Submit <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && selectedPortal && (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your graduation roadmap has been submitted anonymously to {selectedPortal.department}.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Your file has been received by the department
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    The chairperson will review your roadmap
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Results will be posted according to department policy
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
