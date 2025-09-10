"use client";

import { useState, useRef, useEffect } from "react";
import { FaEye, FaUpload, FaFileExcel, FaEdit, FaTrash, FaPlus, FaInfoCircle } from 'react-icons/fa';
import { blacklistApi, type BlacklistData, type BlacklistCourse } from '@/services/blacklistApi';
import { concentrationApi, type ConcentrationData, type ConcentrationCourse } from '@/services/concentrationApi';
import { facultyLabelApi } from '@/services/facultyLabelApi';
import { courseTypesApi, type CourseTypeData } from '@/services/courseTypesApi';

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

// Use CourseTypeData from API instead of local CourseType interface

// Use ConcentrationData from API instead of local Concentration interface

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

// Mock concentrations removed - now using API data

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
  const [courseTypes, setCourseTypes] = useState<CourseTypeData[]>([]);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CourseTypeData | null>(null);
  const [newType, setNewType] = useState({ name: '', color: '#6366f1' });
  
  // Concentration management states
  const [concentrations, setConcentrations] = useState<ConcentrationData[]>([]);
  const [isEditConcentrationTitleOpen, setIsEditConcentrationTitleOpen] = useState(false);
  const [concentrationTitle, setConcentrationTitle] = useState('Concentrations');
  const [isAddConcentrationModalOpen, setIsAddConcentrationModalOpen] = useState(false);
  const [isEditConcentrationModalOpen, setIsEditConcentrationModalOpen] = useState(false);
  const [editingConcentration, setEditingConcentration] = useState<ConcentrationData | null>(null);
  const [newConcentration, setNewConcentration] = useState({ name: '', courses: [] as Course[] });
  const [concentrationDragOver, setConcentrationDragOver] = useState(false);
  const concentrationFileInputRef = useRef<HTMLInputElement>(null);
  
  // Blacklist management states
  const [blacklists, setBlacklists] = useState<BlacklistData[]>([]);
  const [isAddBlacklistModalOpen, setIsAddBlacklistModalOpen] = useState(false);
  const [isEditBlacklistModalOpen, setIsEditBlacklistModalOpen] = useState(false);
  const [editingBlacklist, setEditingBlacklist] = useState<BlacklistData | null>(null);
  const [newBlacklist, setNewBlacklist] = useState({ name: '', description: '', courses: [] as BlacklistCourse[] });
  const [blacklistDragOver, setBlacklistDragOver] = useState(false);
  const blacklistFileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Info modal states
  const [isBlacklistInfoModalOpen, setIsBlacklistInfoModalOpen] = useState(false);
  const [isConcentrationInfoModalOpen, setIsConcentrationInfoModalOpen] = useState(false);
  const [selectedInfoBlacklist, setSelectedInfoBlacklist] = useState<BlacklistData | null>(null);
  const [selectedInfoConcentration, setSelectedInfoConcentration] = useState<ConcentrationData | null>(null);

  // Load blacklists on component mount
  useEffect(() => {
    loadBlacklists();
  }, []);

  // Load concentrations on component mount
  useEffect(() => {
    loadConcentrations();
  }, []);

  // Load concentration title on component mount
  useEffect(() => {
    loadConcentrationTitle();
  }, []);

  // Load course types on component mount
  useEffect(() => {
    loadCourseTypes();
  }, []);

  const loadBlacklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blacklistApi.getBlacklists();
      setBlacklists(response.blacklists);
    } catch (err) {
      console.error('Error loading blacklists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blacklists');
    } finally {
      setLoading(false);
    }
  };

  const loadConcentrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await concentrationApi.getConcentrations();
      setConcentrations(response || []);
    } catch (err) {
      console.error('Error loading concentrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load concentrations');
    } finally {
      setLoading(false);
    }
  };

  const loadConcentrationTitle = async () => {
    try {
      const response = await facultyLabelApi.getConcentrationLabel();
      setConcentrationTitle(response.concentrationLabel);
    } catch (err) {
      console.error('Error loading concentration title:', err);
      // Keep default title if loading fails
    }
  };

  const loadCourseTypes = async () => {
    try {
      const response = await courseTypesApi.getAllCourseTypes();
      setCourseTypes(response.courseTypes || []);
      
      // If no course types exist in database, create defaults
      if (!response.courseTypes || response.courseTypes.length === 0) {
        await createDefaultCourseTypes();
      }
    } catch (err) {
      console.error('Error loading course types:', err);
      // Fallback to defaults if API fails
      setCourseTypes(defaultCourseTypes.map(type => ({
        ...type,
        departmentId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })));
    }
  };

  const createDefaultCourseTypes = async () => {
    try {
      const createdTypes: CourseTypeData[] = [];
      for (const defaultType of defaultCourseTypes) {
        try {
          const newType = await courseTypesApi.createCourseType({
            name: defaultType.name,
            color: defaultType.color
          });
          createdTypes.push(newType);
          console.log(`✅ Created default course type: ${defaultType.name}`);
        } catch (err) {
          // If it already exists, skip it silently
          console.log(`⚠️ Course type '${defaultType.name}' already exists, skipping...`);
        }
      }
      if (createdTypes.length > 0) {
        setCourseTypes(prevTypes => [...prevTypes, ...createdTypes]);
        console.log(`✅ Successfully created ${createdTypes.length} new default course types`);
      } else {
        console.log('📋 All default course types already exist');
      }
    } catch (err) {
      console.error('Error creating default course types:', err);
    }
  };

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

  // Handler functions are defined later in the component

  const handleShowConcentrationInfo = (concentration: ConcentrationData) => {
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

  const handleBlacklistFileUpload = async (file: File | null) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      try {
        setLoading(true);
        let uploadedCourses: any[] = [];
        
        if (file.name.endsWith('.csv')) {
          // For CSV files, read as text and parse
          const fileContent = await file.text();
          uploadedCourses = blacklistApi.parseCSVContent(fileContent);
        } else {
          // For Excel files, parse directly with the file object
          uploadedCourses = await blacklistApi.parseExcelFile(file);
        }
        
        setNewBlacklist({ ...newBlacklist, courses: uploadedCourses });
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse file. Please check the file format.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
    }
  };

  const handleSaveNewBlacklist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate input
      const validationErrors = blacklistApi.validateBlacklistData({
        name: newBlacklist.name,
        description: newBlacklist.description
      });
      
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return;
      }
      
      // Check for duplicate names
      const nameExists = await blacklistApi.checkNameExists(newBlacklist.name);
      if (nameExists) {
        setError('A blacklist with this name already exists');
        return;
      }
      
      // Map course codes to course IDs if we have courses from file upload
      let courseIds: string[] = [];
      if (newBlacklist.courses && newBlacklist.courses.length > 0) {
        const courseCodes = newBlacklist.courses.map(course => course.code);
        const mappingResults = await blacklistApi.mapCodesToIds(courseCodes);
        
        // Separate found courses from courses that need to be created
        const foundCourses = mappingResults.filter(result => result.found);
        const coursesToCreate = mappingResults.filter(result => !result.found && result.isNew);
        
        // Get course IDs for found courses
        courseIds = foundCourses.map(result => result.id);
        
        // Create new courses for those that don't exist
        if (coursesToCreate.length > 0) {
          const coursesToCreateData = coursesToCreate.map(result => {
            const originalCourse = newBlacklist.courses.find(c => c.code === result.code);
            return originalCourse!;
          });
          
          try {
            const createdCourses = await blacklistApi.createCoursesFromBlacklistData(coursesToCreateData);
            courseIds.push(...createdCourses.map(c => c.id));
          } catch (createError) {
            console.error('Error creating new courses:', createError);
            setError('Failed to create some courses. Please try again.');
            return;
          }
        }
      }
      
      // Create the blacklist with course IDs
      const createdBlacklist = await blacklistApi.createBlacklist({
        name: newBlacklist.name,
        description: newBlacklist.description || undefined,
        courseIds: courseIds.length > 0 ? courseIds : undefined
      });
      
      // Update local state
      setBlacklists([...blacklists, createdBlacklist]);
      setIsAddBlacklistModalOpen(false);
      setNewBlacklist({ name: '', description: '', courses: [] });
      
    } catch (err) {
      console.error('Error creating blacklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditBlacklist = async () => {
    if (!editingBlacklist) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate input
      const validationErrors = blacklistApi.validateBlacklistData({
        name: newBlacklist.name,
        description: newBlacklist.description
      });
      
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return;
      }
      
      // Check for duplicate names (excluding current blacklist)
      const nameExists = await blacklistApi.checkNameExists(newBlacklist.name, editingBlacklist.id);
      if (nameExists) {
        setError('A blacklist with this name already exists');
        return;
      }
      
      // Extract course IDs for API update
      const courseIds = newBlacklist.courses.map(course => course.id).filter(id => id && !id.startsWith('temp_'));
      console.log('Saving blacklist with course IDs:', courseIds);
      console.log('Original courses:', newBlacklist.courses);

      // Update the blacklist
      const updatedBlacklist = await blacklistApi.updateBlacklist(editingBlacklist.id, {
        name: newBlacklist.name,
        description: newBlacklist.description || undefined,
        courseIds
      });
      
      // Update local state
      setBlacklists(blacklists.map(b => 
        b.id === editingBlacklist.id ? updatedBlacklist : b
      ));
      setIsEditBlacklistModalOpen(false);
      setEditingBlacklist(null);
      setNewBlacklist({ name: '', description: '', courses: [] });
      
    } catch (err) {
      console.error('Error updating blacklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to update blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklistFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBlacklistFileUpload(file);
    }
  };

  const handleEditBlacklist = (blacklist: BlacklistData) => {
    setEditingBlacklist(blacklist);
    setNewBlacklist({ 
      name: blacklist.name, 
      description: blacklist.description || '',
      courses: blacklist.courses 
    });
    setIsEditBlacklistModalOpen(true);
  };

  const handleShowBlacklistInfo = (blacklist: BlacklistData) => {
    setSelectedInfoBlacklist(blacklist);
    setIsBlacklistInfoModalOpen(true);
  };

  const handleDeleteBlacklist = async (blacklist: BlacklistData) => {
    if (!confirm(`Are you sure you want to delete the blacklist "${blacklist.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await blacklistApi.deleteBlacklist(blacklist.id);
      
      // Update local state
      setBlacklists(blacklists.filter(b => b.id !== blacklist.id));
      
    } catch (err) {
      console.error('Error deleting blacklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete blacklist');
    } finally {
      setLoading(false);
    }
  };

  // Course type management functions
  const handleAddType = () => {
    setIsAddTypeModalOpen(true);
  };

  const handleEditType = (type: CourseTypeData) => {
    setEditingType(type);
    setNewType({ name: type.name, color: type.color });
    setIsEditTypeModalOpen(true);
  };

  const handleDeleteType = async (typeId: string) => {
    try {
      await courseTypesApi.deleteCourseType(typeId);
      setCourseTypes(courseTypes.filter(type => type.id !== typeId));
    } catch (error) {
      console.error('Error deleting course type:', error);
      alert('Failed to delete course type. Please try again.');
    }
  };

  const handleSaveNewType = async () => {
    try {
      // Validate input
      const errors = courseTypesApi.validateCourseType(newType.name, newType.color);
      if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
      }

      const newTypeData = await courseTypesApi.createCourseType({
        name: newType.name.trim(),
        color: newType.color
      });

      setCourseTypes([...courseTypes, newTypeData]);
      setIsAddTypeModalOpen(false);
      setNewType({ name: '', color: '#6366f1' });
    } catch (error) {
      console.error('Error creating course type:', error);
      alert('Failed to create course type. Please try again.');
    }
  };

  const handleSaveEditType = async () => {
    if (editingType) {
      try {
        // Validate input
        const errors = courseTypesApi.validateCourseType(newType.name, newType.color);
        if (errors.length > 0) {
          alert(errors.join('\n'));
          return;
        }

        const updatedType = await courseTypesApi.updateCourseType(editingType.id, {
          name: newType.name.trim(),
          color: newType.color
        });

        setCourseTypes(courseTypes.map(type => 
          type.id === editingType.id ? updatedType : type
        ));
        setIsEditTypeModalOpen(false);
        setEditingType(null);
        setNewType({ name: '', color: '#6366f1' });
      } catch (error) {
        console.error('Error updating course type:', error);
        alert('Failed to update course type. Please try again.');
      }
    }
  };

  // Concentration management functions
  const handleEditConcentrationTitle = () => {
    setIsEditConcentrationTitleOpen(true);
  };

  const handleSaveConcentrationTitle = async () => {
    try {
      await facultyLabelApi.updateConcentrationLabel({ label: concentrationTitle });
      setIsEditConcentrationTitleOpen(false);
      // Optionally reload the data to ensure consistency
      await loadConcentrationTitle();
    } catch (error) {
      console.error('Error updating concentration title:', error);
      alert('Failed to update concentration title. Please try again.');
    }
  };

  const handleAddConcentration = () => {
    setIsAddConcentrationModalOpen(true);
  };

  const handleEditConcentration = (concentration: ConcentrationData) => {
    setEditingConcentration(concentration);
    // Convert ConcentrationCourse[] to Course[] for the edit form
    const coursesForEdit: Course[] = concentration.courses.map(course => ({
      code: course.code,
      title: course.name, // API uses 'name', form uses 'title'
      credits: course.credits,
      creditHours: course.creditHours,
      type: course.category, // API uses 'category', form uses 'type'
      description: course.description
    }));
    setNewConcentration({ name: concentration.name, courses: coursesForEdit });
    setIsEditConcentrationModalOpen(true);
  };

  const handleDeleteConcentration = async (concentrationId: string) => {
    try {
      await concentrationApi.deleteConcentration(concentrationId);
      // Reload concentrations from API to get the latest data
      await loadConcentrations();
    } catch (error) {
      console.error('Error deleting concentration:', error);
      alert('Failed to delete concentration. Please try again.');
    }
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

  const handleSaveNewConcentration = async () => {
    if (newConcentration.name.trim() && newConcentration.courses.length > 0) {
      try {
        // Step 1: Create the concentration with basic info only
        const newConcentrationData = await concentrationApi.createConcentration({
          name: newConcentration.name.trim(),
          description: `${newConcentration.name.trim()} concentration`,
        });

        // Step 2: Add courses to the concentration
        if (newConcentration.courses.length > 0) {
          // Convert Course[] to the format expected by the courses API
          const coursesForAPI = newConcentration.courses.map(course => {
            // Parse creditHours safely
            let creditHours = 3; // default
            if (course.creditHours && typeof course.creditHours === 'string') {
              const parsed = parseInt(course.creditHours.split('-')[0]);
              if (!isNaN(parsed) && parsed > 0) {
                creditHours = parsed;
              }
            }

            return {
              code: course.code.trim(),
              name: course.title.trim(),
              credits: Number(course.credits) || 3,
              creditHours: creditHours,
              description: course.description?.trim() || '',
              category: course.type?.trim() || 'Elective'
            };
          });

          // Add courses via the dedicated course endpoint using direct fetch
          const addCoursesResponse = await fetch(`/api/concentrations/${newConcentrationData.id}/courses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courses: coursesForAPI }),
          });

          if (!addCoursesResponse.ok) {
            const error = await addCoursesResponse.json();
            throw new Error(error.error?.message || 'Failed to add courses to concentration');
          }
        }

        // Reload concentrations from API to get the latest data
        await loadConcentrations();
        setIsAddConcentrationModalOpen(false);
        setNewConcentration({ name: '', courses: [] });
      } catch (error) {
        console.error('Error creating concentration:', error);
        alert('Failed to create concentration. Please try again.');
      }
    }
  };

  const handleSaveEditConcentration = async () => {
    if (editingConcentration && newConcentration.name.trim()) {
      try {
        // Step 1: Update basic concentration info
        await concentrationApi.updateConcentration(editingConcentration.id, {
          name: newConcentration.name,
          description: editingConcentration.description || undefined,
        });

        // Step 2: Handle course changes
        if (editingConcentration.courses && newConcentration.courses) {
          const originalCourseIds = editingConcentration.courses.map(c => c.id);
          const newCourseIds = newConcentration.courses.map(c => (c as any).id).filter(Boolean);
          
          // Find courses to remove (in original but not in new)
          const coursesToRemove = originalCourseIds.filter(id => !newCourseIds.includes(id));
          
          // Find courses to add (new courses without IDs or with IDs not in original)
          const coursesToAdd = newConcentration.courses.filter(course => 
            !(course as any).id || !originalCourseIds.includes((course as any).id)
          );

          // Remove courses that are no longer in the list
          if (coursesToRemove.length > 0) {
            for (const courseId of coursesToRemove) {
              await fetch(`/api/concentrations/${editingConcentration.id}/courses?courseId=${courseId}`, {
                method: 'DELETE',
              });
            }
          }

          // Add new courses
          if (coursesToAdd.length > 0) {
            const coursesForAPI = coursesToAdd.map(course => {
              let creditHours = 3; // default
              if (course.creditHours && typeof course.creditHours === 'string') {
                const parsed = parseInt(course.creditHours.split('-')[0]);
                if (!isNaN(parsed) && parsed > 0) {
                  creditHours = parsed;
                }
              }

              return {
                code: course.code.trim(),
                name: course.title.trim(),
                credits: Number(course.credits) || 3,
                creditHours: creditHours,
                description: course.description?.trim() || '',
                category: course.type?.trim() || 'Elective'
              };
            });

            const addCoursesResponse = await fetch(`/api/concentrations/${editingConcentration.id}/courses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ courses: coursesForAPI }),
            });

            if (!addCoursesResponse.ok) {
              const error = await addCoursesResponse.json();
              throw new Error(error.error?.message || 'Failed to add courses to concentration');
            }
          }
        }

        // Reload concentrations from API to get the latest data
        await loadConcentrations();
        setIsEditConcentrationModalOpen(false);
        setEditingConcentration(null);
        setNewConcentration({ name: '', courses: [] });
      } catch (error) {
        console.error('Error updating concentration:', error);
        alert('Failed to update concentration. Please try again.');
      }
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
      const blacklistCourse: BlacklistCourse = {
        id: (course as any).id || crypto.randomUUID(), // Use course ID if available, otherwise generate one
        code: course.code,
        name: course.title,
        credits: course.credits,
        category: course.type,
        description: course.description
      };
      
      setNewBlacklist(prev => ({
        ...prev,
        courses: [...prev.courses, blacklistCourse]
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
        const blacklistCourse: BlacklistCourse = {
          id: crypto.randomUUID(),
          code: courseToAdd.code,
          name: courseToAdd.title,
          credits: courseToAdd.credits,
          category: courseToAdd.type,
          description: courseToAdd.description
        };
        
        setNewBlacklist(prev => ({
          ...prev,
          courses: [...prev.courses, blacklistCourse]
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
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        onClick={() => handleDeleteBlacklist(blacklist)}
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
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="w-full px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-3 py-1 bg-primarary rounded text-sm hover:bg-primary/90 transition-colors"
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
                  <h4 className="font-semibold text-gray-900 dararymb-3">
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
                            <td className="px-3 py-2 text-gray-900 dark:text-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-300">{course.name}</td>
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
                disabled={loading || !newBlacklist.name.trim() || newBlacklist.courses.length === 0}
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Add Blacklist'
                )}
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
                          className="w-full px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-3 py-1 bg-primarary rounded text-sm hover:bg-primary/90 transition-colors"
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
                          <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-border">
                        {newBlacklist.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-foreground">{course.code}</td>
                            <td className="px-3 py-2 text-foreground">{course.name}</td>
                            <td className="px-3 py-2 text-foreground">{course.credits}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveCourseFromBlacklist(index)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
                                title="Remove course from blacklist"
                              >
                                <FaTrash className="w-3 h-3" />
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
                onClick={() => setIsEditBlacklistModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditBlacklist}
                disabled={!newBlacklist.name.trim()}
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="w-full px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-3 py-1 bg-primarary rounded text-sm hover:bg-primary/90 transition-colors"
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
                  <h4 className="font-semibold text-gray-900 dararymb-3">
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
                            <td className="px-3 py-2 text-gray-900 dark:text-foreground">{course.code}</td>
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
                disabled={loading || !newConcentration.name.trim() || newConcentration.courses.length === 0}
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Add Concentration'
                )}
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
                          className="w-full px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-3 py-1 bg-primary rounded text-sm hover:bg-primary/90 transition-colors"
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
                  <h4 className="font-semibold text-gray-900 dararymb-3">
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
                            <td className="px-3 py-2 text-gray-900 dark:text-foreground">{course.code}</td>
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Course Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Course Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Credit Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-border">
                    {selectedInfoBlacklist.courses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-foreground">{course.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            {course.category || '-'}
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
                className="w-full px-4 py-2 bg-gray-60aryrounded-lg hover:bg-gray-700 transition-colors"
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Course Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Course Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Credit Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-200 dark:border-border">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-border">
                    {selectedInfoConcentration.courses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-foreground">{course.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{course.creditHours}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20/30 dark:text-primary/30">
                            {course.category || '-'}
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
                className="w-full px-4 py-2 bg-gray-600 text-foreground rounded-lg hover:bg-gray-700 transition-colors"
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
