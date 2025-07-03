"use client";

import { useState } from "react";
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface Course {
  code: string;
  title: string;
  credits: number;
  creditHours: string; // Changed to string to support formats like "3-0-6"
  type: string;
  description?: string;
}

interface Blacklist {
  id: string;
  name: string;
  courses: Course[];
  createdAt: string;
}

interface CurriculumBlacklist {
  blacklistId: string;
}

interface BlacklistTabProps {
  // No blacklistTitle prop since "Blacklist" title is fixed and not editable
}

// Mock data - in real implementation, this will come from backend
const mockAvailableBlacklists: Blacklist[] = [
  {
    id: '1',
    name: 'Outdated Courses',
    courses: [
      { code: 'CSX 1001', title: 'Introduction to Computer Science', credits: 3, creditHours: '3-0-6', type: 'Core', description: 'Introduction to fundamental concepts of computer science and programming.' },
      { code: 'CSX 2005', title: 'Legacy Programming', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Study of outdated programming languages and practices.' },
      { code: 'CSX 3008', title: 'Outdated Web Technologies', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Exploration of deprecated web development technologies.' },
    ],
    createdAt: '2024-12-15'
  },
  {
    id: '2',
    name: 'Conflicting Prerequisites',
    courses: [
      { code: 'CSX 4001', title: 'Advanced Research Methods', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Research methodologies with scheduling conflicts.' },
      { code: 'CSX 4002', title: 'Senior Capstone A', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Capstone project with prerequisite issues.' },
    ],
    createdAt: '2024-11-20'
  },
  {
    id: '3',
    name: 'Discontinued Electives',
    courses: [
      { code: 'CSX 3010', title: 'Flash Development', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Development using discontinued Flash technology.' },
      { code: 'CSX 3011', title: 'Silverlight Programming', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Programming with discontinued Silverlight framework.' },
      { code: 'CSX 3012', title: 'Internet Explorer Extensions', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Developing extensions for deprecated browser.' },
    ],
    createdAt: '2024-10-10'
  },
];

export default function BlacklistTab() {
  const [selectedBlacklists, setSelectedBlacklists] = useState<CurriculumBlacklist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleBlacklistClick = (blacklistId: string) => {
    const existing = selectedBlacklists.find(b => b.blacklistId === blacklistId);
    if (existing) {
      // If already selected, remove it
      // TODO: Backend integration - Remove blacklist application from curriculum
      setSelectedBlacklists(prev => prev.filter(b => b.blacklistId !== blacklistId));
    } else {
      // If not selected, add it
      // TODO: Backend integration - Apply blacklist to curriculum
      const newBlacklist: CurriculumBlacklist = {
        blacklistId: blacklistId,
      };
      setSelectedBlacklists(prev => [...prev, newBlacklist]);
    }
  };

  const getBlacklistById = (id: string) => {
    return mockAvailableBlacklists.find(b => b.id === id);
  };

  const isBlacklistSelected = (blacklistId: string) => {
    return selectedBlacklists.some(b => b.blacklistId === blacklistId);
  };

  const filteredBlacklists = mockAvailableBlacklists.filter(blacklist =>
    blacklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blacklist.courses.some(course => 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalBlacklistedCourses = selectedBlacklists.reduce((total, selected) => {
    const blacklist = getBlacklistById(selected.blacklistId);
    return total + (blacklist?.courses.length || 0);
  }, 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Available Blacklists */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6">Available Blacklists</h2>
          
          {/* Search Input */}
          <div className="mb-4">
            {/* TODO: Backend integration - Implement real-time search functionality for blacklists */}
            <input
              type="text"
              placeholder="Search blacklists or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-background text-foreground"
            />
          </div>

          {/* Blacklists List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* TODO: Backend integration - Replace with actual blacklist data from API
                 API endpoint: GET /api/blacklists?department={departmentId} */}
            {filteredBlacklists.map((blacklist) => {
              const isSelected = isBlacklistSelected(blacklist.id);
              
              return (
                <div 
                  key={blacklist.id} 
                  onClick={() => handleBlacklistClick(blacklist.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{blacklist.name}</span>
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Applied
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {blacklist.courses.length} courses blacklisted
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        Created {blacklist.createdAt}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <FaCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredBlacklists.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                  {searchTerm ? 'No blacklists match your search.' : 'No blacklists available.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Applied Blacklists Summary */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">Applied Blacklists</h2>
            {selectedBlacklists.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {totalBlacklistedCourses} courses blacklisted
              </span>
            )}
          </div>

          {/* Show applied blacklists when any are selected */}
          {/* TODO: Backend integration - Display and save blacklist applications */}
          {selectedBlacklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FaExclamationTriangle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                No blacklists applied to this curriculum
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Select blacklists from the list to restrict courses for students
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedBlacklists.map((selected) => {
                const blacklist = getBlacklistById(selected.blacklistId);
                if (!blacklist) return null;
                
                return (
                  <div key={selected.blacklistId} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {blacklist.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {blacklist.courses.length} courses will be restricted
                          </p>
                        </div>
                        <button
                          onClick={() => handleBlacklistClick(selected.blacklistId)}
                          className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Course Preview */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Blacklisted Courses:
                        </h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {blacklist.courses.map((course, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {course.code}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 truncate ml-2">
                                {course.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Created {blacklist.createdAt}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Warning Message */}
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Important Notice
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Students enrolled in this curriculum will not be able to register for any courses in the applied blacklists. 
                      Make sure these restrictions align with your curriculum requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
