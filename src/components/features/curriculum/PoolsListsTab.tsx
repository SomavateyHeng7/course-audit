'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FaLayerGroup,
  FaSitemap,
  FaClipboardList,
  FaPlus,
  FaLink,
  FaExclamationTriangle,
  FaInfoCircle,
  FaFlask,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import CurriculumPoolAttachment from './CurriculumPoolAttachment';
import PoolCreditPreview from './PoolCreditPreview';
import AttachPoolModal from './AttachPoolModal';
import { calculatePoolCredits, detectPoolOverlaps } from '@/lib/utils/creditPoolCalculation';
import {
  getMockCreditPools,
  getMockPoolLists,
  getMockCurriculumAttachments,
  mockCreditPoolStore,
} from '@/lib/mockData/creditPoolMocks';
import type {
  CreditPool,
  PoolList,
  CurriculumPoolAttachment as CurriculumPoolAttachmentType,
  CurriculumPoolAttachmentWithCredits,
  PoolCreditConfig,
  CourseTypeLite,
  CurriculumCourseLite,
} from '@/types/creditPool';


// =============================================================================
// Types
// =============================================================================

interface CourseTypeNode extends CourseTypeLite {
  children: CourseTypeNode[];
}

interface PoolsListsTabProps {
  curriculumId: string;
  curriculumName?: string;
  departmentId?: string;
  courseTypes: CourseTypeLite[];
  courses: CurriculumCourseLite[];
  isLoadingCourseTypes?: boolean;
  // Optional props for external state management (when not using mock data)
  availablePools?: CreditPool[];
  attachedPools?: CurriculumPoolAttachmentType[];
  poolLists?: PoolList[];
  onAttachPool?: (poolId: string, credits: PoolCreditConfig) => void;
  onDetachPool?: (attachmentId: string) => void;
  onUpdateAttachment?: (attachment: CurriculumPoolAttachmentType) => void;
  onReorderAttachments?: (orderedIds: string[]) => void;
  isDemoMode?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

const normalizeParentId = (type: CourseTypeLite) =>
  type.parentId ?? type.parent_id ?? type.parentCourseTypeId ?? null;

const buildTree = (types: CourseTypeLite[]): CourseTypeNode[] => {
  const nodeMap = new Map<string, CourseTypeNode>();
  const roots: CourseTypeNode[] = [];

  types.forEach((type) => {
    nodeMap.set(type.id, {
      ...type,
      parentId: normalizeParentId(type),
      children: [],
    });
  });

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list: CourseTypeNode[]): CourseTypeNode[] =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({ ...node, children: sortNodes(node.children) }));

  return sortNodes(roots);
};


// =============================================================================
// Tree Node Component
// =============================================================================

const TreeNodeList = ({ nodes, depth = 0 }: { nodes: CourseTypeNode[]; depth?: number }) => {
  if (!nodes.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-gray-900/40 px-3 py-2"
            style={{ marginLeft: depth * 16 }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: node.color || '#6b7280' }}
              ></span>
              <span className="text-sm font-semibold text-foreground">{node.name}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {node.usageCount ?? node.usage_count ?? 0} courses
            </span>
          </div>
          {node.children.length > 0 && <TreeNodeList nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
};


// =============================================================================
// Available Pool Card Component (for attaching)
// =============================================================================

interface AvailablePoolCardProps {
  pool: CreditPool;
  onAttach: (pool: CreditPool) => void;
  hasOverlap?: boolean;
  overlappingPoolNames?: string[];
}

const AvailablePoolCard = ({
  pool,
  onAttach,
  hasOverlap = false,
  overlappingPoolNames = [],
}: AvailablePoolCardProps) => {
  const sourceCount = pool.sources?.length ?? 0;
  const creditRangeDisplay =
    pool.maxCredits !== null
      ? `${pool.minCredits}–${pool.maxCredits}`
      : `${pool.minCredits}+`;

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FaLayerGroup className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{pool.name}</h4>
              {hasOverlap && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FaExclamationTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Overlaps with: {overlappingPoolNames.join(', ')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {pool.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {pool.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Badge variant="outline" className="text-xs">
                {creditRangeDisplay} cr
              </Badge>
              <span>{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8"
            onClick={() => onAttach(pool)}
          >
            <FaLink className="h-3 w-3 mr-1.5" />
            Attach
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};


// =============================================================================
// Demo Mode Banner Component
// =============================================================================

const DemoModeBanner = () => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3">
    <div className="flex items-center gap-2">
      <FaFlask className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Demo Mode Active
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Using mock data for demonstration. Changes will not persist after page refresh.
        </p>
      </div>
    </div>
  </div>
);

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
}

const CollapsibleSection = ({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  badge,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
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
        </div>
        {isOpen ? (
          <FaChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <FaChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </section>
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
  availablePools: externalAvailablePools,
  attachedPools: externalAttachedPools,
  poolLists: externalPoolLists,
  onAttachPool: externalOnAttachPool,
  onDetachPool: externalOnDetachPool,
  onUpdateAttachment: externalOnUpdateAttachment,
  onReorderAttachments: externalOnReorderAttachments,
  isDemoMode: externalIsDemoMode,
}: PoolsListsTabProps) {
  // ==========================================================================
  // State Management
  // ==========================================================================
  
  // Determine if we're using mock data (demo mode)
  const useMockData = externalAvailablePools === undefined;
  const isDemoMode = externalIsDemoMode ?? useMockData;

  // Local state for mock data mode
  const [localPools, setLocalPools] = useState<CreditPool[]>([]);
  const [localPoolLists, setLocalPoolLists] = useState<PoolList[]>([]);
  const [localAttachments, setLocalAttachments] = useState<CurriculumPoolAttachmentType[]>([]);
  
  // Modal state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedPoolForAttach, setSelectedPoolForAttach] = useState<string | null>(null);
  
  // Drag state
  const [draggedAttachmentId, setDraggedAttachmentId] = useState<string | null>(null);

  // Initialize mock data on mount
  useEffect(() => {
    if (useMockData) {
      setLocalPools(getMockCreditPools(departmentId));
      setLocalPoolLists(getMockPoolLists(departmentId));
      setLocalAttachments(getMockCurriculumAttachments(curriculumId));
    }
  }, [useMockData, departmentId, curriculumId]);

  // Use external or local data
  const allPools = externalAvailablePools ?? localPools;
  const poolLists = externalPoolLists ?? localPoolLists;
  const attachments = externalAttachedPools ?? localAttachments;


  // ==========================================================================
  // Computed Values
  // ==========================================================================

  // Build course type tree for display
  const courseTypeTree = useMemo(() => buildTree(courseTypes), [courseTypes]);

  // Sort attachments by orderIndex
  const sortedAttachments = useMemo(
    () => [...attachments].sort((a, b) => a.orderIndex - b.orderIndex),
    [attachments]
  );

  // Resolve pool data for attachments
  const attachmentsWithPools = useMemo(() => {
    return sortedAttachments.map((attachment) => ({
      ...attachment,
      pool: attachment.pool ?? allPools.find((p) => p.id === attachment.creditPoolId),
    }));
  }, [sortedAttachments, allPools]);

  // Calculate credits for each attached pool
  const creditCalculations = useMemo(() => {
    // Ensure courses have IDs for calculation
    const coursesWithIds = courses.map((c, idx) => ({
      ...c,
      id: (c as CurriculumCourseLite & { id?: string }).id ?? `course-${idx}`,
    }));
    return calculatePoolCredits(attachmentsWithPools, coursesWithIds, courseTypes, poolLists);
  }, [attachmentsWithPools, courses, courseTypes, poolLists]);

  // Build attachments with credit data for preview
  const attachmentsWithCredits: CurriculumPoolAttachmentWithCredits[] = useMemo(() => {
    return attachmentsWithPools.map((attachment) => {
      const calc = creditCalculations.find((c) => c.poolId === attachment.creditPoolId);
      return {
        ...attachment,
        appliedCredits: calc?.appliedCredits ?? 0,
        remainingCredits: calc?.remainingCredits ?? 0,
        overflowCredits: calc?.overflowCredits ?? 0,
        isSatisfied: calc?.isSatisfied ?? false,
        matchedCourses: calc?.matchedCourses ?? [],
      };
    });
  }, [attachmentsWithPools, creditCalculations]);

  // Calculate total curriculum credits
  const totalCurriculumCredits = useMemo(
    () => courses.reduce((sum, c) => sum + (c.credits || 0), 0),
    [courses]
  );

  // Calculate free elective overflow
  const freeElectiveOverflow = useMemo(
    () => creditCalculations.reduce((sum, c) => sum + c.overflowCredits, 0),
    [creditCalculations]
  );

  // Detect overlapping pools
  const poolOverlaps = useMemo(
    () => detectPoolOverlaps(attachmentsWithPools),
    [attachmentsWithPools]
  );

  // Get available pools (not yet attached)
  const availablePoolsToAttach = useMemo(() => {
    const attachedPoolIds = new Set(attachments.map((a) => a.creditPoolId));
    return allPools.filter((p) => !attachedPoolIds.has(p.id));
  }, [allPools, attachments]);


  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  // Handle attaching a pool
  const handleAttachPool = useCallback(
    (poolId: string, credits: PoolCreditConfig) => {
      if (externalOnAttachPool) {
        externalOnAttachPool(poolId, credits);
      } else if (useMockData) {
        const newAttachment = mockCreditPoolStore.attachPoolToCurriculum(
          curriculumId,
          poolId,
          credits
        );
        if (newAttachment) {
          setLocalAttachments((prev) => [...prev, newAttachment]);
        }
      }
      setIsAttachModalOpen(false);
      setSelectedPoolForAttach(null);
    },
    [externalOnAttachPool, useMockData, curriculumId]
  );

  // Handle detaching a pool
  const handleDetachPool = useCallback(
    (attachmentId: string) => {
      if (externalOnDetachPool) {
        externalOnDetachPool(attachmentId);
      } else if (useMockData) {
        mockCreditPoolStore.detachPoolFromCurriculum(attachmentId);
        setLocalAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      }
    },
    [externalOnDetachPool, useMockData]
  );

  // Handle updating an attachment
  const handleUpdateAttachment = useCallback(
    (attachment: CurriculumPoolAttachmentType) => {
      if (externalOnUpdateAttachment) {
        externalOnUpdateAttachment(attachment);
      } else if (useMockData) {
        mockCreditPoolStore.updateCurriculumAttachment(attachment.id, {
          requiredCredits: attachment.requiredCredits,
          maxCredits: attachment.maxCredits,
        });
        setLocalAttachments((prev) =>
          prev.map((a) => (a.id === attachment.id ? attachment : a))
        );
      }
    },
    [externalOnUpdateAttachment, useMockData]
  );

  // Handle reordering attachments via drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, attachmentId: string) => {
    setDraggedAttachmentId(attachmentId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetAttachmentId: string) => {
      e.preventDefault();
      if (!draggedAttachmentId || draggedAttachmentId === targetAttachmentId) {
        setDraggedAttachmentId(null);
        return;
      }

      // Calculate new order
      const currentOrder = sortedAttachments.map((a) => a.id);
      const draggedIndex = currentOrder.indexOf(draggedAttachmentId);
      const targetIndex = currentOrder.indexOf(targetAttachmentId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedAttachmentId(null);
        return;
      }

      // Remove dragged item and insert at target position
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedAttachmentId);

      if (externalOnReorderAttachments) {
        externalOnReorderAttachments(newOrder);
      } else if (useMockData) {
        mockCreditPoolStore.reorderCurriculumAttachments(curriculumId, newOrder);
        // Update local state with new order indices
        setLocalAttachments((prev) =>
          prev.map((a) => ({
            ...a,
            orderIndex: newOrder.indexOf(a.id),
          }))
        );
      }

      setDraggedAttachmentId(null);
    },
    [draggedAttachmentId, sortedAttachments, externalOnReorderAttachments, useMockData, curriculumId]
  );

  // Open attach modal for a specific pool
  const openAttachModal = useCallback((pool?: CreditPool) => {
    setSelectedPoolForAttach(pool?.id ?? null);
    setIsAttachModalOpen(true);
  }, []);


  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Demo Mode Banner */}
        {isDemoMode && <DemoModeBanner />}

        {/* Info Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <FaLayerGroup className="mt-1 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Credit Pools for {curriculumName || 'this curriculum'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Attach credit pools to define how courses are grouped and counted toward graduation requirements.
              </p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                Curriculum ID: {curriculumId} • Department: {departmentId || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Attached Pools & Available Pools */}
          <div className="xl:col-span-2 space-y-6">
            {/* Attached Pools Section */}
            <CollapsibleSection
              title="Attached Pools"
              subtitle="Pools attached to this curriculum with credit requirements"
              icon={<FaLayerGroup className="h-4 w-4" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {attachments.length} pool{attachments.length !== 1 ? 's' : ''}
                </Badge>
              }
            >
              {attachmentsWithCredits.length > 0 ? (
                <div className="space-y-3">
                  {attachmentsWithCredits.map((attachment, index) => {
                    const hasOverlap = poolOverlaps.has(attachment.creditPoolId);
                    return (
                      <div key={attachment.id} className="relative">
                        {hasOverlap && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="absolute -left-2 top-4 z-10">
                                <FaExclamationTriangle className="h-4 w-4 text-amber-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                This pool has overlapping sources with other attached pools.
                                Courses will be assigned to the pool with higher priority (lower position).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <CurriculumPoolAttachment
                          pool={attachment.pool!}
                          attachment={attachment}
                          appliedCredits={attachment.appliedCredits}
                          overflowCredits={attachment.overflowCredits}
                          onUpdate={handleUpdateAttachment}
                          onDetach={handleDetachPool}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          isDragging={draggedAttachmentId === attachment.id}
                          showDragHandle={true}
                          position={index + 1}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-8 text-center">
                  <FaLayerGroup className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pools attached to this curriculum yet.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Attach pools from the available pools section below.
                  </p>
                </div>
              )}
            </CollapsibleSection>


            {/* Available Pools Section */}
            <CollapsibleSection
              title="Available Pools"
              subtitle="Department pools available to attach to this curriculum"
              icon={<FaClipboardList className="h-4 w-4" />}
              badge={
                <Badge variant="outline" className="text-xs">
                  {availablePoolsToAttach.length} available
                </Badge>
              }
              defaultOpen={attachments.length === 0}
            >
              {availablePoolsToAttach.length > 0 ? (
                <div className="space-y-2">
                  {availablePoolsToAttach.map((pool) => (
                    <AvailablePoolCard
                      key={pool.id}
                      pool={pool}
                      onAttach={() => openAttachModal(pool)}
                    />
                  ))}
                </div>
              ) : allPools.length > 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-6 text-center">
                  <FaInfoCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    All available pools have been attached.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-6 text-center">
                  <FaLayerGroup className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pools available in this department.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Create pools in the Config page first.
                  </p>
                </div>
              )}
              
              {/* Add Pool Button */}
              {availablePoolsToAttach.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAttachModal()}
                    className="w-full"
                  >
                    <FaPlus className="h-3 w-3 mr-2" />
                    Attach Another Pool
                  </Button>
                </div>
              )}
            </CollapsibleSection>

            {/* Course Type Hierarchy Section */}
            <CollapsibleSection
              title="Course Type Hierarchy"
              subtitle="Course types that pools can target as sources"
              icon={<FaSitemap className="h-4 w-4" />}
              defaultOpen={false}
            >
              {isLoadingCourseTypes ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
                  Loading course types...
                </div>
              ) : courseTypeTree.length ? (
                <TreeNodeList nodes={courseTypeTree} />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No course types defined. Create course types in the Config page to enable pool targeting.
                </div>
              )}
            </CollapsibleSection>
          </div>


          {/* Right Column: Credit Preview */}
          <div className="xl:col-span-1">
            <div className="sticky top-4">
              <PoolCreditPreview
                attachments={attachmentsWithCredits}
                totalCurriculumCredits={totalCurriculumCredits}
                freeElectiveOverflow={freeElectiveOverflow}
              />
            </div>
          </div>
        </div>

        {/* Attach Pool Modal */}
        <AttachPoolModal
          isOpen={isAttachModalOpen}
          onClose={() => {
            setIsAttachModalOpen(false);
            setSelectedPoolForAttach(null);
          }}
          onAttach={handleAttachPool}
          availablePools={availablePoolsToAttach}
          selectedPoolId={selectedPoolForAttach}
        />
      </div>
    </TooltipProvider>
  );
}
