'use client';

import React, { useState } from 'react';
import { FaTimes, FaChalkboardTeacher, FaChair } from 'react-icons/fa';

interface CourseDetailFormProps {
  courseName?: string;
  courseCode?: string;
  onSave: (courseData: CourseFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface CourseFormData {
  section: string;
  day: string;
  startTime: string;
  endTime: string;
  instructor: string;
  seat: string;
  categoryColor: string;
}

const CourseDetailForm: React.FC<CourseDetailFormProps> = ({
  courseName = "Data Structure",
  courseCode = "CSX3003",
  onSave,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState<CourseFormData>({
    section: '',
    day: '',
    startTime: '',
    endTime: '',
    instructor: '',
    seat: '',
    categoryColor: '#3B82F6'
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const required = ['section', 'day', 'startTime', 'endTime', 'instructor', 'seat'];
    for (const field of required) {
      if (!(formData as any)[field]?.trim()) {
        alert(`Please enter ${field}`);
        return;
      }
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/40 p-0 sm:p-4 animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate pr-2">
            {courseCode} • {courseName}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition touch-manipulation shrink-0"
          >
            <FaTimes className="text-gray-600 dark:text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Section */}
          <div className="relative">
            <input
              type="text"
              id="section"
              value={formData.section}
              onChange={(e) => handleInputChange('section', e.target.value)}
              className="peer w-full px-3 pt-4 sm:pt-5 pb-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              placeholder=" "
            />
            <label
              htmlFor="section"
              className="absolute left-3 top-1.5 sm:top-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 sm:peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-1.5 sm:peer-focus:top-2 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-teal-500"
            >
              Section
            </label>
          </div>

          {/* Day & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Day</label>
              <select
                value={formData.day}
                onChange={(e) => handleInputChange('day', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base touch-manipulation"
              >
                <option value="">Select Day</option>
                {daysOfWeek.map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Time</label>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex-1">
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                  />
                </div>
                <span className="text-gray-400 text-sm">-</span>
                <div className="flex-1">
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="relative">
            <FaChalkboardTeacher className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={formData.instructor}
              onChange={(e) => handleInputChange('instructor', e.target.value)}
              placeholder="Instructor name"
              className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
            />
          </div>

          {/* Seat */}
          <div className="relative">
            <FaChair className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={formData.seat}
              onChange={(e) => handleInputChange('seat', e.target.value)}
              placeholder="Seat capacity"
              className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
            />
          </div>

          {/* Category Color */}
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Category Color</label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={formData.categoryColor}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-gray-100 cursor-default text-sm sm:text-base"
              />
              <input
                type="color"
                value={formData.categoryColor}
                onChange={(e) => handleInputChange('categoryColor', e.target.value)}
                className="w-8 h-8 sm:w-10 sm:h-10 border-none bg-transparent cursor-pointer touch-manipulation"
                aria-label="Pick category color"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 sm:px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm sm:text-base touch-manipulation order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 sm:px-6 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition text-sm sm:text-base touch-manipulation order-1 sm:order-2"
            >
              Add Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseDetailForm;