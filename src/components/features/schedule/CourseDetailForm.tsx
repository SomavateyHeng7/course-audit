'use client';

import React, { useState } from 'react';
import { FaTimes, FaChalkboardTeacher, FaChair } from 'react-icons/fa';
import { useToastHelpers } from '@/hooks/useToast';

interface CourseDetailFormProps {
  courseName?: string;
  courseCode?: string;
  onSave: (courseData: CourseFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
  instructorsList?: string[];
  onAddInstructor?: (instructorName: string) => void;
}

interface DayTimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface CourseFormData {
  section: string;
  dayTimeSlots: DayTimeSlot[];
  instructor: string;
  seat: string;
  categoryColor: string;
}

const CourseDetailForm: React.FC<CourseDetailFormProps> = ({
  courseName = "Data Structure",
  courseCode = "CSX3003",
  onSave,
  onCancel,
  isOpen,
  instructorsList = [],
  onAddInstructor
}) => {
  const [formData, setFormData] = useState<CourseFormData>({
    section: '',
    dayTimeSlots: [],
    instructor: '',
    seat: '',
    categoryColor: '#3B82F6'
  });

  const [showCustomInstructor, setShowCustomInstructor] = useState(false);
  const [customInstructor, setCustomInstructor] = useState('');
  const { error: showError, warning } = useToastHelpers();

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleInputChange = (field: keyof CourseFormData, value: string | DayTimeSlot[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const existingSlot = prev.dayTimeSlots.find(slot => slot.day === day);
      
      if (existingSlot) {
        // Remove the day
        return {
          ...prev,
          dayTimeSlots: prev.dayTimeSlots.filter(slot => slot.day !== day)
        };
      } else {
        // Add the day with empty time slots
        return {
          ...prev,
          dayTimeSlots: [...prev.dayTimeSlots, { day, startTime: '', endTime: '' }]
        };
      }
    });
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      dayTimeSlots: prev.dayTimeSlots.map(slot =>
        slot.day === day ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.section?.trim()) {
      showError('Please enter section', 'Missing Section');
      return;
    }
    if (formData.dayTimeSlots.length === 0) {
      showError('Please select at least one day', 'Missing Schedule');
      return;
    }
    
    // Validate that all selected days have times
    for (const slot of formData.dayTimeSlots) {
      if (!slot.startTime || !slot.endTime) {
        showError(`Please enter start and end time for ${slot.day}`, 'Incomplete Time Schedule');
        return;
      }
    }
    
    if (!formData.instructor?.trim()) {
      showError('Please enter instructor', 'Missing Instructor');
      return;
    }
    if (!formData.seat?.trim()) {
      showError('Please enter seat capacity', 'Missing Seat Capacity');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/40 p-0 sm:p-4 animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 shrink-0">
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

        {/* Form - with scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
          <div className="space-y-3 sm:space-y-4">
            {/* Days Selection */}
            <div>
              <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                Days <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(Select one or more days)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.dayTimeSlots.some(slot => slot.day === day);
                  return (
                    <label
                      key={day}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                          : 'border-gray-300 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDayToggle(day)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {day.substring(0, 3)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {formData.dayTimeSlots.length > 0 && (
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                  Selected: {formData.dayTimeSlots.map(slot => slot.day).join(', ')}
                </p>
              )}
            </div>

            {/* Time Slots for Each Selected Day */}
            {formData.dayTimeSlots.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Time Schedule <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Specify time for each day)</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                  {formData.dayTimeSlots.map((slot) => (
                    <div key={slot.day} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300 min-w-[80px]">
                        {slot.day}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeChange(slot.day, 'startTime', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          placeholder="Start"
                        />
                        <span className="text-gray-400 text-sm">-</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeChange(slot.day, 'endTime', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          placeholder="End"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructor */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">
              <FaChalkboardTeacher className="inline mr-1 w-4 h-4" />
              Instructor
            </label>
            {!showCustomInstructor ? (
              <div className="space-y-2">
                <select
                  value={formData.instructor}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomInstructor(true);
                      handleInputChange('instructor', '');
                    } else {
                      handleInputChange('instructor', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                >
                  <option value="">Select Instructor</option>
                  {instructorsList.map((instructor) => (
                    <option key={instructor} value={instructor}>{instructor}</option>
                  ))}
                  <option value="__custom__">+ Add New Instructor</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstructor}
                  onChange={(e) => setCustomInstructor(e.target.value)}
                  placeholder="Enter instructor name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customInstructor.trim()) {
                      handleInputChange('instructor', customInstructor);
                      if (onAddInstructor) {
                        onAddInstructor(customInstructor);
                      }
                      setCustomInstructor('');
                      setShowCustomInstructor(false);
                    }
                  }}
                  className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInstructor(false);
                    setCustomInstructor('');
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Seat */}
          <div className="relative">
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
              <FaChair className="inline mr-1 w-4 h-4" />
              Seat Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.seat}
              onChange={(e) => handleInputChange('seat', e.target.value)}
              placeholder="Enter seat capacity"
              min="1"
              required
              className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseDetailForm;