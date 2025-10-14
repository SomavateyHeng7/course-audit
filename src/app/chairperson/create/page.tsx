"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useToastHelpers } from '@/hooks/useToast';

interface ParsedCourse {
  code: string;
  title: string;
  credits: number;
  description: string;
  creditHours: string;
}

export default function CreateCurriculumPage() {
  const router = useRouter();
  const { success, error } = useToastHelpers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for form inputs
  const [curriculumName, setCurriculumName] = useState('');
  const [year, setYear] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [idStart, setIdStart] = useState('');
  const [idEnd, setIdEnd] = useState('');
  const [description, setDescription] = useState('');
  
  // State for CSV/Excel handling
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [parsedCourses, setParsedCourses] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    // For our specific format where some fields might not be quoted but contain commas
    // If we get more than 5 fields, combine the middle ones as description
    if (result.length > 5) {
      const code = result[0];
      const title = result[1];
      const credits = result[2];
      const description = result.slice(3, -1).join(','); // Combine middle parts
      const creditHours = result[result.length - 1];
      return [code, title, credits, description, creditHours];
    }
    
    return result;
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);

    try {
      let courses: ParsedCourse[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV parsing
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file must have a header row and at least one data row');
          return;
        }

        // Simple CSV parsing for the specific format
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5) {
            courses.push({
              code: values[0]?.trim() || '',
              title: values[1]?.trim() || '',
              credits: parseInt(values[2]?.trim()) || 0,
              description: values[3]?.trim() || '',
              creditHours: values[4]?.trim() || '',
            });
          }
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Handle Excel parsing
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          alert('Excel file must have a header row and at least one data row');
          return;
        }
        
        // Find column indices based on headers
        const headers = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
        const codeIndex = headers.findIndex((h: string) => h.includes('course code') || h.includes('code'));
        const titleIndex = headers.findIndex((h: string) => h.includes('course title') || h.includes('title'));
        const creditsIndex = headers.findIndex((h: string) => h.includes('credits') || h.includes('credit'));
        const descriptionIndex = headers.findIndex((h: string) => h.includes('description') || h.includes('desc'));
        const creditHoursIndex = headers.findIndex((h: string) => h.includes('crd hour') || h.includes('credit hour') || h.includes('hour'));

        if (codeIndex === -1 || titleIndex === -1 || creditsIndex === -1) {
          alert('Excel file must contain columns for Course Code, Course Title, and Credits');
          return;
        }

        // Parse course data from Excel
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length > Math.max(codeIndex, titleIndex, creditsIndex)) {
            const code = String(row[codeIndex] || '').trim();
            const title = String(row[titleIndex] || '').trim();
            const credits = parseInt(String(row[creditsIndex] || '0')) || 0;
            const description = descriptionIndex >= 0 ? String(row[descriptionIndex] || '').trim() : '';
            const creditHours = creditHoursIndex >= 0 ? String(row[creditHoursIndex] || '').trim() : '';
            
            if (code && title && credits > 0) {
              courses.push({
                code,
                title,
                credits,
                description,
                creditHours,
              });
            }
          }
        }
      } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }

      if (courses.length === 0) {
        alert('No valid course data found in the file');
        return;
      }

      setParsedCourses(courses);
      console.log('Parsed courses:', courses);

    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUploadFromFile(file);
    }
  };

  const handleFileUploadFromFile = async (file: File) => {
    setUploadedFile(file);
    setIsUploading(true);

    try {
      let courses: ParsedCourse[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV parsing
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file must have a header row and at least one data row');
          return;
        }

        // Simple CSV parsing for the specific format
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5) {
            courses.push({
              code: values[0]?.trim() || '',
              title: values[1]?.trim() || '',
              credits: parseInt(values[2]?.trim()) || 0,
              description: values[3]?.trim() || '',
              creditHours: values[4]?.trim() || '',
            });
          }
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Handle Excel parsing
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          alert('Excel file must have a header row and at least one data row');
          return;
        }
        
        // Find column indices based on headers
        const headers = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
        const codeIndex = headers.findIndex((h: string) => h.includes('course code') || h.includes('code'));
        const titleIndex = headers.findIndex((h: string) => h.includes('course title') || h.includes('title'));
        const creditsIndex = headers.findIndex((h: string) => h.includes('credits') || h.includes('credit'));
        const descriptionIndex = headers.findIndex((h: string) => h.includes('description') || h.includes('desc'));
        const creditHoursIndex = headers.findIndex((h: string) => h.includes('crd hour') || h.includes('credit hour') || h.includes('hour'));

        if (codeIndex === -1 || titleIndex === -1 || creditsIndex === -1) {
          alert('Excel file must contain columns for Course Code, Course Title, and Credits');
          return;
        }

        // Parse course data from Excel
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length > Math.max(codeIndex, titleIndex, creditsIndex)) {
            const code = String(row[codeIndex] || '').trim();
            const title = String(row[titleIndex] || '').trim();
            const credits = parseInt(String(row[creditsIndex] || '0')) || 0;
            const description = descriptionIndex >= 0 ? String(row[descriptionIndex] || '').trim() : '';
            const creditHours = creditHoursIndex >= 0 ? String(row[creditHoursIndex] || '').trim() : '';
            
            if (code && title && credits > 0) {
              courses.push({
                code,
                title,
                credits,
                description,
                creditHours,
              });
            }
          }
        }
      } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }

      if (courses.length === 0) {
        alert('No valid course data found in the file');
        return;
      }

      setParsedCourses(courses);
      console.log('Parsed courses:', courses);

    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!curriculumName || !year || !totalCredits || !idStart || !idEnd) {
        error('Please fill in all required fields: curriculum name, year, total credits, ID start, and ID end');
        return;
      }
      if (!uploadedFile || parsedCourses.length === 0) {
        error('Please upload and successfully parse a course file');
        return;
      }
      
      // Store data in sessionStorage for the details page
      sessionStorage.setItem('uploadedCourses', JSON.stringify(parsedCourses));
      sessionStorage.setItem('curriculumInfo', JSON.stringify({
        name: curriculumName,
        year: year,
        totalCredits: totalCredits,
        idStart: idStart,
        idEnd: idEnd,
        fileName: uploadedFile.name,
        courseCount: parsedCourses.length
      }));

      success('Curriculum data prepared successfully! Redirecting...', 'Success');
      setTimeout(() => {
        // Navigate to details page
        router.push('/chairperson/create/details');
      }, 1500);
      
    } catch (err) {
      error('Error preparing curriculum data. Please try again.');
    } finally {
      setTimeout(() => setIsSubmitting(false), 1500);
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
      f.name.endsWith('.csv') || 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls')
    );
    
    if (file) {
      await handleFileUploadFromFile(file);
    } else {
      error('Please drop a CSV or Excel file (.csv, .xlsx, .xls)');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl border border-border p-12">
          <div className="flex gap-12">
            {/* Form Section */}
            <div className="w-[400px]">              <h1 className="text-4xl font-extrabold mb-10 text-foreground">Create Curriculum</h1>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Curriculum Name</label>
                  <input
                    type="text"
                    placeholder="Enter curriculum name"
                    value={curriculumName}
                    onChange={(e) => setCurriculumName(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Academic Year</label>
                  <input
                    type="text"
                    placeholder="Enter academic year (e.g., 2024, 2025)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    required
                    pattern="[0-9]{4}"
                    title="Please enter a 4-digit year"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
                  <input
                    type="number"
                    placeholder="Enter total credits"
                    value={totalCredits}
                    onChange={(e) => setTotalCredits(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">ID - Start</label>
                  <input
                    type="text"
                    placeholder="Enter starting ID (e.g., 63001, 64001, 65001)"
                    value={idStart}
                    onChange={(e) => setIdStart(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    required
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Sample: 63xxx, 64xxx, 65xxx (first 2 digits = batch year)
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">ID - End</label>
                  <input
                    type="text"
                    placeholder="Enter ending ID (e.g., 63999, 64999, 65999)"
                    value={idEnd}
                    onChange={(e) => setIdEnd(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    required
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Sample: 63xxx, 64xxx, 65xxx (first 2 digits = batch year)
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUploading || isSubmitting || !uploadedFile}
                  className="bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition mt-4 w-32 self-start disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : (isUploading ? 'Uploading...' : 'Continue')}
                </button>
              </form>
            </div>
            {/* File Upload Section */}
            <div className="flex-1 flex flex-col justify-start">              <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="font-bold text-xl mb-4 text-foreground">Upload Course File</h2>                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Excel Format Preferred:</strong> Include columns for Course Code, Course Title, Credits, Course Description, and Crd Hour. 
                    Excel files (.xlsx, .xls) are preferred over CSV. Course categories and constraints will be set in the next step.
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex flex-col gap-2">
                      <a 
                        href="/api/download/sample-csv" 
                        download="sample_curriculum_courses.csv"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Sample CSV Template
                      </a>
                      <a 
                        href="/api/download/sample-xlsx" 
                        download="sample_curriculum_courses.xlsx"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Sample XLSX Template
                      </a>
                    </div>
                  </div>
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
                        : 'border-border hover:bg-muted/50 text-muted-foreground hover:border-primary/50'
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
                        Drop your file here!
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
                      <svg className="w-10 h-10 mb-2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      </svg>                      <p className="text-center text-sm text-muted-foreground">
                        <span className="font-medium">Drag and drop</span> Excel or CSV file here,<br />
                        or <span className="text-primary underline">click here to upload</span>.
                      </p>
                    </>
                  )}                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
