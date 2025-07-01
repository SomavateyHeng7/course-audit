"use client";

import { useState, useRef } from "react";
import { FaEye, FaUpload, FaFileExcel, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface Course {
  code: string;
  title: string;
  credits: number;
  creditHours: string; // Changed to string to support formats like "3-0-6"
  type: string;
  description?: string; // Added description field
}

interface CourseType {
  id: string;
  name: string;
  color: string;
}

interface Concentration {
  id: string;
  name: string;
  courses: Course[];
  createdAt: string;
}

const mockBlacklistCourses: Course[] = [
  { code: 'CSX 1001', title: 'Introduction to Computer Science', credits: 3, creditHours: '3-0-6', type: 'Core', description: 'Introduction to fundamental concepts of computer science and programming.' },
  { code: 'CSX 2005', title: 'Legacy Programming', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Study of outdated programming languages and practices.' },
  { code: 'CSX 3008', title: 'Outdated Web Technologies', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Exploration of deprecated web development technologies.' },
];

const defaultCourseTypes: CourseType[] = [
  { id: '1', name: 'Core', color: '#ef4444' }, // red
  { id: '2', name: 'Major', color: '#22c55e' }, // green
  { id: '3', name: 'Major Elective', color: '#eab308' }, // yellow
  { id: '4', name: 'General Education', color: '#6366f1' }, // indigo
  { id: '5', name: 'Free Elective', color: '#6b7280' }, // gray
];

const mockConcentrations: Concentration[] = [
  {
    id: '1',
    name: 'Data Science',
    courses: [
      { code: 'CSX 3001', title: 'Machine Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Introduction to machine learning algorithms and applications.' },
      { code: 'CSX 3002', title: 'Data Mining', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Techniques for extracting patterns from large datasets.' },
    ],
    createdAt: '2024-12-15'
  },
  {
    id: '2',
    name: 'Software Engineering',
    courses: [
      { code: 'CSX 3003', title: 'Software Architecture', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Design principles and patterns for large-scale software systems.' },
      { code: 'CSX 3004', title: 'Advanced Testing', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Advanced software testing methodologies and tools.' },
    ],
    createdAt: '2024-11-20'
  },
];

export default function InfoConfig() {
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedCourses, setUploadedCourses] = useState<Course[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>(defaultCourseTypes);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CourseType | null>(null);
  const [newType, setNewType] = useState({ name: '', color: '#6366f1' });
  const [concentrations, setConcentrations] = useState<Concentration[]>(mockConcentrations);
  const [isEditConcentrationTitleOpen, setIsEditConcentrationTitleOpen] = useState(false);
  const [concentrationTitle, setConcentrationTitle] = useState('Concentrations');
  const [isAddConcentrationModalOpen, setIsAddConcentrationModalOpen] = useState(false);
  const [isEditConcentrationModalOpen, setIsEditConcentrationModalOpen] = useState(false);
  const [editingConcentration, setEditingConcentration] = useState<Concentration | null>(null);
  const [newConcentration, setNewConcentration] = useState({ name: '', courses: [] as Course[] });
  const [concentrationDragOver, setConcentrationDragOver] = useState(false);
  const concentrationFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleViewBlacklist = () => {
    setIsBlacklistModalOpen(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File | null) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      // Mock parsing of Excel file - in real implementation, parse the Excel file
      // TODO: Backend integration - Parse Excel file and extract course data
      const mockUploadedCourses: Course[] = [
        { code: 'CSX 4001', title: 'Advanced Machine Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Advanced techniques in machine learning and artificial intelligence.' },
        { code: 'CSX 4002', title: 'Deep Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Neural networks and deep learning architectures.' },
      ];
      setUploadedCourses(mockUploadedCourses);
      setIsUploadModalOpen(true);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleConfirmUpload = () => {
    // TODO: Backend integration - Send blacklist courses to backend
    console.log('Uploading courses to blacklist:', uploadedCourses);
    setIsUploadModalOpen(false);
    setUploadedCourses([]);
  };

  // Course type management functions
  const handleAddType = () => {
    setIsAddTypeModalOpen(true);
  };

  const handleEditType = (type: CourseType) => {
    setEditingType(type);
    setNewType({ name: type.name, color: type.color });
    setIsEditTypeModalOpen(true);
  };

  const handleDeleteType = (typeId: string) => {
    // TODO: Backend integration - Check if type is in use before deletion
    setCourseTypes(courseTypes.filter(type => type.id !== typeId));
  };

  const handleSaveNewType = () => {
    // TODO: Backend integration - Save new course type
    const newTypeObj: CourseType = {
      id: Date.now().toString(),
      name: newType.name,
      color: newType.color
    };
    setCourseTypes([...courseTypes, newTypeObj]);
    setIsAddTypeModalOpen(false);
    setNewType({ name: '', color: '#6366f1' });
  };

  const handleSaveEditType = () => {
    if (editingType) {
      // TODO: Backend integration - Update course type
      setCourseTypes(courseTypes.map(type => 
        type.id === editingType.id 
          ? { ...type, name: newType.name, color: newType.color }
          : type
      ));
      setIsEditTypeModalOpen(false);
      setEditingType(null);
      setNewType({ name: '', color: '#6366f1' });
    }
  };

  // Concentration management functions
  const handleEditConcentrationTitle = () => {
    setIsEditConcentrationTitleOpen(true);
  };

  const handleSaveConcentrationTitle = () => {
    // TODO: Backend integration - Update concentration title system-wide
    // This will affect all concentrations displayed throughout the system
    // Update the database field that stores the concentration category name
    setIsEditConcentrationTitleOpen(false);
  };

  const handleAddConcentration = () => {
    setIsAddConcentrationModalOpen(true);
  };

  const handleEditConcentration = (concentration: Concentration) => {
    setEditingConcentration(concentration);
    setNewConcentration({ name: concentration.name, courses: concentration.courses });
    setIsEditConcentrationModalOpen(true);
  };

  const handleDeleteConcentration = (concentrationId: string) => {
    // TODO: Backend integration - Delete concentration from database
    // This concentration belongs to the chairperson's department only
    setConcentrations(concentrations.filter(c => c.id !== concentrationId));
  };

  const handleConcentrationDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setConcentrationDragOver(true);
  };

  const handleConcentrationDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setConcentrationDragOver(false);
  };

  const handleConcentrationDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setConcentrationDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleConcentrationFileUpload(files[0]);
    }
  };

  const handleConcentrationFileUpload = (file: File | null) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      // TODO: Backend integration - Parse Excel file for concentration courses
      const mockCourses: Course[] = [
        { code: 'CSX 4003', title: 'Advanced AI', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Advanced artificial intelligence concepts and applications.' },
        { code: 'CSX 4004', title: 'Neural Networks', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Design and implementation of neural network architectures.' },
      ];
      setNewConcentration({ ...newConcentration, courses: mockCourses });
    }
  };

  const handleConcentrationFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleConcentrationFileUpload(file);
    }
  };

  const handleSaveNewConcentration = () => {
    if (newConcentration.name.trim() && newConcentration.courses.length > 0) {
      // TODO: Backend integration - Save new concentration to database
      // This concentration will be associated with the chairperson's department only
      const newConcentrationObj: Concentration = {
        id: Date.now().toString(),
        name: newConcentration.name,
        courses: newConcentration.courses,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setConcentrations([...concentrations, newConcentrationObj]);
      setIsAddConcentrationModalOpen(false);
      setNewConcentration({ name: '', courses: [] });
    }
  };

  const handleSaveEditConcentration = () => {
    if (editingConcentration && newConcentration.name.trim()) {
      // TODO: Backend integration - Update concentration in database
      setConcentrations(concentrations.map(c => 
        c.id === editingConcentration.id 
          ? { ...c, name: newConcentration.name, courses: newConcentration.courses }
          : c
      ));
      setIsEditConcentrationModalOpen(false);
      setEditingConcentration(null);
      setNewConcentration({ name: '', courses: [] });
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-2">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-10">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Config</h1>
          </div>

          {/* Configuration Containers */}
          <div className="space-y-8">
            
            {/* Black list courses */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Black list courses</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Manage courses that are no longer available or recommended for students in your department.
                  </p>
                </div>
                <button
                  onClick={handleViewBlacklist}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  <FaEye className="w-4 h-4" />
                  View Current Blacklist
                </button>
              </div>

              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-foreground">
                    Upload New Blacklist Courses
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center">
                      <FaFileExcel className="w-12 h-12 text-emerald-500 mb-4" />
                      <div className="mb-4">
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Drop your Excel file here
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          or click to browse
                        </p>
                      </div>
                      <button
                        onClick={handleUploadClick}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Upload an Excel file containing course codes, titles, credits, and other course details.
                  </p>
                </div>
              </div>
            </div>

            {/* Categories (type) */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Categories (type)</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Manage course types and categories used in your curriculum.
                  </p>
                </div>
                <button
                  onClick={handleAddType}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Type
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <span className="font-medium text-gray-900 dark:text-white">{type.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditType(type)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="Edit Type"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Type"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concentrations */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {isEditConcentrationTitleOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={concentrationTitle}
                        onChange={(e) => setConcentrationTitle(e.target.value)}
                        className="text-xl font-bold border border-gray-300 dark:border-border rounded px-2 py-1 bg-background text-foreground"
                        onBlur={handleSaveConcentrationTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveConcentrationTitle()}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">{concentrationTitle}</h2>
                      <button
                        onClick={handleEditConcentrationTitle}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 rounded transition-colors"
                        title="Edit Title"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Manage academic concentrations available in your department.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddConcentration}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Concentration
                </button>
              </div>

              <div className="space-y-3">
                {concentrations.map((concentration) => (
                  <div
                    key={concentration.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{concentration.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {concentration.courses.length} courses
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Created {concentration.createdAt}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditConcentration(concentration)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="Edit Concentration"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConcentration(concentration.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Concentration"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {concentrations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <FaPlus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium mb-2">No concentrations created yet</p>
                      <p className="text-sm">Create your first concentration to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* View Blacklist Modal */}
      {isBlacklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-4xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Current Blacklisted Courses</h3>
              <button
                onClick={() => setIsBlacklistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mockBlacklistCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No courses are currently blacklisted.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Credit Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                    {mockBlacklistCourses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {course.code}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.title}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.credits}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.creditHours}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.type || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsBlacklistModalOpen(false)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Confirmation Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-4xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Confirm Blacklist Upload</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The following courses will be added to the blacklist. Please review and confirm:
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Credit Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                    {uploadedCourses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {course.code}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.title}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.credits}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.creditHours}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {course.type || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors border border-red-700"
              >
                Confirm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {isAddTypeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Course Type</h3>
              <button
                onClick={() => setIsAddTypeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Type Name</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  placeholder="e.g., Capstone"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 dark:border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddTypeModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewType}
                disabled={!newType.name.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Type Modal */}
      {isEditTypeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Course Type</h3>
              <button
                onClick={() => setIsEditTypeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Type Name</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 dark:border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditTypeModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditType}
                disabled={!newType.name.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Concentration Modal */}
      {isAddConcentrationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Concentration</h3>
              <button
                onClick={() => setIsAddConcentrationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Concentration Name</label>
                <input
                  type="text"
                  value={newConcentration.name}
                  onChange={(e) => setNewConcentration({ ...newConcentration, name: e.target.value })}
                  placeholder="e.g., Artificial Intelligence"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Upload Courses</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    concentrationDragOver 
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                  onDragOver={handleConcentrationDragOver}
                  onDragLeave={handleConcentrationDragLeave}
                  onDrop={handleConcentrationDrop}
                >
                  <div className="flex flex-col items-center">
                    <FaFileExcel className="w-8 h-8 text-emerald-500 mb-3" />
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        Drop Excel file with courses
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        or click to browse
                      </p>
                    </div>
                    <button
                      onClick={() => concentrationFileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      Choose File
                    </button>
                  </div>
                  <input
                    ref={concentrationFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleConcentrationFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {newConcentration.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Courses ({newConcentration.courses.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newConcentration.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.title}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.credits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddConcentrationModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewConcentration}
                disabled={!newConcentration.name.trim() || newConcentration.courses.length === 0}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Concentration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Concentration Modal */}
      {isEditConcentrationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Concentration</h3>
              <button
                onClick={() => setIsEditConcentrationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Concentration Name</label>
                <input
                  type="text"
                  value={newConcentration.name}
                  onChange={(e) => setNewConcentration({ ...newConcentration, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Update Courses (Optional)</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    concentrationDragOver 
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                  onDragOver={handleConcentrationDragOver}
                  onDragLeave={handleConcentrationDragLeave}
                  onDrop={handleConcentrationDrop}
                >
                  <div className="flex flex-col items-center">
                    <FaFileExcel className="w-8 h-8 text-emerald-500 mb-3" />
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        Upload new course list
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        or keep existing courses
                      </p>
                    </div>
                    <button
                      onClick={() => concentrationFileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>

              {newConcentration.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Current Courses ({newConcentration.courses.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newConcentration.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.title}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.credits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditConcentrationModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditConcentration}
                disabled={!newConcentration.name.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
