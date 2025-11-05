"use client";
import React, { useState, useEffect } from "react";

// Enhanced mock data for demonstration
const mockCurricula = [
  {
    id: "1",
    faculty: "VMES",
    program: "CS",
    name: "BSCS2022",
    department: { name: "Computer Science", color: "text-sky-400" },
    credits: 132
  },
  {
    id: "2",
    faculty: "MSME",
    program: "BBA",
    name: "DBM63x-65x",
    department: { name: "Business Administration", color: "text-green-400" },
    credits: 142
  },
  {
    id: "3",
    faculty: "VMES",
    program: "IT",
    name: "BSIT651xxx-onwards",
    department: { name: "Information Technology", color: "text-purple-400" },
    credits: 132
  },
];

const getUnique = (arr: any[], key: string) => [
  ...new Set(arr.map((item) => item[key]))
];

export default function AllCurriculaPage() {
  const [curricula, setCurricula] = useState(mockCurricula);
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState("All Faculties");
  const [search, setSearch] = useState("");

  // Filter options
  const facultyOptions = ["All Faculties", ...getUnique(mockCurricula, "faculty")];

  // Filtering logic
  const filteredCurricula = curricula.filter((curr) => {
    const matchesFaculty = faculty === "All Faculties" || curr.faculty === faculty;
    const matchesSearch =
      curr.name.toLowerCase().includes(search.toLowerCase()) ||
      curr.department.name.toLowerCase().includes(search.toLowerCase()) ||
      curr.faculty.toLowerCase().includes(search.toLowerCase());
    return matchesFaculty && matchesSearch;
  });

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">All Curricula</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Browse through all available curricula</p>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="relative w-full sm:w-auto">
          <select
            className="w-full sm:min-w-[200px] pl-3 sm:pl-4 pr-12 sm:pr-16 py-2.5 sm:py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground appearance-none text-sm sm:text-base"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          >
            {facultyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-foreground">
            <svg width="16" height="16" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div className="relative w-full">
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="16" height="16" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm sm:text-base"
            type="text"
            placeholder="Search curriculum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {/* Card Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8 sm:py-12 text-sm sm:text-base">Loading curricula...</div>
      ) : filteredCurricula.length === 0 ? (
        <div className="text-center text-gray-400 py-8 sm:py-12 text-sm sm:text-base">No curricula available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredCurricula.map((curr) => (
            <CurriculumCard key={curr.id} curriculum={curr} />
          ))}
        </div>
      )}
    </div>
  );
}

// Card component
function CurriculumCard({ curriculum }: { curriculum: any }) {
  const handleViewDetails = () => {
    // Check if this is the IT program
    if (curriculum.id === "3" && curriculum.program === "IT") {
      // Create a temporary anchor element to download/view the PDF
      const link = document.createElement('a');
      link.href = '/Study Plan IT.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle other curricula - you can add more PDFs or other logic here
      alert(`Details for ${curriculum.name} are not available yet.`);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-[#23272f] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-2 sm:gap-3 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-500">
      <div className="mb-1 sm:mb-2">
        <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">{curriculum.name}</div>
        <div className={`text-xs sm:text-sm font-medium mt-1 ${curriculum.department.color}`}>{curriculum.department.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{curriculum.faculty} &gt; {curriculum.program}</div>
      </div>
      <div className="flex gap-4 sm:gap-8 text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
        <div><span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{curriculum.credits}</span> <span className="text-xs ml-1">CREDITS</span></div>
      </div>
      <div className="flex gap-2 sm:gap-3 mt-auto">
        {curriculum.id === "1" && curriculum.program === "CS" ? (
          <a
            href="/bscs2022-study-plan-653.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-block text-center w-full sm:w-auto"
          >
            View Details
          </a>
        ) : curriculum.id === "3" && curriculum.program === "IT" ? (
          <a
            href="/Study Plan IT.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-block text-center w-full sm:w-auto"
          >
            View Details
          </a>
        ) : (
          <button 
            onClick={handleViewDetails}
            className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
