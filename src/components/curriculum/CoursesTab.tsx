'use client';

import { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Course {
  code: string;
  title: string;
  credits: number;
  creditHours: number;
  type: string;
}

interface CoursesTabProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  onAddCourse: () => void;
}

export default function CoursesTab({ courses, onEditCourse, onAddCourse }: CoursesTabProps) {
  const [search, setSearch] = useState('');

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      <div className="mb-6 flex items-center justify-between">        <div className="relative">
          <input
            type="text"
            placeholder="Search courses by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 border border-gray-300 dark:border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
            suppressHydrationWarning
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800 dark:text-emerald-200">Course Code</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800 dark:text-emerald-200">Title</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">Credits</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">Credit Hours</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">Type</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 dark:divide-border">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{course.code}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{course.title}</td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {course.credits}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      {course.creditHours}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    {course.type ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.type === 'Core' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        course.type === 'Major' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        course.type === 'Major Elective' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        course.type === 'General Education' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {course.type}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEditCourse(course)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all" 
                        title="Edit Course"
                        suppressHydrationWarning
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                        title="Delete Course"
                        suppressHydrationWarning
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No courses found</p>
                    <p className="text-sm">
                      {search ? `No courses match "${search}"` : "No courses in curriculum yet"}
                    </p>
                    {search && (
                      <button 
                        onClick={() => setSearch('')}
                        className="mt-3 text-emerald-600 dark:text-emerald-400 hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-border">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} in curriculum
        </div>        <div className="flex gap-3">
          <button 
            onClick={onAddCourse}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors border border-emerald-700 shadow-sm"
            suppressHydrationWarning
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
          <button 
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors border border-emerald-700 shadow-sm"
            suppressHydrationWarning
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
