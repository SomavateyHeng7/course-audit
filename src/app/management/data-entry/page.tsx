'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, createContext, useContext, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart2 } from 'lucide-react';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Define a CourseStatus type for consistent typing
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
  // Use CourseStatus for completedCourses state
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

// Move these to module scope so StatusDropdown can use them
const statusLabels: Record<'not_completed' | 'completed' | 'taking' | 'planning', string> = {
  not_completed: 'Not Completed',
  completed: 'Completed',
  taking: 'Currently Taking',
  planning: 'Planning for Next Semester',
};
const statusOptions: { value: 'not_completed' | 'completed' | 'taking' | 'planning'; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'taking', label: 'Currently Taking' },
  { value: 'planning', label: 'Planning for Next Semester' },
  { value: 'not_completed', label: 'Not Completed' },
];

// Add a helper for status color classes
const statusColorClasses: Record<'not_completed' | 'completed' | 'taking' | 'planning', string> = {
  not_completed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  completed: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200',
  taking: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
  planning: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
};

// Move gradeOptions to module scope so it is accessible everywhere
const gradeOptions: string[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'S'];

export default function DataEntryPage() {
  const router = useRouter();
  // Use context for shared state
  const {
    completedCourses, setCompletedCourses,
    selectedDepartment, setSelectedDepartment,
    selectedCurriculum, setSelectedCurriculum,
    selectedConcentration, setSelectedConcentration,
    freeElectives,
  } = useProgressContext();

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
    'Major Required',
    'Major Elective',
    'Free Elective',
  ];

  // Digital Business Management (BBA 2022) curriculum from CSV
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
      'Free Elective': [],
    },
    bba2022: {
      'General Education': [
        { code: 'BBA1001', title: 'Business Exploration', credits: 3 },
        { code: 'BBA1002', title: 'Microeconomics', credits: 3 },
        { code: 'BBA2001', title: 'Human Behavior', credits: 3 },
        { code: 'BBA2002', title: 'Economic and Financial Environment', credits: 3 },
        { code: 'BG1001', title: 'English I', credits: 3 },
        { code: 'BG1002', title: 'English II', credits: 3 },
        { code: 'BG2000', title: 'English III', credits: 3 },
        { code: 'BG2001', title: 'English IV', credits: 3 },
        { code: 'GE1204', title: 'Physical Education', credits: 1 },
        { code: 'GE1302', title: 'Ecology and Sustainability', credits: 3 },
        { code: 'GE1403', title: 'Communication in Thai', credits: 3 },
        { code: 'GE1405', title: 'Thai Language and Culture (Only for International students)', credits: 0 },
        { code: 'GE1408', title: 'Thai Usage (For students who graduated from Inter Schools)', credits: 0 },
        { code: 'GE2102', title: 'Human Heritage and Globalization', credits: 3 },
        { code: 'GE2202', title: 'Ethics', credits: 3 },
        { code: 'MA1200', title: 'Mathematics for Business', credits: 3 },
      ],
      'Core Courses': [
        { code: 'BBA1101', title: 'Seminar in Business I', credits: 1 },
        { code: 'BBA1102', title: 'Data and Information Literacy', credits: 3 },
        { code: 'BBA1103', title: 'Fundamentals of Financial Accounting', credits: 3 },
        { code: 'BBA1104', title: 'Fundamentals of Marketing', credits: 3 },
        { code: 'BBA2101', title: 'Fundamentals of Managerial Accounting', credits: 3 },
        { code: 'BBA2102', title: 'Organization and Management', credits: 3 },
        { code: 'BBA2103', title: 'Corporate Finance', credits: 3 },
        { code: 'BBA2104', title: 'Global Strategy and Communication', credits: 3 },
        { code: 'BBA2105', title: 'Operations and Supply Chain Management', credits: 3 },
        { code: 'BBA2106', title: 'Seminar in Business II', credits: 1 },
        { code: 'BBA3101', title: 'Business Research', credits: 3 },
        { code: 'BBA4101', title: 'Entrepreneurship', credits: 3 },
        { code: 'LAW1201', title: 'Business Laws for Entrepreneurs', credits: 3 },
        { code: 'SA1001', title: 'Business Statistics I', credits: 2 },
        { code: 'SA2001', title: 'Business Statistics II', credits: 2 },
      ],
      'Major Required': [
        { code: 'BDM3201', title: 'Digital Business', credits: 3 },
        { code: 'BDM3202', title: 'Digital Commerce', credits: 3 },
        { code: 'BDM3203', title: 'Cybersecurity', credits: 3 },
        { code: 'BDM3204', title: 'Enterprise Resource Planning', credits: 3 },
        { code: 'BDM3205', title: 'Information Systems Strategy, Management, and Acquisition', credits: 3 },
        { code: 'BDM3301', title: 'Data Analytics Fundamentals', credits: 3 },
        { code: 'BDM3302', title: 'Data Management', credits: 3 },
        { code: 'BDM3303', title: 'Data Mining', credits: 3 },
        { code: 'BDM3304', title: 'Systems Analysis and Design', credits: 3 },
        { code: 'BDM3305', title: 'Big Data Analytics', credits: 3 },
      ],
      'Major Elective': [
        // 6 more electives to be filled by student selection
      ],
      'Free Elective': [
        // 4 free electives to be filled by student selection
      ],
    },
  };

  // Add mockConcentrations for BBA 2022 > Digital Business Management
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
        Major: [
          { code: 'BDM3201', title: 'Digital Business', credits: 3 },
          { code: 'BDM3202', title: 'Digital Commerce', credits: 3 },
          { code: 'BDM3203', title: 'Cybersecurity', credits: 3 },
          { code: 'BDM3204', title: 'Enterprise Resourse Planning', credits: 3 },
          { code: 'BDM3205', title: 'Information Systems Strategy, Management, and Acquisition', credits: 3 },
          { code: 'BDM3301', title: 'Data Analytics Fundamentals', credits: 3 },
          { code: 'BDM3302', title: 'Data Management', credits: 3 },
          { code: 'BDM3303', title: 'Data Mining', credits: 3 },
          { code: 'BDM3304', title: 'Systems Analysis and Design', credits: 3 },
          { code: 'BDM3305', title: 'Big Data Analytics', credits: 3 },
        ],
      },
    },
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-2">
        <Button variant="outline" onClick={handleBackToManagement} className="mr-4">
          Back to Management
        </Button>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Manual Course Entry</h1>

      {/* Step 1: Select Faculty, Department, Curriculum, and Concentration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

      {/* Only show curriculum course list if all three are selected (concentration can be 'none') */}
      {selectedDepartment && selectedCurriculum && selectedConcentration && (
        <div className="flex flex-col gap-8">
          {/* Render all categories in the new order, with special logic for Major (concentration) if needed */}
          {courseTypeOrder.map(category => {
            if (category === 'Major' && selectedCurriculum === 'bscs2022') {
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <div className="text-lg font-bold mb-2 text-foreground p-4 pb-0">Major</div>
                  <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
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
                                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                    {completedCourses[course.code]?.status === 'completed' && (
                                      <Select
                                        value={completedCourses[course.code]?.grade || ''}
                                        onValueChange={value => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                          ...prev,
                                          [course.code]: {
                                            ...prev[course.code],
                                            grade: value
                                          }
                                        }))}
                                      >
                                        <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                          <SelectValue placeholder="Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {gradeOptions.map((g: string) => (
                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    <StatusDropdown
                                      code={course.code}
                                      status={completedCourses[course.code]?.status || 'not_completed'}
                                      setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                        ...prev,
                                        [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
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
                          <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                              <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                              {completedCourses[course.code]?.status === 'completed' && (
                                <Select
                                  value={completedCourses[course.code]?.grade || ''}
                                  onValueChange={value => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                    ...prev,
                                    [course.code]: {
                                      ...prev[course.code],
                                      grade: value
                                    }
                                  }))}
                                >
                                  <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                    <SelectValue placeholder="Grade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gradeOptions.map((g: string) => (
                                      <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <StatusDropdown
                                code={course.code}
                                status={completedCourses[course.code]?.status || 'not_completed'}
                                setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                  ...prev,
                                  [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                                }))}
                              />
                            </div>
                          </div>
                        ))
                      ))
                    )}
                  </div>
                </div>
              );
            }
            if (category === 'Major Elective') {
              // Major Elective: allow up to 21 credits, add UI for adding/removing electives, similar to Free Elective
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <div className="text-lg font-bold mb-2 text-foreground p-4 pb-0">Major Elective</div>
                  <div className="text-sm text-muted-foreground p-4 mb-2">
                    Students can take up to <span className="font-bold">21 credits</span> of business electives. Check the list of allowed Business Elective Courses!
                  </div>
                  <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    <MajorElectiveAddButton maxCredits={21} />
                    {/* Render static major electives, if any */}
                    {(curriculumCourses[selectedCurriculum]?.['Major Elective'] || []).map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                          <StatusDropdown
                            code={course.code}
                            status={completedCourses[course.code]?.status || 'not_completed'}
                            setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                              ...prev,
                              [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                            }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
// Add this component at the top level of the file (outside DataEntryPage)
function MajorElectiveAddButton({ maxCredits }: { maxCredits: number }) {
  const { completedCourses, setCompletedCourses } = useProgressContext();
  // Use local state for major electives
  const [majorElectives, setMajorElectives] = useState<{ code: string; title: string; credits: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', credits: '' });

  // Calculate total credits
  const totalCredits = majorElectives.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  const handleAdd = () => {
    if (!form.code.trim() || !form.title.trim() || !form.credits) return;
    const newCredits = Number(form.credits);
    if (totalCredits + newCredits > maxCredits) return;
    setMajorElectives(prev => [...prev, { code: form.code.trim(), title: form.title.trim(), credits: newCredits }]);
    setForm({ code: '', title: '', credits: '' });
  };

  const handleRemove = (idx: number) => {
    setMajorElectives(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
        onClick={() => setShowForm((v) => !v)}
      >
        <span className="text-lg leading-none">+</span> Add Major Elective
      </button>
      {showForm && (
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <input
            type="text"
            placeholder="Course Code"
            className="w-full md:w-32 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Course Name"
            className="w-full md:w-64 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Credits"
            className="w-full md:w-24 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.credits}
            min={0}
            max={maxCredits - totalCredits}
            onChange={e => {
              let value = e.target.value;
              if (Number(value) > maxCredits - totalCredits) value = String(maxCredits - totalCredits);
              setForm(f => ({ ...f, credits: value }));
            }}
          />
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
            onClick={handleAdd}
            disabled={totalCredits >= maxCredits}
          >
            Add
          </button>
        </div>
      )}
      {/* List of added major electives */}
      {majorElectives.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {majorElectives.map((course, idx) => (
            <div key={course.code + idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                <span className="text-sm text-muted-foreground">{course.credits} credits</span>
              </div>
              <div className="flex flex-row items-center gap-3 mt-2 sm:mt-0">
                <StatusDropdown
                  code={course.code}
                  status={completedCourses[course.code]?.status || 'not_completed'}
                  setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                    ...prev,
                    [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
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
      <div className="text-xs text-muted-foreground mt-2">Total Major Elective Credits: {totalCredits} / {maxCredits}</div>
    </div>
  );
}
            if (category === 'Free Elective') {
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <div className="text-lg font-bold text-foreground p-4 pb-0">Free Elective</div>
                  <div className="text-sm text-muted-foreground p-4 mb-2">
                    Students can take free elective courses of 12 credits from any faculty in Assumption University upon completion of the prerequisite. Check with academic advisor for the course availability.
                  </div>
                  <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    <FreeElectiveAddButton />
                    {/* Render static free electives, if any */}
                    {(curriculumCourses[selectedCurriculum]?.['Free Elective'] || []).map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                          {completedCourses[course.code]?.status === 'completed' && (
                            <Select
                              value={completedCourses[course.code]?.grade || ''}
                              onValueChange={value => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                ...prev,
                                [course.code]: {
                                  ...prev[course.code],
                                  grade: value
                                }
                              }))}
                            >
                              <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {gradeOptions.map((g: string) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <StatusDropdown
                            code={course.code}
                            status={completedCourses[course.code]?.status || 'not_completed'}
                            setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                              ...prev,
                              [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                            }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            // General Education, Core Courses
            return (
              <div key={category} className="border border-border rounded-lg mb-6 p-6">
                <div className="text-lg font-bold mb-2 text-foreground p-4 pb-0">{category}</div>
                <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                  {(curriculumCourses[selectedCurriculum]?.[category] || []).length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                  ) : (
                    curriculumCourses[selectedCurriculum][category].map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                          {completedCourses[course.code]?.status === 'completed' && (
                            <Select
                              value={completedCourses[course.code]?.grade || ''}
                              onValueChange={value => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                ...prev,
                                [course.code]: {
                                  ...prev[course.code],
                                  grade: value
                                }
                              }))}
                            >
                              <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {gradeOptions.map((g: string) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <StatusDropdown
                            code={course.code}
                            status={completedCourses[course.code]?.status || 'not_completed'}
                            setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                              ...prev,
                              [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
                            }))}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              variant="default"
              onClick={() => {
                // Gather all course data for export
                const allCourses: any[] = [];
                courseTypeOrder.forEach(category => {
                  const courses = (curriculumCourses[selectedCurriculum]?.[category] || []);
                  courses.forEach(course => {
                    allCourses.push({
                      Category: category,
                      Code: course.code,
                      Title: course.title,
                      Credits: course.credits,
                      Status: completedCourses[course.code]?.status || 'not_completed',
                      Grade: completedCourses[course.code]?.grade || '',
                    });
                  });
                });
                // Add free electives
                freeElectives.forEach(course => {
                  allCourses.push({
                    Category: 'Free Elective',
                    Code: course.code,
                    Title: course.title,
                    Credits: course.credits,
                    Status: completedCourses[course.code]?.status || 'not_completed',
                    Grade: completedCourses[course.code]?.grade || '',
                  });
                });
                const ws = XLSX.utils.json_to_sheet(allCourses);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Courses');
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'courses.xlsx');
              }}
            >
              <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Download as Excel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" variant="default" onClick={() => router.push('/management/progress')}>
              <BarChart2 className="w-5 h-5 mr-2 inline-block" />
              Show Progress
            </Button>
          </div>
            </div>
      )}
            </div>
  );
}

// Add this component at the top level of the file (outside DataEntryPage)
function FreeElectiveAddButton() {
  const { completedCourses, setCompletedCourses, freeElectives, setFreeElectives } = useProgressContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', credits: '' });


  const handleAdd = () => {
    if (!form.code.trim() || !form.title.trim() || !form.credits) return;
    const newEntry = { code: form.code.trim(), title: form.title.trim(), credits: Number(form.credits) };
    setFreeElectives(prev => [...prev, newEntry]);
    setForm({ code: '', title: '', credits: '' });
  };



  const handleRemove = (idx: number) => {
    setFreeElectives(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
        onClick={() => setShowForm((v) => !v)}
      >
        <span className="text-lg leading-none">+</span> Add Free Elective
      </button>
      {showForm && (
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <input
            type="text"
            placeholder="Course Code"
            className="w-full md:w-32 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Course Name"
            className="w-full md:w-64 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Credits"
            className="w-full md:w-24 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.credits}
            min={0}
            max={3}
            onChange={e => {
              let value = e.target.value;
              if (Number(value) > 3) value = '3';
              setForm(f => ({ ...f, credits: value }));
            }}
          />
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
      )}
      {/* List of added free electives */}
      {freeElectives.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {freeElectives.map((course, idx) => (
            <div key={course.code + idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                <span className="text-sm text-muted-foreground">{course.credits} credits</span>
              </div>
              <div className="flex flex-row items-center gap-3 mt-2 sm:mt-0">
                {completedCourses[course.code]?.status === 'completed' && (
                  <Select
                    value={completedCourses[course.code]?.grade || ''}
                    onValueChange={value => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                      ...prev,
                      [course.code]: {
                        ...prev[course.code],
                        grade: value
                      }
                    }))}
                  >
                    <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((g: string) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <StatusDropdown
                  code={course.code}
                  status={completedCourses[course.code]?.status || 'not_completed'}
                  setStatus={status => setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                    ...prev,
                    [course.code]: { ...prev[course.code], status, ...(status !== 'completed' ? { grade: '' } : {}) }
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

function StatusDropdown({ code, status, setStatus }: { code: string; status: 'not_completed' | 'completed' | 'taking' | 'planning'; setStatus: (status: 'not_completed' | 'completed' | 'taking' | 'planning') => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !(ref.current as HTMLDivElement).contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`flex items-center gap-2 px-3 py-1 border border-gray-400 rounded text-sm font-medium focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${statusColorClasses[status]}`}
        onClick={() => setOpen(v => !v)}
      >
        {statusLabels[status]}
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-lg">
          {statusOptions.map((opt: { value: 'not_completed' | 'completed' | 'taking' | 'planning'; label: string }) => (
            <button
              key={opt.value}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${status === opt.value ? `font-bold ${statusColorClasses[opt.value]}` : ''}`}
              onClick={() => { setStatus(opt.value); setOpen(false); }}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
