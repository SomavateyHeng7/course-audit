'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import type {
  CurriculumCreditPool,
  SubCategoryPool,
  AttachedPoolCourse,
  CourseTypeLite,
  CurriculumCourseLite,
  CourseTypeTreeNode,
} from '@/types/creditPool';

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
// Mock Data for Demo
// =============================================================================

const generateMockPools = (
  courseTypes: CourseTypeLite[],
  courses: CurriculumCourseLite[]
): CurriculumCreditPool[] => {
  // If we have course types, use them to generate realistic mock data
  const topLevelTypes = getTopLevelTypes(courseTypes);
  
  // Always generate at least 2 demo pools for demonstration
  const mockPools: CurriculumCreditPool[] = [];
  
  if (topLevelTypes.length > 0) {
    // Create pools from actual course types
    topLevelTypes.slice(0, 2).forEach((topLevel, poolIdx) => {
      const descendants = getDescendants(topLevel.id, courseTypes);
      const subCatTypes = descendants.length > 0 ? descendants : [topLevel];

      const subCategories: SubCategoryPool[] = subCatTypes.slice(0, 4).map((type, idx) => {
        const matchingCourses = courses.filter(c => c.courseType?.id === type.id);
        const attachedCourses: AttachedPoolCourse[] = matchingCourses.slice(0, 3).map(c => ({
          id: `attached-${c.id}`,
          courseId: c.id,
          code: c.code || 'N/A',
          name: c.name || 'Unknown Course',
          credits: c.credits,
          attachedAt: new Date().toISOString(),
        }));

        const requiredCredits = poolIdx === 0 ? [12, 9, 6, 3][idx] || 6 : [15, 12, 9, 6][idx] || 9;

        return {
          id: `subcat-${poolIdx}-${idx}`,
          poolId: `pool-${poolIdx + 1}`,
          courseTypeId: type.id,
          courseTypeName: type.name,
          courseTypeColor: type.color,
          requiredCredits,
          attachedCourses,
          attachedCredits: attachedCourses.reduce((sum, c) => sum + c.credits, 0),
        };
      });

      mockPools.push({
        id: `pool-${poolIdx + 1}`,
        curriculumId: 'curr-1',
        name: topLevel.name,
        topLevelCourseTypeId: topLevel.id,
        topLevelCourseTypeColor: topLevel.color,
        enabled: true,
        subCategories,
        totalRequiredCredits: subCategories.reduce((sum, sc) => sum + sc.requiredCredits, 0),
        totalAttachedCredits: subCategories.reduce((sum, sc) => sum + sc.attachedCredits, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  } else {
    // Fallback: Create demo pools with placeholder data
    const demoCategories = [
      { id: 'demo-major', name: 'Major Courses', color: '#22c55e' },
      { id: 'demo-ge', name: 'General Education', color: '#6366f1' },
    ];

    demoCategories.forEach((category, poolIdx) => {
      const subCatNames = poolIdx === 0 
        ? ['Core Requirements', 'Major Electives', 'Capstone']
        : ['Humanities', 'Social Sciences', 'Natural Sciences'];
      
      const subCatColors = poolIdx === 0
        ? ['#16a34a', '#4ade80', '#86efac']
        : ['#818cf8', '#a5b4fc', '#c7d2fe'];

      const subCategories: SubCategoryPool[] = subCatNames.map((name, idx) => ({
        id: `subcat-${poolIdx}-${idx}`,
        poolId: `pool-${poolIdx + 1}`,
        courseTypeId: `demo-subcat-${poolIdx}-${idx}`,
        courseTypeName: name,
        courseTypeColor: subCatColors[idx],
        requiredCredits: [12, 9, 6][idx] || 6,
        attachedCourses: idx === 0 ? [
          {
            id: `attached-demo-${poolIdx}-${idx}-1`,
            courseId: `course-demo-${poolIdx}-${idx}-1`,
            code: poolIdx === 0 ? 'CS 101' : 'GE 101',
            name: poolIdx === 0 ? 'Introduction to Programming' : 'Critical Thinking',
            credits: 3,
            attachedAt: new Date().toISOString(),
          },
          {
            id: `attached-demo-${poolIdx}-${idx}-2`,
            courseId: `course-demo-${poolIdx}-${idx}-2`,
            code: poolIdx === 0 ? 'CS 102' : 'GE 102',
            name: poolIdx === 0 ? 'Data Structures' : 'Ethics and Society',
            credits: 3,
            attachedAt: new Date().toISOString(),
          },
        ] : [],
        attachedCredits: idx === 0 ? 6 : 0,
      }));

      mockPools.push({
        id: `pool-${poolIdx + 1}`,
        curriculumId: 'curr-1',
        name: category.name,
        topLevelCourseTypeId: category.id,
        topLevelCourseTypeColor: category.color,
        enabled: poolIdx === 0, // First pool enabled, second disabled for demo
        subCategories,
        totalRequiredCredits: subCategories.reduce((sum, sc) => sum + sc.requiredCredits, 0),
        totalAttachedCredits: subCategories.reduce((sum, sc) => sum + sc.attachedCredits, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return mockPools;
};

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
  
  return (
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
          <Badge variant={isSatisfied ? 'default' : 'secondary'} className="text-xs">
            {subCategory.attachedCredits}/{subCategory.requiredCredits} cr
          </Badge>
          {isSatisfied ? (
            <FaCheck className="w-3 h-3 text-green-500" />
          ) : (
            <FaExclamationTriangle className="w-3 h-3 text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={subCategory.requiredCredits}
            onChange={(e) => {
              e.stopPropagation();
              onUpdateCredits(Math.max(0, parseInt(e.target.value) || 0));
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-20 h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground">req.</span>
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
            <Badge variant="outline">
              Total: {pool.totalRequiredCredits} credits
            </Badge>
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
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  availableCourses,
  subCategoryName,
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
          {availableCourses.length > 0 ? (
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
  // State
  const [pools, setPools] = useState<CurriculumCreditPool[]>(() => 
    generateMockPools(courseTypes, courses)
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addCourseModal, setAddCourseModal] = useState<{
    isOpen: boolean;
    poolId: string;
    subCatId: string;
    subCatName: string;
  }>({ isOpen: false, poolId: '', subCatId: '', subCatName: '' });

  // Computed values
  const topLevelTypes = useMemo(() => getTopLevelTypes(courseTypes), [courseTypes]);
  const usedTypeIds = useMemo(() => pools.map(p => p.topLevelCourseTypeId), [pools]);

  // Get courses matching a course type
  const getCoursesForType = useCallback((typeId: string): CurriculumCourseLite[] => {
    return courses.filter(c => c.courseType?.id === typeId);
  }, [courses]);

  // Get all attached course IDs in a pool
  const getPoolAttachedIds = useCallback((pool: CurriculumCreditPool): string[] => {
    return pool.subCategories.flatMap(sc => sc.attachedCourses.map(c => c.courseId));
  }, []);

  // Handlers
  const handleCreatePool = useCallback((
    topLevelTypeId: string,
    subCategories: { courseTypeId: string; requiredCredits: number }[]
  ) => {
    const topLevelType = courseTypes.find(t => t.id === topLevelTypeId);
    if (!topLevelType) return;

    const newPool: CurriculumCreditPool = {
      id: `pool-${Date.now()}`,
      curriculumId,
      name: topLevelType.name,
      topLevelCourseTypeId: topLevelTypeId,
      topLevelCourseTypeColor: topLevelType.color,
      enabled: true,
      subCategories: subCategories.map((sc, idx) => {
        const type = courseTypes.find(t => t.id === sc.courseTypeId);
        return {
          id: `subcat-${Date.now()}-${idx}`,
          poolId: `pool-${Date.now()}`,
          courseTypeId: sc.courseTypeId,
          courseTypeName: type?.name || 'Unknown',
          courseTypeColor: type?.color,
          requiredCredits: sc.requiredCredits,
          attachedCourses: [],
          attachedCredits: 0,
        };
      }),
      totalRequiredCredits: subCategories.reduce((sum, sc) => sum + sc.requiredCredits, 0),
      totalAttachedCredits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPools(prev => [...prev, newPool]);
  }, [courseTypes, curriculumId]);

  const handleToggleEnabled = useCallback((poolId: string, enabled: boolean) => {
    setPools(prev => prev.map(p => 
      p.id === poolId ? { ...p, enabled, updatedAt: new Date().toISOString() } : p
    ));
  }, []);

  const handleDeletePool = useCallback((poolId: string) => {
    if (confirm('Are you sure you want to delete this pool?')) {
      setPools(prev => prev.filter(p => p.id !== poolId));
    }
  }, []);

  const handleUpdateSubCategory = useCallback((poolId: string, subCatId: string, credits: number) => {
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
  }, []);

  const handleDetachCourse = useCallback((poolId: string, subCatId: string, courseId: string) => {
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
  }, []);

  const handleAutoAttach = useCallback((poolId: string, subCatId: string) => {
    setPools(prev => prev.map(p => {
      if (p.id !== poolId) return p;
      
      const poolAttachedIds = new Set(getPoolAttachedIds(p));
      
      const updatedSubCats = p.subCategories.map(sc => {
        if (sc.id !== subCatId) return sc;
        
        const availableCourses = getCoursesForType(sc.courseTypeId)
          .filter(c => !poolAttachedIds.has(c.id));
        
        const newAttached: AttachedPoolCourse[] = availableCourses.map(c => ({
          id: `attached-${c.id}`,
          courseId: c.id,
          code: c.code || 'N/A',
          name: c.name || 'Unknown',
          credits: c.credits,
          attachedAt: new Date().toISOString(),
        }));
        
        const allAttached = [...sc.attachedCourses, ...newAttached];
        return {
          ...sc,
          attachedCourses: allAttached,
          attachedCredits: allAttached.reduce((sum, c) => sum + c.credits, 0),
        };
      });
      
      return {
        ...p,
        subCategories: updatedSubCats,
        totalAttachedCredits: updatedSubCats.reduce((sum, sc) => sum + sc.attachedCredits, 0),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [getCoursesForType, getPoolAttachedIds]);

  const handleAddCourses = useCallback((coursesToAdd: CurriculumCourseLite[]) => {
    const { poolId, subCatId } = addCourseModal;
    
    setPools(prev => prev.map(p => {
      if (p.id !== poolId) return p;
      
      const updatedSubCats = p.subCategories.map(sc => {
        if (sc.id !== subCatId) return sc;
        
        const newAttached: AttachedPoolCourse[] = coursesToAdd.map(c => ({
          id: `attached-${c.id}`,
          courseId: c.id,
          code: c.code || 'N/A',
          name: c.name || 'Unknown',
          credits: c.credits,
          attachedAt: new Date().toISOString(),
        }));
        
        const allAttached = [...sc.attachedCourses, ...newAttached];
        return {
          ...sc,
          attachedCourses: allAttached,
          attachedCredits: allAttached.reduce((sum, c) => sum + c.credits, 0),
        };
      });
      
      return {
        ...p,
        subCategories: updatedSubCats,
        totalAttachedCredits: updatedSubCats.reduce((sum, sc) => sum + sc.attachedCredits, 0),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [addCourseModal]);

  const openAddCourseModal = useCallback((poolId: string, subCatId: string) => {
    const pool = pools.find(p => p.id === poolId);
    const subCat = pool?.subCategories.find(sc => sc.id === subCatId);
    if (subCat) {
      setAddCourseModal({
        isOpen: true,
        poolId,
        subCatId,
        subCatName: subCat.courseTypeName,
      });
    }
  }, [pools]);

  // Get available courses for add modal
  const getAvailableCoursesForModal = useCallback(() => {
    const { poolId, subCatId } = addCourseModal;
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return [];
    
    const subCat = pool.subCategories.find(sc => sc.id === subCatId);
    if (!subCat) return [];
    
    const poolAttachedIds = new Set(getPoolAttachedIds(pool));
    return getCoursesForType(subCat.courseTypeId).filter(c => !poolAttachedIds.has(c.id));
  }, [addCourseModal, pools, getCoursesForType, getPoolAttachedIds]);

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
        <Button onClick={() => setIsCreateModalOpen(true)} disabled={topLevelTypes.length === usedTypeIds.length}>
          <FaPlus className="w-4 h-4 mr-2" />
          Add Pool
        </Button>
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
        availableTopLevelTypes={topLevelTypes}
        courseTypes={courseTypes}
        usedTypeIds={usedTypeIds}
      />

      <AddCourseModal
        isOpen={addCourseModal.isOpen}
        onClose={() => setAddCourseModal(prev => ({ ...prev, isOpen: false }))}
        onAdd={handleAddCourses}
        availableCourses={getAvailableCoursesForModal()}
        subCategoryName={addCourseModal.subCatName}
      />
    </div>
  );
}
