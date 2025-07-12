"use client";

import { useState, useRef } from "react";
import { FaEye, FaUpload, FaFileExcel, FaEdit, FaTrash, FaPlus, FaInfoCircle } from 'react-icons/fa';

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

interface Blacklist {
  id: string;
  name: string;
  courses: Course[];
  createdAt: string;
}

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

const mockBlacklists: Blacklist[] = [
  {
    id: '1',
    name: 'Outdated Courses',
    courses: [
      { code: 'CSX 1001', title: 'Introduction to Computer Science', credits: 3, creditHours: '3-0-6', type: 'Core', description: 'Introduction to fundamental concepts of computer science and programming.' },
      { code: 'CSX 2005', title: 'Legacy Programming', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Study of outdated programming languages and practices.' },
      { code: 'CSX 3008', title: 'Outdated Web Technologies', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Exploration of deprecated web development technologies.' },
    ],
    createdAt: '2024-12-15'
  },
  {
    id: '2',
    name: 'Conflicting Prerequisites',
    courses: [
      { code: 'CSX 4001', title: 'Advanced Research Methods', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Research methodologies with scheduling conflicts.' },
      { code: 'CSX 4002', title: 'Senior Capstone A', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Capstone project with prerequisite issues.' },
    ],
    createdAt: '2024-11-20'
  },
];

export default function InfoConfig() {
  // Course type management states
  const [courseTypes, setCourseTypes] = useState<CourseType[]>(defaultCourseTypes);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CourseType | null>(null);
  const [newType, setNewType] = useState({ name: '', color: '#6366f1' });
  
  // Concentration management states
  const [concentrations, setConcentrations] = useState<Concentration[]>(mockConcentrations);
  const [isEditConcentrationTitleOpen, setIsEditConcentrationTitleOpen] = useState(false);
  const [concentrationTitle, setConcentrationTitle] = useState('Concentrations');
  const [isAddConcentrationModalOpen, setIsAddConcentrationModalOpen] = useState(false);
  const [isEditConcentrationModalOpen, setIsEditConcentrationModalOpen] = useState(false);
  const [editingConcentration, setEditingConcentration] = useState<Concentration | null>(null);
  const [newConcentration, setNewConcentration] = useState({ name: '', courses: [] as Course[] });
  const [concentrationDragOver, setConcentrationDragOver] = useState(false);
  const concentrationFileInputRef = useRef<HTMLInputElement>(null);
  
  // Blacklist management states
  const [blacklists, setBlacklists] = useState<Blacklist[]>(mockBlacklists);
  const [isAddBlacklistModalOpen, setIsAddBlacklistModalOpen] = useState(false);
  const [isEditBlacklistModalOpen, setIsEditBlacklistModalOpen] = useState(false);
  const [editingBlacklist, setEditingBlacklist] = useState<Blacklist | null>(null);
  const [newBlacklist, setNewBlacklist] = useState({ name: '', courses: [] as Course[] });
  const [blacklistDragOver, setBlacklistDragOver] = useState(false);
  const blacklistFileInputRef = useRef<HTMLInputElement>(null);
  
  // Info modal states
  const [isBlacklistInfoModalOpen, setIsBlacklistInfoModalOpen] = useState(false);
  const [isConcentrationInfoModalOpen, setIsConcentrationInfoModalOpen] = useState(false);
  const [selectedInfoBlacklist, setSelectedInfoBlacklist] = useState<Blacklist | null>(null);
  const [selectedInfoConcentration, setSelectedInfoConcentration] = useState<Concentration | null>(null);

  // Manual course addition states
  const [courseSearch, setCourseSearch] = useState('');
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    credits: 3,
    creditHours: '3-0-6',
    type: 'Major Elective',
    description: ''
  });

  // Mock database courses for search functionality
  const mockDatabaseCourses = [
    { code: 'CSX 1001', title: 'Introduction to Computer Science', credits: 3, creditHours: '3-0-6', type: 'Core', description: 'Basic computer science concepts' },
    { code: 'CSX 2001', title: 'Data Structures', credits: 3, creditHours: '3-0-6', type: 'Major', description: 'Study of data structures and algorithms' },
    { code: 'CSX 3001', title: 'Machine Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Introduction to machine learning' },
    { code: 'CSX 4001', title: 'Advanced AI', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Advanced artificial intelligence' },
    { code: 'MAT 1001', title: 'Calculus I', credits: 3, creditHours: '3-0-6', type: 'General Education', description: 'Introduction to calculus' },
    { code: 'PHY 1001', title: 'Physics I', credits: 3, creditHours: '3-0-6', type: 'General Education', description: 'Basic physics principles' },
  ];

  // Blacklist management functions
  const handleAddBlacklist = () => {
    setIsAddBlacklistModalOpen(true);
  };

  const handleEditBlacklist = (blacklist: Blacklist) => {
    setEditingBlacklist(blacklist);
    setNewBlacklist({ name: blacklist.name, courses: blacklist.courses });
    setIsEditBlacklistModalOpen(true);
  };

  const handleDeleteBlacklist = (blacklistId: string) => {
    // TODO: Backend integration - Delete blacklist from database
    // This blacklist belongs to the chairperson's department only
    setBlacklists(blacklists.filter(b => b.id !== blacklistId));
  };

  const handleShowBlacklistInfo = (blacklist: Blacklist) => {
    setSelectedInfoBlacklist(blacklist);
    setIsBlacklistInfoModalOpen(true);
  };

  const handleShowConcentrationInfo = (concentration: Concentration) => {
    setSelectedInfoConcentration(concentration);
    setIsConcentrationInfoModalOpen(true);
  };

  const handleBlacklistDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setBlacklistDragOver(true);
  };

  const handleBlacklistDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setBlacklistDragOver(false);
  };

  const handleBlacklistDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setBlacklistDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleBlacklistFileUpload(files[0]);
    }
  };

  const handleBlacklistFileUpload = (file: File | null) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      // Mock parsing of Excel file - in real implementation, parse the Excel file
      // TODO: Backend integration - Parse Excel file and extract course data for blacklist
      const mockUploadedCourses: Course[] = [
        { code: 'CSX 4001', title: 'Advanced Machine Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Advanced techniques in machine learning and artificial intelligence.' },
        { code: 'CSX 4002', title: 'Deep Learning', credits: 3, creditHours: '3-0-6', type: 'Major Elective', description: 'Neural networks and deep learning architectures.' },
      ];
      setNewBlacklist({ ...newBlacklist, courses: mockUploadedCourses });
    }
  };

  const handleBlacklistFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBlacklistFileUpload(file);
    }
  };

  const handleSaveNewBlacklist = () => {
    // TODO: Backend integration - Create new blacklist for the department
    // Each blacklist will be available for assignment to curricula in info_edit
    const newBlacklistObj: Blacklist = {
      id: Date.now().toString(),
      name: newBlacklist.name,
      courses: newBlacklist.courses,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBlacklists([...blacklists, newBlacklistObj]);
    setIsAddBlacklistModalOpen(false);
    setNewBlacklist({ name: '', courses: [] });
  };

  const handleSaveEditBlacklist = () => {
    if (editingBlacklist) {
      // TODO: Backend integration - Update blacklist in database
      setBlacklists(blacklists.map(b => 
        b.id === editingBlacklist.id 
          ? { ...b, name: newBlacklist.name, courses: newBlacklist.courses }
          : b
      ));
      setIsEditBlacklistModalOpen(false);
      setEditingBlacklist(null);
      setNewBlacklist({ name: '', courses: [] });
    }
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

  // Manual course addition functions
  const handleAddExistingCourse = (course: Course, target: 'concentration' | 'blacklist') => {
    if (target === 'concentration') {
      setNewConcentration(prev => ({
        ...prev,
        courses: [...prev.courses, course]
      }));
    } else {
      setNewBlacklist(prev => ({
        ...prev,
        courses: [...prev.courses, course]
      }));
    }
  };

  const handleAddNewCourse = (target: 'concentration' | 'blacklist') => {
    if (newCourse.code.trim() && newCourse.title.trim()) {
      const courseToAdd: Course = {
        code: newCourse.code,
        title: newCourse.title,
        credits: newCourse.credits,
        creditHours: newCourse.creditHours,
        type: newCourse.type,
        description: newCourse.description
      };
      
      if (target === 'concentration') {
        setNewConcentration(prev => ({
          ...prev,
          courses: [...prev.courses, courseToAdd]
        }));
      } else {
        setNewBlacklist(prev => ({
          ...prev,
          courses: [...prev.courses, courseToAdd]
        }));
      }
      
      // Reset form
      setNewCourse({
        code: '',
        title: '',
        credits: 3,
        creditHours: '3-0-6',
        type: 'Major Elective',
        description: ''
      });
      setShowAddCourseForm(false);
    }
  };

  const handleRemoveCourseFromConcentration = (courseIndex: number) => {
    setNewConcentration(prev => ({
      ...prev,
      courses: prev.courses.filter((_, index) => index !== courseIndex)
    }));
  };

  const handleRemoveCourseFromBlacklist = (courseIndex: number) => {
    setNewBlacklist(prev => ({
      ...prev,
      courses: prev.courses.filter((_, index) => index !== courseIndex)
    }));
  };

  const filteredDatabaseCourses = mockDatabaseCourses.filter(course =>
    course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

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
            
            {/* Blacklist */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">Blacklist</h2>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Manage blacklists of courses that are no longer available or recommended for students.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddBlacklist}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Blacklist
                </button>
              </div>

              <div className="space-y-3">
                {blacklists.map((blacklist) => (
                  <div
                    key={blacklist.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-foreground">{blacklist.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {blacklist.courses.length} courses
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Created {blacklist.createdAt}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShowBlacklistInfo(blacklist)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="View Course Details"
                      >
                        <FaInfoCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditBlacklist(blacklist)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all"
                        title="Edit Blacklist"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlacklist(blacklist.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Blacklist"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {blacklists.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <FaPlus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-lg font-medium mb-2 text-foreground">No blacklists created yet</p>
                      <p className="text-sm text-muted-foreground">Create your first blacklist to get started</p>
                    </div>
                  </div>
                )}
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
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                      <span className="font-medium text-foreground">{type.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditType(type)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all"
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
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded transition-colors"
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
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                        <h3 className="font-semibold text-foreground">{concentration.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                          {concentration.courses.length} courses
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Created {concentration.createdAt}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShowConcentrationInfo(concentration)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="View Course Details"
                      >
                        <FaInfoCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditConcentration(concentration)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all"
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
                        <FaPlus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-lg font-medium mb-2 text-foreground">No concentrations created yet</p>
                      <p className="text-sm text-muted-foreground">Create your first concentration to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Add Blacklist Modal */}
      {isAddBlacklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Blacklist</h3>
              <button
                onClick={() => setIsAddBlacklistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Blacklist Name</label>
                <input
                  type="text"
                  value={newBlacklist.name}
                  onChange={(e) => setNewBlacklist({ ...newBlacklist, name: e.target.value })}
                  placeholder="e.g., Outdated Courses"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Add Courses</label>
                <div className="space-y-4">
                  {/* Search and Add Existing Courses */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Search Database Courses</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search by course code or title..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                      />
                      
                      {courseSearch && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                          {filteredDatabaseCourses.length > 0 ? (
                            filteredDatabaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'blacklist');
                                  setCourseSearch('');
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Add New Course */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-foreground">Add New Course</h5>
                      <button
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {showAddCourseForm ? 'Cancel' : '+ Add New'}
                      </button>
                    </div>
                    
                    {showAddCourseForm && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Course Code (e.g., CSX 3001)"
                              value={newCourse.code}
                              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Course Title"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="number"
                              placeholder="Credits"
                              min="1"
                              max="6"
                              value={newCourse.credits}
                              onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Credit Hours (e.g., 3-0-6)"
                              value={newCourse.creditHours}
                              onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <select
                              value={newCourse.type}
                              onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            >
                              <option value="Core">Core</option>
                              <option value="Major">Major</option>
                              <option value="Major Elective">Major Elective</option>
                              <option value="General Education">General Education</option>
                              <option value="Free Elective">Free Elective</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <textarea
                            placeholder="Course Description (optional)"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            rows={2}
                          />
                        </div>
                        
                        <button
                          onClick={() => handleAddNewCourse('blacklist')}
                          disabled={!newCourse.code.trim() || !newCourse.title.trim()}
                          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Course
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Option */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Or Upload Excel File</h5>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        blacklistDragOver 
                          ? 'border-primary/40 bg-primary/10 dark:bg-primary/20/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary'
                      }`}
                      onDragOver={handleBlacklistDragOver}
                      onDragLeave={handleBlacklistDragLeave}
                      onDrop={handleBlacklistDrop}
                    >
                      <div className="flex flex-col items-center">
                        <FaFileExcel className="w-6 h-6 text-ring mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Drop Excel file or click to browse
                        </p>
                        <button
                          onClick={() => blacklistFileInputRef.current?.click()}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                        >
                          Choose File
                        </button>
                      </div>
                      <input
                        ref={blacklistFileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleBlacklistFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {newBlacklist.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-primary-foreground mb-3">
                    Courses ({newBlacklist.courses.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Credits</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newBlacklist.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-primary-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.title}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.credits}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleRemoveCourseFromBlacklist(index)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Remove course"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </td>
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
                onClick={() => setIsAddBlacklistModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewBlacklist}
                disabled={!newBlacklist.name.trim() || newBlacklist.courses.length === 0}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Blacklist Modal */}
      {isEditBlacklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Blacklist</h3>
              <button
                onClick={() => setIsEditBlacklistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Blacklist Name</label>
                <input
                  type="text"
                  value={newBlacklist.name}
                  onChange={(e) => setNewBlacklist({ ...newBlacklist, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Manage Courses</label>
                <div className="space-y-4">
                  {/* Search and Add Existing Courses */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Search Database Courses</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search by course code or title..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                      />
                      
                      {courseSearch && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                          {filteredDatabaseCourses.length > 0 ? (
                            filteredDatabaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'blacklist');
                                  setCourseSearch('');
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Add New Course */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-foreground">Add New Course</h5>
                      <button
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {showAddCourseForm ? 'Cancel' : '+ Add New'}
                      </button>
                    </div>
                    
                    {showAddCourseForm && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Course Code (e.g., CSX 3001)"
                              value={newCourse.code}
                              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Course Title"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="number"
                              placeholder="Credits"
                              min="1"
                              max="6"
                              value={newCourse.credits}
                              onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Credit Hours (e.g., 3-0-6)"
                              value={newCourse.creditHours}
                              onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <select
                              value={newCourse.type}
                              onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            >
                              <option value="Core">Core</option>
                              <option value="Major">Major</option>
                              <option value="Major Elective">Major Elective</option>
                              <option value="General Education">General Education</option>
                              <option value="Free Elective">Free Elective</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <textarea
                            placeholder="Course Description (optional)"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            rows={2}
                          />
                        </div>
                        
                        <button
                          onClick={() => handleAddNewCourse('blacklist')}
                          disabled={!newCourse.code.trim() || !newCourse.title.trim()}
                          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Course
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Option */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Or Upload Excel File</h5>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        blacklistDragOver 
                          ? 'border-primary/40 bg-primary/10 dark:bg-primary/20/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary'
                      }`}
                      onDragOver={handleBlacklistDragOver}
                      onDragLeave={handleBlacklistDragLeave}
                      onDrop={handleBlacklistDrop}
                    >
                      <div className="flex flex-col items-center">
                        <FaFileExcel className="w-6 h-6 text-ring mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Replace all courses with Excel file
                        </p>
                        <button
                          onClick={() => blacklistFileInputRef.current?.click()}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                        >
                          Choose File
                        </button>
                      </div>
                      <input
                        ref={blacklistFileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleBlacklistFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {newBlacklist.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">
                    Current Courses ({newBlacklist.courses.length})
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
                        {newBlacklist.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-foreground">{course.title}</td>
                            <td className="px-3 py-2 text-foreground">{course.credits}</td>
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
                onClick={() => setIsEditBlacklistModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditBlacklist}
                disabled={!newBlacklist.name.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
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
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
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
                    className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
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
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
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
                    className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
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
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Add Courses</label>
                <div className="space-y-4">
                  {/* Search and Add Existing Courses */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Search Database Courses</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search by course code or title..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                      />
                      
                      {courseSearch && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                          {filteredDatabaseCourses.length > 0 ? (
                            filteredDatabaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'concentration');
                                  setCourseSearch('');
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Add New Course */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-foreground">Add New Course</h5>
                      <button
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {showAddCourseForm ? 'Cancel' : '+ Add New'}
                      </button>
                    </div>
                    
                    {showAddCourseForm && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Course Code (e.g., CSX 3001)"
                              value={newCourse.code}
                              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Course Title"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="number"
                              placeholder="Credits"
                              min="1"
                              max="6"
                              value={newCourse.credits}
                              onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Credit Hours (e.g., 3-0-6)"
                              value={newCourse.creditHours}
                              onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <select
                              value={newCourse.type}
                              onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            >
                              <option value="Core">Core</option>
                              <option value="Major">Major</option>
                              <option value="Major Elective">Major Elective</option>
                              <option value="General Education">General Education</option>
                              <option value="Free Elective">Free Elective</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <textarea
                            placeholder="Course Description (optional)"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            rows={2}
                          />
                        </div>
                        
                        <button
                          onClick={() => handleAddNewCourse('concentration')}
                          disabled={!newCourse.code.trim() || !newCourse.title.trim()}
                          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Course
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Option */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Or Upload Excel File</h5>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        concentrationDragOver 
                          ? 'border-primary/40 bg-primary/10 dark:bg-primary/20/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary'
                      }`}
                      onDragOver={handleConcentrationDragOver}
                      onDragLeave={handleConcentrationDragLeave}
                      onDrop={handleConcentrationDrop}
                    >
                      <div className="flex flex-col items-center">
                        <FaFileExcel className="w-6 h-6 text-ring mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Drop Excel file or click to browse
                        </p>
                        <button
                          onClick={() => concentrationFileInputRef.current?.click()}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
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
                </div>
              </div>

              {newConcentration.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-primary-foreground mb-3">
                    Courses ({newConcentration.courses.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Credits</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newConcentration.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-primary-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.title}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.credits}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleRemoveCourseFromConcentration(index)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Remove course"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </td>
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
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Manage Courses</label>
                <div className="space-y-4">
                  {/* Search and Add Existing Courses */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Search Database Courses</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search by course code or title..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                      />
                      
                      {courseSearch && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                          {filteredDatabaseCourses.length > 0 ? (
                            filteredDatabaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'concentration');
                                  setCourseSearch('');
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Add New Course */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-foreground">Add New Course</h5>
                      <button
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {showAddCourseForm ? 'Cancel' : '+ Add New'}
                      </button>
                    </div>
                    
                    {showAddCourseForm && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Course Code (e.g., CSX 3001)"
                              value={newCourse.code}
                              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Course Title"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="number"
                              placeholder="Credits"
                              min="1"
                              max="6"
                              value={newCourse.credits}
                              onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Credit Hours (e.g., 3-0-6)"
                              value={newCourse.creditHours}
                              onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <select
                              value={newCourse.type}
                              onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            >
                              <option value="Core">Core</option>
                              <option value="Major">Major</option>
                              <option value="Major Elective">Major Elective</option>
                              <option value="General Education">General Education</option>
                              <option value="Free Elective">Free Elective</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <textarea
                            placeholder="Course Description (optional)"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            rows={2}
                          />
                        </div>
                        
                        <button
                          onClick={() => handleAddNewCourse('concentration')}
                          disabled={!newCourse.code.trim() || !newCourse.title.trim()}
                          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Course
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Option */}
                  <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                    <h5 className="font-medium text-foreground mb-3">Or Upload Excel File</h5>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        concentrationDragOver 
                          ? 'border-primary/40 bg-primary/10 dark:bg-primary/20/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary'
                      }`}
                      onDragOver={handleConcentrationDragOver}
                      onDragLeave={handleConcentrationDragLeave}
                      onDrop={handleConcentrationDrop}
                    >
                      <div className="flex flex-col items-center">
                        <FaFileExcel className="w-6 h-6 text-ring mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Replace all courses with Excel file
                        </p>
                        <button
                          onClick={() => concentrationFileInputRef.current?.click()}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
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
                </div>
              </div>

              {newConcentration.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-primary-foreground mb-3">
                    Current Courses ({newConcentration.courses.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Credits</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newConcentration.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-primary-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.title}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.credits}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleRemoveCourseFromConcentration(index)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Remove course"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </td>
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
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Info Modal */}
      {isBlacklistInfoModalOpen && selectedInfoBlacklist && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-6xl border border-gray-200 dark:border-border shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Blacklist: {selectedInfoBlacklist.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Created on {selectedInfoBlacklist.createdAt} • {selectedInfoBlacklist.courses.length} courses
                </p>
              </div>
              <button
                onClick={() => setIsBlacklistInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedInfoBlacklist.courses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                  <thead className="bg-red-50 dark:bg-red-900/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Course Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Course Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Credit Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-border">
                    {selectedInfoBlacklist.courses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-primary-foreground">{course.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.creditHours}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            {course.type || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 max-w-xs">
                          <div className="text-xs leading-relaxed overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {course.description || 'No description available'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">No courses in this blacklist</p>
                <p className="text-sm">This blacklist is currently empty</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
              <button
                onClick={() => setIsBlacklistInfoModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-600 text-primary-foreground rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concentration Info Modal */}
      {isConcentrationInfoModalOpen && selectedInfoConcentration && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-6xl border border-gray-200 dark:border-border shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Concentration: {selectedInfoConcentration.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Created on {selectedInfoConcentration.createdAt} • {selectedInfoConcentration.courses.length} courses
                </p>
              </div>
              <button
                onClick={() => setIsConcentrationInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedInfoConcentration.courses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                  <thead className="bg-primary/10 dark:bg-primary/20/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Course Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Course Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Credit Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-primary-foreground border-b border-gray-200 dark:border-border">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-border">
                    {selectedInfoConcentration.courses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-primary-foreground">{course.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.creditHours}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20/30 dark:text-primary/30">
                            {course.type || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 max-w-xs">
                          <div className="text-xs leading-relaxed overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {course.description || 'No description available'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">No courses in this concentration</p>
                <p className="text-sm">This concentration is currently empty</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
              <button
                onClick={() => setIsConcentrationInfoModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-600 text-primary-foreground rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
