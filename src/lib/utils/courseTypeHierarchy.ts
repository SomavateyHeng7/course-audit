/**
 * Course Type Hierarchy Utilities
 * 
 * This module provides functions for working with course type hierarchies,
 * including building breadcrumb paths for ancestry display and getting
 * descendant IDs for implicit child inclusion.
 * 
 * Requirements: 6.2, 6.5
 */

import type { CourseTypeLite } from '@/types/creditPool';

/**
 * Breadcrumb segment representing a single node in the path
 */
export interface BreadcrumbSegment {
  id: string;
  name: string;
  color?: string;
}

/**
 * Builds a breadcrumb path from root to the specified course type
 * 
 * The path shows all ancestor names from root to the selected node,
 * separated by "›" when displayed, in correct hierarchical order.
 * 
 * Example: For a type "HUMAN" under "GE", returns:
 * [{ id: 'ge-id', name: 'GE' }, { id: 'human-id', name: 'HUMAN' }]
 * 
 * @param typeId - The course type ID to build the path for
 * @param courseTypes - All course types for hierarchy lookup
 * @returns Array of breadcrumb segments from root to the specified type
 */
export function buildBreadcrumbPath(
  typeId: string,
  courseTypes: CourseTypeLite[]
): BreadcrumbSegment[] {
  if (!typeId || courseTypes.length === 0) {
    return [];
  }

  // Build type lookup map for efficient access
  const typeMap = new Map(courseTypes.map(t => [t.id, t]));
  
  const targetType = typeMap.get(typeId);
  if (!targetType) {
    return [];
  }

  // Build path from target up to root
  const pathFromTarget: BreadcrumbSegment[] = [];
  let currentType: CourseTypeLite | undefined = targetType;
  
  // Prevent infinite loops with a visited set
  const visited = new Set<string>();
  
  while (currentType && !visited.has(currentType.id)) {
    visited.add(currentType.id);
    
    pathFromTarget.push({
      id: currentType.id,
      name: currentType.name,
      color: currentType.color,
    });
    
    // Get parent ID (handle different field names from API)
    const parentId = currentType.parentId ?? currentType.parent_id ?? currentType.parentCourseTypeId;
    
    if (parentId) {
      currentType = typeMap.get(parentId);
    } else {
      currentType = undefined;
    }
  }
  
  // Reverse to get root-to-target order
  return pathFromTarget.reverse();
}

/**
 * Formats a breadcrumb path as a display string
 * 
 * @param path - Array of breadcrumb segments
 * @param separator - Separator between segments (default: " › ")
 * @returns Formatted breadcrumb string (e.g., "GE › HUMAN")
 */
export function formatBreadcrumbPath(
  path: BreadcrumbSegment[],
  separator: string = ' › '
): string {
  return path.map(segment => segment.name).join(separator);
}

/**
 * Gets all descendant type IDs for a given course type
 * 
 * When a parent type is selected as a pool source, all descendant types
 * are implicitly included. This function returns all such descendant IDs.
 * 
 * @param typeId - The parent type ID
 * @param courseTypes - All course types
 * @returns Array of descendant type IDs (not including the parent itself)
 */
export function getDescendantIds(
  typeId: string,
  courseTypes: CourseTypeLite[]
): string[] {
  if (!typeId || courseTypes.length === 0) {
    return [];
  }

  const descendants: string[] = [];
  
  // Find direct children
  const directChildren = courseTypes.filter(t => {
    const parentId = t.parentId ?? t.parent_id ?? t.parentCourseTypeId;
    return parentId === typeId;
  });
  
  // Recursively get descendants
  for (const child of directChildren) {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, courseTypes));
  }
  
  return descendants;
}

/**
 * Gets all ancestor type IDs for a given course type
 * 
 * @param typeId - The course type ID
 * @param courseTypes - All course types
 * @returns Array of ancestor type IDs from immediate parent to root
 */
export function getAncestorIds(
  typeId: string,
  courseTypes: CourseTypeLite[]
): string[] {
  if (!typeId || courseTypes.length === 0) {
    return [];
  }

  const typeMap = new Map(courseTypes.map(t => [t.id, t]));
  const ancestors: string[] = [];
  const visited = new Set<string>();
  
  let currentType = typeMap.get(typeId);
  
  while (currentType && !visited.has(currentType.id)) {
    visited.add(currentType.id);
    
    const parentId = currentType.parentId ?? currentType.parent_id ?? currentType.parentCourseTypeId;
    
    if (parentId) {
      ancestors.push(parentId);
      currentType = typeMap.get(parentId);
    } else {
      currentType = undefined;
    }
  }
  
  return ancestors;
}

/**
 * Checks if a type is an ancestor of another type
 * 
 * @param potentialAncestorId - The ID that might be an ancestor
 * @param typeId - The type to check ancestry for
 * @param courseTypes - All course types
 * @returns True if potentialAncestorId is an ancestor of typeId
 */
export function isAncestorOf(
  potentialAncestorId: string,
  typeId: string,
  courseTypes: CourseTypeLite[]
): boolean {
  const ancestors = getAncestorIds(typeId, courseTypes);
  return ancestors.includes(potentialAncestorId);
}

/**
 * Checks if a type is a descendant of another type
 * 
 * @param potentialDescendantId - The ID that might be a descendant
 * @param typeId - The type to check descendants for
 * @param courseTypes - All course types
 * @returns True if potentialDescendantId is a descendant of typeId
 */
export function isDescendantOf(
  potentialDescendantId: string,
  typeId: string,
  courseTypes: CourseTypeLite[]
): boolean {
  const descendants = getDescendantIds(typeId, courseTypes);
  return descendants.includes(potentialDescendantId);
}

/**
 * Gets the depth/level of a course type in the hierarchy
 * 
 * Root types have depth 0, their children have depth 1, etc.
 * 
 * @param typeId - The course type ID
 * @param courseTypes - All course types
 * @returns The depth of the type, or -1 if not found
 */
export function getTypeDepth(
  typeId: string,
  courseTypes: CourseTypeLite[]
): number {
  if (!typeId || courseTypes.length === 0) {
    return -1;
  }

  const typeMap = new Map(courseTypes.map(t => [t.id, t]));
  const targetType = typeMap.get(typeId);
  
  if (!targetType) {
    return -1;
  }

  let depth = 0;
  const visited = new Set<string>();
  let currentType: CourseTypeLite | undefined = targetType;
  
  while (currentType && !visited.has(currentType.id)) {
    visited.add(currentType.id);
    
    const parentId = currentType.parentId ?? currentType.parent_id ?? currentType.parentCourseTypeId;
    
    if (parentId) {
      depth++;
      currentType = typeMap.get(parentId);
    } else {
      currentType = undefined;
    }
  }
  
  return depth;
}
