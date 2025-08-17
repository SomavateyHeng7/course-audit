"use client";

import { useState, useEffect } from "react";
import { FaCheck, FaPlus } from 'react-icons/fa';
import { concentrationApi } from '@/services/concentrationApi';

interface Concentration {
  id: string;
  name: string;
  courses: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    creditHours?: string;
    category?: string;
    description?: string;
  }>;
  createdAt: string;
}

interface CurriculumConcentration {
  concentrationId: string;
  requiredCourses: number;
}

interface ConcentrationsTabProps {
  concentrationTitle?: string; // Backend-controlled title
  curriculumId?: string; // Add curriculum ID for backend integration
}

export default function ConcentrationsTab({ concentrationTitle = "Concentrations", curriculumId }: ConcentrationsTabProps) {
  const [availableConcentrations, setAvailableConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentrations, setSelectedConcentrations] = useState<CurriculumConcentration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available concentrations on mount
  useEffect(() => {
    loadConcentrations();
  }, []);

  // Load curriculum concentrations if curriculumId is provided
  useEffect(() => {
    if (curriculumId) {
      loadCurriculumConcentrations();
    }
  }, [curriculumId]);

  const loadConcentrations = async () => {
    try {
      setLoading(true);
      const concentrations = await concentrationApi.getConcentrations();
      setAvailableConcentrations(concentrations);
    } catch (err) {
      console.error('Error loading concentrations:', err);
      setError('Failed to load concentrations');
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculumConcentrations = async () => {
    try {
      // TODO: Implement API endpoint for getting curriculum concentrations
      // const curriculumConcentrations = await concentrationApi.getCurriculumConcentrations(curriculumId);
      // setSelectedConcentrations(curriculumConcentrations);
    } catch (err) {
      console.error('Error loading curriculum concentrations:', err);
    }
  };

  const handleConcentrationClick = async (concentrationId: string) => {
    const existing = selectedConcentrations.find(c => c.concentrationId === concentrationId);
    
    try {
      setLoading(true);
      
      if (existing) {
        // Remove concentration requirement from curriculum
        // TODO: Implement API endpoint for removing concentration from curriculum
        // await concentrationApi.removeCurriculumConcentration(curriculumId, concentrationId);
        setSelectedConcentrations(prev => prev.filter(c => c.concentrationId !== concentrationId));
      } else {
        // Add concentration requirement to curriculum
        // TODO: Implement API endpoint for adding concentration to curriculum
        // await concentrationApi.addCurriculumConcentration(curriculumId, concentrationId, 1);
        const newConcentration: CurriculumConcentration = {
          concentrationId: concentrationId,
          requiredCourses: 1
        };
        setSelectedConcentrations(prev => [...prev, newConcentration]);
      }
    } catch (err) {
      console.error('Error updating concentration:', err);
      setError('Failed to update concentration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequiredCourses = async (concentrationId: string, newCount: number) => {
    try {
      setLoading(true);
      // TODO: Implement API endpoint for updating concentration requirement count
      // await concentrationApi.updateCurriculumConcentration(curriculumId, concentrationId, newCount);
      setSelectedConcentrations(prev => 
        prev.map(c => 
          c.concentrationId === concentrationId 
            ? { ...c, requiredCourses: newCount }
            : c
        )
      );
    } catch (err) {
      console.error('Error updating required courses:', err);
      setError('Failed to update required courses');
    } finally {
      setLoading(false);
    }
  };

  const getConcentrationById = (id: string) => {
    return availableConcentrations.find(c => c.id === id);
  };

  const isConcentrationSelected = (concentrationId: string) => {
    return selectedConcentrations.some(c => c.concentrationId === concentrationId);
  };

  const getSelectedConcentration = (concentrationId: string) => {
    return selectedConcentrations.find(c => c.concentrationId === concentrationId);
  };

  // Filter concentrations based on search term
  const filteredConcentrations = availableConcentrations.filter(concentration =>
    concentration.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Available Concentrations */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6">Available {concentrationTitle}</h2>
          
          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={`Search ${concentrationTitle}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
            />
          </div>

          {/* Concentrations List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredConcentrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No concentrations found</p>
              </div>
            ) : (
              filteredConcentrations.map((concentration) => {
                const isSelected = isConcentrationSelected(concentration.id);
                
                return (
                  <div 
                    key={concentration.id} 
                    onClick={() => handleConcentrationClick(concentration.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary/40 bg-primary/10 dark:bg-primary/20/20' 
                        : 'border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">{concentration.name}</span>
                          {isSelected && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20/30 dark:text-primary/30">
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
                        <div className="w-6 h-6 bg-ring rounded-full flex items-center justify-center">
                          <FaCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Elective Requirements */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">Elective Requirements</h2>
          </div>

          {/* Show configuration when a concentration is selected */}
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
                            disabled={loading || selected.requiredCourses <= 1}
                            className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-medium text-lg transition-colors disabled:opacity-50"
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
                            disabled={loading || selected.requiredCourses >= concentration.courses.length}
                            className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-medium text-lg transition-colors disabled:opacity-50"
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
                          disabled={loading}
                          className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
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
