"use client";

import { useState, useRef } from "react";
import { FaEdit, FaTrash } from 'react-icons/fa';
import CoursesTab from '@/components/curriculum/CoursesTab';
import ConstraintsTab from '@/components/curriculum/ConstraintsTab';
import ElectiveRulesTab from '@/components/curriculum/ElectiveRulesTab';
import ExcelPlusTab from '@/components/curriculum/ExcelPlusTab';

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

const tabs = ["Courses", "Constraints", "Elective Rules", "Excel+"];

const coursesData = [
  {
    code: 'CSX 1001',
    title: 'Intro to Computer Science',
    credits: 3,
    creditHours: 3,
    type: 'Core',
  },
  {
    code: 'CSX 1002', 
    title: 'Math for Computer Science',
    credits: 3,
    creditHours: 3,
    type: 'Core',
  },
  {
    code: 'CSX 2001',
    title: 'Database Systems',
    credits: 3,
    creditHours: 3,
    type: 'Major',
  },
  {
    code: 'CSX 3001',
    title: 'Software Testing',
    credits: 3,
    creditHours: 3,
    type: 'Major Elective',
  },
  {
    code: 'CSX 4001',
    title: 'Machine Learning',
    credits: 3,
    creditHours: 3,
    type: '', // This will show as "-"
  },
  {
    code: 'CSX 4002',
    title: 'Data Mining',
    credits: 3,
    creditHours: 3,
    type: '', // This will show as "-"
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
    type: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      type: ''
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
            {/* Tabs */}
            <div className="flex gap-4 mt-4 mb-8">              {tabs.map((tab) => (
                <button
                  key={tab}
                  suppressHydrationWarning
                  className={`px-6 py-2 rounded-full font-semibold text-md transition-all border-2 ${
                    activeTab === tab
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-card text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
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

          {activeTab === "Excel+" && (
            <ExcelPlusTab />
          )}
        </div>
      </div>{/* Edit Course Modal */}
      {isEditModalOpen && (        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-8 w-full max-w-[480px] border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Course Details</h3>              <button
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
                
                <div className="grid grid-cols-2 gap-4">
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
                      type="number"
                      value={editingCourse.creditHours}
                      onChange={(e) => setEditingCourse({...editingCourse, creditHours: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                      min="0"
                      max="6"
                    />
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
              </div>            )}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
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
          <div className="bg-white dark:bg-card rounded-xl p-8 w-full max-w-[480px] border border-gray-200 dark:border-border shadow-2xl">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                    type="number"
                    value={newCourse.creditHours}
                    onChange={(e) => setNewCourse({...newCourse, creditHours: e.target.value})}
                    placeholder="3"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                    min="0"
                    max="6"
                  />
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
            </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
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