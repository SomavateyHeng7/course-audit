'use client';

import { useState, useRef } from 'react';

interface ExcelPlusTabProps {}

export default function ExcelPlusTab({}: ExcelPlusTabProps) {
  const [curriculumConcentration, setCurriculumConcentration] = useState('Software Development');
  const [constraintHandling, setConstraintHandling] = useState<'preserve' | 'reset'>('preserve');
  const [electiveHandling, setElectiveHandling] = useState<'preserve' | 'reset'>('preserve');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx, .xls)');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    
    try {
      // Here you would add the Excel parsing logic
      console.log('Processing Excel file:', file.name);
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Excel file processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files.find(f => 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls')
    );
    
    if (file) {
      await handleFileUpload(file);
    } else {
      alert('Please drop an Excel file (.xlsx, .xls)');
    }
  };

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
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
              <input
                type="number"
                placeholder="Enter total credits"
                defaultValue="132"
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
            </div>            <div>
              <label className="block font-semibold mb-1 text-foreground">Concentration</label>
              <select 
                value={curriculumConcentration}
                onChange={(e) => setCurriculumConcentration(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
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
              className="bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition mt-4 w-32 self-start"
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
            
            {uploadedFile && (
              <div className="mb-4 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg">
                <p className="text-sm text-primary">
                  <strong>File uploaded:</strong> {uploadedFile.name}
                </p>
              </div>
            )}
            
            <div
              className={`h-52 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                isDragOver 
                  ? 'border-primary bg-primary/10 text-primary scale-105'
                  : uploadedFile 
                    ? 'border-primary/30 bg-primary/10 dark:bg-primary/20 text-primary' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm">Processing file...</p>
                </>
              ) : isDragOver ? (
                <>
                  <svg className="w-12 h-12 mb-2 text-primary animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <p className="text-center text-sm font-medium">
                    Drop your Excel file here!
                  </p>
                </>
              ) : uploadedFile ? (
                <>
                  <svg className="w-10 h-10 mb-2 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-center text-sm">
                    File uploaded successfully!<br />
                    Click to upload a different file.
                  </p>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <p className="text-center text-sm">
                    <span className="font-medium">Drag and drop</span> Excel file here,<br />
                    or <span className="text-primary underline">click here to upload</span>.
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
