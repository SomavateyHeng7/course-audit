"use client";

import { useState, useRef } from "react";
import { FaEdit, FaTrash } from 'react-icons/fa';

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

const tabs = ["Structure", "Courses", "Requisites", "Elective Rules", "Excel+"];

const coursesData = [
  {
    code: 'CSX 1001',
    title: 'Intro to Computer Science',
    credits: 3,
    type: 'Core',
    concentrations: 'All',
  },
  {
    code: 'CSX 3001',
    title: 'Software Testing',
    credits: 3,
    type: 'Major Elective',
    concentrations: 'Software Engineering and Development',
  },
];

export default function EditCurriculum() {
  const [activeTab, setActiveTab] = useState("Structure");
  const [search, setSearch] = useState("");
  const [requisiteSearch, setRequisiteSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("CSX 4001");
  const [electiveSearch, setElectiveSearch] = useState("");
  const [selectedConcentration, setSelectedConcentration] = useState("Software Development");
  const [majorElectiveCredits, setMajorElectiveCredits] = useState("24");
  const [minGPA, setMinGPA] = useState("2.5");
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
    { code: 'CSX 4003', name: 'Computer Graphics' }
  ];

  const filteredCourses = coursesData.filter((course) =>
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRequisiteCourses = allCourses.filter((course) =>
    course.code.toLowerCase().includes(requisiteSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(requisiteSearch.toLowerCase())
  );

  const electiveCourses = [
    { code: 'CSX 3001', name: 'Software Testing', credits: 3, category: 'Major Elective' },
    { code: 'CSX 3002', name: 'Mobile App Development', credits: 3, category: 'Major Elective' },
    { code: 'CSX 3003', name: 'Web Development', credits: 3, category: 'Major Elective' },
    { code: 'CSX 4001', name: 'Machine Learning', credits: 3, category: 'Major Elective' },
    { code: 'CSX 4002', name: 'Data Science', credits: 3, category: 'Major Elective' },
    { code: 'CSX 4003', name: 'Computer Graphics', credits: 3, category: 'Major Elective' },
    { code: 'GE 1001', name: 'English Communication', credits: 3, category: 'General Education' },
    { code: 'GE 1002', name: 'Philosophy', credits: 3, category: 'General Education' },
    { code: 'GE 1003', name: 'History', credits: 3, category: 'General Education' },
    { code: 'FREE 1001', name: 'Art Appreciation', credits: 3, category: 'Free Elective' },
    { code: 'FREE 1002', name: 'Music Theory', credits: 3, category: 'Free Elective' },
    { code: 'FREE 1003', name: 'Creative Writing', credits: 3, category: 'Free Elective' },
  ];

  const filteredElectiveCourses = electiveCourses.filter((course) =>
    course.code.toLowerCase().includes(electiveSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(electiveSearch.toLowerCase())
  );

  const getSelectedCourseData = () => {
    return allCourses.find(course => course.code === selectedCourse) || { code: selectedCourse, name: 'Unknown Course' };
  };
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-10">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-foreground">
              Course Management <span className="text-emerald-600 dark:text-emerald-400">&gt;</span> Curriculum for 2022
            </h1>
            {/* Tabs */}
            <div className="flex gap-4 mt-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
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
          </div>

          {/* Tab Content */}
          {activeTab === "Structure" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
              {curriculum.map((year, yIdx) => (
                <div key={yIdx} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-foreground">Year {year.year}</h2>
                  <div className="flex gap-8">
                    {year.semesters.map((sem, sIdx) => (
                      <div key={sIdx} className="flex-1 bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-6 mb-4">
                        <h3 className="font-bold text-lg mb-4 text-foreground">{sem.name}</h3>
                        <div className="flex flex-col gap-2 mb-2">
                          {sem.courses.map((course, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{course.code}</span>
                              <span className="flex-1 mx-2 text-gray-600 dark:text-gray-400">{course.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-medium">{course.credits}rd</span>
                            </div>
                          ))}
                        </div>                        <button className="w-full mt-2 flex items-center justify-center gap-2 border border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 rounded py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">
                          <span className="material-icons text-base">add</span> Add Course
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-between mt-8">
                <button className="flex items-center gap-2 px-4 py-2 border border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">
                  <span className="material-icons text-base">add</span> Add Year
                </button>
                <button className="bg-emerald-600 text-white px-8 py-2 rounded font-semibold hover:bg-emerald-700 transition border border-emerald-700">
                  Save Structure
                </button>
              </div>
            </div>
          )}

          {activeTab === "Courses" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
              <div className="mb-4 flex items-center">
                <input
                  type="text"
                  placeholder="Search Course....."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-1/2 border border-gray-300 dark:border-border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-foreground">Course Code</th>
                      <th className="px-4 py-2 text-left text-foreground">Title</th>
                      <th className="px-4 py-2 text-center text-foreground">Credits</th>
                      <th className="px-4 py-2 text-center text-foreground">Type</th>
                      <th className="px-4 py-2 text-center text-foreground">Concentrations</th>
                      <th className="px-4 py-2 text-center text-foreground">Action</th>
                    </tr>                  </thead>
                  <tbody>
                    {filteredCourses.map((course, idx) => (
                      <tr key={idx} className="border-t border-gray-200 dark:border-border">
                        <td className="px-4 py-2 text-foreground">{course.code}</td>
                        <td className="px-4 py-2 text-foreground">{course.title}</td>
                        <td className="px-4 py-2 text-center text-foreground">{course.credits}</td>
                        <td className="px-4 py-2 text-center text-foreground">{course.type}</td>
                        <td className="px-4 py-2 text-center text-foreground">{course.concentrations}</td>
                        <td className="px-4 py-2 text-center">
                          <button className="text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 mr-2" title="Edit">
                            <FaEdit />
                          </button>
                          <button className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" title="Delete">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button className="bg-emerald-600 text-white px-6 py-2 rounded font-semibold hover:bg-emerald-700 transition border border-emerald-700">
                  Add Course
                </button>
                <button className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-6 py-2 rounded font-semibold border border-emerald-600 dark:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition">
                  Assign To Concentration
                </button>
                <button className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 px-6 py-2 rounded font-semibold border border-yellow-600 dark:border-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition">
                  Set Prerequisites
                </button>              </div>
            </div>
          )}          {activeTab === "Requisites" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">              <div className="flex gap-8 min-h-[700px]">
                {/* Left Side - Available Courses */}
                <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-foreground">Available Courses</h3>
                    {/* Search Bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search Courses..."
                      value={requisiteSearch}
                      onChange={(e) => setRequisiteSearch(e.target.value)}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                    />
                  </div>

                  {/* Course List */}
                  <div className="space-y-2 overflow-y-auto max-h-[580px]">
                    {filteredRequisiteCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          course.code === selectedCourse ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-white dark:bg-card'
                        }`}
                        onClick={() => setSelectedCourse(course.code)}
                      >
                        <div className="font-semibold text-sm text-foreground">{course.code}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{course.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Prerequisite Structure */}
                <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col">                  <h3 className="text-lg font-bold mb-4 text-foreground">Prerequisite Structure for {selectedCourse}</h3>
                    {/* Visualization Area */}
                  <div className="relative min-h-96 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-border">
                    {/* Main Course - Center Top */}
                    <div className="flex justify-center mb-8">
                      <div className="relative">
                        <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-emerald-600 shadow-lg">
                          <div className="text-center">
                            <div>{selectedCourse}</div>
                            <div className="text-xs">{getSelectedCourseData().name.split(' ').slice(0, 2).join(' ')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Prerequisites Row */}
                    <div className="flex justify-center mb-12">
                      <div className="flex gap-8 items-center">
                        {/* Prerequisite 1 */}
                        <div className="relative">
                          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-xs">
                            <div className="text-center">
                              <div>CSX 2001</div>
                              <div className="text-xs">Database</div>
                            </div>
                          </div>
                          {/* Connection Line */}
                          <svg className="absolute -top-10 left-1/2 transform -translate-x-1/2" width="2" height="40">
                            <line x1="1" y1="0" x2="1" y2="40" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2"/>
                          </svg>
                        </div>

                        {/* Prerequisite 2 */}
                        <div className="relative">
                          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-xs">
                            <div className="text-center">
                              <div>CSX 3003</div>
                              <div className="text-xs">Algorithm</div>
                            </div>
                          </div>
                          {/* Connection Line */}
                          <svg className="absolute -top-10 left-1/2 transform -translate-x-1/2" width="2" height="40">
                            <line x1="1" y1="0" x2="1" y2="40" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2"/>
                          </svg>
                        </div>

                        {/* Prerequisite 3 */}
                        <div className="relative">
                          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-xs">
                            <div className="text-center">
                              <div>CSX 1002</div>
                              <div className="text-xs">Math</div>
                            </div>
                          </div>
                          {/* Connection Line */}
                          <svg className="absolute -top-10 left-1/2 transform -translate-x-1/2" width="2" height="40">
                            <line x1="1" y1="0" x2="1" y2="40" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Indirect Prerequisites Row */}
                    <div className="flex justify-center mb-8">
                      <div className="flex gap-16 items-center">
                        {/* Sub-prerequisite 1 */}
                        <div className="relative">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-xs">
                            <div className="text-center">
                              <div>CSX 1001</div>
                            </div>
                          </div>
                          {/* Connection Line to CSX 3003 */}
                          <svg className="absolute -top-20 left-1/2 transform translate-x-8" width="2" height="80">
                            <line x1="1" y1="0" x2="1" y2="80" stroke="#6b7280" strokeWidth="1" strokeDasharray="2,2"/>
                          </svg>
                        </div>

                        {/* Sub-prerequisite 2 */}
                        <div className="relative">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-xs">
                            <div className="text-center">
                              <div>CSX 1003</div>
                            </div>
                          </div>
                          {/* Connection Line to CSX 3003 */}
                          <svg className="absolute -top-20 left-1/2 transform -translate-x-8" width="2" height="80">
                            <line x1="1" y1="0" x2="1" y2="80" stroke="#6b7280" strokeWidth="1" strokeDasharray="2,2"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">Selected Course</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">Direct Prerequisites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">Indirect Prerequisites</span>
                      </div>
                    </div>                    {/* Relationship Type Indicator */}                    <div className="absolute top-4 right-4 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-2 text-xs">
                      <div className="font-semibold text-foreground mb-1">Relationship Type</div>
                      <div className="text-emerald-600 dark:text-emerald-400">AND (All Required)</div>
                    </div>
                  </div>

                  {/* Current Prerequisites List */}
                  <div className="mb-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-4">
                    <h4 className="font-bold mb-2 text-foreground">Current Prerequisites</h4>
                    <div className="flex flex-wrap gap-2">
                      {['CSX 2001', 'CSX 3003', 'CSX 1002'].map((prereq, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                          <span>{prereq}</span>
                          <button className="text-red-500 hover:text-red-700 text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Management Section */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-4 flex-shrink-0">                    <h4 className="font-bold mb-2 text-foreground">Manage Prerequisites for {selectedCourse}</h4>
                    
                    <div className="flex gap-4 items-end mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1 text-foreground">Select Course</label>
                        <select className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm">
                          <option value="">Choose a course...</option>
                          <option value="CSX1001">CSX 1001 - Introduction to Computer Science</option>
                          <option value="CSX1002">CSX 1002 - Math for Computer Science</option>
                          <option value="CSX2001">CSX 2001 - Database Systems</option>
                          <option value="CSX2002">CSX 2002 - Software Engineering</option>
                          <option value="CSX3001">CSX 3001 - Web Development</option>
                          <option value="CSX3003">CSX 3003 - Algorithm Design</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700 text-sm">
                          Add
                        </button>
                        <button className="bg-red-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700 transition border border-red-700 text-sm">
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Relationship Type Selector */}
                    <div className="flex gap-4 items-center">
                      <label className="block text-sm font-medium text-foreground">Relationship Type:</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="relationship" value="AND" defaultChecked className="text-emerald-600" />
                          <span className="text-sm text-foreground">AND (All Required)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="relationship" value="OR" className="text-emerald-600" />
                          <span className="text-sm text-foreground">OR (Any One Required)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}          {activeTab === "Elective Rules" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
              <div className="flex gap-8 min-h-[700px]">
                {/* Left Side - Course List */}
                <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-foreground">Available Elective Courses</h3>
                  
                  {/* Search Bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search Courses..."
                      value={electiveSearch}
                      onChange={(e) => setElectiveSearch(e.target.value)}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                    />
                  </div>

                  {/* Course List */}
                  <div className="space-y-2 overflow-y-auto max-h-[580px]">
                    {filteredElectiveCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        <div className="font-semibold text-sm text-foreground">{course.code}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{course.name}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{course.category} • {course.credits} credits</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Elective Rules Configuration */}
                <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
                  {/* Concentration Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-foreground">Concentration:</label>
                    <select 
                      value={selectedConcentration}
                      onChange={(e) => setSelectedConcentration(e.target.value)}
                      className="w-64 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                    >
                      <option value="Software Development">Software Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                    </select>
                  </div>

                  <div className="flex gap-8">
                    {/* Left Column - Elective Categories */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-4 text-foreground">Elective Categories</h3>
                      
                      {/* Major Electives */}
                      <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <h4 className="font-bold text-foreground mb-1">Major Electives</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Required: 24 credits</p>
                      </div>

                      {/* General Education Electives */}
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg">
                        <h4 className="font-bold text-foreground mb-1">General Education Electives</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Required: 24 credits</p>
                      </div>

                      {/* Free Electives */}
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg">
                        <h4 className="font-bold text-foreground mb-1">Free Electives</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Required: 6 credits</p>
                      </div>

                      {/* Elective Distribution */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 text-foreground">Elective Distribution</h3>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition border border-emerald-600">
                            Major
                          </button>
                          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition border border-emerald-600">
                            General Education
                          </button>
                          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition border border-emerald-600">
                            Free
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Major Elective Configuration */}
                    <div className="w-80">
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Major Elective Configuration</h3>
                        
                        <div className="mb-6">
                          <h4 className="font-bold mb-3 text-foreground">Settings</h4>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 text-foreground">Category Name</label>
                            <input
                              type="text"
                              value="Major Electives"
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                              readOnly
                            />
                          </div>

                          <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-1 text-foreground">Required Credits</label>
                              <input
                                type="number"
                                value={majorElectiveCredits}
                                onChange={(e) => setMajorElectiveCredits(e.target.value)}
                                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-1 text-foreground">Min. GPA</label>
                              <input
                                type="number"
                                step="0.1"
                                value={minGPA}
                                onChange={(e) => setMinGPA(e.target.value)}
                                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-border">
                          <button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700">
                            Save Changes
                          </button>
                          <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition border border-gray-400 dark:border-gray-500">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Excel+" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
              <div className="flex gap-12">
                {/* Form Section */}
                <div className="w-[400px]">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Edit Curriculum</h2>
                  <form className="flex flex-col gap-6">
                    <div>
                      <label className="block font-semibold mb-1 text-foreground">Curriculum Name</label>
                      <input
                        type="text"
                        placeholder="Enter curriculum name"
                        defaultValue="Curriculum for 2022"
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
                      <input
                        type="number"
                        placeholder="Enter total credits"
                        defaultValue="132"
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-foreground">Concentration</label>
                      <select className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground">
                        <option>Software Development</option>
                        <option>Informatic and Data Science</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition mt-4 w-32 self-start border border-emerald-700"
                    >
                      Update
                    </button>
                  </form>
                </div>
                
                {/* File Upload Section */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
                    <h3 className="font-bold text-xl mb-4 text-foreground">Upload Excel File</h3>
                    <div
                      className="h-52 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      </svg>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop Excel file here,<br />
                        or click here to upload.
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        ref={fileInputRef}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}