'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  FaLayerGroup,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaExclamationTriangle,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaEdit,
  FaMagic,
  FaSync,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/useToast';
import type {
  CurriculumCreditPool,
  SubCategoryPool,
  AttachedPoolCourse,
  CourseTypeLite,
  CurriculumCourseLite,
  CourseTypeTreeNode,
} from '@/types/creditPool';
import {
  fetchCurriculumCreditPools,
  createCreditPool,
  updateCreditPool,
  deleteCreditPool,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  attachCoursesToSubCategory,
  detachCourseByAttachmentId,
  fetchAvailableCoursesForSubCategory,
  fetchAvailableCourseTypes,
  fetchAvailableSubTypes,
  type CreditPool,
  type SubCategory,
  type AvailableCourse,
} from '@/lib/api/creditPools';

// =============================================================================
// Helper Functions
// =============================================================================

const normalizeParentId = (type: CourseTypeLite) =>
  type.parentId ?? type.parent_id ?? type.parentCourseTypeId ?? null;

const buildTree = (types: CourseTypeLite[]): CourseTypeTreeNode[] => {
  const nodeMap = new Map<string, CourseTypeTreeNode>();
  const roots: CourseTypeTreeNode[] = [];

  types.forEach((type) => {
    nodeMap.set(type.id, { ...type, parentId: normalizeParentId(type), children: [] });
  });

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const getDescendants = (typeId: string, types: CourseTypeLite[]): CourseTypeLite[] => {
  const descendants: CourseTypeLite[] = [];
  const directChildren = types.filter(t => normalizeParentId(t) === typeId);
  
  for (const child of directChildren) {
    descendants.push(child);
    descendants.push(...getDescendants(child.id, types));
  }
  
  return descendants;
};

const getTopLevelTypes = (types: CourseTypeLite[]): CourseTypeLite[] => {
  return types.filter(t => !normalizeParentId(t));
};

// =============================================================================
// Mock Data for Demo - COMMENTED OUT (Now using real API)
// =============================================================================

/*
const generateMockPools = (
  courseTypes: CourseTypeLite[],
  courses: CurriculumCourseLite[]
): CurriculumCreditPool[] => {
  // MOCK DATA GENERATION REMOVED - Using real backend API now
  return [];
};
*/

// =============================================================================
// API Data Transformation Helpers
// =============================================================================

/**
 * Transform API CreditPool response to frontend CurriculumCreditPool type
 */
const transformApiPoolToFrontend = (apiPool: CreditPool): CurriculumCreditPool => ({
  id: String(apiPool.id),
  curriculumId: apiPool.curriculumId,
  name: apiPool.name,
  topLevelCourseTypeId: apiPool.topLevelCourseTypeId,
  topLevelCourseTypeColor: apiPool.topLevelCourseTypeColor,
  enabled: apiPool.enabled,
  subCategories: apiPool.subCategories.map(sc => ({
    id: String(sc.id),
    poolId: String(sc.poolId),
    courseTypeId: sc.courseTypeId,
    courseTypeName: sc.courseTypeName,
    courseTypeColor: sc.courseTypeColor,
    requiredCredits: sc.requiredCredits,
    attachedCourses: sc.attachedCourses.map(ac => ({
      id: String(ac.id),
      courseId: ac.courseId,
      code: ac.code,
      name: ac.name,
      credits: ac.credits,
      attachedAt: ac.attachedAt,
    })),
    attachedCredits: sc.attachedCredits,
  })),
  totalRequiredCredits: apiPool.totalRequiredCredits,
  totalAttachedCredits: apiPool.totalAttachedCredits,
  createdAt: apiPool.createdAt,
  updatedAt: apiPool.updatedAt,
});

// =============================================================================
// Sub Components
// =============================================================================

interface SubCategoryRowProps {
  subCategory: SubCategoryPool;
  onUpdateCredits: (credits: number) => void;
  onDetachCourse: (courseId: string) => void;
  onAutoAttach: () => void;
  onAddCourse: () => void;
  availableCoursesCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const SubCategoryRow: React.FC<SubCategoryRowProps> = ({
  subCategory,
  onUpdateCredits,
  onDetachCourse,
  onAutoAttach,
  onAddCourse,
  availableCoursesCount,
  isExpanded,
  onToggleExpand,
}) => {
  const isSatisfied = subCategory.attachedCredits >= subCategory.requiredCredits;
  const [localCredits, setLocalCredits] = useState(subCategory.requiredCredits);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef(subCategory.requiredCredits);

  // Sync local state when prop changes (e.g., from server refresh)
  useEffect(() => {
    setLocalCredits(subCategory.requiredCredits);
    lastSavedValueRef.current = subCategory.requiredCredits;
  }, [subCategory.requiredCredits]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleCreditsChange = (value: number) => {
    setLocalCredits(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for autosave after 2 seconds
    debounceTimerRef.current = setTimeout(async () => {
      if (value !== lastSavedValueRef.current) {
        console.log('[SubCategoryRow] Autosaving credits:', value, 'for subCategory:', subCategory.id);
        setIsSaving(true);
        try {
          await onUpdateCredits(value);
          console.log('[SubCategoryRow] Credits saved successfully:', value);
          lastSavedValueRef.current = value;
        } catch (error) {
          console.error('[SubCategoryRow] Failed to save credits:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000);
  };
  
  return (
    <TooltipProvider>
      <div className="border rounded-lg bg-muted/30 overflow-hidden">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
          onClick={onToggleExpand}
        >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: subCategory.courseTypeColor || '#6b7280' }}
          />
          <span className="font-medium text-sm">{subCategory.courseTypeName}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={isSatisfied ? 'default' : 'secondary'} 
                className={`text-xs cursor-help ${isSatisfied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
              >
                {localCredits} of {subCategory.attachedCredits} cr
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{localCredits} credits required out of {subCategory.attachedCredits} total available</p>
            </TooltipContent>
          </Tooltip>
          {isSatisfied ? (
            <FaCheck className="w-3 h-3 text-green-500" />
          ) : (
            <FaExclamationTriangle className="w-3 h-3 text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5 bg-background border rounded-md px-2 py-1">
            <Input
              type="number"
              min={0}
              value={localCredits}
              onChange={(e) => {
                e.stopPropagation();
                handleCreditsChange(Math.max(0, parseInt(e.target.value) || 0));
              }}
              onClick={(e) => e.stopPropagation()}
              className={`w-14 h-6 text-sm text-center border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isSaving ? 'text-primary' : ''}`}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">req.</span>
            {isSaving && (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {!isSaving && <FaCheck className="w-3 h-3 text-green-500" />}
          </div>
          {isExpanded ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 pt-0 border-t bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={onAutoAttach} disabled={availableCoursesCount === 0}>
              <FaMagic className="w-3 h-3 mr-1" />
              Auto-attach ({availableCoursesCount})
            </Button>
            <Button size="sm" variant="outline" onClick={onAddCourse}>
              <FaPlus className="w-3 h-3 mr-1" />
              Add Course
            </Button>
          </div>
          
          {subCategory.attachedCourses.length > 0 ? (
            <div className="space-y-1">
              {subCategory.attachedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <div>
                    <span className="font-medium">{course.code}</span>
                    <span className="text-muted-foreground ml-2">{course.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{course.credits} cr</span>
                    <button
                      onClick={() => onDetachCourse(course.courseId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No courses attached</p>
          )}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};


// =============================================================================
// Pool Card Component
// =============================================================================

interface PoolCardProps {
  pool: CurriculumCreditPool;
  onToggleEnabled: (enabled: boolean) => void;
  onDelete: () => void;
  onUpdateSubCategory: (subCatId: string, credits: number) => void;
  onDetachCourse: (subCatId: string, courseId: string) => void;
  onAutoAttach: (subCatId: string) => void;
  onAddCourse: (subCatId: string) => void;
  getAvailableCourses: (courseTypeId: string) => CurriculumCourseLite[];
}

const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  onToggleEnabled,
  onDelete,
  onUpdateSubCategory,
  onDetachCourse,
  onAutoAttach,
  onAddCourse,
  getAvailableCourses,
}) => {
  const [expandedSubCats, setExpandedSubCats] = useState<Set<string>>(new Set());
  
  const toggleSubCat = (id: string) => {
    setExpandedSubCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isComplete = pool.subCategories.every(sc => sc.attachedCredits >= sc.requiredCredits);
  
  // Calculate pool totals
  const totalRequired = pool.subCategories.reduce((sum, sc) => sum + sc.requiredCredits, 0);
  const totalAvailable = pool.subCategories.reduce((sum, sc) => sum + sc.attachedCredits, 0);

  return (
    <Card className={`${!pool.enabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded"
              style={{ backgroundColor: pool.topLevelCourseTypeColor || '#6b7280' }}
            />
            <CardTitle className="text-lg">{pool.name}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-help">
                    {totalRequired} of {totalAvailable} cr
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{totalRequired} credits required out of {totalAvailable} total available in pool</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isComplete ? (
              <Badge className="bg-green-100 text-green-700">
                <FaCheck className="w-3 h-3 mr-1" /> Complete
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700">
                <FaExclamationTriangle className="w-3 h-3 mr-1" /> Needs Attention
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleEnabled(!pool.enabled)}
                    className={`p-2 rounded ${pool.enabled ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {pool.enabled ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{pool.enabled ? 'Disable pool' : 'Enable pool'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-700 rounded">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {pool.subCategories.map((subCat) => {
          const availableCourses = getAvailableCourses(subCat.courseTypeId);
          const attachedIds = new Set(subCat.attachedCourses.map(c => c.courseId));
          const unattachedCourses = availableCourses.filter(c => !attachedIds.has(c.id));
          
          return (
            <SubCategoryRow
              key={subCat.id}
              subCategory={subCat}
              onUpdateCredits={(credits) => onUpdateSubCategory(subCat.id, credits)}
              onDetachCourse={(courseId) => onDetachCourse(subCat.id, courseId)}
              onAutoAttach={() => onAutoAttach(subCat.id)}
              onAddCourse={() => onAddCourse(subCat.id)}
              availableCoursesCount={unattachedCourses.length}
              isExpanded={expandedSubCats.has(subCat.id)}
              onToggleExpand={() => toggleSubCat(subCat.id)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// Create Pool Modal
// =============================================================================

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (topLevelTypeId: string, subCategories: { courseTypeId: string; requiredCredits: number }[]) => void;
  availableTopLevelTypes: CourseTypeLite[];
  courseTypes: CourseTypeLite[];
  usedTypeIds: string[];
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableTopLevelTypes,
  courseTypes,
  usedTypeIds,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [subCatCredits, setSubCatCredits] = useState<Record<string, number>>({});

  const availableTypes = availableTopLevelTypes.filter(t => !usedTypeIds.includes(t.id));
  
  const selectedType = availableTypes.find(t => t.id === selectedTypeId);
  const descendants = selectedTypeId ? getDescendants(selectedTypeId, courseTypes) : [];
  const subCatTypes = descendants.length > 0 ? descendants : (selectedType ? [selectedType] : []);

  const handleSave = () => {
    if (!selectedTypeId) return;
    
    const subCategories = subCatTypes.map(t => ({
      courseTypeId: t.id,
      requiredCredits: subCatCredits[t.id] || 0,
    }));
    
    onSave(selectedTypeId, subCategories);
    setSelectedTypeId('');
    setSubCatCredits({});
    onClose();
  };

  const totalCredits = subCatTypes.reduce((sum, t) => sum + (subCatCredits[t.id] || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Credit Pool</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Top-Level Category</label>
            <select
              value={selectedTypeId}
              onChange={(e) => {
                setSelectedTypeId(e.target.value);
                setSubCatCredits({});
              }}
              className="w-full mt-1 p-2 border rounded-md bg-background"
            >
              <option value="">Choose a category...</option>
              {availableTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTypeId && subCatTypes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Sub-Categories</label>
                <Badge variant="outline">Total: {totalCredits} credits</Badge>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {subCatTypes.map(type => (
                  <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color || '#6b7280' }}
                      />
                      <span className="text-sm">{type.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={subCatCredits[type.id] || 0}
                        onChange={(e) => setSubCatCredits(prev => ({
                          ...prev,
                          [type.id]: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        className="w-20 h-8"
                      />
                      <span className="text-xs text-muted-foreground">credits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedTypeId}>
            Create Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// =============================================================================
// Add Course Modal
// =============================================================================

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (courses: CurriculumCourseLite[]) => void;
  availableCourses: CurriculumCourseLite[];
  subCategoryName: string;
  isLoading?: boolean;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  availableCourses,
  subCategoryName,
  isLoading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleCourse = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const selected = availableCourses.filter(c => selectedIds.has(c.id));
    onAdd(selected);
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Courses to {subCategoryName}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-60 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <FaSync className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading available courses...</span>
            </div>
          ) : availableCourses.length > 0 ? (
            availableCourses.map(course => (
              <div
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                  selectedIds.has(course.id) ? 'bg-primary/10 border-primary' : 'bg-muted/50 hover:bg-muted'
                } border`}
              >
                <div>
                  <span className="font-medium text-sm">{course.code}</span>
                  <span className="text-muted-foreground text-sm ml-2">{course.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{course.credits} cr</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No courses available to attach
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
            Add {selectedIds.size} Course{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Summary Card
// =============================================================================

interface SummaryCardProps {
  pools: CurriculumCreditPool[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ pools }) => {
  const enabledPools = pools.filter(p => p.enabled);
  const totalRequired = enabledPools.reduce((sum, p) => sum + p.totalRequiredCredits, 0);
  const completePools = enabledPools.filter(p => 
    p.subCategories.every(sc => sc.attachedCredits >= sc.requiredCredits)
  ).length;
  const needsAttention = enabledPools.length - completePools;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold">{pools.length}</p>
              <p className="text-xs text-muted-foreground">Total Pools</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRequired}</p>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Badge className="bg-green-100 text-green-700">{completePools} Complete</Badge>
            </div>
            {needsAttention > 0 && (
              <div className="text-center">
                <Badge className="bg-amber-100 text-amber-700">{needsAttention} Needs Attention</Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// Main Component
// =============================================================================

interface CurriculumPoolsTabProps {
  curriculumId: string;
  curriculumName: string;
  courseTypes: CourseTypeLite[];
  courses: CurriculumCourseLite[];
}

export default function CurriculumPoolsTab({
  curriculumId,
  curriculumName,
  courseTypes,
  courses,
}: CurriculumPoolsTabProps) {
  const { showToast } = useToast();
  
  // State
  const [pools, setPools] = useState<CurriculumCreditPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addCourseModal, setAddCourseModal] = useState<{
    isOpen: boolean;
    poolId: string;
    subCatId: string;
    subCatName: string;
    availableCourses: AvailableCourse[];
    isLoadingCourses: boolean;
  }>({ isOpen: false, poolId: '', subCatId: '', subCatName: '', availableCourses: [], isLoadingCourses: false });
  const [availableTopLevelTypes, setAvailableTopLevelTypes] = useState<CourseTypeLite[]>([]);

  // Fetch pools from API
  const loadPools = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      
      const response = await fetchCurriculumCreditPools(curriculumId);
      const transformedPools = (response.pools || []).map(transformApiPoolToFrontend);
      setPools(transformedPools);
    } catch (error) {
      console.error('Failed to fetch pools:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load credit pools',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [curriculumId, showToast]);

  // Initial load
  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Fetch available top-level types for create modal
  const loadAvailableTypes = useCallback(async () => {
    try {
      const response = await fetchAvailableCourseTypes(curriculumId);
      // Transform response to CourseTypeLite format
      const types: CourseTypeLite[] = (response.courseTypes || []).map((t: { id: string; name: string; color?: string; position?: number }) => ({
        id: t.id,
        name: t.name,
        color: t.color || '#6366f1',
        parentId: null,
      }));
      setAvailableTopLevelTypes(types);
    } catch (error) {
      console.error('Failed to fetch available types:', error);
    }
  }, [curriculumId]);

  // Load available types when opening create modal
  useEffect(() => {
    if (isCreateModalOpen) {
      loadAvailableTypes();
    }
  }, [isCreateModalOpen, loadAvailableTypes]);

  // Computed values
  const topLevelTypes = useMemo(() => getTopLevelTypes(courseTypes), [courseTypes]);
  const usedTypeIds = useMemo(() => pools.map(p => p.topLevelCourseTypeId), [pools]);

  // Get courses matching a course type (for UI display)
  const getCoursesForType = useCallback((typeId: string): CurriculumCourseLite[] => {
    return courses.filter(c => c.courseType?.id === typeId);
  }, [courses]);

  // Get all attached course IDs in a pool
  const getPoolAttachedIds = useCallback((pool: CurriculumCreditPool): string[] => {
    return pool.subCategories.flatMap(sc => sc.attachedCourses.map(c => c.courseId));
  }, []);

  // Handlers - Now using API calls
  const handleCreatePool = useCallback(async (
    topLevelTypeId: string,
    subCategories: { courseTypeId: string; requiredCredits: number }[]
  ) => {
    const topLevelType = courseTypes.find(t => t.id === topLevelTypeId);
    if (!topLevelType) return;

    try {
      await createCreditPool(curriculumId, {
        name: topLevelType.name,
        topLevelCourseTypeId: topLevelTypeId,
        enabled: true,
        subCategories,
      });
      
      showToast({
        type: 'success',
        title: 'Success',
        message: `Credit pool "${topLevelType.name}" created successfully`,
      });
      
      // Refresh pools list
      await loadPools(true);
    } catch (error) {
      console.error('Failed to create pool:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create credit pool',
      });
    }
  }, [courseTypes, curriculumId, loadPools, showToast]);

  const handleToggleEnabled = useCallback(async (poolId: string, enabled: boolean) => {
    try {
      await updateCreditPool(curriculumId, Number(poolId), { enabled });
      
      // Optimistically update UI
      setPools(prev => prev.map(p => 
        p.id === poolId ? { ...p, enabled, updatedAt: new Date().toISOString() } : p
      ));
    } catch (error) {
      console.error('Failed to toggle pool:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update pool',
      });
      // Refresh to get correct state
      loadPools(true);
    }
  }, [curriculumId, loadPools, showToast]);

  const handleDeletePool = useCallback(async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool?')) return;
    
    try {
      await deleteCreditPool(curriculumId, Number(poolId));
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Credit pool deleted successfully',
      });
      
      // Remove from local state
      setPools(prev => prev.filter(p => p.id !== poolId));
    } catch (error) {
      console.error('Failed to delete pool:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete credit pool',
      });
    }
  }, [curriculumId, showToast]);

  const handleUpdateSubCategory = useCallback(async (poolId: string, subCatId: string, credits: number) => {
    console.log('[handleUpdateSubCategory] Called with:', { poolId, subCatId, credits, curriculumId });
    try {
      const result = await updateSubCategory(curriculumId, Number(poolId), Number(subCatId), {
        requiredCredits: credits,
      });
      console.log('[handleUpdateSubCategory] API response:', result);
      
      // Optimistically update UI
      setPools(prev => prev.map(p => {
        if (p.id !== poolId) return p;
        const updatedSubCats = p.subCategories.map(sc =>
          sc.id === subCatId ? { ...sc, requiredCredits: credits } : sc
        );
        return {
          ...p,
          subCategories: updatedSubCats,
          totalRequiredCredits: updatedSubCats.reduce((sum, sc) => sum + sc.requiredCredits, 0),
          updatedAt: new Date().toISOString(),
        };
      }));
    } catch (error) {
      console.error('Failed to update sub-category:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update credit requirement',
      });
      loadPools(true);
    }
  }, [curriculumId, loadPools, showToast]);

  const handleDetachCourse = useCallback(async (poolId: string, subCatId: string, courseId: string) => {
    try {
      // Find the attachment ID
      const pool = pools.find(p => p.id === poolId);
      const subCat = pool?.subCategories.find(sc => sc.id === subCatId);
      const attachment = subCat?.attachedCourses.find(c => c.courseId === courseId);
      
      console.log('[handleDetachCourse] Detaching:', { poolId, subCatId, courseId, attachmentId: attachment?.id });
      
      if (!attachment) {
        throw new Error('Attachment not found');
      }
      
      // Use attachment ID for deletion (more reliable)
      await detachCourseByAttachmentId(curriculumId, Number(attachment.id));
      
      // Optimistically update UI
      setPools(prev => prev.map(p => {
        if (p.id !== poolId) return p;
        const updatedSubCats = p.subCategories.map(sc => {
          if (sc.id !== subCatId) return sc;
          const updatedCourses = sc.attachedCourses.filter(c => c.courseId !== courseId);
          return {
            ...sc,
            attachedCourses: updatedCourses,
            attachedCredits: updatedCourses.reduce((sum, c) => sum + c.credits, 0),
          };
        });
        return {
          ...p,
          subCategories: updatedSubCats,
          totalAttachedCredits: updatedSubCats.reduce((sum, sc) => sum + sc.attachedCredits, 0),
          updatedAt: new Date().toISOString(),
        };
      }));
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Course detached successfully',
      });
    } catch (error) {
      console.error('Failed to detach course:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to detach course',
      });
      loadPools(true);
    }
  }, [curriculumId, pools, loadPools, showToast]);

  const handleAutoAttach = useCallback(async (poolId: string, subCatId: string) => {
    try {
      // Fetch available courses for this sub-category from API
      const response = await fetchAvailableCoursesForSubCategory(curriculumId, Number(poolId), Number(subCatId));
      const availableCourses = response.courses || [];
      
      if (availableCourses.length === 0) {
        showToast({
          type: 'info',
          title: 'No courses available',
          message: 'All matching courses are already attached',
        });
        return;
      }
      
      // Attach all available courses
      const courseIds = availableCourses.map((c: AvailableCourse) => c.id);
      await attachCoursesToSubCategory(curriculumId, Number(subCatId), courseIds);
      
      showToast({
        type: 'success',
        title: 'Success',
        message: `Attached ${courseIds.length} course(s) automatically`,
      });
      
      // Refresh pools to get updated state
      await loadPools(true);
    } catch (error) {
      console.error('Failed to auto-attach courses:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to auto-attach courses',
      });
    }
  }, [curriculumId, loadPools, showToast]);

  const handleAddCourses = useCallback(async (coursesToAdd: CurriculumCourseLite[]) => {
    const { subCatId } = addCourseModal;
    
    try {
      const courseIds = coursesToAdd.map(c => c.id);
      await attachCoursesToSubCategory(curriculumId, Number(subCatId), courseIds);
      
      showToast({
        type: 'success',
        title: 'Success',
        message: `Attached ${courseIds.length} course(s) successfully`,
      });
      
      // Close modal and refresh
      setAddCourseModal(prev => ({ ...prev, isOpen: false }));
      await loadPools(true);
    } catch (error) {
      console.error('Failed to attach courses:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to attach courses',
      });
    }
  }, [addCourseModal, curriculumId, loadPools, showToast]);

  const openAddCourseModal = useCallback(async (poolId: string, subCatId: string) => {
    const pool = pools.find(p => p.id === poolId);
    const subCat = pool?.subCategories.find(sc => sc.id === subCatId);
    if (!subCat) return;
    
    // Open modal with loading state
    setAddCourseModal({
      isOpen: true,
      poolId,
      subCatId,
      subCatName: subCat.courseTypeName,
      availableCourses: [],
      isLoadingCourses: true,
    });
    
    try {
      // Fetch available courses from API
      const response = await fetchAvailableCoursesForSubCategory(curriculumId, Number(poolId), Number(subCatId));
      setAddCourseModal(prev => ({
        ...prev,
        availableCourses: response.courses || [],
        isLoadingCourses: false,
      }));
    } catch (error) {
      console.error('Failed to fetch available courses:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load available courses',
      });
      setAddCourseModal(prev => ({ ...prev, isLoadingCourses: false }));
    }
  }, [pools, curriculumId, showToast]);

  // Transform available courses to CurriculumCourseLite for modal
  const getAvailableCoursesForModal = useCallback((): CurriculumCourseLite[] => {
    return addCourseModal.availableCourses.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      credits: c.credits,
      courseType: null,
    }));
  }, [addCourseModal.availableCourses]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading credit pools...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaLayerGroup className="text-primary" />
            Credit Pools
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage credit requirements based on course categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadPools(true)}
            disabled={isRefreshing}
          >
            <FaSync className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} disabled={availableTopLevelTypes.length === 0 && topLevelTypes.length === usedTypeIds.length}>
            <FaPlus className="w-4 h-4 mr-2" />
            Add Pool
          </Button>
        </div>
      </div>

      {/* Summary */}
      {pools.length > 0 && <SummaryCard pools={pools} />}

      {/* Pool List */}
      {pools.length > 0 ? (
        <div className="space-y-4">
          {pools.map(pool => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onToggleEnabled={(enabled) => handleToggleEnabled(pool.id, enabled)}
              onDelete={() => handleDeletePool(pool.id)}
              onUpdateSubCategory={(subCatId, credits) => handleUpdateSubCategory(pool.id, subCatId, credits)}
              onDetachCourse={(subCatId, courseId) => handleDetachCourse(pool.id, subCatId, courseId)}
              onAutoAttach={(subCatId) => handleAutoAttach(pool.id, subCatId)}
              onAddCourse={(subCatId) => openAddCourseModal(pool.id, subCatId)}
              getAvailableCourses={getCoursesForType}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <FaLayerGroup className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Credit Pools</h3>
          <p className="text-muted-foreground mb-4">
            Create credit pools to define requirements based on course categories
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FaPlus className="w-4 h-4 mr-2" />
            Create First Pool
          </Button>
        </Card>
      )}

      {/* Modals */}
      <CreatePoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePool}
        availableTopLevelTypes={availableTopLevelTypes.length > 0 ? availableTopLevelTypes : topLevelTypes}
        courseTypes={courseTypes}
        usedTypeIds={usedTypeIds}
      />

      <AddCourseModal
        isOpen={addCourseModal.isOpen}
        onClose={() => setAddCourseModal(prev => ({ ...prev, isOpen: false }))}
        onAdd={handleAddCourses}
        availableCourses={getAvailableCoursesForModal()}
        subCategoryName={addCourseModal.subCatName}
        isLoading={addCourseModal.isLoadingCourses}
      />
    </div>
  );
}
