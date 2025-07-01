"use client";

import { useState } from "react";
import { FaCheck, FaPlus } from 'react-icons/fa';

interface Concentration {
  id: string;
  name: string;
  courses: Array<{
    code: string;
    title: string;
    credits: number;
    creditHours: string; // Changed to string to support formats like "3-0-6"
    type: string;
  }>;
  createdAt: string;
}

interface CurriculumConcentration {
  concentrationId: string;
  requiredCourses: number;
}

interface ConcentrationsTabProps {
  concentrationTitle?: string; // Backend-controlled title
}

// Mock data - in real implementation, this will come from backend
const mockAvailableConcentrations: Concentration[] = [
  {
    id: '1',
    name: 'Data Science',
    courses: [
      { code: 'CSX 3001', title: 'Machine Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3002', title: 'Data Mining', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3003', title: 'Statistical Analysis', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3004', title: 'Big Data Analytics', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
    ],
    createdAt: '2024-12-15'
  },
  {
    id: '2',
    name: 'Software Engineering',
    courses: [
      { code: 'CSX 3005', title: 'Software Architecture', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3006', title: 'Advanced Testing', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3007', title: 'DevOps Practices', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 3008', title: 'Software Project Management', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
    ],
    createdAt: '2024-11-20'
  },
  {
    id: '3',
    name: 'Artificial Intelligence',
    courses: [
      { code: 'CSX 4001', title: 'Neural Networks', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 4002', title: 'Computer Vision', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 4003', title: 'Natural Language Processing', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
      { code: 'CSX 4004', title: 'Robotics', credits: 3, creditHours: '3-0-6', type: 'Major Elective' },
    ],
    createdAt: '2024-10-10'
  },
];

export default function ConcentrationsTab({ concentrationTitle = "Concentrations" }: ConcentrationsTabProps) {
  const [selectedConcentrations, setSelectedConcentrations] = useState<CurriculumConcentration[]>([]);

  const handleConcentrationClick = (concentrationId: string) => {
    const existing = selectedConcentrations.find(c => c.concentrationId === concentrationId);
    if (existing) {
      // If already selected, remove it
      // TODO: Backend integration - Remove concentration requirement from curriculum
      setSelectedConcentrations(prev => prev.filter(c => c.concentrationId !== concentrationId));
    } else {
      // If not selected, add it with default 1 required course
      // TODO: Backend integration - Add concentration requirement to curriculum
      const newConcentration: CurriculumConcentration = {
        concentrationId: concentrationId,
        requiredCourses: 1
      };
      setSelectedConcentrations(prev => [...prev, newConcentration]);
    }
  };

  const handleUpdateRequiredCourses = (concentrationId: string, newCount: number) => {
    // TODO: Backend integration - Update concentration requirement
    setSelectedConcentrations(prev => 
      prev.map(c => 
        c.concentrationId === concentrationId 
          ? { ...c, requiredCourses: newCount }
          : c
      )
    );
  };

  const getConcentrationById = (id: string) => {
    return mockAvailableConcentrations.find(c => c.id === id);
  };

  const isConcentrationSelected = (concentrationId: string) => {
    return selectedConcentrations.some(c => c.concentrationId === concentrationId);
  };

  const getSelectedConcentration = (concentrationId: string) => {
    return selectedConcentrations.find(c => c.concentrationId === concentrationId);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Available Concentrations */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6">Available {concentrationTitle}</h2>
        
        {/* Search Input */}
        <div className="mb-4">
          {/* TODO: Backend integration - Implement real-time search functionality for concentrations */}
          <input
            type="text"
            placeholder={`Search ${concentrationTitle}...`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          {/* TODO: Backend integration - Filter concentrations by category */}
          <select className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground">
            <option>All</option>
            <option>Technical</option>
            <option>Business</option>
            <option>Research</option>
          </select>
        </div>

        {/* Concentrations List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* TODO: Backend integration - Replace with actual concentration data from API
               API endpoint: GET /api/concentrations?department={departmentId} */}
          {mockAvailableConcentrations.map((concentration) => {
            const isSelected = isConcentrationSelected(concentration.id);
            
            return (
              <div 
                key={concentration.id} 
                onClick={() => handleConcentrationClick(concentration.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{concentration.name}</span>
                      {isSelected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {concentration.courses.length} courses available
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                      Created {concentration.createdAt}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <FaCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Elective Requirements */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">Elective Requirements</h2>
        </div>

        {/* Show configuration when a concentration is selected */}
        {/* TODO: Backend integration - Display and save concentration requirements */}
        {selectedConcentrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Select a concentration from the list to configure its elective requirements
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedConcentrations.map((selected) => {
              const concentration = getConcentrationById(selected.concentrationId);
              if (!concentration) return null;
              
              return (
                <div key={selected.concentrationId} className="border border-gray-200 dark:border-border rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {concentration.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {concentration.courses.length} courses available in this concentration
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Required Courses
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            if (selected.requiredCourses > 1) {
                              handleUpdateRequiredCourses(selected.concentrationId, selected.requiredCourses - 1);
                            }
                          }}
                          className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-medium text-lg transition-colors"
                          disabled={selected.requiredCourses <= 1}
                        >
                          -
                        </button>
                        <div className="flex-1 text-center">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            {selected.requiredCourses}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            course{selected.requiredCourses !== 1 ? 's' : ''} required
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (selected.requiredCourses < concentration.courses.length) {
                              handleUpdateRequiredCourses(selected.concentrationId, selected.requiredCourses + 1);
                            }
                          }}
                          className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-medium text-lg transition-colors"
                          disabled={selected.requiredCourses >= concentration.courses.length}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                        Students must complete this many courses from the {concentration.name} concentration
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Available courses:</span> {concentration.courses.length}
                      </div>
                      <button
                        onClick={() => handleConcentrationClick(selected.concentrationId)}
                        className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-sm font-medium"
                      >
                        Remove Concentration
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
    </>
  );
}
