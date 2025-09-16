"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const categoryOrder = [
  "General Education",
  "Core Courses",
  "Major",
  "Major Elective",
  "Free Elective",
];

interface CourseStatus {
  status: 'not_completed' | 'completed' | 'failed' | 'withdrawn';
  grade?: string;
}

interface CompletedCourseData {
  completedCourses: { [code: string]: CourseStatus };
  selectedDepartment: string;
  selectedCurriculum: string;
  selectedConcentration: string;
  freeElectives: { code: string; title: string; credits: number }[];
}

interface PlannedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: string;
  year: number;
  status: 'planning' | 'will-take' | 'considering';
}

interface ConcentrationProgress {
  concentration: {
    id: string;
    name: string;
    description?: string;
    requiredCourses: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
    }>;
  };
  completedCourses: string[];
  plannedCourses: string[];
  progress: number;
  isEligible: boolean;
  remainingCourses: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState<ConcentrationProgress[]>([]);
  const [completedData, setCompletedData] = useState<CompletedCourseData>({
    completedCourses: {},
    selectedDepartment: '',
    selectedCurriculum: '',
    selectedConcentration: '',
    freeElectives: []
  });
  
  // Load all data from localStorage
  useEffect(() => {
    try {
      // Load completed courses data from data-entry page
      const savedCompletedData = localStorage.getItem('studentAuditData');
      if (savedCompletedData) {
        setCompletedData(JSON.parse(savedCompletedData));
      }
      
      // Load planned courses from course planner
      const savedCoursePlan = localStorage.getItem('coursePlan');
      if (savedCoursePlan) {
        const planData = JSON.parse(savedCoursePlan);
        setPlannedCourses(planData.plannedCourses || []);
      }
      
      // Load concentration analysis
      const savedConcentrationAnalysis = localStorage.getItem('concentrationAnalysis');
      if (savedConcentrationAnalysis) {
        setConcentrationAnalysis(JSON.parse(savedConcentrationAnalysis));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const { completedCourses, selectedCurriculum, selectedConcentration, freeElectives } = completedData;

  // Mock curriculumCourses and mockConcentrations (should match data-entry page)
  // In real app, import or share this data
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
      "Free Elective": [
        { code: "ART1001", title: "Art Appreciation", credits: 3 },
      ],
    },
    // ...other curricula
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
    // Major: use concentration logic
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
    // Merge free electives from context
    allCoursesByCategory["Free Elective"] = [
      ...(allCoursesByCategory["Free Elective"] || []),
      ...freeElectives.filter(
        (fe) => !(allCoursesByCategory["Free Elective"] || []).some((c) => c.code === fe.code)
      ),
    ];
  }

  // GPA mapping
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

  // Calculate stats (include both completed and planned courses)
  let totalCredits = 0;
  let earnedCredits = 0;
  let plannedCredits = 0;
  let totalGradePoints = 0;
  let totalGpaCredits = 0;
  const categoryStats: { [category: string]: { completed: number; total: number; earned: number; totalCredits: number; planned: number } } = {};
  const completedList: any[] = [];
  const takingList: any[] = [];
  const plannedFromPlannerList: any[] = [];
  const pendingList: any[] = [];

  // Get planned courses by code for easy lookup
  const plannedCoursesMap = new Map(plannedCourses.map(course => [course.code, course]));

  for (const category of categoryOrder) {
    const courses = allCoursesByCategory[category] || [];
    let completedCount = 0;
    let plannedCount = 0;
    let earnedCategoryCredits = 0;
    let totalCategoryCredits = 0;
    
    for (const c of courses) {
      const status = completedCourses[c.code]?.status;
      const plannedCourse = plannedCoursesMap.get(c.code);
      
      if (status === 'completed') {
        completedList.push({ ...c, category, grade: completedCourses[c.code]?.grade, source: 'completed' });
        earnedCredits += c.credits;
        earnedCategoryCredits += c.credits;
        completedCount++;
        // GPA calculation
        const grade = completedCourses[c.code]?.grade;
        if (grade && gradeToGPA[grade] !== undefined) {
          totalGradePoints += gradeToGPA[grade] * c.credits;
          totalGpaCredits += c.credits;
        }
      } else if (plannedCourse) {
        // Course is in the planner
        plannedFromPlannerList.push({ 
          ...c, 
          category, 
          source: 'planner',
          semester: plannedCourse.semester,
          year: plannedCourse.year,
          status: plannedCourse.status
        });
        plannedCredits += c.credits;
        plannedCount++;
      } else {
        pendingList.push({ ...c, category, source: 'pending' });
      }
      
      totalCategoryCredits += c.credits;
    }
    
    categoryStats[category] = {
      completed: completedCount,
      planned: plannedCount,
      total: courses.length,
      earned: earnedCategoryCredits,
      totalCredits: totalCategoryCredits,
    };
  }
  
  const totalCreditsRequired = 132; // Replace with real value from curriculum when available
  const percent = totalCreditsRequired ? Math.round((earnedCredits / totalCreditsRequired) * 100) : 0;
  const projectedPercent = totalCreditsRequired ? Math.round(((earnedCredits + plannedCredits) / totalCreditsRequired) * 100) : 0;
  const gpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : 'N/A';

  // For each category, count completed, planned and total courses
  const coreCompleted = categoryStats['Core Courses']?.completed || 0;
  const corePlanned = categoryStats['Core Courses']?.planned || 0;
  const coreTotal = allCoursesByCategory['Core Courses']?.length || 0;
  
  const majorCompleted = categoryStats['Major']?.completed || 0;
  const majorPlanned = categoryStats['Major']?.planned || 0;
  const majorTotal = allCoursesByCategory['Major']?.length || 0;
  
  const majorElectiveCompleted = categoryStats['Major Elective']?.completed || 0;
  const majorElectivePlanned = categoryStats['Major Elective']?.planned || 0;
  const majorElectiveTotal = allCoursesByCategory['Major Elective']?.length || 0;
  
  const freeElectiveCompleted = categoryStats['Free Elective']?.completed || 0;
  const freeElectivePlanned = categoryStats['Free Elective']?.planned || 0;
  const freeElectiveTotal = allCoursesByCategory['Free Elective']?.length || 0;
  
  const genEdCompleted = categoryStats['General Education']?.completed || 0;
  const genEdPlanned = categoryStats['General Education']?.planned || 0;
  const genEdTotal = allCoursesByCategory['General Education']?.length || 0;

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculate image dimensions to fit A4
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save("progress-report.pdf");
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Academic Progress Overview</h2>
        <div className="flex gap-2">
          <button
            className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => router.push('/management/course-planning')}
          >
            Back to Course Planner
          </button>
          <button
            className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => router.push('/management/data-entry')}
          >
            Course Entry
          </button>
        </div>
      </div>
  <div ref={pdfRef} className="bg-white dark:bg-card rounded-xl p-6 mb-6 border border-gray-200 dark:border-border">
        {/* Improved progress bar layout */}
        <div className="flex items-center relative h-24 mb-4 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg px-6">
          {/* Progress bar */}
          <div className="flex-1 relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Completed progress */}
            <div
              className="h-4 bg-emerald-500 transition-all"
              style={{ width: `${percent}%` }}
            ></div>
            {/* Planned progress overlay */}
            <div
              className="h-4 bg-blue-300 opacity-60 absolute top-0 transition-all"
              style={{ width: `${projectedPercent}%` }}
            ></div>
            {/* Student icon */}
            <div
              className="absolute"
              style={{ left: `calc(${percent}% - 16px)`, top: '-28px' }}
            >
              <span role="img" aria-label="student" style={{ fontSize: 24 }}>🧑‍🎓</span>
            </div>
            {/* Percentage label above the progress end */}
            <div
              className="absolute"
              style={{
                left: `calc(${percent}% - 16px)`,
                top: '-38px',
                width: '40px',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{percent}%</span>
            </div>
            {/* Projected percentage */}
            {projectedPercent > percent && (
              <div
                className="absolute"
                style={{
                  left: `calc(${projectedPercent}% - 20px)`,
                  top: '-50px',
                  width: '40px',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">↑{projectedPercent}%</span>
              </div>
            )}
          </div>
          {/* Graduate label at the far right */}
          <div className="flex items-center ml-4">
            <span role="img" aria-label="graduate" className="mr-1" style={{ fontSize: 24 }}>🎓</span>
            <span className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">Graduate!</span>
          </div>
        </div>
        
        {/* Legend for progress bar */}
        <div className="flex justify-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-emerald-500 rounded"></div>
            <span>Completed ({earnedCredits} credits)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-300 rounded"></div>
            <span>Planned ({plannedCredits} credits)</span>
          </div>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Total Credits</div>
            <div className="text-2xl font-bold text-primary">
              {earnedCredits} 
              {plannedCredits > 0 && <span className="text-blue-600">+{plannedCredits}</span>}
              <span className="text-gray-400"> / {totalCreditsRequired}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">GPA</div>
            <div className="text-2xl font-bold text-primary">{gpa}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">General Education</div>
            <div className="text-xl font-bold text-primary">
              {genEdCompleted}
              {genEdPlanned > 0 && <span className="text-blue-600">+{genEdPlanned}</span>}
              <span className="text-gray-400"> / {genEdTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Core Courses</div>
            <div className="text-xl font-bold text-primary">
              {coreCompleted}
              {corePlanned > 0 && <span className="text-blue-600">+{corePlanned}</span>}
              <span className="text-gray-400"> / {coreTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major</div>
            <div className="text-xl font-bold text-primary">
              {majorCompleted}
              {majorPlanned > 0 && <span className="text-blue-600">+{majorPlanned}</span>}
              <span className="text-gray-400"> / {majorTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major Elective</div>
            <div className="text-xl font-bold text-primary">
              {majorElectiveCompleted}
              {majorElectivePlanned > 0 && <span className="text-blue-600">+{majorElectivePlanned}</span>}
              <span className="text-gray-400"> / {majorElectiveTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Free Elective</div>
            <div className="text-xl font-bold text-primary">
              {freeElectiveCompleted}
              {freeElectivePlanned > 0 && <span className="text-blue-600">+{freeElectivePlanned}</span>}
              <span className="text-gray-400"> / {freeElectiveTotal}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Completed and Planned Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Completed Courses</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No completed courses yet.</div>
            ) : (
              completedList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-3 py-2">
                  <span className="font-semibold text-xs text-green-800 dark:text-green-200">{c.code} - {c.title}</span>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {c.category}{c.grade ? ` • ${c.grade}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Planned Courses <span className="text-sm text-blue-600">(From Course Planner)</span></h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {plannedFromPlannerList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses planned yet. <br /><span className="text-xs">Use the Course Planner to add courses.</span></div>
            ) : (
              plannedFromPlannerList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-3 py-2">
                  <span className="font-semibold text-xs text-blue-800 dark:text-blue-200">{c.code} - {c.title}</span>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {c.category} • {c.semester} {c.year}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Add Concentration Analysis Section */}
      {concentrationAnalysis.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Concentration Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {concentrationAnalysis.map((analysis) => (
              <div key={analysis.concentration.id} className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{analysis.concentration.name}</h4>
                    {analysis.concentration.description && (
                      <p className="text-sm text-muted-foreground">{analysis.concentration.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${analysis.isEligible ? 'text-green-600' : 'text-blue-600'}`}>
                      {Math.round(analysis.progress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.completedCourses.length + analysis.plannedCourses.length} / {analysis.concentration.requiredCourses}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      analysis.isEligible ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, analysis.progress)}%` }}
                  />
                </div>
                
                {/* Course breakdown */}
                <div className="space-y-2">
                  {analysis.completedCourses.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">Completed:</span> {analysis.completedCourses.join(', ')}
                    </div>
                  )}
                  {analysis.plannedCourses.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-blue-600">Planned:</span> {analysis.plannedCourses.join(', ')}
                    </div>
                  )}
                  {analysis.remainingCourses > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {analysis.remainingCourses} more course{analysis.remainingCourses !== 1 ? 's' : ''} needed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[300px]">
          <h3 className="text-lg font-bold mb-3">Remaining Courses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">All courses completed or planned! 🎉</div>
            ) : (
              pendingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2">
                  <span className="font-semibold text-xs">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <button
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleDownloadPDF}
        >
          Download as PDF
        </button>
      </div>
    </div>
  );
} 