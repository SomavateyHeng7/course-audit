"use client";

import { useState, useEffect } from "react";
import { FaCheck, FaPlus } from 'react-icons/fa';
import { concentrationApi, curriculumConcentrationApi } from '@/services/concentrationApi';

interface Course {
  id: string;
  code: string;
  title?: string;
  name?: string;
  creditHours: string | number;
  credits?: number;
  category?: string;
}

interface Concentration {
  id: string;
  name: string;
  description?: string;
  courses: Course[];
  createdAt: string;
}

interface CurriculumConcentration {
  id: string;
  concentration: Concentration;
  requiredCourses: number;
}

interface ConcentrationsTabProps {
  concentrationTitle?: string; // Backend-controlled title
  curriculumId: string; // Required curriculum ID for backend integration
}

export default function ConcentrationsTab({ concentrationTitle = "Concentrations", curriculumId }: ConcentrationsTabProps) {
  const [availableConcentrations, setAvailableConcentrations] = useState<Concentration[]>([]);
  const [curriculumConcentrations, setCurriculumConcentrations] = useState<CurriculumConcentration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for input values to prevent auto-save on every keystroke
  const [localInputValues, setLocalInputValues] = useState<Record<string, number>>({});

  // Load data on mount and when curriculumId changes
  useEffect(() => {
    if (curriculumId) {
      loadData();
    }
  }, [curriculumId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both available concentrations and curriculum concentrations
      const [allConcentrations, curriculumData] = await Promise.all([
        concentrationApi.getConcentrations(),
        curriculumConcentrationApi.getCurriculumConcentrations(curriculumId)
      ]);
      
      setAvailableConcentrations(allConcentrations || []);
      setCurriculumConcentrations(curriculumData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load concentration data');
    } finally {
      setLoading(false);
    }
  };

  const handleConcentrationClick = async (concentrationId: string) => {
    // Check if this concentration is already assigned
    // Backend returns { id: concentration_id, concentration: {...} }
    const existing = curriculumConcentrations.find(cc => 
      cc.id === concentrationId || cc.concentration?.id === concentrationId
    );
    
    try {
      setLoading(true);
      setError(null);
      
      if (existing) {
        // Remove concentration requirement from curriculum
        await curriculumConcentrationApi.removeCurriculumConcentration(curriculumId, concentrationId);
      } else {
        // Add concentration requirement to curriculum
        await curriculumConcentrationApi.addCurriculumConcentration(curriculumId, concentrationId, 1);
      }
      
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error updating concentration:', err);
      setError('Failed to update concentration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequiredCourses = async (concentrationId: string, newCount: number) => {
    if (newCount < 1) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await curriculumConcentrationApi.updateCurriculumConcentration(curriculumId, concentrationId, newCount);
      
      // Clear local input value after successful save
      setLocalInputValues(prev => {
        const updated = { ...prev };
        delete updated[concentrationId];
        return updated;
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error updating required courses:', err);
      setError('Failed to update required courses');
    } finally {
      setLoading(false);
    }
  };

  // Handle input value changes locally
  const handleInputChange = (concentrationId: string, value: string) => {
    const numValue = parseInt(value) || 1;
    setLocalInputValues(prev => ({
      ...prev,
      [concentrationId]: numValue
    }));
  };

  // Handle saving input value (on blur or Enter key)
  const handleSaveInput = (concentrationId: string) => {
    const currentConcentration = curriculumConcentrations.find(cc => cc.concentration.id === concentrationId);
    if (!currentConcentration) return;

    const localValue = localInputValues[concentrationId];
    if (localValue && localValue !== currentConcentration.requiredCourses) {
      const maxCourses = currentConcentration.concentration.courses.length;
      const validValue = Math.max(1, Math.min(localValue, maxCourses));
      handleUpdateRequiredCourses(concentrationId, validValue);
    }
  };

  const isConcentrationSelected = (concentrationId: string) => {
    return curriculumConcentrations.some(cc => 
      cc.id === concentrationId || cc.concentration?.id === concentrationId
    );
  };

  const getSelectedConcentration = (concentrationId: string) => {
    return curriculumConcentrations.find(cc => 
      cc.id === concentrationId || cc.concentration?.id === concentrationId
    );
  };

  // Get unassigned concentrations for display
  // Backend can return either format: { id: concentrationId, concentration: {...} } or { concentration: { id: ... } }
  const assignedConcentrationIds = curriculumConcentrations.map(cc => 
    cc.id || cc.concentration?.id
  ).filter(Boolean);
  const unassignedConcentrations = availableConcentrations.filter(
    concentration => !assignedConcentrationIds.includes(concentration.id)
  );

  // Filter concentrations based on search term
  const filteredConcentrations = unassignedConcentrations.filter(concentration =>
    concentration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (concentration.description && concentration.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button 
            onClick={loadData}
            className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Available Concentrations */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6">
            Available {concentrationTitle}
          </h2>
          
          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={`Search ${concentrationTitle.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Concentrations List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : filteredConcentrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? `No ${concentrationTitle.toLowerCase()} found matching "${searchTerm}"` : `No available ${concentrationTitle.toLowerCase()}`}
              </div>
            ) : (
              filteredConcentrations.map((concentration) => (
                <div
                  key={concentration.id}
                  onClick={() => handleConcentrationClick(concentration.id)}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{concentration.name}</h3>
                      {concentration.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{concentration.description}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {concentration.courses.length} courses available
                      </p>
                    </div>
                    <div className="ml-4">
                      <FaPlus className="text-blue-500" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Selected Concentrations */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">
              Selected {concentrationTitle}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {curriculumConcentrations.length} selected
            </span>
          </div>

          {/* Show configuration when concentrations are selected */}
          {curriculumConcentrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FaPlus className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No {concentrationTitle.toLowerCase()} selected</p>
              <p className="text-sm mt-2">Click on a {concentrationTitle.toLowerCase().slice(0, -1)} from the left to add it</p>
            </div>
          ) : (
            <div className="space-y-4">
              {curriculumConcentrations.map((curriculumConcentration) => (
                <div
                  key={curriculumConcentration.concentration.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {curriculumConcentration.concentration.name}
                      </h3>
                      {curriculumConcentration.concentration.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {curriculumConcentration.concentration.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleConcentrationClick(curriculumConcentration.concentration.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Required Courses:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={curriculumConcentration.concentration.courses.length}
                          value={localInputValues[curriculumConcentration.concentration.id] ?? curriculumConcentration.requiredCourses}
                          onChange={(e) => handleInputChange(curriculumConcentration.concentration.id, e.target.value)}
                          onBlur={() => handleSaveInput(curriculumConcentration.concentration.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur(); // This will trigger onBlur which saves
                            }
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading}
                          placeholder="1"
                        />
                        {localInputValues[curriculumConcentration.concentration.id] && 
                         localInputValues[curriculumConcentration.concentration.id] !== curriculumConcentration.requiredCourses && (
                          <button
                            onClick={() => handleSaveInput(curriculumConcentration.concentration.id)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            disabled={loading}
                          >
                            Save
                          </button>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          of {curriculumConcentration.concentration.courses.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Available courses: {curriculumConcentration.concentration.courses.map(course => course.code).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
