"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from '@/contexts/SanctumAuthContext';
import { useRouter } from "next/navigation";
import {
  FaFileExcel,
  FaEdit,
  FaTrash,
  FaPlus,
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaLayerGroup,
  FaSitemap,
  FaLightbulb,
  FaListUl
} from 'react-icons/fa';
import { blacklistApi, type BlacklistData, type BlacklistCourse } from '@/services/blacklistApi';
import { concentrationApi, type ConcentrationData, type ConcentrationCourse } from '@/services/concentrationApi';
import { facultyLabelApi } from '@/services/facultyLabelApi';
import { courseTypesApi, type CourseTypeData } from '@/services/courseTypesApi';
import { formatCreatedDate } from "@/lib/ui/dateformat";
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE } from '@/lib/api/laravel';
import { useConfigFeatureFlags } from '@/hooks/useConfigFeatureFlags';

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
  parentId?: string | null;
}

interface CourseTypeTreeNode extends CourseTypeData {
  children: CourseTypeTreeNode[];
  parentId?: string | null;
}

type ConfigSectionKey = 'blacklists' | 'courseTypes' | 'concentrations' | 'pools';

interface CourseTypeOption {
  id: string;
  label: string;
}

interface NewCourseTypeForm {
  name: string;
  color: string;
  parentId: string | null;
}

const createEmptyTypeForm = (overrides?: Partial<NewCourseTypeForm>): NewCourseTypeForm => ({
  name: '',
  color: '#6366f1',
  parentId: null,
  ...overrides
});

const buildCourseTypeTree = (types: CourseTypeData[]): CourseTypeTreeNode[] => {
  const nodes = new Map<string, CourseTypeTreeNode>();
  const roots: CourseTypeTreeNode[] = [];

  types.forEach((type) => {
    nodes.set(type.id, {
      ...type,
      parentId: type.parentId ?? null,
      children: []
    });
  });

  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list: CourseTypeTreeNode[]): CourseTypeTreeNode[] =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({
        ...node,
        children: sortNodes(node.children)
      }));

  return sortNodes(roots);
};

const flattenCourseTypeTree = (nodes: CourseTypeTreeNode[], depth = 0): CourseTypeOption[] => {
  const result: CourseTypeOption[] = [];

  nodes.forEach((node) => {
    const prefix = depth > 0 ? `${'--'.repeat(depth)} ` : '';
    result.push({ id: node.id, label: `${prefix}${node.name}` });
    result.push(...flattenCourseTypeTree(node.children, depth + 1));
  });

  return result;
};

const findCourseTypeNode = (nodes: CourseTypeTreeNode[], id: string): CourseTypeTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findCourseTypeNode(node.children, id);
    if (child) {
      return child;
    }
  }
  return null;
};

const collectDescendantIds = (node: CourseTypeTreeNode): string[] => {
  const ids: string[] = [];
  node.children.forEach((child) => {
    ids.push(child.id);
    ids.push(...collectDescendantIds(child));
  });
  return ids;
};

const calculateTreeDepth = (nodes: CourseTypeTreeNode[], depth = 1): number => {
  if (nodes.length === 0) {
    return 0;
  }

  return nodes.reduce((maxDepth, node) => {
    if (node.children.length === 0) {
      return Math.max(maxDepth, depth);
    }
    return Math.max(maxDepth, calculateTreeDepth(node.children, depth + 1));
  }, depth);
};

// Use CourseTypeData from API instead of local CourseType interface

// Use ConcentrationData from API instead of local Concentration interface

interface Blacklist {
  id: string;
  name: string;
  courses: Course[];
  createdAt: string;
}

const defaultCourseTypes: CourseType[] = [
  { id: '1', name: 'Core', color: '#ef4444', parentId: null }, // red
  { id: '2', name: 'Major', color: '#22c55e', parentId: null }, // green
  { id: '3', name: 'Major Elective', color: '#eab308', parentId: null }, // yellow
  { id: '4', name: 'General Education', color: '#6366f1', parentId: null }, // indigo
  { id: '5', name: 'Free Elective', color: '#6b7280', parentId: null }, // gray
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
  // Authentication hooks - MUST be at the top
  const { user } = useAuth();
  const router = useRouter();

  // Toast notifications - MUST be before conditional returns
  const { success, error: showError, warning, info } = useToastHelpers();
  
  // Course type management states
  const [courseTypes, setCourseTypes] = useState<CourseTypeData[]>([]);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CourseTypeData | null>(null);
  const [newType, setNewType] = useState<NewCourseTypeForm>(createEmptyTypeForm());
  const [collapsedSections, setCollapsedSections] = useState<Record<ConfigSectionKey, boolean>>({
    blacklists: false,
    courseTypes: false,
    concentrations: false,
    pools: false
  });
  const [expandedTypeIds, setExpandedTypeIds] = useState<Record<string, boolean>>({});
  const [poolLists] = useState<{ id: string; name: string; courseCount: number; type: 'pool'; updatedAt?: string }[]>([]);
  const [pools] = useState<{ id: string; name: string; minCredits: number; maxCredits: number; updatedAt?: string }[]>([]);
  
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
  
  // Database courses for search functionality
  const [databaseCourses, setDatabaseCourses] = useState<Course[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { flags, isLoading: featureFlagsLoading, error: featureFlagError, refresh: refreshFeatureFlags } = useConfigFeatureFlags();

  const hierarchyEnabled = flags.enableHierarchy;
  const poolsEnabled = flags.enablePools;
  const genericListsEnabled = flags.enableGenericLists;
  const legacyBannerVisible = flags.showLegacyBridgeBanner;

  const courseTypeTree = useMemo(() => buildCourseTypeTree(courseTypes), [courseTypes]);
  const courseTypeOptions = useMemo(() => flattenCourseTypeTree(courseTypeTree), [courseTypeTree]);
  const courseTypeDepth = useMemo(() => calculateTreeDepth(courseTypeTree), [courseTypeTree]);
  const disallowedParentIds = useMemo(() => {
    if (!editingType) {
      return [] as string[];
    }
    const targetNode = findCourseTypeNode(courseTypeTree, editingType.id);
    if (!targetNode) {
      return [editingType.id];
    }
    return [editingType.id, ...collectDescendantIds(targetNode)];
  }, [editingType, courseTypeTree]);
  const courseTypeParentLookup = useMemo(() => {
    const map = new Map<string, CourseTypeTreeNode>();
    const walk = (nodes: CourseTypeTreeNode[]) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        walk(node.children);
      });
    };
    walk(courseTypeTree);
    return map;
  }, [courseTypeTree]);
  const genericListSummaries = useMemo(() => ([
    {
      id: 'concentrations',
      label: 'Concentration Lists',
      description: 'Curated bundles of electives',
      count: concentrations.length,
      type: 'concentration'
    },
    {
      id: 'blacklists',
      label: 'Blacklists',
      description: 'Banned or sunset courses',
      count: blacklists.length,
      type: 'blacklist'
    },
    {
      id: 'pool-lists',
      label: 'Pool Lists',
      description: 'Reusable pools coming soon',
      count: poolLists.length,
      type: 'pool'
    }
  ]), [blacklists.length, concentrations.length, poolLists.length]);

  // Authentication check - AFTER all hooks are declared
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (user.role !== 'CHAIRPERSON') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Load blacklists on component mount - only if authenticated
  useEffect(() => {
    if (user && user.role === 'CHAIRPERSON') {
      loadBlacklists();
    }
  }, [user]);

  // Load concentrations on component mount - only if authenticated
  useEffect(() => {
    if (user && user.role === 'CHAIRPERSON') {
      loadConcentrations();
    }
  }, [user]);

  // Load concentration title on component mount - only if authenticated
  useEffect(() => {
    if (user && user.role === 'CHAIRPERSON') {
      loadConcentrationTitle();
    }
  }, [user]);

  // Load course types on component mount - only if authenticated
  useEffect(() => {
    if (user && user.role === 'CHAIRPERSON') {
      loadCourseTypes();
    }
  }, [user]);

  // Trigger search when courseSearch changes - with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (courseSearch && courseSearch.trim().length >= 2) {
        searchDatabaseCourses(courseSearch);
      } else {
        setDatabaseCourses([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [courseSearch]);

  // Don't render if not authenticated or not chairperson
  if (!user || user.role !== 'CHAIRPERSON') {
    return null;
  }

  const loadBlacklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blacklistApi.getBlacklists();
      setBlacklists(Array.isArray(response.blacklists) ? response.blacklists : []);
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
      setConcentrations(Array.isArray(response) ? response : []);
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
        parentId: type.parentId ?? null,
        usageCount: 0,
        childCount: 0,
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
            color: defaultType.color,
            parentId: defaultType.parentId ?? null
          });
          createdTypes.push({
            ...newType,
            parentId: newType.parentId ?? defaultType.parentId ?? null
          });
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

  // Fetch courses from database based on search query
  const searchDatabaseCourses = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setDatabaseCourses([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`${API_BASE}/courses/search?q=${encodeURIComponent(query)}&limit=20`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to search courses');
      }
      
      const data = await response.json();
      
      // Convert API response to Course[] format
      const courses: Course[] = data.courses.map((course: any) => ({
        code: course.code,
        title: course.name,
        credits: course.credits,
        creditHours: course.creditHours || '3-0-6',
        type: course.category || 'Unknown',
        description: course.description || ''
      }));
      
      setDatabaseCourses(courses);
    } catch (err) {
      console.error('Error searching courses:', err);
      setDatabaseCourses([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSection = useCallback((section: ConfigSectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const toggleCourseTypeNode = useCallback((typeId: string, currentState: boolean) => {
    setExpandedTypeIds(prev => ({
      ...prev,
      [typeId]: !currentState
    }));
  }, []);

  const handlePoolBuilderPlaceholder = useCallback(() => {
    warning('Credit Pool builder is coming soon. Backend endpoints need to land before we enable this.');
  }, [warning]);

  const handleGenericListPlaceholder = useCallback(() => {
    info('Unified pool lists will reuse concentrations and blacklists once backend support ships.');
  }, [info]);

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
  const handleAddType = (parentId?: string | null) => {
    setNewType(createEmptyTypeForm({ parentId: parentId ?? null }));
    setIsAddTypeModalOpen(true);
  };

  const handleEditType = (type: CourseTypeData) => {
    setEditingType(type);
    setNewType(createEmptyTypeForm({
      name: type.name,
      color: type.color,
      parentId: type.parentId ?? null
    }));
    setIsEditTypeModalOpen(true);
  };

  const handleDeleteType = async (typeId: string) => {
    // Find the type to get its name for the confirmation dialog
    const typeToDelete = courseTypes.find(type => type.id === typeId);
    if (!typeToDelete) return;

    if (!confirm(`Are you sure you want to delete the course type "${typeToDelete.name}"?`)) {
      return;
    }

    try {
      await courseTypesApi.deleteCourseType(typeId);
      setCourseTypes(courseTypes.filter(type => type.id !== typeId));
      success('Course type deleted successfully');
    } catch (error) {
      console.error('Error deleting course type:', error);
      showError('Failed to delete course type. Please try again.');
    }
  };

  const handleSaveNewType = async () => {
    try {
      // Validate input
      const errors = courseTypesApi.validateCourseType(newType.name, newType.color);
      if (errors.length > 0) {
        showError(errors.join(', '));
        return;
      }

      const payload = {
        name: newType.name.trim(),
        color: newType.color,
        parentId: newType.parentId ?? null
      };

      const newTypeData = await courseTypesApi.createCourseType(payload);
      const normalizedType: CourseTypeData = {
        ...newTypeData,
        parentId: newTypeData.parentId ?? payload.parentId ?? null
      };

      setCourseTypes([...courseTypes, normalizedType]);
      setIsAddTypeModalOpen(false);
      setNewType(createEmptyTypeForm());
      success('Course type created successfully');
    } catch (error) {
      console.error('Error creating course type:', error);
      showError('Failed to create course type. Please try again.');
    }
  };

  const handleSaveEditType = async () => {
    if (editingType) {
      try {
        // Validate input
        const errors = courseTypesApi.validateCourseType(newType.name, newType.color);
        if (errors.length > 0) {
          showError(errors.join(', '));
          return;
        }

        const payload = {
          name: newType.name.trim(),
          color: newType.color,
          parentId: newType.parentId ?? null
        };

        const updatedType = await courseTypesApi.updateCourseType(editingType.id, payload);
        const normalizedType: CourseTypeData = {
          ...updatedType,
          parentId: updatedType.parentId ?? payload.parentId ?? null
        };

        setCourseTypes(Array.isArray(courseTypes) ? courseTypes.map(type => 
          type.id === editingType.id ? normalizedType : type
        ) : [normalizedType]);
        setIsEditTypeModalOpen(false);
        setEditingType(null);
        setNewType(createEmptyTypeForm());
        success('Course type updated successfully');
      } catch (error) {
        console.error('Error updating course type:', error);
        showError('Failed to update course type. Please try again.');
      }
    }
  };

  const renderCourseTypeNode = useCallback((node: CourseTypeTreeNode, depth = 0) => {
    const isExpanded = expandedTypeIds[node.id] ?? (!node.parentId);
    const hasChildren = node.children.length > 0;
    const parentLabel = node.parentId ? courseTypeParentLookup.get(node.parentId)?.name ?? 'Parent' : 'Top level';

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          style={{ paddingLeft: depth * 16 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCourseTypeNode(node.id, isExpanded)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label={isExpanded ? 'Collapse children' : 'Expand children'}
                >
                  {isExpanded ? <FaChevronDown className="h-3 w-3" /> : <FaChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <span className="inline-flex h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              )}
            </div>
            <span
              className="h-2.5 w-2.5 rounded-full border border-gray-200"
              style={{ backgroundColor: node.color }}
            ></span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {node.parentId ? `Child of ${parentLabel}` : 'Top level type'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {(node.usageCount ?? 0)} uses
            </span>
            <button
              type="button"
              onClick={() => handleAddType(node.id)}
              className="p-1.5 text-gray-500 transition-all hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              title="Add child type"
            >
              <FaPlus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleEditType(node)}
              className="p-1.5 text-gray-500 transition-all hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              title="Edit type"
            >
              <FaEdit className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteType(node.id)}
              className="p-1.5 text-gray-500 transition-all hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              title="Delete type"
            >
              <FaTrash className="h-3 w-3" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {node.children.map(child => renderCourseTypeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [courseTypeParentLookup, expandedTypeIds, handleAddType, handleDeleteType, handleEditType, toggleCourseTypeNode]);

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
      success('Concentration title updated successfully');
    } catch (error) {
      console.error('Error updating concentration title:', error);
      showError('Failed to update concentration title. Please try again.');
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
    // Find the concentration to get its name for the confirmation dialog
    const concentrationToDelete = concentrations.find(concentration => concentration.id === concentrationId);
    if (!concentrationToDelete) return;

    if (!confirm(`Are you sure you want to delete the concentration "${concentrationToDelete.name}"?`)) {
      return;
    }

    try {
      await concentrationApi.deleteConcentration(concentrationId);
      // Reload concentrations from API to get the latest data
      await loadConcentrations();
      success('Concentration deleted successfully');
    } catch (error) {
      console.error('Error deleting concentration:', error);
      showError('Failed to delete concentration. Please try again.');
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

  const handleConcentrationFileUpload = async (file: File | null) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      try {
        setLoading(true);
        let uploadedCourses: any[] = [];
        
        if (file.name.endsWith('.csv')) {
          // For CSV files, read as text and parse
          const fileContent = await file.text();
          uploadedCourses = concentrationApi.parseCSVContent(fileContent);
        } else {
          // For Excel files, parse directly with the file object
          uploadedCourses = await concentrationApi.parseExcelFile(file);
        }
        
        // Convert to Course[] format for the form
        const coursesForForm: Course[] = uploadedCourses.map(course => ({
          code: course.code,
          title: course.name, // API uses 'name', form uses 'title'
          credits: course.credits,
          creditHours: course.creditHours,
          type: course.category, // API uses 'category', form uses 'type'
          description: course.description
        }));
        
        setNewConcentration({ ...newConcentration, courses: coursesForForm });
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
          const addCoursesResponse = await fetch(`${API_BASE}/concentrations/${newConcentrationData.id}/courses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
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
        success('Concentration created successfully');
      } catch (error) {
        console.error('Error creating concentration:', error);
        showError('Failed to create concentration. Please try again.');
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
              await fetch(`${API_BASE}/concentrations/${editingConcentration.id}/courses?courseId=${courseId}`, {
                method: 'DELETE',
                credentials: 'include',
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

            const addCoursesResponse = await fetch(`${API_BASE}/concentrations/${editingConcentration.id}/courses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
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
        success('Concentration updated successfully');
      } catch (error) {
        console.error('Error updating concentration:', error);
        showError('Failed to update concentration. Please try again.');
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
    const course = newConcentration.courses[courseIndex];
    if (!course) return;

    if (!confirm(`Are you sure you want to remove "${course.code} - ${course.title}" from this concentration?`)) {
      return;
    }

    setNewConcentration(prev => ({
      ...prev,
      courses: prev.courses.filter((_, index) => index !== courseIndex)
    }));
  };

  const handleRemoveCourseFromBlacklist = (courseIndex: number) => {
    const course = newBlacklist.courses[courseIndex];
    if (!course) return;

    if (!confirm(`Are you sure you want to remove "${course.code} - ${course.name}" from this blacklist?`)) {
      return;
    }

    setNewBlacklist(prev => ({
      ...prev,
      courses: prev.courses.filter((_, index) => index !== courseIndex)
    }));
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-2 px-2 sm:px-4 lg:px-6">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-lg sm:rounded-2xl p-3 sm:p-5 lg:p-6">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-foreground">Configuration</h1>
          </div>

          {featureFlagError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-50">
              Unable to sync feature flags. Falling back to environment defaults.
            </div>
          )}

          {/* Configuration Containers */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            
            {/* Blacklist */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('blacklists')}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="rounded-full border border-gray-200 dark:border-gray-700 p-1 text-gray-600 dark:text-gray-300">
                    {collapsedSections.blacklists ? (
                      <FaChevronRight className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-foreground">Blacklists</h2>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {blacklists.length} lists
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Manage sunset or banned courses while we transition to pool lists.
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddBlacklist}
                    disabled={loading}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm lg:text-base shrink-0 touch-manipulation"
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Add Blacklist</span>
                    <span className="xs:hidden">Add</span>
                  </button>
                </div>
              </div>

              {!collapsedSections.blacklists && (
                <div className="mt-4 space-y-2 sm:space-y-3">
                  {Array.isArray(blacklists) && blacklists.map((blacklist) => (
                    <div
                      key={blacklist.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{blacklist.name}</h3>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
                              {blacklist.courses.length} courses
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              Created {formatCreatedDate(blacklist.createdAt)}
                            </span>
                          </div>
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

                  {(!Array.isArray(blacklists) || blacklists.length === 0) && (
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
              )}
            </div>

            {/* Categories (type) */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('courseTypes')}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="rounded-full border border-gray-200 dark:border-gray-700 p-1 text-gray-600 dark:text-gray-300">
                    {collapsedSections.courseTypes ? (
                      <FaChevronRight className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <FaSitemap className="h-4 w-4 text-primary" />
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-foreground">Course Categories</h2>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {courseTypes.length} types
                      </span>
                      {courseTypeDepth > 1 && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {courseTypeDepth} levels
                        </span>
                      )}
                      {featureFlagsLoading && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                          <span className="h-2 w-2 animate-spin rounded-full border border-amber-700 border-t-transparent"></span>
                          Syncing flags
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Build a multi-level taxonomy for course planning and upcoming pool logic.
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddType()}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm lg:text-base shrink-0 touch-manipulation"
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Add Type</span>
                    <span className="xs:hidden">Add</span>
                  </button>
                </div>
              </div>

              {!collapsedSections.courseTypes && (
                <div className="mt-4 space-y-3">
                  {hierarchyEnabled ? (
                    courseTypeTree.length > 0 ? (
                      <div className="space-y-1 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-background">
                        {courseTypeTree.map(node => renderCourseTypeNode(node))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 dark:border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No course types yet. Use “Add Type” to seed your hierarchy.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 dark:border-border p-4 text-sm text-muted-foreground">
                      <p className="mb-2">
                        Hierarchy management is behind a feature flag. Enable `NEXT_PUBLIC_ENABLE_CONFIG_HIERARCHY` or refresh once the backend endpoint is ready.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => refreshFeatureFlags()}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Refresh Flags
                        </button>
                        <button
                          type="button"
                          onClick={() => info('Hierarchy UI hidden until backend toggle is enabled.')}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Concentrations */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection('concentrations')}
                    className="rounded-full border border-gray-200 dark:border-gray-700 p-1 text-gray-600 dark:text-gray-300"
                  >
                    {collapsedSections.concentrations ? (
                      <FaChevronRight className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditConcentrationTitleOpen ? (
                        <input
                          type="text"
                          value={concentrationTitle}
                          onChange={(e) => setConcentrationTitle(e.target.value)}
                          className="text-lg sm:text-xl font-bold border border-gray-300 dark:border-border rounded px-2 py-1 bg-background text-foreground"
                          onBlur={handleSaveConcentrationTitle}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveConcentrationTitle()}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-foreground">{concentrationTitle}</h2>
                          <button
                            onClick={handleEditConcentrationTitle}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded transition-colors touch-manipulation"
                            title="Edit Title"
                          >
                            <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {concentrations.length} lists
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Manage academic concentrations and staged electives during the migration.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddConcentration}
                  disabled={loading}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm lg:text-base shrink-0 touch-manipulation"
                >
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Add Concentration</span>
                  <span className="xs:hidden">Add</span>
                </button>
              </div>

              {!collapsedSections.concentrations && (
                <div className="mt-4 space-y-2 sm:space-y-3">
                  {concentrations.map((concentration) => (
                    <div
                      key={concentration.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{concentration.name}</h3>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shrink-0">
                              {concentration.courses.length} courses
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              Created {formatCreatedDate(concentration.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={() => handleShowConcentrationInfo(concentration)}
                          className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all touch-manipulation"
                          title="View Course Details"
                        >
                          <FaInfoCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleEditConcentration(concentration)}
                          className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all touch-manipulation"
                          title="Edit Concentration"
                        >
                          <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConcentration(concentration.id)}
                          className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all touch-manipulation"
                          title="Delete Concentration"
                        >
                          <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
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
              )}
            </div>

            {/* Pools & Lists */}
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('pools')}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="rounded-full border border-gray-200 dark:border-gray-700 p-1 text-gray-600 dark:text-gray-300">
                    {collapsedSections.pools ? (
                      <FaChevronRight className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <FaLayerGroup className="h-4 w-4 text-primary" />
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-foreground">Pools &amp; Lists</h2>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {pools.length} pools
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {genericListSummaries.reduce((total, summary) => total + summary.count, 0)} lists
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Stage the upcoming credit-pool builder and generic course lists without blocking existing workflows.
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePoolBuilderPlaceholder}
                    disabled={!poolsEnabled}
                    className="flex items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    <FaLayerGroup className="h-3.5 w-3.5" />
                    Launch Builder
                  </button>
                </div>
              </div>

              {!collapsedSections.pools && (
                <div className="mt-4 space-y-4">
                  {poolsEnabled ? (
                    <>
                      <div className="rounded-lg border border-gray-200 dark:border-border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Credit Pools Builder</h3>
                            <p className="text-sm text-muted-foreground">
                              Define min/max credit gates and source nodes. Backend endpoints `/credit-pools` &amp; `/curricula/:id/credit-pools` pending.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handlePoolBuilderPlaceholder}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                          >
                            Add Pool
                          </button>
                        </div>

                        {pools.length === 0 ? (
                          <div className="mt-4 rounded-lg border border-dashed border-gray-300 dark:border-border p-4 text-sm text-muted-foreground">
                            No pools yet. This UI will light up once the backend delivers pool + attachment APIs.
                          </div>
                        ) : (
                          <ul className="mt-4 space-y-3">
                            {pools.map((pool) => (
                              <li key={pool.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                                <div>
                                  <p className="font-semibold text-foreground">{pool.name}</p>
                                  <p className="text-muted-foreground">
                                    {pool.minCredits}-{pool.maxCredits} credit window
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Updated {pool.updatedAt ? formatCreatedDate(pool.updatedAt) : '—'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {genericListsEnabled ? (
                        <div className="rounded-lg border border-gray-200 dark:border-border p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <FaListUl className="h-4 w-4 text-primary" />
                              <h3 className="text-base font-semibold text-foreground">Generic Lists</h3>
                            </div>
                            <button
                              type="button"
                              onClick={handleGenericListPlaceholder}
                              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                              New List
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {genericListSummaries.map((summary) => (
                              <div key={summary.id} className="rounded-lg border border-gray-200 dark:border-border p-3">
                                <p className="text-sm font-semibold text-foreground">{summary.label}</p>
                                <p className="text-xs text-muted-foreground">{summary.description}</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{summary.count}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 dark:border-border p-4 text-sm text-muted-foreground">
                          Generic pool lists are off. Flip `NEXT_PUBLIC_ENABLE_CONFIG_GENERIC_LISTS` when backend consolidation is ready.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 dark:border-border p-4 text-sm text-muted-foreground">
                      Credit pools are gated by the `NEXT_PUBLIC_ENABLE_CONFIG_POOLS` flag until the Laravel endpoints ship. Refresh the flags after the backend handoff.
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => refreshFeatureFlags()}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Refresh Flags
                        </button>
                        <button
                          type="button"
                          onClick={handlePoolBuilderPlaceholder}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Preview UX
                        </button>
                      </div>
                    </div>
                  )}

                  {legacyBannerVisible && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-100">
                      <FaLightbulb className="mt-1 h-4 w-4" />
                      <div>
                        <p className="font-semibold">Legacy elective rules stay active</p>
                        <p className="text-sm">
                          Pools will eventually replace elective rules once migration finishes. For now, continue editing elective criteria in the curriculum tab.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Add Blacklist Modal */}
      {isAddBlacklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Add New Blacklist</h3>
              <button
                onClick={() => setIsAddBlacklistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Blacklist Name</label>
                <input
                  type="text"
                  value={newBlacklist.name}
                  onChange={(e) => setNewBlacklist({ ...newBlacklist, name: e.target.value })}
                  placeholder="e.g., Outdated Courses"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors text-sm sm:text-base"
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
                          {searchLoading ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              Searching...
                            </div>
                          ) : databaseCourses.length > 0 ? (
                            databaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'blacklist');
                                  setCourseSearch('');
                                  setDatabaseCourses([]);
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : courseSearch.length >= 2 ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              Type at least 2 characters to search
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
                          className="px-3 py-1 bg-primarary rounded text-sm bg-primary/90 transition-colors"
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsAddBlacklistModalOpen(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewBlacklist}
                disabled={loading || !newBlacklist.name.trim() || newBlacklist.courses.length === 0}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-border rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span className="hidden xs:inline">Creating...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Add Blacklist</span>
                    <span className="xs:hidden">Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Blacklist Modal */}
      {isEditBlacklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-y-auto">
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
                          {searchLoading ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              Searching...
                            </div>
                          ) : databaseCourses.length > 0 ? (
                            databaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'blacklist');
                                  setCourseSearch('');
                                  setDatabaseCourses([]);
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{course.title}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                              </div>
                            ))
                          ) : courseSearch.length >= 2 ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No courses found matching "{courseSearch}"
                            </div>
                          ) : (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                              Type at least 2 characters to search
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
                          className="px-3 py-1 bg-primarary rounded text-sm bg-primary/90 transition-colors"
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {isAddTypeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-sm lg:max-w-md border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Add New Course Type</h3>
              <button
                onClick={() => setIsAddTypeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Type Name</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  placeholder="e.g., Capstone"
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Color</label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="w-10 h-8 sm:w-12 sm:h-10 border border-gray-300 dark:border-border rounded cursor-pointer touch-manipulation"
                  />
                  <input
                    type="text"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors text-xs sm:text-sm"
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Parent Type (optional)</label>
                <select
                  value={newType.parentId ?? ''}
                  onChange={(e) => setNewType({ ...newType, parentId: e.target.value || null })}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground text-sm"
                >
                  <option value="">No parent (top level)</option>
                  {courseTypeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Select a parent to nest this type within your hierarchy.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsAddTypeModalOpen(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewType}
                disabled={!newType.name.trim()}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
              >
                <span className="hidden xs:inline">Add Type</span>
                <span className="xs:hidden">Add</span>
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

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Parent Type</label>
                <select
                  value={newType.parentId ?? ''}
                  onChange={(e) => setNewType({ ...newType, parentId: e.target.value || null })}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="">No parent (top level)</option>
                  {courseTypeOptions.map(option => (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={disallowedParentIds.includes(option.id)}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  The selected type cannot become its own parent or the parent of its descendants.
                </p>
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          {searchLoading ? (<div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Searching...</div>) : databaseCourses.length > 0 ? (
                            databaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'concentration');
                                  setCourseSearch('');
                                  setDatabaseCourses([]);
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
                          className="px-3 py-1 bg-primarary rounded text-sm bg-primary/90 transition-colors"
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                          {searchLoading ? (<div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Searching...</div>) : databaseCourses.length > 0 ? (
                            databaseCourses.map((course, index) => (
                              <div
                                key={index}
                                className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleAddExistingCourse(course, 'concentration');
                                  setCourseSearch('');
                                  setDatabaseCourses([]);
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
                          className="px-3 py-1 rounded text-sm bg-primary/90 transition-colors"
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
                className="flex-1 px-4 py-2 bg-primarary rounded-lg bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>
      )}
    </div>
  );
}




