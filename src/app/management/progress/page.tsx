"use client";
import { useProgressContext } from "../data-entry/page";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, Calendar, CheckCircle, Clock, X, Maximize2 } from "lucide-react";
import { useState, ReactElement } from "react";

interface Course {
  code: string;
  title: string;
  category: string;
  grade?: string;
  credits: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactElement | null;
  courses: Course[];
}

const CourseModal = ({ isOpen, onClose, title, icon, courses }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2234] rounded-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            {courses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No courses available.</div>
            ) : (
              courses.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-white dark:bg-background rounded-lg px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm dark:text-gray-200">{c.code} - {c.title}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.category}</span>
                  </div>
                  {c.grade && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Grade: {c.grade}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const categoryOrder = [
  "General Education",
  "Core Courses",
  "Major",
  "Major Elective",
  "Free Elective",
  "Ethics Seminars",
];

export default function ProgressPage() {
  const router = useRouter();
  const {
    completedCourses,
    selectedCurriculum,
    selectedConcentration,
    freeElectives,
  } = useProgressContext();

  // State for modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: string;
    courses: Course[];
    title: string;
    icon: ReactElement | null;
  }>({
    isOpen: false,
    type: '',
    courses: [],
    title: '',
    icon: null
  });

  const openModal = (type: string, courses: Course[], title: string, icon: ReactElement) => {
    setModalState({
      isOpen: true,
      type,
      courses,
      title,
      icon
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Mock curriculumCourses and mockConcentrations (should match data-entry page)
  const curriculumCourses: { [key: string]: { [category: string]: { code: string; title: string; credits: number }[] } } = {
    bscs2022: {
      "General Education": [
        { code: "ELE1001", title: "Communication English I", credits: 3 },
        { code: "ELE1002", title: "Communication English II", credits: 3 },
        { code: "GE1411", title: "Thai Language for Multicultural Communication", credits: 2 },
        { code: "GE2110", title: "Human Civilizations and Global Citizens", credits: 2 },
      ],
      "Core Courses": [
        { code: "CS101", title: "Intro to Computer Science", credits: 3 },
        { code: "CS201", title: "Data Structures", credits: 3 },
        { code: "CS301", title: "Algorithms", credits: 3 },
      ],
      Major: [
        { code: "CS410", title: "AI Fundamentals", credits: 3 },
        { code: "CS420", title: "Web Development", credits: 3 },
      ],
      "Major Elective": [
        { code: "CS430", title: "Mobile App Dev", credits: 3 },
        { code: "CS440", title: "Cloud Computing", credits: 3 },
      ],
      "Ethics Seminars": [
        { code: "BG14031", title: "Professional Ethics Seminar I", credits: 0 },
        { code: "BG14032", title: "Professional Ethics Seminar II", credits: 0 },
        { code: "BG14033", title: "Professional Ethics Seminar III", credits: 0 },
        { code: "BG14034", title: "Professional Ethics Seminar IV", credits: 0 },
        { code: "BG14035", title: "Professional Ethics Seminar V", credits: 0 },
        { code: "BG14036", title: "Professional Ethics Seminar VI", credits: 0 },
        { code: "BG14037", title: "Professional Ethics Seminar VII", credits: 0 },
        { code: "BG14038", title: "Professional Ethics Seminar VIII", credits: 0 },
      ],
      "Free Elective": [
        { code: "ART1001", title: "Art Appreciation", credits: 3 },
      ],
    },

  };
  const mockConcentrations: { [curriculum: string]: { [concentration: string]: { label: string; Major: { code: string; title: string; credits: number }[] } } } = {
    bscs2022: {
      ai: {
        label: "Artificial Intelligence",
        Major: [
          { code: "CS510", title: "Machine Learning", credits: 3 },
          { code: "CS511", title: "Neural Networks", credits: 3 },
        ],
      },
      se: {
        label: "Software Engineering",
        Major: [
          { code: "CS520", title: "Software Architecture", credits: 3 },
          { code: "CS521", title: "DevOps Practices", credits: 3 },
        ],
      },
      ds: {
        label: "Data Science",
        Major: [
          { code: "CS530", title: "Big Data Analytics", credits: 3 },
          { code: "CS531", title: "Data Mining", credits: 3 },
        ],
      },
    },
  };

  // Gather all courses for the selected curriculum (and concentration for Major)
  let allCoursesByCategory: { [category: string]: { code: string; title: string; credits: number }[] } = {};
  if (selectedCurriculum === "bscs2022") {
    allCoursesByCategory = { ...curriculumCourses[selectedCurriculum] };
 
    if (selectedConcentration && selectedConcentration !== "none") {
      allCoursesByCategory["Major"] =
        mockConcentrations[selectedCurriculum]?.[selectedConcentration]?.Major || [];
    } else {
      // If no concentration, flatten all concentration majors
      allCoursesByCategory["Major"] = Object.values(
        mockConcentrations[selectedCurriculum] || {}
      ).flatMap((c) => c.Major);
    }
    // Merge free electives from context
    allCoursesByCategory["Free Elective"] = [
      ...(allCoursesByCategory["Free Elective"] || []),
      ...freeElectives.filter(
        (fe) => !(allCoursesByCategory["Free Elective"] || []).some((c) => c.code === fe.code)
      ),
    ];
  } else if (selectedCurriculum && curriculumCourses[selectedCurriculum]) {
    allCoursesByCategory = { ...curriculumCourses[selectedCurriculum] };
    
    allCoursesByCategory["Free Elective"] = [
      ...(allCoursesByCategory["Free Elective"] || []),
      ...freeElectives.filter(
        (fe) => !(allCoursesByCategory["Free Elective"] || []).some((c) => c.code === fe.code)
      ),
    ];
  }


  const gradeToGPA: Record<string, number> = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'S': 0.0,
  };

  
  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;
  let totalGpaCredits = 0;
  const categoryStats: { [category: string]: { completed: number; total: number; earned: number; totalCredits: number } } = {};
  const completedList: Course[] = [];
  const takingList: Course[] = [];
  const planningList: Course[] = [];
  const pendingList: Course[] = [];

  for (const category of categoryOrder) {
    const courses = allCoursesByCategory[category] || [];
    for (const c of courses) {
      const status = completedCourses[c.code]?.status;
      if (status === 'completed') {
        completedList.push({ ...c, category, grade: completedCourses[c.code]?.grade });
        earnedCredits += c.credits;
       
        const grade = completedCourses[c.code]?.grade;
        if (grade && gradeToGPA[grade] !== undefined) {
          totalGradePoints += gradeToGPA[grade] * c.credits;
          totalGpaCredits += c.credits;
        }
      } else if (status === 'taking') {
        takingList.push({ ...c, category });
      } else if (status === 'planning') {
        planningList.push({ ...c, category });
      } else {
        pendingList.push({ ...c, category });
      }
    }
  }

  for (const category of categoryOrder) {
    const completed = completedList.filter(c => c.category === category);
    categoryStats[category] = {
      completed: completed.length,
      total: completed.length, 
      earned: completed.reduce((sum: number, c: Course) => sum + c.credits, 0),
      totalCredits: completed.reduce((sum: number, c: Course) => sum + c.credits, 0),
    };
  }
  const totalCreditsRequired = 132; // Replace with real value from curriculum when available
  const percent = totalCreditsRequired ? Math.round((earnedCredits / totalCreditsRequired) * 100) : 0;
  const gpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : 'N/A';

  // For each category, count completed credits and total credits
  const coreCompletedCredits = completedList
    .filter(c => c.category === 'Core Courses')
    .reduce((sum, c) => sum + c.credits, 0);
  const coreTotalCredits = allCoursesByCategory['Core Courses']?.reduce((sum, c) => sum + c.credits, 0) || 0;

  const majorCompletedCredits = completedList
    .filter(c => c.category === 'Major')
    .reduce((sum, c) => sum + c.credits, 0);
  const majorTotalCredits = allCoursesByCategory['Major']?.reduce((sum, c) => sum + c.credits, 0) || 0;

  const majorElectiveCompletedCredits = completedList
    .filter(c => c.category === 'Major Elective')
    .reduce((sum, c) => sum + c.credits, 0);
  const majorElectiveTotalCredits = allCoursesByCategory['Major Elective']?.reduce((sum, c) => sum + c.credits, 0) || 0;

  const freeElectiveCompletedCredits = completedList
    .filter(c => c.category === 'Free Elective')
    .reduce((sum, c) => sum + c.credits, 0);
  const freeElectiveTotalCredits = 12; 

  const ethicsSeminarsCompleted = completedList
    .filter(c => c.category === 'Ethics Seminars')
    .length;
  const ethicsSeminarsTotal = allCoursesByCategory['Ethics Seminars']?.length || 0;

  const genEdCompletedCredits = completedList
    .filter(c => c.category === 'General Education')
    .reduce((sum, c) => sum + c.credits, 0);
  const genEdTotalCredits = allCoursesByCategory['General Education']?.reduce((sum, c) => sum + c.credits, 0) || 0;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Progress Bar</h2>
        <button
          className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/management/data-entry';
            }
          }}
        >
          Back to Course Entry
        </button>
      </div>
      <div className="bg-white dark:bg-background rounded-xl p-6 mb-6 border border-gray-200 dark:border-border">
        <div className="relative h-64 mb-4 rounded-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-sky-200 dark:bg-sky-900/30">
            <div className="absolute left-[10%] top-6">
              <Image
                src="/svg/cloud.svg"
                alt="Cloud"
                width={80}
                height={42}
                className="opacity-80"
              />
            </div>

            <div className="absolute right-[15%] top-4">
              <Image
                src="/svg/cloud.svg"
                alt="Cloud"
                width={80}
                height={42}
                className="opacity-90"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30">
            <div className="absolute -top-4 left-0 right-0 flex justify-between px-16">
              {[0, 1, 2, 3, 4, 5].map((_, index) => (
                <div 
                  key={index} 
                  className="transform-gpu"
                  style={{ 
                    transform: `scale(${1})`,
                  }}
                >
                  <Image
                    src="/svg/tree.svg"
                    alt="Tree"
                    width={55}
                    height={55}
                    priority
                  />
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-12 left-8 right-8">
              <div className="relative">
                <div 
                  className="absolute transition-all duration-500"
                  style={{ 
                    left: `calc(${Math.min(Math.max(percent, 4), 96)}% - 20px)`,
                    bottom: '12px',
                  }}
                >
                  <span className="text-xs font-semibold bg-primary/20 px-2 py-1 rounded-full text-primary">
                    {percent}%
                  </span>
                </div>

                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Student Character */}
            <div 
              className="absolute transition-all duration-500"
              style={{ 
                left: `calc(${Math.min(Math.max(percent, 4), 96)}% )`,
                bottom: '14px',
              }}
            >
              <span role="img" aria-label="student" className="text-2xl">🧑‍🎓</span>
            </div>

            {/* Graduate text and icon - moved closer to progress bar */}
            <div className="absolute right-8 bottom-14">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-primary">Graduate!</span>
                <span className="text-xl">🎓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid continues below */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Total Credits Earned</div>
            <div className="text-2xl font-bold text-primary">{earnedCredits} <span className="text-gray-400">/ {totalCreditsRequired}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">GPA</div>
            <div className="text-2xl font-bold text-primary">{gpa}</div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">General Education Credits</div>
            <div className="text-xl font-bold text-primary">{genEdCompletedCredits} <span className="text-gray-400">/ {genEdTotalCredits}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Core Course Credits</div>
            <div className="text-xl font-bold text-primary">{coreCompletedCredits} <span className="text-gray-400">/ {coreTotalCredits}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Major Credits</div>
            <div className="text-xl font-bold text-primary">{majorCompletedCredits} <span className="text-gray-400">/ {majorTotalCredits}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Major Elective Credits</div>
            <div className="text-xl font-bold text-primary">{majorElectiveCompletedCredits} <span className="text-gray-400">/ {majorElectiveTotalCredits}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Ethics Seminars</div>
            <div className="text-xl font-bold text-primary">{ethicsSeminarsCompleted} <span className="text-gray-400">/ {ethicsSeminarsTotal}</span></div>
          </div>
          <div className="bg-white dark:bg-background rounded-lg p-4 text-center border border-gray-200 dark:border-border">
            <div className="text-xs text-gray-500">Free Elective Credits</div>
            <div className="text-xl font-bold text-primary">{freeElectiveCompletedCredits} <span className="text-gray-400">/ {freeElectiveTotalCredits}</span></div>
          </div>
        </div>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-background rounded-xl p-6 border border-gray-200 dark:border-cyan-500/20 border-l-4 border-l-cyan-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:bg-gray-50/50 dark:hover:bg-[#1e2943]">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-base font-bold text-gray-600 dark:text-gray-200">Currently Taking</h3>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              <button
                onClick={() => openModal('taking', takingList, 'Currently Taking Courses', <BookOpen className="h-5 w-5 text-cyan-500" />)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
            {takingList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses currently being taken.</div>
            ) : (
              takingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-white dark:bg-background rounded px-3 py-2">
                  <span className="font-semibold text-xs dark:text-gray-300">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-background rounded-xl p-6 border border-gray-200 dark:border-amber-500/20 border-l-4 border-l-amber-400 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:bg-gray-50/50 dark:hover:bg-[#1e2943]">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-base font-bold text-gray-600 dark:text-gray-200">Planning for Next Semester</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <button
                onClick={() => openModal('planning', planningList, 'Planned Courses', <Calendar className="h-5 w-5 text-amber-400" />)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
            {planningList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses planned for next semester.</div>
            ) : (
              planningList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-white dark:bg-background rounded px-3 py-2">
                  <span className="font-semibold text-xs dark:text-gray-300">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-background rounded-xl p-6 border border-gray-200 dark:border-lime-500/20 border-l-4 border-l-lime-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:bg-gray-50/50 dark:hover:bg-[#1e2943]">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-base font-bold text-gray-600 dark:text-gray-200">Completed Courses</h3>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-lime-500" />
              <button
                onClick={() => openModal('completed', completedList, 'Completed Courses', <CheckCircle className="h-5 w-5 text-lime-500" />)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto mt-4">
            {completedList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No completed courses yet.</div>
            ) : (
              completedList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-white dark:bg-background rounded px-3 py-2">
                  <span className="font-semibold text-xs dark:text-gray-300">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.category}{c.grade ? ` • Grade: ${c.grade}` : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-background rounded-xl p-6 border border-gray-200 dark:border-gray-500/20 border-l-4 border-l-gray-400 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:bg-gray-50/50 dark:hover:bg-[#1e2943]">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-base font-bold text-gray-600 dark:text-gray-200">Pending Courses</h3>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <button
                onClick={() => openModal('pending', pendingList, 'Pending Courses', <Clock className="h-5 w-5 text-gray-400" />)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto mt-4">
            {pendingList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No pending courses!</div>
            ) : (
              pendingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-white dark:bg-background rounded px-3 py-2">
                  <span className="font-semibold text-xs dark:text-gray-300">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <CourseModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        icon={modalState.icon}
        courses={modalState.courses}
      />
      <div className="flex justify-end mt-8">
        <button 
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Download as Excel File
        </button>
      </div>
    </div>
  );
} 