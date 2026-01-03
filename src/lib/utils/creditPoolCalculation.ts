/**
 * Credit Pool Calculation Module
 * 
 * This module provides functions for calculating credit distribution across pools
 * for a curriculum. It implements the pool priority ordering algorithm and source
 * matching logic.
 * 
 * Requirements: 4.2, 4.3, 4.4
 */

import type {
  CurriculumPoolAttachment,
  CurriculumCourseLite,
  CourseTypeLite,
  PoolList,
  PoolSource,
  PoolCreditCalculation,
} from '@/types/creditPool';

/**
 * Calculates credit distribution across pools for a curriculum
 * 
 * Algorithm:
 * 1. Sort pools by orderIndex (evaluation priority)
 * 2. For each pool in order:
 *    a. Find courses matching pool sources (course types or lists)
 *    b. Exclude courses already consumed by higher-priority pools
 *    c. Apply credits up to maxCredits (if set)
 *    d. Track overflow for Free Elective routing
 * 3. Return per-pool breakdown with satisfaction status
 * 
 * @param attachments - Pool attachments for the curriculum
 * @param courses - Courses in the curriculum
 * @param courseTypes - All course types for hierarchy lookup
 * @param poolLists - All pool lists for source matching
 * @returns Array of credit calculations per pool
 */
export function calculatePoolCredits(
  attachments: CurriculumPoolAttachment[],
  courses: CurriculumCourseLite[],
  courseTypes: CourseTypeLite[],
  poolLists: PoolList[]
): PoolCreditCalculation[] {
  // Sort attachments by orderIndex (evaluation priority)
  const sortedAttachments = [...attachments].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Track which courses have been consumed by higher-priority pools
  const consumedCourseIds = new Set<string>();
  const results: PoolCreditCalculation[] = [];
  
  for (const attachment of sortedAttachments) {
    const pool = attachment.pool;
    if (!pool) continue;
    
    // Find matching courses not yet consumed
    const matchingCourses = courses.filter(course => {
      if (consumedCourseIds.has(course.id)) return false;
      return courseMatchesPoolSources(course, pool.sources, courseTypes, poolLists);
    });
    
    // Calculate applied credits respecting maxCredits limit
    let appliedCredits = 0;
    const matchedCourseIds: string[] = [];
    
    for (const course of matchingCourses) {
      const courseCredits = course.credits;
      const wouldExceedMax = attachment.maxCredits !== null && 
        (appliedCredits + courseCredits) > attachment.maxCredits;
      
      if (!wouldExceedMax) {
        appliedCredits += courseCredits;
        matchedCourseIds.push(course.id);
        consumedCourseIds.add(course.id);
      }
    }
    
    // Calculate overflow (credits beyond max that go to Free Elective)
    const potentialCredits = matchingCourses.reduce((sum, c) => sum + c.credits, 0);
    const overflowCredits = attachment.maxCredits !== null 
      ? Math.max(0, potentialCredits - attachment.maxCredits)
      : 0;
    
    results.push({
      poolId: pool.id,
      poolName: pool.name,
      requiredCredits: attachment.requiredCredits,
      maxCredits: attachment.maxCredits,
      appliedCredits,
      remainingCredits: Math.max(0, attachment.requiredCredits - appliedCredits),
      overflowCredits,
      isSatisfied: appliedCredits >= attachment.requiredCredits,
      matchedCourses: matchedCourseIds
    });
  }
  
  return results;
}

/**
 * Checks if a course matches any of the pool's sources
 * 
 * A course matches if:
 * - Its course type matches a COURSE_TYPE source (including parent hierarchy)
 * - It is included in a COURSE_LIST source
 * 
 * @param course - The course to check
 * @param sources - Pool sources to match against
 * @param courseTypes - All course types for hierarchy lookup
 * @param poolLists - All pool lists for list membership check
 * @returns True if the course matches any source
 */
export function courseMatchesPoolSources(
  course: CurriculumCourseLite,
  sources: PoolSource[],
  courseTypes: CourseTypeLite[],
  poolLists: PoolList[]
): boolean {
  for (const source of sources) {
    if (source.sourceType === 'COURSE_TYPE' && source.courseTypeId) {
      // Check if course type matches (including parent hierarchy)
      if (courseTypeMatchesHierarchy(course.courseType?.id, source.courseTypeId, courseTypes)) {
        return true;
      }
    } else if (source.sourceType === 'COURSE_LIST' && source.courseListId) {
      // Check if course is in the pool list
      const list = poolLists.find(l => l.id === source.courseListId);
      if (list?.courses.some(lc => lc.courseId === course.id)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a course type matches a target type or is a descendant of it
 * 
 * This function traverses up the course type hierarchy to check if the
 * course's type is either the target type or a child/grandchild of it.
 * 
 * When a parent type is selected as a pool source, all descendant types
 * are implicitly included.
 * 
 * @param courseTypeId - The course's type ID
 * @param targetTypeId - The target type ID to match against
 * @param courseTypes - All course types for hierarchy lookup
 * @returns True if the course type matches or is a descendant
 */
export function courseTypeMatchesHierarchy(
  courseTypeId: string | undefined,
  targetTypeId: string,
  courseTypes: CourseTypeLite[]
): boolean {
  if (!courseTypeId) return false;
  if (courseTypeId === targetTypeId) return true;
  
  // Build type lookup map for efficient access
  const typeMap = new Map(courseTypes.map(t => [t.id, t]));
  
  // Walk up the hierarchy from the course type to check if target is an ancestor
  let currentType = typeMap.get(courseTypeId);
  while (currentType) {
    // Handle different parent ID field names (API inconsistency)
    const parentId = currentType.parentId ?? currentType.parent_id ?? currentType.parentCourseTypeId;
    
    if (parentId === targetTypeId) return true;
    
    currentType = parentId ? typeMap.get(parentId) : undefined;
  }
  
  return false;
}

/**
 * Gets all descendant type IDs for a given course type
 * 
 * This is useful for displaying which types are implicitly included
 * when a parent type is selected.
 * 
 * @param typeId - The parent type ID
 * @param courseTypes - All course types
 * @returns Array of descendant type IDs
 */
export function getDescendantTypeIds(
  typeId: string,
  courseTypes: CourseTypeLite[]
): string[] {
  const descendants: string[] = [];
  
  // Find direct children
  const directChildren = courseTypes.filter(t => {
    const parentId = t.parentId ?? t.parent_id ?? t.parentCourseTypeId;
    return parentId === typeId;
  });
  
  // Recursively get descendants
  for (const child of directChildren) {
    descendants.push(child.id);
    descendants.push(...getDescendantTypeIds(child.id, courseTypes));
  }
  
  return descendants;
}

/**
 * Calculates total overflow credits across all pools
 * 
 * @param calculations - Pool credit calculations
 * @returns Total overflow credits
 */
export function calculateTotalOverflow(calculations: PoolCreditCalculation[]): number {
  return calculations.reduce((sum, calc) => sum + calc.overflowCredits, 0);
}

/**
 * Checks if any pools have overlapping sources
 * 
 * @param attachments - Pool attachments to check
 * @returns Map of pool IDs to arrays of overlapping pool IDs
 */
export function detectPoolOverlaps(
  attachments: CurriculumPoolAttachment[]
): Map<string, string[]> {
  const overlaps = new Map<string, string[]>();
  
  for (let i = 0; i < attachments.length; i++) {
    const poolA = attachments[i].pool;
    if (!poolA) continue;
    
    const overlappingPools: string[] = [];
    
    for (let j = 0; j < attachments.length; j++) {
      if (i === j) continue;
      
      const poolB = attachments[j].pool;
      if (!poolB) continue;
      
      // Check if any sources overlap
      const hasOverlap = poolA.sources.some(sourceA => 
        poolB.sources.some(sourceB => {
          if (sourceA.sourceType !== sourceB.sourceType) return false;
          
          if (sourceA.sourceType === 'COURSE_TYPE') {
            return sourceA.courseTypeId === sourceB.courseTypeId;
          } else {
            return sourceA.courseListId === sourceB.courseListId;
          }
        })
      );
      
      if (hasOverlap) {
        overlappingPools.push(poolB.id);
      }
    }
    
    if (overlappingPools.length > 0) {
      overlaps.set(poolA.id, overlappingPools);
    }
  }
  
  return overlaps;
}
