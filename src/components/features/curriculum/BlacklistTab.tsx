"use client";

import { useState, useEffect } from "react";
import { FaCheck, FaExclamationTriangle, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { curriculumBlacklistApi, type CurriculumBlacklist, type AssignedBlacklist, type CurriculumBlacklistsResponse } from '@/services/curriculumBlacklistApi';

interface BlacklistTabProps {
  curriculumId: string;
}

export default function BlacklistTab({ curriculumId }: BlacklistTabProps) {
  // State for blacklist data
  const [data, setData] = useState<CurriculumBlacklistsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningBlacklists, setAssigningBlacklists] = useState<Set<string>>(new Set());
  const [removingBlacklists, setRemovingBlacklists] = useState<Set<string>>(new Set());
  const [expandedBlacklists, setExpandedBlacklists] = useState<Set<string>>(new Set());

  // Load curriculum blacklists on mount
  useEffect(() => {
    loadCurriculumBlacklists();
  }, [curriculumId]);

  const loadCurriculumBlacklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await curriculumBlacklistApi.getCurriculumBlacklists(curriculumId);
      setData(response);
    } catch (err) {
      console.error('Error loading curriculum blacklists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blacklists');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBlacklist = async (blacklistId: string) => {
    try {
      setAssigningBlacklists(prev => new Set(prev).add(blacklistId));
      setError(null);
      
      await curriculumBlacklistApi.assignBlacklistToCurriculum(curriculumId, { blacklistId });
      
      // Reload data to get updated assignments
      await loadCurriculumBlacklists();
      
    } catch (err) {
      console.error('Error assigning blacklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign blacklist');
    } finally {
      setAssigningBlacklists(prev => {
        const newSet = new Set(prev);
        newSet.delete(blacklistId);
        return newSet;
      });
    }
  };

  const handleRemoveBlacklist = async (blacklistId: string) => {
    try {
      setRemovingBlacklists(prev => new Set(prev).add(blacklistId));
      setError(null);
      
      await curriculumBlacklistApi.removeBlacklistFromCurriculum(curriculumId, blacklistId);
      
      // Reload data to get updated assignments
      await loadCurriculumBlacklists();
      
    } catch (err) {
      console.error('Error removing blacklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove blacklist');
    } finally {
      setRemovingBlacklists(prev => {
        const newSet = new Set(prev);
        newSet.delete(blacklistId);
        return newSet;
      });
    }
  };

  const toggleBlacklistExpansion = (blacklistId: string) => {
    setExpandedBlacklists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blacklistId)) {
        newSet.delete(blacklistId);
      } else {
        newSet.add(blacklistId);
      }
      return newSet;
    });
  };

  const isBlacklistAssigned = (blacklistId: string) => {
    return data?.assignedBlacklists.some(ab => ab.blacklistId === blacklistId) || false;
  };

  const filteredAvailableBlacklists = data?.availableBlacklists.filter(blacklist =>
    blacklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blacklist.courses.some(course => 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const filteredAssignedBlacklists = data?.assignedBlacklists.filter(assigned =>
    assigned.blacklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assigned.blacklist.courses.some(course => 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <FaSpinner className="w-5 h-5 animate-spin" />
          <span>Loading blacklists...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
          <FaExclamationTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Error Loading Blacklists</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadCurriculumBlacklists}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data?.stats.totalAvailable || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Available Blacklists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data?.stats.totalAssigned || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Assigned to Curriculum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data?.stats.totalBlacklistedCourses || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Blacklisted Courses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Available Blacklists */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-6">Available Blacklists</h2>
          
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search blacklists or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-background text-foreground"
            />
          </div>

          {/* Available Blacklists List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAvailableBlacklists.map((blacklist) => {
              const isAssigned = isBlacklistAssigned(blacklist.id);
              const isAssigning = assigningBlacklists.has(blacklist.id);
              const isExpanded = expandedBlacklists.has(blacklist.id);
              
              return (
                <div 
                  key={blacklist.id} 
                  className={`p-4 border rounded-lg transition-colors ${
                    isAssigned 
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">{blacklist.name}</span>
                          {isAssigned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {blacklist.courseCount} courses • {blacklist.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Preview Button */}
                        <button
                          onClick={() => toggleBlacklistExpansion(blacklist.id)}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={isExpanded ? "Hide courses" : "Show courses"}
                        >
                          {isExpanded ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                        </button>

                        {/* Assign/Assigned Button */}
                        {isAssigned ? (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <FaCheck className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAssignBlacklist(blacklist.id)}
                            disabled={isAssigning}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isAssigning ? (
                              <>
                                <FaSpinner className="w-3 h-3 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              'Assign'
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Course Preview */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Blacklisted Courses ({blacklist.courseCount}):
                        </h4>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {blacklist.courses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between text-sm">
                              <span className="font-mono text-gray-800 dark:text-gray-200">{course.code}</span>
                              <span className="text-gray-600 dark:text-gray-400 truncate ml-2">{course.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAvailableBlacklists.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                  {searchTerm ? 'No blacklists match your search.' : 'No blacklists available in your department.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Assigned Blacklists */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">Assigned Blacklists</h2>
            {(data?.stats.totalAssigned || 0) > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {data?.stats.totalBlacklistedCourses} courses blacklisted
              </span>
            )}
          </div>

          {/* Assigned Blacklists List */}
          {filteredAssignedBlacklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FaExclamationTriangle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                No blacklists assigned to this curriculum
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Assign blacklists from the available list to restrict courses for students
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredAssignedBlacklists.map((assigned) => {
                const isRemoving = removingBlacklists.has(assigned.blacklistId);
                const isExpanded = expandedBlacklists.has(assigned.blacklistId);
                
                return (
                  <div key={assigned.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {assigned.blacklist.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assigned.blacklist.courseCount} courses restricted • Assigned {new Date(assigned.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Preview Button */}
                          <button
                            onClick={() => toggleBlacklistExpansion(assigned.blacklistId)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={isExpanded ? "Hide courses" : "Show courses"}
                          >
                            {isExpanded ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                          </button>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveBlacklist(assigned.blacklistId)}
                            disabled={isRemoving}
                            className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isRemoving ? (
                              <>
                                <FaSpinner className="w-3 h-3 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              'Remove'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Course Preview */}
                      {isExpanded && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Blacklisted Courses ({assigned.blacklist.courseCount}):
                          </h4>
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                            {assigned.blacklist.courses.map((course) => (
                              <div key={course.id} className="flex items-center justify-between text-sm">
                                <span className="font-mono text-gray-800 dark:text-gray-200">{course.code}</span>
                                <span className="text-gray-600 dark:text-gray-400 truncate ml-2">{course.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                      Students enrolled in this curriculum will not be able to register for any courses in the assigned blacklists. 
                      These restrictions are automatically effective and will apply immediately to all students.
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
