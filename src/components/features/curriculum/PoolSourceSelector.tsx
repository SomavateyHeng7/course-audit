'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  FaChevronRight, 
  FaChevronDown, 
  FaSearch, 
  FaList, 
  FaSitemap,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaTimesCircle,
  FaExpandAlt,
  FaCompressAlt
} from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { 
  PoolSourceSelectorProps, 
  CourseTypeTreeNode, 
  PoolList, 
  PoolSource,
  CourseTypeLite
} from '@/types/creditPool';
import { 
  buildBreadcrumbPath, 
  formatBreadcrumbPath,
  getDescendantIds 
} from '@/lib/utils/courseTypeHierarchy';

/**
 * PoolSourceSelector Component
 * 
 * Renders course type hierarchy as an indented tree with expand/collapse controls.
 * Shows color badges and usage counts per node.
 * Supports multi-selection of course types and pool lists.
 * Shows breadcrumb paths for selected nodes.
 * 
 * Requirements: 1.2, 6.1, 6.2, 6.3, 6.5
 */
export default function PoolSourceSelector({
  courseTypes,
  poolLists,
  selectedSources,
  onSourcesChange
}: PoolSourceSelectorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'courseTypes' | 'poolLists'>('courseTypes');

  // Flatten course types for hierarchy utilities
  const flatCourseTypes: CourseTypeLite[] = useMemo(() => {
    const flatten = (nodes: CourseTypeTreeNode[]): CourseTypeLite[] => {
      const result: CourseTypeLite[] = [];
      for (const node of nodes) {
        result.push({
          id: node.id,
          name: node.name,
          color: node.color,
          parentId: node.parentId,
          parent_id: node.parent_id,
          parentCourseTypeId: node.parentCourseTypeId,
          usageCount: node.usageCount,
          usage_count: node.usage_count,
          childCount: node.childCount,
          child_count: node.child_count,
        });
        if (node.children?.length) {
          result.push(...flatten(node.children));
        }
      }
      return result;
    };
    return flatten(courseTypes);
  }, [courseTypes]);

  // Get all node IDs for expand/collapse all functionality
  const allNodeIds = useMemo(() => {
    const collectIds = (nodes: CourseTypeTreeNode[]): string[] => {
      const ids: string[] = [];
      for (const node of nodes) {
        if (node.children?.length) {
          ids.push(node.id);
          ids.push(...collectIds(node.children));
        }
      }
      return ids;
    };
    return collectIds(courseTypes);
  }, [courseTypes]);

  // Get selected course type IDs
  const selectedCourseTypeIds = useMemo(() => {
    return new Set(
      selectedSources
        .filter(s => s.sourceType === 'COURSE_TYPE' && s.courseTypeId)
        .map(s => s.courseTypeId!)
    );
  }, [selectedSources]);

  // Get selected pool list IDs
  const selectedPoolListIds = useMemo(() => {
    return new Set(
      selectedSources
        .filter(s => s.sourceType === 'COURSE_LIST' && s.courseListId)
        .map(s => s.courseListId!)
    );
  }, [selectedSources]);

  // Get implicitly included course type IDs (descendants of selected parents)
  const implicitlyIncludedIds = useMemo(() => {
    const implicit = new Set<string>();
    for (const typeId of selectedCourseTypeIds) {
      const descendants = getDescendantIds(typeId, flatCourseTypes);
      descendants.forEach(id => implicit.add(id));
    }
    return implicit;
  }, [selectedCourseTypeIds, flatCourseTypes]);

  // Get count of implicitly included children for each selected parent
  const implicitChildCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const typeId of selectedCourseTypeIds) {
      const descendants = getDescendantIds(typeId, flatCourseTypes);
      counts.set(typeId, descendants.length);
    }
    return counts;
  }, [selectedCourseTypeIds, flatCourseTypes]);

  // Get matching node IDs for search highlighting
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase();
    return new Set(
      flatCourseTypes
        .filter(t => t.name.toLowerCase().includes(query))
        .map(t => t.id)
    );
  }, [searchQuery, flatCourseTypes]);

  // Get parent IDs of matching nodes (to auto-expand)
  const parentsOfMatchingNodes = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const parents = new Set<string>();
    
    const findParents = (nodes: CourseTypeTreeNode[], parentIds: string[] = []): void => {
      for (const node of nodes) {
        const currentPath = [...parentIds, node.id];
        if (matchingNodeIds.has(node.id)) {
          // Add all parents to the set
          parentIds.forEach(id => parents.add(id));
        }
        if (node.children?.length) {
          findParents(node.children, currentPath);
        }
      }
    };
    
    findParents(courseTypes);
    return parents;
  }, [courseTypes, matchingNodeIds, searchQuery]);

  // Auto-expand parents of matching nodes when searching
  useEffect(() => {
    if (searchQuery.trim() && parentsOfMatchingNodes.size > 0) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        parentsOfMatchingNodes.forEach(id => next.add(id));
        return next;
      });
    }
  }, [parentsOfMatchingNodes, searchQuery]);

  // Filter course types based on search query
  const filteredCourseTypes = useMemo(() => {
    if (!searchQuery.trim()) return courseTypes;
    
    const query = searchQuery.toLowerCase();
    
    const filterTree = (nodes: CourseTypeTreeNode[]): CourseTypeTreeNode[] => {
      return nodes.reduce<CourseTypeTreeNode[]>((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(query);
        const filteredChildren = filterTree(node.children || []);
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };
    
    return filterTree(courseTypes);
  }, [courseTypes, searchQuery]);

  // Filter pool lists based on search query
  const filteredPoolLists = useMemo(() => {
    if (!searchQuery.trim()) return poolLists;
    const query = searchQuery.toLowerCase();
    return poolLists.filter(list => 
      list.name.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    );
  }, [poolLists, searchQuery]);

  // Check if hierarchy has more than 3 levels (to show search)
  const hasDeepHierarchy = useMemo(() => {
    const getMaxDepth = (nodes: CourseTypeTreeNode[], depth: number = 0): number => {
      if (!nodes.length) return depth;
      return Math.max(...nodes.map(node => 
        getMaxDepth(node.children || [], depth + 1)
      ));
    };
    return getMaxDepth(courseTypes) > 3;
  }, [courseTypes]);

  // Calculate hierarchy depth for display
  const hierarchyDepth = useMemo(() => {
    const getMaxDepth = (nodes: CourseTypeTreeNode[], depth: number = 0): number => {
      if (!nodes.length) return depth;
      return Math.max(...nodes.map(node => 
        getMaxDepth(node.children || [], depth + 1)
      ));
    };
    return getMaxDepth(courseTypes);
  }, [courseTypes]);

  // Toggle node expansion
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand all nodes
  const expandAll = useCallback(() => {
    setExpandedNodes(new Set(allNodeIds));
  }, [allNodeIds]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle course type selection
  const handleCourseTypeToggle = useCallback((typeId: string, typeName: string, typeColor?: string) => {
    const isSelected = selectedCourseTypeIds.has(typeId);
    
    if (isSelected) {
      // Remove this source
      const newSources = selectedSources.filter(
        s => !(s.sourceType === 'COURSE_TYPE' && s.courseTypeId === typeId)
      );
      onSourcesChange(newSources);
    } else {
      // Add this source
      const newSource: PoolSource = {
        id: `temp-${Date.now()}`,
        poolId: '',
        sourceType: 'COURSE_TYPE',
        courseTypeId: typeId,
        sourceName: typeName,
        sourceColor: typeColor,
      };
      onSourcesChange([...selectedSources, newSource]);
    }
  }, [selectedCourseTypeIds, selectedSources, onSourcesChange]);

  // Handle pool list selection
  const handlePoolListToggle = useCallback((listId: string, listName: string) => {
    const isSelected = selectedPoolListIds.has(listId);
    
    if (isSelected) {
      // Remove this source
      const newSources = selectedSources.filter(
        s => !(s.sourceType === 'COURSE_LIST' && s.courseListId === listId)
      );
      onSourcesChange(newSources);
    } else {
      // Add this source
      const newSource: PoolSource = {
        id: `temp-${Date.now()}`,
        poolId: '',
        sourceType: 'COURSE_LIST',
        courseListId: listId,
        sourceName: listName,
      };
      onSourcesChange([...selectedSources, newSource]);
    }
  }, [selectedPoolListIds, selectedSources, onSourcesChange]);

  // Remove a selected source
  const removeSource = useCallback((source: PoolSource) => {
    const newSources = selectedSources.filter(s => {
      if (source.sourceType === 'COURSE_TYPE') {
        return !(s.sourceType === 'COURSE_TYPE' && s.courseTypeId === source.courseTypeId);
      }
      return !(s.sourceType === 'COURSE_LIST' && s.courseListId === source.courseListId);
    });
    onSourcesChange(newSources);
  }, [selectedSources, onSourcesChange]);

  // Render a course type tree node
  const renderTreeNode = (node: CourseTypeTreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedCourseTypeIds.has(node.id);
    const isImplicitlyIncluded = implicitlyIncludedIds.has(node.id);
    const usageCount = node.usageCount ?? node.usage_count ?? 0;
    const isSearchMatch = matchingNodeIds.has(node.id);
    const implicitChildCount = implicitChildCounts.get(node.id) || 0;

    // Find the parent that caused this node to be implicitly included
    const getImplicitParentName = (): string | null => {
      if (!isImplicitlyIncluded) return null;
      for (const typeId of selectedCourseTypeIds) {
        const descendants = getDescendantIds(typeId, flatCourseTypes);
        if (descendants.includes(node.id)) {
          const parent = flatCourseTypes.find(t => t.id === typeId);
          return parent?.name || null;
        }
      }
      return null;
    };

    const implicitParentName = getImplicitParentName();

    // Highlight matching text in search
    const highlightText = (text: string): React.ReactNode => {
      if (!searchQuery.trim() || !isSearchMatch) return text;
      const query = searchQuery.toLowerCase();
      const index = text.toLowerCase().indexOf(query);
      if (index === -1) return text;
      
      return (
        <>
          {text.slice(0, index)}
          <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {text.slice(index, index + searchQuery.length)}
          </mark>
          {text.slice(index + searchQuery.length)}
        </>
      );
    };

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer
            transition-colors duration-150
            ${isSelected 
              ? 'bg-primary/10 border border-primary/30' 
              : isImplicitlyIncluded
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-700'
                : isSearchMatch
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-transparent'
            }
          `}
          style={{ marginLeft: depth * 20 }}
        >
          {/* Expand/Collapse Button */}
          <button
            type="button"
            className={`
              flex-shrink-0 w-5 h-5 flex items-center justify-center
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              ${!hasChildren ? 'invisible' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
          >
            {hasChildren && (
              isExpanded ? <FaChevronDown className="h-3 w-3" /> : <FaChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Selection Checkbox Area */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 text-left"
                  onClick={() => !isImplicitlyIncluded && handleCourseTypeToggle(node.id, node.name, node.color)}
                  disabled={isImplicitlyIncluded}
                >
                  {/* Color Badge */}
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                    style={{ backgroundColor: node.color || '#6b7280' }}
                    title={`Color: ${node.color || 'default'}`}
                  />

                  {/* Node Name */}
                  <span className={`
                    text-sm font-medium flex-1
                    ${isSelected ? 'text-primary' : isImplicitlyIncluded ? 'text-blue-500 dark:text-blue-400' : 'text-foreground'}
                  `}>
                    {highlightText(node.name)}
                  </span>

                  {/* Usage Count Badge */}
                  <Badge 
                    variant="outline" 
                    className={`
                      text-xs py-0 px-1.5
                      ${usageCount > 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'}
                    `}
                  >
                    {usageCount} {usageCount === 1 ? 'course' : 'courses'}
                  </Badge>

                  {/* Implicit Child Count (when selected and has children) */}
                  {isSelected && implicitChildCount > 0 && (
                    <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      +{implicitChildCount} child{implicitChildCount !== 1 ? 'ren' : ''}
                    </Badge>
                  )}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <FaCheck className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                  
                  {/* Implicitly Included Indicator */}
                  {isImplicitlyIncluded && !isSelected && (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs py-0 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        <FaInfoCircle className="h-2.5 w-2.5 mr-1" />
                        included
                      </Badge>
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              {isImplicitlyIncluded && implicitParentName && (
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Automatically included because parent type <strong>&quot;{implicitParentName}&quot;</strong> is selected.
                    Child types are always included when a parent is selected.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render pool list item
  const renderPoolListItem = (list: PoolList) => {
    const isSelected = selectedPoolListIds.has(list.id);
    const courseCount = list.courses?.length ?? 0;

    return (
      <div
        key={list.id}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer
          transition-colors duration-150
          ${isSelected 
            ? 'bg-primary/10 border border-primary/30' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-transparent'
          }
        `}
        onClick={() => handlePoolListToggle(list.id, list.name)}
      >
        {/* List Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FaList className="h-3 w-3" />
          </div>
        </div>

        {/* List Info */}
        <div className="flex-1 min-w-0">
          <span className={`
            text-sm font-medium
            ${isSelected ? 'text-primary' : 'text-foreground'}
          `}>
            {list.name}
          </span>
        </div>

        {/* Course Count */}
        <Badge variant="secondary" className="text-xs">
          {courseCount} {courseCount === 1 ? 'course' : 'courses'}
        </Badge>

        {/* Selection Indicator */}
        {isSelected && (
          <FaCheck className="h-3 w-3 text-primary flex-shrink-0" />
        )}
      </div>
    );
  };

  // Get breadcrumb for a selected course type
  const getBreadcrumb = (typeId: string): string => {
    const path = buildBreadcrumbPath(typeId, flatCourseTypes);
    return formatBreadcrumbPath(path);
  };

  return (
    <div className="space-y-4">
      {/* Selected Sources Display */}
      {selectedSources.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-border bg-gray-50 dark:bg-gray-900/40 p-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Selected Sources ({selectedSources.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSources.map((source, index) => {
              const isCourseType = source.sourceType === 'COURSE_TYPE';
              const breadcrumb = isCourseType && source.courseTypeId 
                ? getBreadcrumb(source.courseTypeId)
                : null;

              return (
                <div
                  key={`${source.sourceType}-${source.courseTypeId || source.courseListId}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1"
                >
                  {isCourseType ? (
                    <>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: source.sourceColor || '#6b7280' }}
                      />
                      <span className="text-xs font-medium text-foreground" title={breadcrumb || undefined}>
                        {breadcrumb || source.sourceName}
                      </span>
                    </>
                  ) : (
                    <>
                      <FaList className="h-2.5 w-2.5 text-blue-500" />
                      <span className="text-xs font-medium text-foreground">
                        {source.sourceName}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    className="ml-0.5 text-gray-400 hover:text-destructive"
                    onClick={() => removeSource(source)}
                  >
                    <FaTimes className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input (shown for deep hierarchies or always for convenience) */}
      {(hasDeepHierarchy || courseTypes.length > 5 || poolLists.length > 3) && (
        <div className="space-y-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search course types or lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
              >
                <FaTimesCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          {/* Search results info and expand/collapse controls */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              {searchQuery && (
                <span>
                  {matchingNodeIds.size} {matchingNodeIds.size === 1 ? 'match' : 'matches'} found
                </span>
              )}
              {!searchQuery && hierarchyDepth > 3 && (
                <span>
                  {hierarchyDepth} levels deep
                </span>
              )}
            </div>
            
            {activeTab === 'courseTypes' && allNodeIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Expand all"
                >
                  <FaExpandAlt className="h-3 w-3" />
                  <span>Expand</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Collapse all"
                >
                  <FaCompressAlt className="h-3 w-3" />
                  <span>Collapse</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-border">
        <button
          type="button"
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px
            transition-colors duration-150
            ${activeTab === 'courseTypes'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-foreground'
            }
          `}
          onClick={() => setActiveTab('courseTypes')}
        >
          <FaSitemap className="h-3.5 w-3.5" />
          Course Types
          {selectedCourseTypeIds.size > 0 && (
            <Badge variant="default" className="text-xs py-0 px-1.5">
              {selectedCourseTypeIds.size}
            </Badge>
          )}
        </button>
        <button
          type="button"
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px
            transition-colors duration-150
            ${activeTab === 'poolLists'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-foreground'
            }
          `}
          onClick={() => setActiveTab('poolLists')}
        >
          <FaList className="h-3.5 w-3.5" />
          Pool Lists
          {selectedPoolListIds.size > 0 && (
            <Badge variant="default" className="text-xs py-0 px-1.5">
              {selectedPoolListIds.size}
            </Badge>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'courseTypes' ? (
          <div className="space-y-1">
            {filteredCourseTypes.length > 0 ? (
              filteredCourseTypes.map(node => renderTreeNode(node))
            ) : (
              <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No course types match your search' : 'No course types available'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPoolLists.length > 0 ? (
              filteredPoolLists.map(list => renderPoolListItem(list))
            ) : (
              <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No pool lists match your search' : 'No pool lists available'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {activeTab === 'courseTypes' 
            ? 'Select course type nodes to include in this pool. Child types are automatically included when a parent is selected.'
            : 'Select pool lists to include their courses in this pool.'
          }
        </p>
        {activeTab === 'courseTypes' && implicitlyIncludedIds.size > 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <FaInfoCircle className="h-3 w-3" />
            {implicitlyIncludedIds.size} child type{implicitlyIncludedIds.size !== 1 ? 's' : ''} automatically included from selected parents
          </p>
        )}
      </div>
    </div>
  );
}
