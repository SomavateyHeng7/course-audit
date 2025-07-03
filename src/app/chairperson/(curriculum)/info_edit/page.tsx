"use client";

import { useState, useRef, useEffect } from "react";
import { FaEdit, FaTrash, FaBook, FaGavel, FaGraduationCap, FaStar, FaBan, FaFileExcel } from 'react-icons/fa';
import CoursesTab from '@/components/curriculum/CoursesTab';
import ConstraintsTab from '@/components/curriculum/ConstraintsTab';
import ElectiveRulesTab from '@/components/curriculum/ElectiveRulesTab';
import ExcelPlusTab from '@/components/curriculum/ExcelPlusTab';
import ConcentrationsTab from '@/components/curriculum/ConcentrationsTab';
import BlacklistTab from '@/components/curriculum/BlacklistTab';

const summary = {
  totalCredits: 132,
  requiredCore: 86,
  electiveCredits: 46,
};

const curriculum = [
  {
    year: 1,
    semesters: [
      {
        name: "Semester 1",
        courses: [
          { code: "CSX 1001", name: "Intro to Computer Science", credits: 3 },
          { code: "CSX 1002", name: "Math for Computer Science", credits: 3 },
        ],
      },
      {
        name: "Semester 2",
        courses: [
          { code: "CSX 1003", name: "OOP", credits: 3 },
          { code: "CSX 1003", name: "Software Engineering", credits: 3 },
        ],
      },
    ],
  },
  {
    year: 2,
    semesters: [
      {
        name: "Semester 1",
        courses: [
          { code: "CSX 2001", name: "DataStructure and Algorithms", credits: 3 },
          { code: "CSX 2002", name: "DataBase Systems", credits: 3 },
        ],
      },
      {
        name: "Semester 2",
        courses: [
          { code: "CSX 2003", name: "Algorithm Design", credits: 3 },
          { code: "CSX 2004", name: "Programming Languages", credits: 3 },
        ],
      },
    ],
  },
];

const tabs = [
  { name: "Courses", icon: FaBook },
  { name: "Constraints", icon: FaGavel },
  { name: "Elective Rules", icon: FaGraduationCap },
  { name: "Concentrations", icon: FaStar },
  { name: "Blacklist", icon: FaBan },
  { name: "Excel+", icon: FaFileExcel }
];

const coursesData = [
  {
    code: 'CSX 1001',
    title: 'Intro to Computer Science',
    credits: 3,
    creditHours: '3-0-6',
    type: 'Core',
    description: 'Introduction to fundamental concepts of computer science including programming, problem solving, and computational thinking.',
  },
  {
    code: 'CSX 1002', 
    title: 'Math for Computer Science',
    credits: 3,
    creditHours: '3-0-6',
    type: 'Core',
    description: 'Mathematical foundations for computer science including discrete mathematics, logic, and mathematical reasoning.',
  },
  {
    code: 'CSX 2001',
    title: 'Database Systems',
    credits: 3,
    creditHours: '3-0-6',
    type: 'Major',
    description: 'Design and implementation of database systems, SQL, data modeling, and database management principles.',
  },
  {
    code: 'CSX 3001',
    title: 'Software Testing',
    credits: 3,
    creditHours: '3-0-6',
    type: 'Major Elective',
    description: 'Software testing methodologies, test case design, automated testing tools, and quality assurance practices.',
  },
  {
    code: 'CSX 4001',
    title: 'Machine Learning',
    credits: 3,
    creditHours: '3-0-6',
    type: '', // This will show as "-"
    description: 'Introduction to machine learning algorithms, supervised and unsupervised learning, and practical applications.',
  },
  {
    code: 'CSX 4002',
    title: 'Data Mining',
    credits: 3,
    creditHours: '3-0-6',
    type: '', // This will show as "-"
    description: 'Techniques for extracting patterns and knowledge from large datasets using various data mining algorithms.',
  },
];

export default function EditCurriculum() {
  const [activeTab, setActiveTab] = useState("Courses");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    credits: '',
    creditHours: '',
    type: '',
    description: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation functions
  const goToNextTab = () => {
    const currentIndex = tabs.findIndex(t => t.name === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].name);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabs.findIndex(t => t.name === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].name);
    }
  };

  const currentTabIndex = tabs.findIndex(t => t.name === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard nav when not in form inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (!isFirstTab) goToPreviousTab();
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (!isLastTab) goToNextTab();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTabIndex, isFirstTab, isLastTab]);

  const allCourses = [
    { code: 'CSX 1001', name: 'Introduction to Computer Science' },
    { code: 'CSX 1002', name: 'Math for Computer Science' },
    { code: 'CSX 1003', name: 'Data Structure and Algorithm' },
    { code: 'CSX 3003', name: 'Algorithm Design' },
    { code: 'CSX 2001', name: 'Database Systems' },
    { code: 'CSX 2002', name: 'Software Engineering' },
    { code: 'CSX 3001', name: 'Web Development' },
    { code: 'CSX 4001', name: 'Machine Learning' },
    { code: 'CSX 4002', name: 'Artificial Intelligence' },
    { code: 'CSX 3002', name: 'Computer Networks' },
    { code: 'CSX 4003', name: 'Computer Graphics' }  ];

  const handleEditCourse = (course: any) => {
    // Create a copy of the course to avoid mutating the original
    setEditingCourse({...course});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCourse(null);
  };

  const handleAddCourse = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewCourse({
      code: '',
      title: '',
      credits: '',
      creditHours: '',
      type: '',
      description: ''
    });
  };
  return (
    <div className="flex min-h-screen bg-white dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-10">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-foreground">
              Course Management <span className="text-emerald-600 dark:text-emerald-400">&gt;</span> Curriculum for 2022
            </h1>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Manage all aspects of your curriculum from courses to constraints
              </p>
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  ← →
                </kbd>
                <span>to navigate</span>
              </div>
            </div>
            {/* Tabs */}
            <div className="w-full mt-4 mb-8">
              {/* Tab Progress Indicator */}
              <div className="hidden lg:block mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Section {tabs.findIndex(t => t.name === activeTab) + 1} of {tabs.length}
                  </span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {activeTab}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((tabs.findIndex(t => t.name === activeTab) + 1) / tabs.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Desktop Tab Bar */}
              <div className="hidden lg:flex gap-3 flex-wrap">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.name;
                  const isPrevious = tabs.findIndex(t => t.name === activeTab) > index;
                  
                  return (
                    <button
                      key={tab.name}
                      suppressHydrationWarning
                      className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 border-2 shadow-sm hover:shadow-md flex items-center gap-2 relative overflow-hidden ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 dark:shadow-emerald-800/50 transform scale-105"
                          : isPrevious
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600"
                          : "bg-white dark:bg-card text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500"
                      }`}
                      onClick={() => setActiveTab(tab.name)}
                    >
                      {/* Ripple effect on active */}
                      {isActive && (
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      )}
                      <IconComponent className={`w-4 h-4 relative z-10 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="relative z-10">{tab.name}</span>
                      {isPrevious && (
                        <svg className="w-3 h-3 ml-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile/Tablet Enhanced Dropdown */}
              <div className="lg:hidden">
                <div className="relative">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Current Section
                    </span>
                  </div>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-card border-2 border-emerald-200 dark:border-emerald-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {tabs.map((tab, index) => (
                      <option key={tab.name} value={tab.name} className="bg-white dark:bg-card py-2">
                        {`${index + 1}. ${tab.name}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Mobile Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{tabs.findIndex(t => t.name === activeTab) + 1} of {tabs.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((tabs.findIndex(t => t.name === activeTab) + 1) / tabs.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>          {/* Summary Cards */}
          <div className="flex gap-8 mb-8">
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Total Curriculum Credits</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalCredits} Credits</span>
            </div>
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Required Core Courses</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.requiredCore} Credits</span>
            </div>
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Elective Credits</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.electiveCredits} Credits</span>
            </div>
          </div>          {/* Tab Content */}
          {activeTab === "Courses" && (
            <CoursesTab 
              courses={coursesData} 
              onEditCourse={handleEditCourse}
              onAddCourse={handleAddCourse}
            />
          )}          {activeTab === "Constraints" && (
            <ConstraintsTab courses={allCourses} />
          )}

          {activeTab === "Elective Rules" && (
            <ElectiveRulesTab />
          )}

          {activeTab === "Concentrations" && (
            <ConcentrationsTab />
          )}

          {activeTab === "Blacklist" && (
            <BlacklistTab />
          )}

          {activeTab === "Excel+" && (
            <ExcelPlusTab />
          )}
          
          {/* Tab Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-border">
            <button
              onClick={goToPreviousTab}
              disabled={isFirstTab}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isFirstTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeTab === tab.name
                      ? "bg-emerald-600 w-6"
                      : index < currentTabIndex
                      ? "bg-emerald-300 dark:bg-emerald-700"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                  title={tab.name}
                />
              ))}
            </div>
            
            <button
              onClick={goToNextTab}
              disabled={isLastTab}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isLastTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300"
              }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>      {/* Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 sm:p-8 w-full max-w-[90vw] sm:max-w-[600px] lg:max-w-[700px] border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Course Details</h3><button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              {editingCourse && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Code</label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    readOnly
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Course code cannot be modified</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Title</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                    placeholder="Enter course title"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Credits</label>
                    <input
                      type="number"
                      value={editingCourse.credits}
                      onChange={(e) => setEditingCourse({...editingCourse, credits: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                      min="0"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Credit Hours</label>
                    <input
                      type="text"
                      value={editingCourse.creditHours}
                      onChange={(e) => setEditingCourse({...editingCourse, creditHours: e.target.value})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                      placeholder="e.g., 3-0-6"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: Lecture-Lab-Total (e.g., 3-0-6)</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Type</label>
                  <select
                    value={editingCourse.type}
                    onChange={(e) => setEditingCourse({...editingCourse, type: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                  >
                    <option value="">Select Course Type</option>
                    <option value="Core">Core Course</option>
                    <option value="Major">Major Course</option>
                    <option value="Major Elective">Major Elective</option>
                    <option value="General Education">General Education</option>
                    <option value="Free Elective">Free Elective</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the appropriate course type for curriculum requirements</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Description</label>
                  <textarea
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors resize-none"
                    placeholder="Enter a detailed description of the course content and objectives"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide a comprehensive description of the course</p>
                </div>
              </div>            )}
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors border border-emerald-700 font-semibold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 sm:p-8 w-full max-w-[90vw] sm:max-w-[600px] lg:max-w-[700px] border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Course</h3>              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Course Code</label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                  placeholder="e.g., CSX 1001"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter a unique course code (e.g., CSX 1001)</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  placeholder="e.g., Introduction to Computer Science"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Credits</label>
                  <input
                    type="number"
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({...newCourse, credits: e.target.value})}
                    placeholder="3"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                    min="0"
                    max="6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Credit Hours</label>
                  <input
                    type="text"
                    value={newCourse.creditHours}
                    onChange={(e) => setNewCourse({...newCourse, creditHours: e.target.value})}
                    placeholder="e.g., 3-0-6"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: Lecture-Lab-Total (e.g., 3-0-6)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Course Type</label>
                <select
                  value={newCourse.type}
                  onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                >
                  <option value="">Select Course Type</option>
                  <option value="Core">Core Course</option>
                  <option value="Major">Major Course</option>
                  <option value="Major Elective">Major Elective</option>
                  <option value="General Education">General Education</option>
                  <option value="Free Elective">Free Elective</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the appropriate course type for curriculum requirements</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Course Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors resize-none"
                  placeholder="Enter a detailed description of the course content and objectives"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide a comprehensive description of the course</p>
              </div>
            </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors border border-emerald-700 font-semibold shadow-sm"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}