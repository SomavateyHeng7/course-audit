'use client';

import { useState, useRef } from 'react';

interface ExcelPlusTabProps {}

export default function ExcelPlusTab({}: ExcelPlusTabProps) {
  const [curriculumConcentration, setCurriculumConcentration] = useState('Software Development');
  const [constraintHandling, setConstraintHandling] = useState<'preserve' | 'reset'>('preserve');
  const [electiveHandling, setElectiveHandling] = useState<'preserve' | 'reset'>('preserve');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      <div className="flex gap-12">
        {/* Form Section */}
        <div className="w-[400px]">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Edit Curriculum</h2>
          <form className="flex flex-col gap-6">
            <div>
              <label className="block font-semibold mb-1 text-foreground">Curriculum Name</label>
              <input
                type="text"
                placeholder="Enter curriculum name"
                defaultValue="Curriculum for 2022"
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
              <input
                type="number"
                placeholder="Enter total credits"
                defaultValue="132"
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
              />
            </div>            <div>
              <label className="block font-semibold mb-1 text-foreground">Concentration</label>
              <select 
                value={curriculumConcentration}
                onChange={(e) => setCurriculumConcentration(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
              >
                <option value="Software Development">Software Development</option>
                <option value="Informatic and Data Science">Informatic and Data Science</option>
              </select>
            </div>
            
            {/* Post-Upload Handling Options */}
            <div className="border-t border-gray-200 dark:border-border pt-6">
              <h3 className="font-semibold mb-4 text-foreground">Post-Upload Settings</h3>
              
              <div className="mb-4">
                <label className="block font-medium mb-2 text-foreground">Course Constraints:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="constraints"
                      value="preserve"
                      checked={constraintHandling === 'preserve'}
                      onChange={(e) => setConstraintHandling(e.target.value as 'preserve' | 'reset')}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Preserve existing constraints (prerequisites, etc.)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="constraints"
                      value="reset"
                      checked={constraintHandling === 'reset'}
                      onChange={(e) => setConstraintHandling(e.target.value as 'preserve' | 'reset')}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Reset all constraints (start fresh)</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block font-medium mb-2 text-foreground">Elective Status:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="electives"
                      value="preserve"
                      checked={electiveHandling === 'preserve'}
                      onChange={(e) => setElectiveHandling(e.target.value as 'preserve' | 'reset')}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Preserve existing required/elective settings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="electives"
                      value="reset"
                      checked={electiveHandling === 'reset'}
                      onChange={(e) => setElectiveHandling(e.target.value as 'preserve' | 'reset')}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Reset to default (all elective)</span>
                  </label>
                </div>
              </div>
            </div>            <button
              type="submit"
              suppressHydrationWarning
              className="bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition mt-4 w-32 self-start border border-emerald-700"
            >
              Update
            </button>
          </form>
        </div>
          {/* File Upload Section */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
            <h3 className="font-bold text-xl mb-4 text-foreground">Upload Excel File</h3>
            
            {/* Upload Instructions */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Upload Instructions:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Excel file should contain course information (code, name, credits, etc.)</li>
                <li>• New courses will be added to the curriculum</li>
                <li>• Existing courses will be updated with new information</li>
                <li>• Use the settings on the left to control how constraints and elective status are handled</li>
              </ul>
            </div>
            
            <div
              className="h-52 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Drag and drop Excel file here,<br />
                or click here to upload.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
