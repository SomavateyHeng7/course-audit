'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, createContext, useContext } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { FaTrash } from 'react-icons/fa';


interface CourseStatus {
  status: 'not_completed' | 'completed' | 'taking' | 'planning';
  grade?: string;
}

interface ProgressContextType {
  completedCourses: { [code: string]: CourseStatus };
  setCompletedCourses: React.Dispatch<React.SetStateAction<{ [code: string]: CourseStatus }>>;
  selectedDepartment: string;
  setSelectedDepartment: React.Dispatch<React.SetStateAction<string>>;
  selectedCurriculum: string;
  setSelectedCurriculum: React.Dispatch<React.SetStateAction<string>>;
  selectedConcentration: string;
  setSelectedConcentration: React.Dispatch<React.SetStateAction<string>>;
  freeElectives: { code: string; title: string; credits: number }[];
  setFreeElectives: React.Dispatch<React.SetStateAction<{ code: string; title: string; credits: number }[]>>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be used within ProgressProvider');
  return ctx;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('');
  const [completedCourses, setCompletedCourses] = useState<{ [code: string]: CourseStatus }>({});
  const [freeElectives, setFreeElectives] = useState<{ code: string; title: string; credits: number }[]>([]);

  return (
    <ProgressContext.Provider value={{
      completedCourses, setCompletedCourses,
      selectedDepartment, setSelectedDepartment,
      selectedCurriculum, setSelectedCurriculum,
      selectedConcentration, setSelectedConcentration,
      freeElectives, setFreeElectives,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

const statusLabels: Record<'not_completed' | 'completed' | 'taking' | 'planning', string> = {
  not_completed: 'Not Completed',
  completed: 'Completed',
  taking: 'Taking',
  planning: 'Planning',
};

const gradeOptions: string[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'S'];

export default function DataEntryPage() {
  const router = useRouter();
  const {
    completedCourses, setCompletedCourses,
    selectedDepartment, setSelectedDepartment,
    selectedCurriculum, setSelectedCurriculum,
    selectedConcentration, setSelectedConcentration,
    freeElectives, setFreeElectives,
  } = useProgressContext();

  const [form, setForm] = useState({ code: '', title: '', credits: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    if (!form.code.trim() || !form.title.trim() || !form.credits) return;
    const newEntry = { code: form.code.trim(), title: form.title.trim(), credits: Number(form.credits) };
    setFreeElectives(prev => [...prev, newEntry]);
    setForm({ code: '', title: '', credits: '' });
  };

  const handleRemove = (idx: number) => {
    setFreeElectives(prev => prev.filter((_, i) => i !== idx));
  };

  const handleContinue = () => {
    // Check all completed courses for missing grades
    const coursesWithoutGrades = Object.entries(completedCourses)
      .filter(([_, status]) => status.status === 'completed' && !status.grade)
      .map(([code]) => code);

    if (coursesWithoutGrades.length > 0) {
      alert(`Please enter grades for the following completed courses:\n${coursesWithoutGrades.join('\n')}`);
      return;
    }

    router.push('/management/progress');
  };

  // Mock options
  const facultyOptions = [
    { value: 'vmes', label: 'VMES' },
    { value: 'msme', label: 'MSME' },
  ];
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const departmentOptions: { [faculty: string]: { value: string; label: string }[] } = {
    vmes: [
      { value: 'cs', label: 'Computer Science' },
    ],
    msme: [
      { value: 'bba', label: 'BBA' },
    ],
  };
  const curriculumOptions: { [key: string]: { value: string; label: string }[] } = {
    cs: [
      { value: 'bscs2022', label: 'BSCS 2022' },
    ],
    bba: [
      { value: 'bba2022', label: 'BBA 2022' },
    ],
  };
  const concentrationOptions: { [key: string]: { value: string; label: string }[] } = {
    bscs2022: [
      { value: 'se', label: 'Software Engineering' },
      { value: 'ds', label: 'Data Science' },
      { value: 'none', label: 'No Concentration' },
    ],
    bba2022: [
      { value: 'dbm', label: 'Digital Business Management' },
    ],
  };

  // Reset lower selections when a higher one changes
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedCurriculum('');
    setSelectedConcentration('');
  };
  const handleCurriculumChange = (value: string) => {
    setSelectedCurriculum(value);
    setSelectedConcentration('');
  };

  const handleBackToManagement = () => {
    router.push('/management');
  };

  // Use the default course types/categories in this order
  const courseTypeOrder = [
    'General Education',
    'Core Courses',
    'Major',
    'Major Elective',
    'Free Elective',
    'Ethics Seminars',
  ];

  const curriculumCourses: { [key: string]: { [category: string]: { code: string; title: string; credits: number }[] } } = {
    bscs2022: {
      'General Education': [
        { code: 'ELE1001', title: 'Communication English I', credits: 3 },
        { code: 'ELE1002', title: 'Communication English II', credits: 3 },
        { code: 'GE1411', title: 'Thai Language for Multicultural Communication', credits: 2 },
        { code: 'GE2110', title: 'Human Civilizations and Global Citizens', credits: 2 },
      ],
      'Core Courses': [
        { code: 'CS101', title: 'Intro to Computer Science', credits: 3 },
        { code: 'CS201', title: 'Data Structures', credits: 3 },
        { code: 'CS301', title: 'Algorithms', credits: 3 },
      ],
      'Major': [],
      'Major Elective': [],
      'Ethics Seminars': [
        { code: 'BG14031', title: 'Professional Ethics Seminar I', credits: 0 },
        { code: 'BG14032', title: 'Professional Ethics Seminar II', credits: 0 },
        { code: 'BG14033', title: 'Professional Ethics Seminar III', credits: 0 },
        { code: 'BG14034', title: 'Professional Ethics Seminar IV', credits: 0 },
        { code: 'BG14035', title: 'Professional Ethics Seminar V', credits: 0 },
        { code: 'BG14036', title: 'Professional Ethics Seminar VI', credits: 0 },
        { code: 'BG14037', title: 'Professional Ethics Seminar VII', credits: 0 },
        { code: 'BG14038', title: 'Professional Ethics Seminar VIII', credits: 0 },
      ],
      'Free Elective': [], // Empty array since free electives are user-defined
    },
    bba2022: {
      'General Education': [],
      'Core Courses': [],
      'Major': [],
      'Major Elective': [],
      'Ethics Seminars': [
        { code: 'BG14031', title: 'Professional Ethics Seminar I', credits: 0 },
        { code: 'BG14032', title: 'Professional Ethics Seminar II', credits: 0 },
        { code: 'BG14033', title: 'Professional Ethics Seminar III', credits: 0 },
        { code: 'BG14034', title: 'Professional Ethics Seminar IV', credits: 0 },
        { code: 'BG14035', title: 'Professional Ethics Seminar V', credits: 0 },
        { code: 'BG14036', title: 'Professional Ethics Seminar VI', credits: 0 },
        { code: 'BG14037', title: 'Professional Ethics Seminar VII', credits: 0 },
        { code: 'BG14038', title: 'Professional Ethics Seminar VIII', credits: 0 },
      ],
      'Free Elective': [], 
    },
  };


  const mockConcentrations: { [curriculum: string]: { [concentration: string]: { label: string; Major: { code: string; title: string; credits: number }[] } } } = {
    bscs2022: {
      se: {
        label: 'Software Engineering',
        Major: [
          { code: 'CS520', title: 'Software Architecture', credits: 3 },
          { code: 'CS521', title: 'DevOps Practices', credits: 3 },
        ],
      },
      ds: {
        label: 'Data Science',
        Major: [
          { code: 'CS530', title: 'Big Data Analytics', credits: 3 },
          { code: 'CS531', title: 'Data Mining', credits: 3 },
        ],
      },
      none: {
        label: 'No Concentration',
        Major: [],
      },
    },
    bba2022: {
      dbm: {
        label: 'Digital Business Management',
        Major: [],
      },
    },
  };

  return (
    <div className="min-h-screen">
      <div className="z-50 bg-background">
        <div className="flex items-center justify-between mb-6 pt-6 px-6">
          <h1 className="text-3xl font-bold text-foreground">Manual Course Entry</h1>
          <Button variant="outline" onClick={handleBackToManagement}>
            Back to Management
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 px-6">
          <div>
            <label className="block font-bold mb-2 text-gray-900 dark:text-foreground">Select Faculty</label>
            <Select value={selectedFaculty} onValueChange={value => {
              setSelectedFaculty(value);
              setSelectedDepartment('');
              setSelectedCurriculum('');
              setSelectedConcentration('');
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose faculty" />
              </SelectTrigger>
              <SelectContent>
                {facultyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block font-bold mb-2 text-gray-900 dark:text-foreground">Select Department</label>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={!selectedFaculty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose department" />
              </SelectTrigger>
              <SelectContent>
                {(departmentOptions[selectedFaculty] || []).map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-900 dark:text-foreground">Select Curriculum</label>
            <Select value={selectedCurriculum} onValueChange={handleCurriculumChange} disabled={!selectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedDepartment ? 'Select department first' : 'Choose curriculum'} />
              </SelectTrigger>
              <SelectContent>
                {(curriculumOptions[selectedDepartment] || []).map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-900 dark:text-foreground">Select Concentration</label>
            <Select value={selectedConcentration} onValueChange={setSelectedConcentration} disabled={!selectedCurriculum}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedCurriculum ? 'Select curriculum first' : 'Choose concentration'} />
              </SelectTrigger>
              <SelectContent>
                {(concentrationOptions[selectedCurriculum] || []).map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedDepartment && selectedCurriculum && selectedConcentration && (
          <div className="border-border bg-white dark:bg-background">
            <div className="flex items-center gap-6 px-6 py-3 max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                </div>
                <span className="text-sm text-muted-foreground">Planning courses for next semester</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                </div>
                <span className="text-sm text-muted-foreground">Taking courses for the current semester</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-lime-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-lime-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">Completed courses</span>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          {selectedDepartment && selectedCurriculum && selectedConcentration && (
            <div className="border border-border rounded-lg">
              <div className="p-6">
                <div className="flex flex-col gap-8">
                  {courseTypeOrder.map(category => {
                    if (category === 'Major' && selectedCurriculum === 'bscs2022') {
                      return (
                        <div key={category}>
                          <div className="border border-border rounded-lg mb-6 p-6">
                            <div className="text-lg font-bold mb-4 text-foreground">{category}</div>
                            <div className="bg-background rounded-lg flex flex-col gap-3">
                              {(!selectedConcentration || selectedConcentration === 'none') ? (
                                (() => {
                                  const realConcentrations = Object.entries(mockConcentrations[selectedCurriculum] || {}).filter(([concKey]) => concKey !== 'none');
                                  if (realConcentrations.length === 0) {
                                    return <div className="text-muted-foreground text-center py-4">No concentrations available.</div>;
                                  }
                                  return realConcentrations.map(([concKey, concData]) => (
                                    <div key={concKey} className="mb-6">
                                      <div className="font-semibold text-base mb-2">{concData.label}</div>
                                      {concData.Major.length === 0 ? (
                                        <div className="text-muted-foreground text-center py-2">No major courses for this concentration.</div>
                                      ) : (
                                        concData.Major.map(course => (
                                          <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                              <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                              <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                              <StatusRadioGroup
                                                code={course.code}
                                                status={completedCourses[course.code]?.status || 'not_completed'}
                                                setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                                  ...prev,
                                                  [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                                }))}
                                                grade={completedCourses[course.code]?.grade}
                                                setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                                  ...prev,
                                                  [course.code]: {
                                                    ...prev[course.code],
                                                    grade
                                                  }
                                                }))}
                                              />
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  ));
                                })()
                              ) : (
                                (mockConcentrations[selectedCurriculum]?.[selectedConcentration]?.Major.length === 0 ? (
                                  <div className="text-muted-foreground text-center py-4">No major courses for this concentration.</div>
                                ) : (
                                  mockConcentrations[selectedCurriculum][selectedConcentration].Major.map(course => (
                                    <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                        <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                        <StatusRadioGroup
                                          code={course.code}
                                          status={completedCourses[course.code]?.status || 'not_completed'}
                                          setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                            ...prev,
                                            [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                          }))}
                                          grade={completedCourses[course.code]?.grade}
                                          setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                            ...prev,
                                            [course.code]: {
                                              ...prev[course.code],
                                              grade
                                            }
                                          }))}
                                        />
                                      </div>
                                    </div>
                                  ))
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (category === 'Major Elective') {
                      return (
                        <div key={category} className="border border-border rounded-lg mb-3 p-3">
                          <div className="text-lg font-bold mb-2 text-foreground p-4 pb-0">Major Elective</div>
                          <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                            {(curriculumCourses[selectedCurriculum]?.['Major Elective'] || []).length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                            ) : (
                              curriculumCourses[selectedCurriculum]['Major Elective'].map(course => (
                                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                    <StatusRadioGroup
                                      code={course.code}
                                      status={completedCourses[course.code]?.status || 'not_completed'}
                                      setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                      }))}
                                      grade={completedCourses[course.code]?.grade}
                                      setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: {
                                          ...prev[course.code],
                                          grade
                                        }
                                      }))}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (category === 'Ethics Seminars') {
                      return (
                        <div key={category} className="border border-border rounded-lg mb-3 p-3">
                          <div className="text-lg font-bold text-foreground p-4 pb-0">Ethics Seminars</div>
                          <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                            {(curriculumCourses[selectedCurriculum]?.['Ethics Seminars'] || []).length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                            ) : (
                              curriculumCourses[selectedCurriculum]['Ethics Seminars'].map(course => (
                                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                    <StatusRadioGroup
                                      code={course.code}
                                      status={completedCourses[course.code]?.status || 'not_completed'}
                                      setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                      }))}
                                      grade={completedCourses[course.code]?.grade}
                                      setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: {
                                          ...prev[course.code],
                                          grade
                                        }
                                      }))}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (category === 'Free Elective') {
                      return (
                        <div key={category} className="border border-border rounded-lg mb-3 p-3">
                          <div className="text-lg font-bold text-foreground p-4 pb-0">Free Elective</div>
                          <div className="text-sm text-muted-foreground p-4 mb-2">
                            Students can take free elective courses of 12 credits from any faculty in Assumption University upon completion of the prerequisite. Check with academic advisor for the course availability.
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background rounded-lg p-4">
                            {/* Manual Entry Column */}
                            <div className="border border-border rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-4">Manual Entry</h3>
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                  <input
                                    type="text"
                                    placeholder="Course Code"
                                    className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Course Name"
                                    className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Credits"
                                    className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                                    value={form.credits}
                                    min={0}
                                    max={3}
                                    onChange={e => {
                                      let value = e.target.value;
                                      if (Number(value) > 3) value = '3';
                                      setForm(f => ({ ...f, credits: value }));
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
                                  onClick={handleAdd}
                                >
                                  <span className="text-lg leading-none">+</span> Add Course
                                </button>
                              </div>
                            </div>


                            <div className="border border-border rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-4">Search Courses</h3>
                              <div className="flex flex-col gap-4">
                                <input
                                  type="text"
                                  placeholder="Search for courses..."
                                  className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="flex-1 min-h-[200px] border border-border rounded-lg p-2">
                                  <div className="text-sm text-muted-foreground text-center py-8">
                                    Search results will appear here
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* List of added free electives */}
                          {freeElectives.length > 0 && (
                            <div className="mt-4 flex flex-col gap-2">
                              {freeElectives.map((course, idx) => (
                                <div key={course.code + idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <div className="flex flex-row items-center gap-3 mt-2 sm:mt-0">
                                    <StatusRadioGroup
                                      code={course.code}
                                      status={completedCourses[course.code]?.status || 'not_completed'}
                                      setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                      }))}
                                      grade={completedCourses[course.code]?.grade}
                                      setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: {
                                          ...prev[course.code],
                                          grade
                                        }
                                      }))}
                                    />
                                    <button
                                      type="button"
                                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                      onClick={() => handleRemove(idx)}
                                      title="Delete Course"
                                    >
                                      <FaTrash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={category}>
                        <div className="border border-border rounded-lg mb-6 p-6">
                          <div className="text-lg font-bold mb-4 text-foreground">{category}</div>
                          <div className="bg-background rounded-lg flex flex-col gap-3">
                            {(curriculumCourses[selectedCurriculum]?.[category] || []).length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                            ) : (
                              curriculumCourses[selectedCurriculum][category].map(course => (
                                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background rounded-lg px-4 py-3 border border-border mb-2 transition-shadow hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                    <StatusRadioGroup
                                      code={course.code}
                                      status={completedCourses[course.code]?.status || 'not_completed'}
                                      setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                      }))}
                                      grade={completedCourses[course.code]?.grade}
                                      setGrade={grade => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: {
                                          ...prev[course.code],
                                          grade
                                        }
                                      }))}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


                <div className="flex justify-end gap-4 mt-2 pt-2 border-border">
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90" 
                    variant="default" 
                    onClick={handleContinue}
                  >
                    <ArrowRight className="w-5 h-5 mr-2 inline-block" />
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusRadioGroup({ code, status, setStatus, grade, setGrade }: { code: string; status: 'not_completed' | 'completed' | 'taking' | 'planning'; setStatus: (status: 'not_completed' | 'completed' | 'taking' | 'planning') => void; grade?: string; setGrade?: (grade: string) => void }) {
  const options = [
    { value: 'planning', color: 'text-amber-400', label: 'Planning' },
    { value: 'taking', color: 'text-cyan-500', label: 'Taking' },
    { value: 'completed', color: 'text-lime-500', label: 'Completed' },
  ];


  const isEthicsSeminar = code.startsWith('BG1403');

  // Handle status change with automatic grade setting for ethics seminars
  const handleStatusChange = (newStatus: 'not_completed' | 'completed' | 'taking' | 'planning') => {
    setStatus(newStatus);
    if (isEthicsSeminar && newStatus === 'completed' && setGrade) {
      setGrade('S');
    }
  };

  if (status !== 'not_completed') {
    const selected = options.find(opt => opt.value === status);
    return (
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          className={`relative flex items-center justify-center w-8 h-8 transition-all
            ${selected?.color}
            opacity-100
            hover:opacity-100
            focus:outline-none focus:ring-2 focus:ring-ring
          `}
          onClick={() => handleStatusChange('not_completed')}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" className="transition-all" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 12l3 3l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="font-bold capitalize text-foreground text-sm">{statusLabels[status]}</span>
        
        {status === 'completed' && setGrade && !isEthicsSeminar && (
          <Select value={grade || ''} onValueChange={setGrade}>
            <SelectTrigger className="ml-2 border border-input rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {gradeOptions.map((g: string) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {status === 'completed' && isEthicsSeminar && (
          <span className="ml-2 text-sm text-muted-foreground">Grade: S</span>
        )}
      </div>
    );
  }

  // Default: all three buttons
  return (
    <div className="flex items-center gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`relative flex items-center justify-center w-8 h-8 transition-all
            ${opt.color}
            focus:outline-none focus:ring-2 focus:ring-ring
          `}
          onClick={() => handleStatusChange(opt.value as any)}
        >
          <svg
            className="w-6 h-6 transition-colors"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="8" className="transition-all" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      ))}
    </div>
  );
} 

