'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaList, FaExclamationCircle, FaSearch, FaUpload, FaTimes, FaPlus } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type {
  AddPoolListModalProps,
  NewPoolList,
} from '@/types/creditPool';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Validation errors for the pool list form
 */
interface ValidationErrors {
  name?: string;
  defaultRequiredCredits?: string;
  courses?: string;
}

/**
 * Course data structure for search results and parsed courses
 */
interface CourseSearchResult {
  id: string;
  code: string;
  name: string;
  credits: number;
}

/**
 * Parsed course from CSV/XLSX file
 */
interface ParsedCourse {
  code: string;
  name: string;
  credits: number;
}

/**
 * AddPoolListModal Component
 * 
 * Modal for creating and editing pool lists (reusable course collections).
 * Includes fields for name, description, default required credits.
 * Supports course search and CSV/XLSX file upload for adding courses.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */
export default function AddPoolListModal({
  isOpen,
  onClose,
  onSave,
  editingList,
}: AddPoolListModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultRequiredCredits, setDefaultRequiredCredits] = useState<string>('');
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine if we're in edit mode
  const isEditMode = !!editingList;

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock course database for search (in real implementation, this would be an API call)
  const mockCourseDatabase: CourseSearchResult[] = useMemo(() => [
    { id: 'c-101', code: 'CS 101', name: 'Introduction to Programming', credits: 3 },
    { id: 'c-102', code: 'CS 102', name: 'Data Structures', credits: 3 },
    { id: 'c-201', code: 'CS 201', name: 'Algorithms', credits: 3 },
    { id: 'c-202', code: 'CS 202', name: 'Database Systems', credits: 3 },
    { id: 'c-301', code: 'CS 301', name: 'Machine Learning', credits: 3 },
    { id: 'c-302', code: 'CS 302', name: 'Data Mining', credits: 3 },
    { id: 'c-303', code: 'CS 303', name: 'Big Data Analytics', credits: 3 },
    { id: 'c-401', code: 'CS 401', name: 'Software Architecture', credits: 3 },
    { id: 'c-402', code: 'CS 402', name: 'DevOps Practices', credits: 3 },
    { id: 'c-403', code: 'CS 403', name: 'Agile Development', credits: 3 },
    { id: 'c-404', code: 'CS 404', name: 'Software Testing', credits: 3 },
    { id: 'stat-301', code: 'STAT 301', name: 'Statistical Learning', credits: 3 },
    { id: 'stat-302', code: 'STAT 302', name: 'Probability Theory', credits: 3 },
    { id: 'math-201', code: 'MATH 201', name: 'Linear Algebra', credits: 3 },
    { id: 'math-202', code: 'MATH 202', name: 'Calculus III', credits: 3 },
  ], []);

  // Reset form when modal opens/closes or editing list changes
  useEffect(() => {
    if (isOpen) {
      if (editingList) {
        // Populate form with existing list data
        setName(editingList.name);
        setDescription(editingList.description || '');
        setDefaultRequiredCredits(
          editingList.defaultRequiredCredits !== undefined 
            ? String(editingList.defaultRequiredCredits) 
            : ''
        );
        // Convert PoolListCourse to CourseSearchResult
        setCourses(editingList.courses.map(c => ({
          id: c.courseId,
          code: c.code,
          name: c.name,
          credits: c.credits,
        })));
      } else {
        // Reset to defaults for new list
        setName('');
        setDescription('');
        setDefaultRequiredCredits('');
        setCourses([]);
      }
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setUploadError(null);
      setUploadSuccess(null);
      setErrors({});
      setTouched({});
    }
  }, [isOpen, editingList]);

  // Validate form fields
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Name validation - required and non-empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'List name is required';
    }

    // Default required credits validation - if provided, must be non-negative
    if (defaultRequiredCredits.trim() !== '') {
      const creditsNum = parseFloat(defaultRequiredCredits);
      if (isNaN(creditsNum) || creditsNum < 0) {
        newErrors.defaultRequiredCredits = 'Credits must be a non-negative number';
      }
    }

    return newErrors;
  }, [name, defaultRequiredCredits]);

  // Update errors when form values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm());
    }
  }, [name, defaultRequiredCredits, touched, validateForm]);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle course search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate API search delay
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const results = mockCourseDatabase.filter(course => 
        (course.code.toLowerCase().includes(lowerQuery) ||
         course.name.toLowerCase().includes(lowerQuery)) &&
        !courses.some(c => c.id === course.id) // Exclude already added courses
      );
      setSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 200);
  }, [courses, mockCourseDatabase]);

  // Add course from search results
  const handleAddCourse = (course: CourseSearchResult) => {
    if (!courses.some(c => c.id === course.id)) {
      setCourses(prev => [...prev, course]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Remove course from list
  const handleRemoveCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  // Parse CSV content
  const parseCSV = (content: string): ParsedCourse[] => {
    const result = Papa.parse<string[]>(content, {
      skipEmptyLines: true,
    });

    const courses: ParsedCourse[] = [];
    
    result.data.forEach((row, index) => {
      // Skip header row if it looks like headers
      if (index === 0) {
        const firstCell = (row[0] || '').toLowerCase();
        if (firstCell.includes('code') || firstCell.includes('course')) {
          return;
        }
      }

      const [code, name, creditsStr] = row;
      if (code && name) {
        const credits = parseInt(creditsStr || '3', 10) || 3;
        courses.push({
          code: code.trim(),
          name: name.trim(),
          credits,
        });
      }
    });

    return courses;
  };

  // Parse Excel content
  const parseExcel = (data: ArrayBuffer): ParsedCourse[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    return jsonData.map((row) => ({
      code: String(row['Course Code'] || row['Code'] || row['code'] || '').trim(),
      name: String(row['Course Name'] || row['Name'] || row['name'] || '').trim(),
      credits: parseInt(String(row['Credits'] || row['credits'] || '3'), 10) || 3,
    })).filter(course => course.code && course.name);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let parsedCourses: ParsedCourse[] = [];
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            parsedCourses = parseCSV(e.target?.result as string);
          } else {
            parsedCourses = parseExcel(e.target?.result as ArrayBuffer);
          }

          if (parsedCourses.length === 0) {
            setUploadError('No valid courses found in the file. Please check the format.');
            setIsUploading(false);
            return;
          }

          // Convert parsed courses to CourseSearchResult format
          const newCourses: CourseSearchResult[] = parsedCourses.map((course, index) => ({
            id: `uploaded-${Date.now()}-${index}`,
            code: course.code,
            name: course.name,
            credits: course.credits,
          }));

          // Add courses that aren't already in the list
          const existingCodes = new Set(courses.map(c => c.code.toLowerCase()));
          const uniqueNewCourses = newCourses.filter(
            c => !existingCodes.has(c.code.toLowerCase())
          );

          if (uniqueNewCourses.length > 0) {
            setCourses(prev => [...prev, ...uniqueNewCourses]);
            setUploadSuccess(`Added ${uniqueNewCourses.length} course(s) from file`);
          } else {
            setUploadSuccess('All courses from file are already in the list');
          }
        } catch {
          setUploadError('Failed to parse file. Please check the format.');
        }
        setIsUploading(false);
      };

      reader.onerror = () => {
        setUploadError('Failed to read file');
        setIsUploading(false);
      };

      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch {
      setUploadError('Failed to process file');
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      defaultRequiredCredits: true,
    });

    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Build the pool list data
    const listData: NewPoolList = {
      name: name.trim(),
      description: description.trim() || undefined,
      defaultRequiredCredits: defaultRequiredCredits.trim() !== '' 
        ? parseFloat(defaultRequiredCredits) 
        : undefined,
      courseCodes: courses.map(c => c.code),
    };

    onSave(listData);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Check if form is valid for submission
  const isFormValid = name.trim() !== '' && Object.keys(validateForm()).length === 0;

  // Calculate total credits
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FaList className="h-4 w-4" />
            </span>
            {isEditMode ? 'Edit Pool List' : 'Create Pool List'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the pool list settings and courses.'
              : 'Create a new pool list with a collection of courses.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* List Name */}
          <div className="space-y-2">
            <Label htmlFor="list-name" className="text-sm font-medium">
              List Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g., Data Science Track, Software Engineering Track"
              className={errors.name && touched.name ? 'border-destructive' : ''}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <FaExclamationCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="list-description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="list-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this pool list"
            />
          </div>

          {/* Default Required Credits */}
          <div className="space-y-2">
            <Label htmlFor="default-credits" className="text-sm font-medium">
              Default Required Credits
            </Label>
            <Input
              id="default-credits"
              type="number"
              min="0"
              step="1"
              value={defaultRequiredCredits}
              onChange={(e) => setDefaultRequiredCredits(e.target.value)}
              onBlur={() => handleBlur('defaultRequiredCredits')}
              placeholder="Optional"
              className={errors.defaultRequiredCredits && touched.defaultRequiredCredits ? 'border-destructive' : ''}
            />
            {errors.defaultRequiredCredits && touched.defaultRequiredCredits && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <FaExclamationCircle className="h-3 w-3" />
                {errors.defaultRequiredCredits}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Default credit requirement when this list is used as a pool source
            </p>
          </div>

          {/* Course Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Courses</Label>
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                  placeholder="Search courses by code or name..."
                  className="pl-10"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(course => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => handleAddCourse(course)}
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{course.code}</span>
                          <span className="text-muted-foreground ml-2">{course.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{course.credits} cr</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No courses found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Or Upload File</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <FaUpload className="h-3 w-3" />
                {isUploading ? 'Uploading...' : 'Upload CSV/XLSX'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-xs text-muted-foreground">
                Format: Course Code, Course Name, Credits
              </span>
            </div>
            {uploadError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <FaExclamationCircle className="h-3 w-3" />
                {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {uploadSuccess}
              </p>
            )}
          </div>

          {/* Course List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Courses ({courses.length})
              </Label>
              <span className="text-xs text-muted-foreground">
                Total: {totalCredits} credits
              </span>
            </div>
            
            {courses.length > 0 ? (
              <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                {courses.map(course => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-accent/50"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{course.code}</span>
                      <span className="text-muted-foreground text-sm ml-2 truncate">
                        {course.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {course.credits} cr
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(course.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${course.code}`}
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-md p-6 text-center">
                <FaPlus className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No courses added yet. Search for courses or upload a file.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isEditMode ? 'Save Changes' : 'Create List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
