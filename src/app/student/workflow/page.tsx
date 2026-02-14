'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastHelpers } from '@/hooks/useToast';
import { getPublicCurricula, getPublicDepartments, API_BASE } from '@/lib/api/laravel';
import { 
  ArrowRight, 
  Calendar, 
  Sparkles,
  FileUp,
  ClipboardList,
  GraduationCap
} from 'lucide-react';

interface Curriculum {
  id: string;
  name: string;
  code?: string;
  year?: string;
  version?: string;
  description?: string;
  department?: {
    id: string;
    name: string;
    code?: string;
  };
  faculty?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Department {
  id: string;
  name: string;
  code?: string;
}

interface Concentration {
  id: string;
  name: string;
  description?: string;
}

export default function StudentWorkflowPage() {
  const router = useRouter();
  const { success, error: showError } = useToastHelpers();
  
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('');
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [filteredCurricula, setFilteredCurricula] = useState<Curriculum[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedDepartment && curricula.length > 0) {
      console.log('Filtering curricula for department:', selectedDepartment);
      console.log('All curricula:', curricula);
      const filtered = curricula.filter(
        (curr) => curr.department?.id === selectedDepartment
      );
      console.log('Filtered curricula:', filtered);
      setFilteredCurricula(filtered);
      
      // Reset curriculum if it's not in the filtered list
      if (selectedCurriculum && !filtered.find(c => c.id === selectedCurriculum)) {
        setSelectedCurriculum('');
      }
    } else {
      setFilteredCurricula(curricula);
    }
  }, [selectedDepartment, curricula, selectedCurriculum]);

  useEffect(() => {
    if (selectedCurriculum && selectedDepartment) {
      fetchConcentrations();
    } else {
      setConcentrations([]);
      setSelectedConcentration('');
    }
  }, [selectedCurriculum, selectedDepartment]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [curriculaData, departmentsData] = await Promise.all([
        getPublicCurricula(),
        getPublicDepartments()
      ]);
      
      console.log('Fetched curricula:', curriculaData);
      console.log('Fetched departments:', departmentsData);
      
      setCurricula(curriculaData.curricula || []);
      setDepartments(departmentsData.departments || []);
      
      // Check for saved data
      const savedData = localStorage.getItem('studentAuditData');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.selectedDepartment) setSelectedDepartment(data.selectedDepartment);
        if (data.selectedCurriculum) setSelectedCurriculum(data.selectedCurriculum);
        if (data.selectedConcentration) setSelectedConcentration(data.selectedConcentration);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConcentrations = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/public-concentrations?curriculum_id=${selectedCurriculum}&department_id=${selectedDepartment}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch concentrations');
      }
      
      const data = await response.json();
      setConcentrations(data.concentrations || []);
    } catch (error) {
      console.error('Error fetching concentrations:', error);
      setConcentrations([]);
    }
  };

  const handleStartJourney = () => {
    if (!selectedCurriculum || !selectedDepartment) {
      showError('Please select your department and curriculum');
      return;
    }

    // Save selection to localStorage
    const existingData = localStorage.getItem('studentAuditData');
    const data = existingData ? JSON.parse(existingData) : {};
    
    const updatedData = {
      ...data,
      selectedCurriculum,
      selectedDepartment,
      selectedConcentration: selectedConcentration || '',
      actualDepartmentId: selectedDepartment,
      hasPriorCourses: false, // They can enter later in data-entry
    };
    
    localStorage.setItem('studentAuditData', JSON.stringify(updatedData));
    console.log('Workflow saved:', updatedData);

    // Route to course planning to browse courses with calendar view
    success('Let\'s explore available courses!');
    router.push('/student/management/course-planning');
  };

  const workflowSteps = [
    {
      step: 1,
      title: 'Select Program',
      description: 'Choose curriculum and department',
      icon: <GraduationCap className="w-5 h-5" />,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      step: 2,
      title: 'Browse Courses',
      description: 'View available courses',
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      step: 3,
      title: 'Load Schedule',
      description: 'See offered sections from tentative schedule',
      icon: <ClipboardList className="w-5 h-5" />,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      step: 4,
      title: 'Add History',
      description: 'Enter completed courses (optional)',
      icon: <FileUp className="w-5 h-5" />,
      color: 'bg-primary/10 text-primary border-primary/20',
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Your Academic Journey
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Plan your path to graduation with our intelligent course planning system
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="max-w-3xl mx-auto shadow-lg mb-12">
          <div className="bg-primary p-6 sm:p-8">
            <div className="flex items-center gap-3 text-primary-foreground">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Get Started</h2>
                <p className="text-primary-foreground/90">Choose your program to begin course planning</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* Department Selection */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  1
                </div>
                Select Your Department
              </label>
              <Select 
                value={selectedDepartment} 
                onValueChange={(value) => {
                  setSelectedDepartment(value);
                  setSelectedCurriculum('');
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-12 text-base hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose your department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-base py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dept.name}</span>
                        {dept.code && <span className="text-muted-foreground">({dept.code})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curriculum Selection */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  2
                </div>
                Select Your Curriculum
              </label>
              <Select 
                value={selectedCurriculum} 
                onValueChange={setSelectedCurriculum}
                disabled={!selectedDepartment || loading}
              >
                <SelectTrigger className="h-12 text-base hover:border-primary/50 transition-colors">
                  <SelectValue placeholder={
                    !selectedDepartment 
                      ? "Please select a department first" 
                      : "Choose your curriculum..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredCurricula.map((curr) => (
                    <SelectItem key={curr.id} value={curr.id} className="text-base py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{curr.name}</span>
                        {curr.code && <span className="text-muted-foreground">({curr.code})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concentration Selection (Optional) */}
            {concentrations.length > 0 && (
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    3
                  </div>
                  Select Concentration (Optional)
                </label>
                <Select 
                  value={selectedConcentration} 
                  onValueChange={setSelectedConcentration}
                  disabled={loading}
                >
                  <SelectTrigger className="h-12 text-base hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Choose a concentration (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {concentrations.map((conc) => (
                      <SelectItem key={conc.id} value={conc.id} className="text-base py-3">
                        <div>
                          <div className="font-medium">{conc.name}</div>
                          {conc.description && (
                            <div className="text-sm text-muted-foreground">{conc.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Info Message */}
            {selectedCurriculum && (
              <div className="p-4 rounded-lg border bg-accent/50 mt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Ready to Explore Courses!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll see all available courses with a calendar view showing sections and schedules. You can add completed courses later for prerequisite validation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="pt-6">
              <Button 
                onClick={handleStartJourney}
                disabled={!selectedCurriculum || !selectedDepartment || loading}
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    Start Course Planning
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              What&apos;s Next?
            </h3>
            <p className="text-muted-foreground">
              Here&apos;s how our system will help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => (
              <div 
                key={step.step}
                className="group relative"
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`relative p-4 rounded-xl ${step.color} border-2`}>
                        {step.icon}
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md">
                          {step.step}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
