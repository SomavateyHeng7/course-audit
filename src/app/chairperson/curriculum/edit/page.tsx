"use client";

import { useState } from "react";
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

const tabs = ["Structure", "Courses", "Requisites", "Elective Rules"];

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

  const filteredCourses = coursesData.filter((course) =>
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f7fafd]">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-10">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Course Management <span className="text-[#4bb89e]">&gt;</span> Curriculum for 2022
            </h1>
            {/* Tabs */}
            <div className="flex gap-4 mt-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-2 rounded-full font-semibold text-md transition-all border-2 ${
                    activeTab === tab
                      ? "bg-[#4bb89e] text-white border-[#4bb89e]"
                      : "bg-white text-[#4bb89e] border-[#4bb89e] hover:bg-[#e6f4f1]"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex gap-8 mb-8">
            <div className="flex-1 bg-white border rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-gray-500 text-md mb-2">Total Curriculum Credits</span>
              <span className="text-3xl font-bold text-[#4bb89e]">{summary.totalCredits} Credits</span>
            </div>
            <div className="flex-1 bg-white border rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-gray-500 text-md mb-2">Required Core Courses</span>
              <span className="text-3xl font-bold text-[#4bb89e]">{summary.requiredCore} Credits</span>
            </div>
            <div className="flex-1 bg-white border rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-gray-500 text-md mb-2">Elective Credits</span>
              <span className="text-3xl font-bold text-[#4bb89e]">{summary.electiveCredits} Credits</span>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "Structure" && (
            <div className="bg-[#f7fafd] border rounded-xl p-8">
              {curriculum.map((year, yIdx) => (
                <div key={yIdx} className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Year {year.year}</h2>
                  <div className="flex gap-8">
                    {year.semesters.map((sem, sIdx) => (
                      <div key={sIdx} className="flex-1 bg-white rounded-xl shadow p-6 mb-4">
                        <h3 className="font-bold text-lg mb-4">{sem.name}</h3>
                        <div className="flex flex-col gap-2 mb-2">
                          {sem.courses.map((course, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between bg-[#f7fafd] rounded px-3 py-2">
                              <span className="font-semibold text-gray-700">{course.code}</span>
                              <span className="flex-1 mx-2 text-gray-600">{course.name}</span>
                              <span className="text-gray-500 font-medium">{course.credits}rd</span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-2 flex items-center justify-center gap-2 border border-[#4bb89e] text-[#4bb89e] rounded py-1 hover:bg-[#e6f4f1] transition">
                          <span className="material-icons text-base">add</span> Add Course
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-between mt-8">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#4bb89e] text-[#4bb89e] rounded hover:bg-[#e6f4f1] transition">
                  <span className="material-icons text-base">add</span> Add Year
                </button>
                <button className="bg-[#4bb89e] text-white px-8 py-2 rounded font-semibold hover:bg-[#399e85] transition">
                  Save Structure
                </button>
              </div>
            </div>
          )}

          {activeTab === "Courses" && (
            <div className="bg-[#f7fafd] border rounded-xl p-8">
              <div className="mb-4 flex items-center">
                <input
                  type="text"
                  placeholder="Search Course....."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-1/2 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Course Code</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-center">Credits</th>
                      <th className="px-4 py-2 text-center">Type</th>
                      <th className="px-4 py-2 text-center">Concentrations</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{course.code}</td>
                        <td className="px-4 py-2">{course.title}</td>
                        <td className="px-4 py-2 text-center">{course.credits}</td>
                        <td className="px-4 py-2 text-center">{course.type}</td>
                        <td className="px-4 py-2 text-center">{course.concentrations}</td>
                        <td className="px-4 py-2 text-center">
                          <button className="text-gray-600 hover:text-blue-500 mr-2" title="Edit">
                            <FaEdit />
                          </button>
                          <button className="text-gray-600 hover:text-red-500" title="Delete">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button className="bg-[#4bb89e] text-white px-6 py-2 rounded font-semibold hover:bg-[#399e85] transition">
                  Add Course
                </button>
                <button className="bg-[#e6f4f1] text-[#4bb89e] px-6 py-2 rounded font-semibold border border-[#4bb89e] hover:bg-[#d0f0e7] transition">
                  Assign To Concentration
                </button>
                <button className="bg-[#fff7e6] text-[#fbbf24] px-6 py-2 rounded font-semibold border border-[#fbbf24] hover:bg-[#ffe9b8] transition">
                  Set Prerequisites
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}