'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaLayerGroup,
  FaSitemap,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaGripVertical,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBook,
  FaTimes,
  FaSearch,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToastHelpers } from '@/hooks/useToast';
import {
  fetchCurriculumCreditPools,
  createCreditPool,
  deleteCreditPool,
  reorderCreditPools,
  fetchPoolSummary,
  fetchAvailableCourseTypes,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  fetchAvailableSubTypes,
  attachCoursesToSubCategory,
  detachCourseByAttachmentId,
  fetchAvailableCoursesForSubCategory,
  type CreditPool,
  type SubCategory,
  type CourseTypeOption,
  type AvailableCourse,
  type PoolSummaryResponse,
} from '@/lib/api/creditPools';
import type { CourseTypeLite, CurriculumCourseLite } from '@/types/creditPool';

// =============================================================================
// Types
// =============================================================================

interface PoolsListsTabProps {
  curriculumId: string;
  curriculumName?: string;
  departmentId?: string;
  courseTypes: CourseTypeLite[];
  courses: CurriculumCourseLite[];
  isLoadingCourseTypes?: boolean;
}

// =============================================================================
// Collapsible Section Component
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  badge,
  actions,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-primary">{icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-foreground">{title}</p>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {isOpen ? (
            <FaChevronUp className="h-4 w-4 text-gray-400 ml-2" />
          ) : (
            <FaChevronDown className="h-4 w-4 text-gray-400 ml-2" />
          )}
        </button>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
};

// =============================================================================
// Pool Card Component
// =============================================================================

interface PoolCardProps {
  pool: CreditPool;
  onAddSubCategory: () => void;
  onDeletePool: () => void;
  onEditSubCategory: (subCat: SubCategory) => void;
  onDeleteSubCategory: (subCatId: number) => void;
  onAttachCourses: (subCat: SubCategory) => void;
  onDetachCourse: (attachmentId: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const PoolCard = ({
  pool,
  onAddSubCategory,
  onDeletePool,
  onEditSubCategory,
  onDeleteSubCategory,
  onAttachCourses,
  onDetachCourse,
  isExpanded,
  onToggleExpand,
}: PoolCardProps) => {
  const isSatisfied = pool.totalAttachedCredits >= pool.totalRequiredCredits;
  const progressPercent = pool.totalRequiredCredits > 0 
    ? Math.min(100, (pool.totalAttachedCredits / pool.totalRequiredCredits) * 100)
    : 100;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
      {/* Pool Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pool.topLevelCourseTypeColor || '#6b7280' }}
            />
            <div>
              <h3 className="font-semibold text-foreground">{pool.name}</h3>
              <p className="text-xs text-gray-500">
                {pool.subCategories.length} sub-categor{pool.subCategories.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Credit Progress */}
            <div className="flex items-center gap-2">
              {isSatisfied ? (
                <FaCheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <FaExclamationTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span className={`text-sm font-medium ${isSatisfied ? 'text-green-600' : 'text-amber-600'}`}>
                {pool.totalAttachedCredits}/{pool.totalRequiredCredits} credits
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onAddSubCategory}>
                      <FaPlus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Sub-Category</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={onDeletePool}>
                      <FaTrash className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Pool</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {isExpanded ? (
              <FaChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <FaChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${isSatisfied ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* Sub-Categories */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-border">
          {pool.subCategories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No sub-categories yet. Click + to add one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pool.subCategories.map((subCat) => (
                <SubCategoryRow 
                  key={subCat.id}
                  subCategory={subCat}
                  onEdit={() => onEditSubCategory(subCat)}
                  onDelete={() => onDeleteSubCategory(subCat.id)}
                  onAttachCourses={() => onAttachCourses(subCat)}
                  onDetachCourse={onDetachCourse}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Sub-Category Row Component
// =============================================================================

interface SubCategoryRowProps {
  subCategory: SubCategory;
  onEdit: () => void;
  onDelete: () => void;
  onAttachCourses: () => void;
  onDetachCourse: (attachmentId: number) => void;
}

const SubCategoryRow = ({
  subCategory,
  onEdit,
  onDelete,
  onAttachCourses,
  onDetachCourse,
}: SubCategoryRowProps) => {
  const [showCourses, setShowCourses] = useState(false);
  const isSatisfied = subCategory.attachedCredits >= subCategory.requiredCredits;

  return (
    <div className="p-3 pl-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: subCategory.courseTypeColor || '#6b7280' }}
          />
          <span className="text-sm font-medium text-foreground">{subCategory.courseTypeName}</span>
          <Badge variant={isSatisfied ? "default" : "secondary"} className="text-xs">
            {subCategory.attachedCredits}/{subCategory.requiredCredits} cr
          </Badge>
          <Badge variant="outline" className="text-xs">
            {subCategory.attachedCourses.length} course{subCategory.attachedCourses.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowCourses(!showCourses)}>
            <FaBook className="h-3 w-3 mr-1" />
            {showCourses ? 'Hide' : 'Show'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onAttachCourses}>
            <FaPlus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Attached Courses List */}
      {showCourses && subCategory.attachedCourses.length > 0 && (
        <div className="mt-2 ml-4 space-y-1">
          {subCategory.attachedCourses.map((course) => (
            <div 
              key={course.id}
              className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm"
            >
              <span>
                <span className="font-medium">{course.code}</span>
                <span className="text-gray-500 ml-2">{course.name}</span>
                <span className="text-gray-400 ml-2">({course.credits} cr)</span>
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                onClick={() => onDetachCourse(course.id)}
              >
                <FaTimes className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Credit Summary Sidebar
// =============================================================================

interface CreditSummaryProps {
  summary: PoolSummaryResponse | null;
  isLoading: boolean;
}

const CreditSummary = ({ summary, isLoading }: CreditSummaryProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-4 sticky top-4">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <FaSitemap className="h-4 w-4 text-primary" />
        Credit Summary
      </h3>
      
      {/* Overall Status */}
      <div className={`p-3 rounded-lg mb-4 ${summary.allPoolsSatisfied ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
        <div className="flex items-center gap-2">
          {summary.allPoolsSatisfied ? (
            <FaCheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <FaExclamationTriangle className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <p className={`font-medium ${summary.allPoolsSatisfied ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {summary.allPoolsSatisfied ? 'All Requirements Met' : 'Requirements Incomplete'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.totalAttachedCredits}/{summary.totalRequiredCredits} total credits
            </p>
          </div>
        </div>
      </div>
      
      {/* Per-Pool Breakdown */}
      <div className="space-y-2">
        {summary.pools.map((pool) => (
          <div key={pool.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pool.color || '#6b7280' }}
              />
              <span className="text-sm text-foreground">{pool.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${pool.isSatisfied ? 'text-green-600' : 'text-amber-600'}`}>
                {pool.attachedCredits}/{pool.requiredCredits}
              </span>
              {pool.isSatisfied ? (
                <FaCheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <FaExclamationTriangle className="h-3 w-3 text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Create Pool Modal
// =============================================================================

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, courseTypeId: string) => Promise<void>;
  availableTypes: CourseTypeOption[];
  isLoading: boolean;
}

const CreatePoolModal = ({ isOpen, onClose, onSubmit, availableTypes, isLoading }: CreatePoolModalProps) => {
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = availableTypes.find(t => t.id === selectedTypeId);

  useEffect(() => {
    if (selectedType) {
      setName(selectedType.name);
    }
  }, [selectedType]);

  const handleSubmit = async () => {
    if (!selectedTypeId || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name, selectedTypeId);
      setSelectedTypeId('');
      setName('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Credit Pool</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Course Type Category
            </label>
            {isLoading ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : availableTypes.length === 0 ? (
              <p className="text-sm text-gray-500">No available course types. All types are already used.</p>
            ) : (
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-background text-foreground"
              >
                <option value="">Select a course type...</option>
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {selectedTypeId && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pool Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter pool name"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTypeId || !name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Pool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Add Sub-Category Modal
// =============================================================================

interface AddSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseTypeId: string, requiredCredits: number) => Promise<void>;
  poolId: number;
  curriculumId: string;
}

const AddSubCategoryModal = ({ isOpen, onClose, onSubmit, poolId, curriculumId }: AddSubCategoryModalProps) => {
  const [availableTypes, setAvailableTypes] = useState<CourseTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [requiredCredits, setRequiredCredits] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && poolId) {
      loadAvailableTypes();
    }
  }, [isOpen, poolId]);

  const loadAvailableTypes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAvailableSubTypes(curriculumId, poolId);
      setAvailableTypes(data.courseTypes);
    } catch (error) {
      console.error('Failed to load available sub-types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTypeId) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedTypeId, parseInt(requiredCredits) || 0);
      setSelectedTypeId('');
      setRequiredCredits('0');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sub-Category</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Course Type
            </label>
            {isLoading ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : availableTypes.length === 0 ? (
              <p className="text-sm text-gray-500">No available sub-types for this pool.</p>
            ) : (
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-background text-foreground"
              >
                <option value="">Select a course type...</option>
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.isTopLevel ? '(All)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Required Credits
            </label>
            <Input
              type="number"
              min="0"
              value={requiredCredits}
              onChange={(e) => setRequiredCredits(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTypeId || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Sub-Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Attach Courses Modal
// =============================================================================

interface AttachCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseIds: string[]) => Promise<void>;
  subCategory: SubCategory | null;
  poolId: number;
  curriculumId: string;
}

const AttachCoursesModal = ({ isOpen, onClose, onSubmit, subCategory, poolId, curriculumId }: AttachCoursesModalProps) => {
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && subCategory) {
      loadAvailableCourses();
    }
  }, [isOpen, subCategory]);

  useEffect(() => {
    if (isOpen && subCategory) {
      const timeoutId = setTimeout(() => {
        loadAvailableCourses();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [search]);

  const loadAvailableCourses = async () => {
    if (!subCategory) return;
    setIsLoading(true);
    try {
      const data = await fetchAvailableCoursesForSubCategory(curriculumId, poolId, subCategory.id, search);
      setAvailableCourses(data.courses);
    } catch (error) {
      console.error('Failed to load available courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedCourses.size === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(Array.from(selectedCourses));
      setSelectedCourses(new Set());
      setSearch('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCourses(new Set());
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Attach Courses to {subCategory?.courseTypeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="pl-10"
            />
          </div>
          
          {/* Course List */}
          <div className="border border-gray-200 dark:border-border rounded-lg max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading courses...</div>
            ) : availableCourses.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No available courses found. They may already be attached or don't match this category.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {availableCourses.map((course) => (
                  <label
                    key={course.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.has(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{course.code}</span>
                      <span className="text-gray-500 ml-2">{course.name}</span>
                    </div>
                    <Badge variant="outline">{course.credits} cr</Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {selectedCourses.size > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedCourses.size === 0 || isSubmitting}
          >
            {isSubmitting ? 'Attaching...' : `Attach ${selectedCourses.size} Course${selectedCourses.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export default function PoolsListsTab({
  curriculumId,
  curriculumName,
  departmentId,
  courseTypes,
  courses,
  isLoadingCourseTypes,
}: PoolsListsTabProps) {
  const { success, error: showError } = useToastHelpers();
  
  // Data state
  const [pools, setPools] = useState<CreditPool[]>([]);
  const [summary, setSummary] = useState<PoolSummaryResponse | null>(null);
  const [availableCourseTypes, setAvailableCourseTypes] = useState<CourseTypeOption[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  // UI state
  const [expandedPools, setExpandedPools] = useState<Set<number>>(new Set());
  
  // Modal state
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [addSubCategoryPoolId, setAddSubCategoryPoolId] = useState<number | null>(null);
  const [attachCoursesSubCategory, setAttachCoursesSubCategory] = useState<{ subCat: SubCategory; poolId: number } | null>(null);

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  const loadPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCurriculumCreditPools(curriculumId);
      setPools(data.pools);
      // Expand all by default
      setExpandedPools(new Set(data.pools.map(p => p.id)));
    } catch (error) {
      console.error('Failed to load pools:', error);
      showError('Failed to load credit pools');
    } finally {
      setIsLoading(false);
    }
  }, [curriculumId, showError]);

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const data = await fetchPoolSummary(curriculumId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [curriculumId]);

  const loadAvailableCourseTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    try {
      const data = await fetchAvailableCourseTypes(curriculumId);
      setAvailableCourseTypes(data.courseTypes);
    } catch (error) {
      console.error('Failed to load available course types:', error);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [curriculumId]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadPools(), loadSummary()]);
  }, [loadPools, loadSummary]);

  useEffect(() => {
    loadPools();
    loadSummary();
  }, [curriculumId]);

  // ==========================================================================
  // Pool Actions
  // ==========================================================================

  const handleCreatePool = async (name: string, courseTypeId: string) => {
    try {
      await createCreditPool(curriculumId, {
        name,
        topLevelCourseTypeId: courseTypeId,
        enabled: true,
      });
      success('Credit pool created successfully');
      await refreshData();
      await loadAvailableCourseTypes();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create pool');
      throw error;
    }
  };

  const handleDeletePool = async (poolId: number) => {
    if (!confirm('Are you sure you want to delete this pool? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteCreditPool(curriculumId, poolId);
      success('Credit pool deleted');
      await refreshData();
      await loadAvailableCourseTypes();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete pool');
    }
  };

  // ==========================================================================
  // Sub-Category Actions
  // ==========================================================================

  const handleAddSubCategory = async (courseTypeId: string, requiredCredits: number) => {
    if (!addSubCategoryPoolId) return;
    try {
      await addSubCategory(curriculumId, addSubCategoryPoolId, { courseTypeId, requiredCredits });
      success('Sub-category added');
      await refreshData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to add sub-category');
      throw error;
    }
  };

  const handleDeleteSubCategory = async (poolId: number, subCatId: number) => {
    if (!confirm('Delete this sub-category and all its course attachments?')) {
      return;
    }
    try {
      await deleteSubCategory(curriculumId, poolId, subCatId);
      success('Sub-category deleted');
      await refreshData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete sub-category');
    }
  };

  // ==========================================================================
  // Course Attachment Actions
  // ==========================================================================

  const handleAttachCourses = async (courseIds: string[]) => {
    if (!attachCoursesSubCategory) return;
    try {
      await attachCoursesToSubCategory(curriculumId, attachCoursesSubCategory.subCat.id, courseIds);
      success(`${courseIds.length} course${courseIds.length !== 1 ? 's' : ''} attached`);
      await refreshData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to attach courses');
      throw error;
    }
  };

  const handleDetachCourse = async (attachmentId: number) => {
    try {
      await detachCourseByAttachmentId(curriculumId, attachmentId);
      success('Course detached');
      await refreshData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to detach course');
    }
  };

  // ==========================================================================
  // UI Helpers
  // ==========================================================================

  const togglePoolExpanded = (poolId: number) => {
    setExpandedPools(prev => {
      const next = new Set(prev);
      if (next.has(poolId)) {
        next.delete(poolId);
      } else {
        next.add(poolId);
      }
      return next;
    });
  };

  const openCreatePoolModal = () => {
    loadAvailableCourseTypes();
    setIsCreatePoolOpen(true);
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <FaLayerGroup className="mt-1 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Credit Pools for {curriculumName || 'this curriculum'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Create pools based on course type categories, add sub-categories, and attach courses to define credit requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Pools */}
          <div className="xl:col-span-2 space-y-6">
            <CollapsibleSection
              title="Credit Pools"
              subtitle="Define credit requirements by course type categories"
              icon={<FaLayerGroup className="h-4 w-4" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {pools.length} pool{pools.length !== 1 ? 's' : ''}
                </Badge>
              }
              actions={
                <Button size="sm" onClick={openCreatePoolModal}>
                  <FaPlus className="h-3 w-3 mr-2" />
                  Add Pool
                </Button>
              }
            >
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-8 text-center">
                  <FaLayerGroup className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No credit pools defined yet.
                  </p>
                  <Button className="mt-3" size="sm" onClick={openCreatePoolModal}>
                    <FaPlus className="h-3 w-3 mr-2" />
                    Create First Pool
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pools.map((pool) => (
                    <PoolCard
                      key={pool.id}
                      pool={pool}
                      isExpanded={expandedPools.has(pool.id)}
                      onToggleExpand={() => togglePoolExpanded(pool.id)}
                      onAddSubCategory={() => setAddSubCategoryPoolId(pool.id)}
                      onDeletePool={() => handleDeletePool(pool.id)}
                      onEditSubCategory={(subCat) => {
                        // TODO: Implement edit sub-category modal
                        console.log('Edit sub-category:', subCat);
                      }}
                      onDeleteSubCategory={(subCatId) => handleDeleteSubCategory(pool.id, subCatId)}
                      onAttachCourses={(subCat) => setAttachCoursesSubCategory({ subCat, poolId: pool.id })}
                      onDetachCourse={handleDetachCourse}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Right Column: Summary */}
          <div className="xl:col-span-1">
            <CreditSummary summary={summary} isLoading={isSummaryLoading} />
          </div>
        </div>

        {/* Modals */}
        <CreatePoolModal
          isOpen={isCreatePoolOpen}
          onClose={() => setIsCreatePoolOpen(false)}
          onSubmit={handleCreatePool}
          availableTypes={availableCourseTypes}
          isLoading={isLoadingTypes}
        />

        <AddSubCategoryModal
          isOpen={addSubCategoryPoolId !== null}
          onClose={() => setAddSubCategoryPoolId(null)}
          onSubmit={handleAddSubCategory}
          poolId={addSubCategoryPoolId || 0}
          curriculumId={curriculumId}
        />

        <AttachCoursesModal
          isOpen={attachCoursesSubCategory !== null}
          onClose={() => setAttachCoursesSubCategory(null)}
          onSubmit={handleAttachCourses}
          subCategory={attachCoursesSubCategory?.subCat || null}
          poolId={attachCoursesSubCategory?.poolId || 0}
          curriculumId={curriculumId}
        />
      </div>
    </TooltipProvider>
  );
}
