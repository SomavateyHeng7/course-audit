'use client';

import { useState } from 'react';
import { ExcelUpload } from '../components/excel/ExcelUpload';
import Link from 'next/link';

export default function ManagementPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Course Management</h1>

          {/* Faculty Header */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Faculty - VMES</h2>
            <p className="text-gray-600">Please select your department and curriculum</p>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Department Selection Box */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Department</option>
                  <option value="it">Information Technology</option>
                  {/* Add more departments */}
                </select>
              </div>
            </div>

            {/* Curriculum Selection Box */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <label htmlFor="curriculum" className="block text-sm font-medium text-gray-700">
                  Curriculum
                </label>
                <select
                  id="curriculum"
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Curriculum</option>
                  <option value="63">63xxxxx</option>
                  {/* Add more curricula */}
                </select>
              </div>
            </div>

            {/* Data Entry Options Box */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-6">
                {/* Excel Upload Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Upload Excel File</h3>
                  <ExcelUpload
                    onDataLoaded={(data) => {
                      console.log(data);
                      setIsFileUploaded(true);
                    }}
                    onError={(error) => console.error(error)}
                  />
                  {isFileUploaded && (
                    <Link
                      href="/management/excel-view"
                      className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <span>Next</span>
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Manual Entry Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Manual Course Entry</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Enter your courses manually to track your academic progress.
                  </p>
                  <Link
                    href="/management/manual-entry"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <span>Next</span>
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 