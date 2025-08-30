"use client";
import { useProgressContext } from "../data-entry/page";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { useRouter } from "next/navigation";

const categoryOrder = [
  "General Education",
  "Core Courses",
  "Major",
  "Major Elective",
  "Free Elective",
];

export default function ProgressPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);
  const {
    completedCourses,
    selectedCurriculum,
    selectedConcentration,
    freeElectives,
  } = useProgressContext();

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

  // Calculate stats (only count completed courses)
  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;
  let totalGpaCredits = 0;
  const categoryStats: { [category: string]: { completed: number; total: number; earned: number; totalCredits: number } } = {};
  const completedList: any[] = [];
  const takingList: any[] = [];
  const planningList: any[] = [];
  const pendingList: any[] = [];

  for (const category of categoryOrder) {
    const courses = allCoursesByCategory[category] || [];
    for (const c of courses) {
      const status = completedCourses[c.code]?.status;
      if (status === 'completed') {
        completedList.push({ ...c, category, grade: completedCourses[c.code]?.grade });
        earnedCredits += c.credits;
        // GPA calculation
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
  // Only count completed courses for totalCredits
  for (const category of categoryOrder) {
    const completed = completedList.filter(c => c.category === category);
    categoryStats[category] = {
      completed: completed.length,
      total: completed.length, // Only completed courses
      earned: completed.reduce((sum: number, c: any) => sum + c.credits, 0),
      totalCredits: completed.reduce((sum: number, c: any) => sum + c.credits, 0),
    };
  }
  const totalCreditsRequired = 132; // Replace with real value from curriculum when available
  const percent = totalCreditsRequired ? Math.round((earnedCredits / totalCreditsRequired) * 100) : 0;
  const gpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : 'N/A';

  // For each category, count completed and total courses
  const coreCompleted = categoryStats['Core Courses']?.completed || 0;
  const coreTotal = allCoursesByCategory['Core Courses']?.length || 0;
  const majorCompleted = categoryStats['Major']?.completed || 0;
  const majorTotal = allCoursesByCategory['Major']?.length || 0;
  const majorElectiveCompleted = categoryStats['Major Elective']?.completed || 0;
  const majorElectiveTotal = allCoursesByCategory['Major Elective']?.length || 0;
  const freeElectiveCompleted = categoryStats['Free Elective']?.completed || 0;
  const freeElectiveTotal = allCoursesByCategory['Free Elective']?.length || 0;
  const genEdCompleted = categoryStats['General Education']?.completed || 0;
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
  <div ref={pdfRef} className="bg-white dark:bg-card rounded-xl p-6 mb-6 border border-gray-200 dark:border-border">
        {/* Improved progress bar layout */}
        <div className="flex items-center relative h-24 mb-4 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg px-6">
          {/* Progress bar */}
          <div className="flex-1 relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-4 bg-emerald-500 transition-all"
              style={{ width: `${percent}%` }}
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
          </div>
          {/* Graduate label at the far right */}
          <div className="flex items-center ml-4">
            <span role="img" aria-label="graduate" className="mr-1" style={{ fontSize: 24 }}>🎓</span>
            <span className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">Graduate!</span>
          </div>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Total Credits Earned</div>
            <div className="text-2xl font-bold text-primary">{earnedCredits} <span className="text-gray-400">/ {totalCreditsRequired}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">GPA</div>
            <div className="text-2xl font-bold text-primary">{gpa}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">General Education Completed</div>
            <div className="text-xl font-bold text-primary">{genEdCompleted} <span className="text-gray-400">/ {genEdTotal}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Core Courses Completed</div>
            <div className="text-xl font-bold text-primary">{coreCompleted} <span className="text-gray-400">/ {coreTotal}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major Completed</div>
            <div className="text-xl font-bold text-primary">{majorCompleted} <span className="text-gray-400">/ {majorTotal}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major Elective Completed</div>
            <div className="text-xl font-bold text-primary">{majorElectiveCompleted} <span className="text-gray-400">/ {majorElectiveTotal}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Free Elective Completed</div>
            <div className="text-xl font-bold text-primary">{freeElectiveCompleted} <span className="text-gray-400">/ {freeElectiveTotal}</span></div>
          </div>
        </div>
      </div>
      {/* Completed and Pending Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Currently Taking</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {takingList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses currently being taken.</div>
            ) : (
              takingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-muted rounded px-3 py-2">
                  <span className="font-semibold text-xs">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Planning for Next Semester</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {planningList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses planned for next semester.</div>
            ) : (
              planningList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-muted rounded px-3 py-2">
                  <span className="font-semibold text-xs">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[300px]">
          <h3 className="text-lg font-bold mb-3">Completed Courses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {completedList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No completed courses yet.</div>
            ) : (
              completedList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-muted rounded px-3 py-2">
                  <span className="font-semibold text-xs">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500">{c.category}{c.grade ? ` • Grade: ${c.grade}` : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[300px]">
          <h3 className="text-lg font-bold mb-3">Pending Courses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No pending courses!</div>
            ) : (
              pendingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-muted rounded px-3 py-2">
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