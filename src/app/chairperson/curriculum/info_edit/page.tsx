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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCourses = coursesData.filter((course) =>
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.title.toLowerCase().includes(search.toLowerCase())
  );
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