'use client';

import { useState, useEffect } from 'react';
import { courseConstraintsApi } from '@/services/courseConstraintsApi';
import { curriculumCourseConstraintsApi } from '@/services/curriculumCourseConstraintsApi';

interface Course {
  id: string;
  code: string;
  name: string;
  credits?: number;
  curriculumPrerequisites?: Array<{ id?: string; code: string; name?: string | null }>;
  curriculumCorequisites?: Array<{ id?: string; code: string; name?: string | null }>;
  requiresPermission?: boolean;
  summerOnly?: boolean;
  requiresSeniorStanding?: boolean;
  minCreditThreshold?: number | null;
  baseRequiresPermission?: boolean;
  baseSummerOnly?: boolean;
  baseRequiresSeniorStanding?: boolean;
  baseMinCreditThreshold?: number | null;
  hasPermissionOverride?: boolean;
  hasSummerOnlyOverride?: boolean;
  hasSeniorStandingOverride?: boolean;
  hasMinCreditOverride?: boolean;
  curriculumCourseId?: string;
}

interface ConstraintsTabProps {
  courses: Course[];
  curriculumId?: string;
  curriculumCourses?: CurriculumCourseMeta[];
}

interface CurriculumCourseMeta {
  curriculumCourseId: string;
  courseId: string;
  courseCode: string;
  curriculumPrerequisites: Array<{ id?: string; code: string; name?: string | null }>;
  curriculumCorequisites: Array<{ id?: string; code: string; name?: string | null }>;
  overrideRequiresPermission?: boolean | null;
  overrideSummerOnly?: boolean | null;
  overrideRequiresSeniorStanding?: boolean | null;
  overrideMinCreditThreshold?: number | null;
}

interface CurriculumCourseRelation {
  id: string;
  curriculumCourseId: string;
  courseId: string;
  code: string;
  name: string | null;
  credits: number | null;
}

interface CourseConstraints {
  prerequisites: Course[];
  corequisites: Course[];
  bannedCombinations: Course[];
}

interface CourseConstraintFlags {
  requiresPermission: boolean;
  summerOnly: boolean;
  requiresSeniorStanding: boolean;
  minCreditThreshold?: number;
}

export default function ConstraintsTab({ courses, curriculumId, curriculumCourses }: ConstraintsTabProps) {
  console.log('ConstraintsTab initialized with curriculumId:', curriculumId);
  
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [constraintType, setConstraintType] = useState('prerequisites');
  const [selectedConstraintCourse, setSelectedConstraintCourse] = useState('');
  const [constraintCourseSearch, setConstraintCourseSearch] = useState('');

  const [curriculumPrerequisitesState, setCurriculumPrerequisitesState] = useState<CurriculumCourseRelation[]>([]);
  const [curriculumCorequisitesState, setCurriculumCorequisitesState] = useState<CurriculumCourseRelation[]>([]);

  const getCourseIdentifier = (course: Course) => course.curriculumCourseId || course.id || course.code;

  // Resolve the selected course, falling back to curriculum metadata if the main list changes.
  const resolveCourseData = (identifier: string | null | undefined): Course | null => {
    if (!identifier) {
      return null;
    }

    const courseMatch = courses.find(course => String(getCourseIdentifier(course)) === String(identifier));
    if (courseMatch) {
      return courseMatch;
    }

    const metaMatch = curriculumCourses?.find(meta =>
      meta.curriculumCourseId === identifier ||
      meta.courseId === identifier ||
      meta.courseCode === identifier
    );

    if (metaMatch) {
      return {
        id: metaMatch.courseId,
        code: metaMatch.courseCode,
        name: metaMatch.courseCode,
        curriculumPrerequisites: metaMatch.curriculumPrerequisites,
        curriculumCorequisites: metaMatch.curriculumCorequisites,
        curriculumCourseId: metaMatch.curriculumCourseId,
      };
    }

    return null;
  };

  const selectedCourseData = resolveCourseData(selectedCourse);

  const getSelectedCourseData = (): Course =>
    selectedCourseData ?? {
      id: '',
      code: selectedCourse ? String(selectedCourse) : 'UNKNOWN',
      name: 'Unknown Course',
      curriculumPrerequisites: [],
      curriculumCorequisites: [],
      curriculumCourseId: selectedCourse ? String(selectedCourse) : undefined,
    };

  const selectedCurriculumCourseId: string | null = selectedCourseData?.curriculumCourseId
    ?? (selectedCourseData
      ? curriculumCourses?.find((meta) => {
          if (selectedCourseData.id) {
            return meta.courseId === selectedCourseData.id;
          }
          return meta.courseCode === selectedCourseData.code;
        })?.curriculumCourseId ?? null
      : null);
  
  // Real constraint data from backend
  const [constraints, setConstraints] = useState<CourseConstraints>({
    prerequisites: [],
    bannedCombinations: [],
    corequisites: [],
  });
  
  // Course flags from backend
  const [courseFlags, setCourseFlags] = useState<CourseConstraintFlags>({
    requiresPermission: false,
    summerOnly: false,
    requiresSeniorStanding: false,
    minCreditThreshold: 90,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagSaving, setFlagSaving] = useState(false);

  const [overrideFlags, setOverrideFlags] = useState({
    overrideRequiresPermission: null as boolean | null,
    overrideSummerOnly: null as boolean | null,
    overrideRequiresSeniorStanding: null as boolean | null,
    overrideMinCreditThreshold: null as number | null,
  });

  const [mergedFlags, setMergedFlags] = useState({
    requiresPermission: false,
    summerOnly: false,
    requiresSeniorStanding: false,
    minCreditThreshold: null as number | null,
  });

  // Load constraints when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      loadConstraints();
    }
  }, [selectedCourse]);

  const loadConstraints = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    setError(null);

    try {
      const selectedCourseData = getSelectedCourseData();

      if (!selectedCourseData.id) {
        setError('Course ID is missing. Cannot load constraints without proper course ID.');
        return;
      }

      setOverrideFlags({
        overrideRequiresPermission: null,
        overrideSummerOnly: null,
        overrideRequiresSeniorStanding: null,
        overrideMinCreditThreshold: null,
      });
      setMergedFlags({
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: null,
      });
      setCurriculumPrerequisitesState([]);
      setCurriculumCorequisitesState([]);

      const constraintsData = await courseConstraintsApi.getConstraints(selectedCourseData.id);

      let bannedCombinations: any[] = constraintsData.bannedCombinations || [];
      if (curriculumId) {
        try {
          const curriculumResponse = await fetch(`/api/curricula/${curriculumId}/constraints`);
          if (curriculumResponse.ok) {
            const curriculumData = await curriculumResponse.json();
            const curriculumConstraints = curriculumData.constraints || [];

            const curriculumBannedCombinations = curriculumConstraints
              .filter((constraint: any) =>
                constraint.type === 'CUSTOM' &&
                constraint.config?.type === 'banned_combination' &&
                constraint.config?.courses?.some((course: any) => course.id === selectedCourseData.id)
              )
              .map((constraint: any) => {
                const otherCourse = constraint.config.courses.find((course: any) => course.id !== selectedCourseData.id);
                return {
                  id: constraint.id,
                  type: 'curriculumConstraint',
                  otherCourse,
                  constraintName: constraint.name,
                  description: constraint.description,
                  code: otherCourse?.code || 'Unknown',
                  name: otherCourse?.name || 'Unknown Course'
                };
              });

            bannedCombinations = [...bannedCombinations, ...curriculumBannedCombinations];
          }
        } catch (err) {
          console.warn('Could not load curriculum constraints:', err);
        }
      }

      setConstraints({
        prerequisites: constraintsData.prerequisites || [],
        corequisites: constraintsData.corequisites || [],
        bannedCombinations,
      });

      const baseFlags = constraintsData.flags || {
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: 90,
      };

      setCourseFlags(baseFlags);
      setMergedFlags({
        requiresPermission: baseFlags.requiresPermission,
        summerOnly: baseFlags.summerOnly,
        requiresSeniorStanding: baseFlags.requiresSeniorStanding,
        minCreditThreshold: baseFlags.minCreditThreshold ?? null,
      });

      if (curriculumId && selectedCurriculumCourseId) {
        try {
          const curriculumConstraintData = await curriculumCourseConstraintsApi.getConstraints(
            curriculumId,
            selectedCurriculumCourseId
          );

          setOverrideFlags(curriculumConstraintData.overrideFlags);
          setMergedFlags(curriculumConstraintData.mergedFlags);
          setCurriculumPrerequisitesState(curriculumConstraintData.curriculumPrerequisites || []);
          setCurriculumCorequisitesState(curriculumConstraintData.curriculumCorequisites || []);
        } catch (err) {
          console.warn('Could not load curriculum course overrides:', err);
        }
      }
    } catch (err) {
      console.error('Error loading constraints:', err);
      setError(err instanceof Error ? err.message : 'Failed to load constraints');

      setConstraints({
        prerequisites: [],
        corequisites: [],
        bannedCombinations: [],
      });
      setCourseFlags({
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: 90,
      });
      setOverrideFlags({
        overrideRequiresPermission: null,
        overrideSummerOnly: null,
        overrideRequiresSeniorStanding: null,
        overrideMinCreditThreshold: null,
      });
      setMergedFlags({
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: null,
      });
      setCurriculumPrerequisitesState([]);
      setCurriculumCorequisitesState([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredConstraintCourses = courses
    .filter(c => getCourseIdentifier(c) !== selectedCourse)
    .filter(course =>
      course.code.toLowerCase().includes(constraintCourseSearch.toLowerCase()) ||
      course.name.toLowerCase().includes(constraintCourseSearch.toLowerCase())
    );

  const handleAddConstraint = async () => {
    if (!selectedConstraintCourse || !selectedCourse) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedCourseData = getSelectedCourseData();
      const constraintCourseData = courses.find(c => getCourseIdentifier(c) === selectedConstraintCourse);

      if (!selectedCourseData.id || !constraintCourseData?.id) {
        setError('Course IDs are missing. Cannot add constraints without proper course IDs.');
        return;
      }

      if (constraintType === 'prerequisites' || constraintType === 'corequisites') {
        if (!curriculumId || !selectedCurriculumCourseId) {
          setError('Curriculum mapping not available for the selected course.');
          return;
        }

        const targetCurriculumCourseId = constraintCourseData.curriculumCourseId
          || curriculumCourses?.find(entry => entry.courseId === constraintCourseData.id)?.curriculumCourseId
          || null;

        if (!targetCurriculumCourseId) {
          setError('Selected course is not part of this curriculum.');
          return;
        }

        if (targetCurriculumCourseId === selectedCurriculumCourseId) {
          setError('A course cannot reference itself. Choose a different course.');
          return;
        }

        if (constraintType === 'prerequisites') {
          console.log('Adding prerequisite:', { curriculumId, selectedCurriculumCourseId, targetCurriculumCourseId });
          const prerequisite = await curriculumCourseConstraintsApi.addPrerequisite(
            curriculumId as string,
            selectedCurriculumCourseId as string,
            targetCurriculumCourseId
          );
          setCurriculumPrerequisitesState(prev => [...prev, prerequisite]);
        } else {
          console.log('Adding corequisite:', { curriculumId, selectedCurriculumCourseId, targetCurriculumCourseId });
          const corequisite = await curriculumCourseConstraintsApi.addCorequisite(
            curriculumId as string,
            selectedCurriculumCourseId as string,
            targetCurriculumCourseId
          );
          setCurriculumCorequisitesState(prev => [...prev, corequisite]);
        }
      } else if (constraintType === 'bannedCombinations') {
        if (!curriculumId) {
          setError('Curriculum ID is missing. Cannot add banned combinations without curriculum ID.');
          return;
        }

        await addBannedCombination(curriculumId, selectedCourseData.id, constraintCourseData.id);
        await loadConstraints();
      }

      setSelectedConstraintCourse('');
      setConstraintCourseSearch('');
    } catch (err: any) {
      // Handle duplicate constraint errors gracefully
      if (err?.message?.includes('already exists') || err?.message?.includes('DUPLICATE')) {
        setError('This constraint already exists for this course.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to add constraint');
      }
    } finally {
      setSaving(false);
    }
  };

  // Function to add banned combination constraint
  const addBannedCombination = async (curriculumId: string, courseId1: string, courseId2: string) => {
    console.log('Starting addBannedCombination:', { curriculumId, courseId1, courseId2 });
    
    const course1 = courses.find(c => c.id === courseId1);
    const course2 = courses.find(c => c.id === courseId2);
    
    if (!course1 || !course2) {
      throw new Error('Could not find course data for banned combination');
    }
    
    const constraintName = `Banned: ${course1.code} + ${course2.code}`;
    const description = `Students cannot take ${course1.code} (${course1.name}) and ${course2.code} (${course2.name}) together`;
    
    const config = {
      type: 'banned_combination',
      courses: [
        { id: courseId1, code: course1.code, name: course1.name },
        { id: courseId2, code: course2.code, name: course2.name }
      ]
    };
    
    const requestBody = {
      type: 'CUSTOM',
      name: constraintName,
      description: description,
      isRequired: true,
      config: config
    };
    
    console.log('Making POST request to:', `/api/curricula/${curriculumId}/constraints`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`/api/curricula/${curriculumId}/constraints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.error?.message || data.message || 'Failed to add banned combination');
    }
    
    console.log('Banned combination added successfully:', data);
    return data;
  };

  const handleRemoveConstraint = async (type: string, item: any) => {
    if (!selectedCourse) return;

    setSaving(true);
    setError(null);

    try {
      if ((type === 'prerequisites' || type === 'corequisites') && (!curriculumId || !selectedCurriculumCourseId)) {
        setError('Curriculum mapping not available for the selected course.');
        return;
      }

      if (type === 'prerequisites') {
        if (!item?.id) {
          setError('Unable to identify prerequisite relation for removal.');
          return;
        }

        await curriculumCourseConstraintsApi.removePrerequisite(
          curriculumId as string,
          selectedCurriculumCourseId as string,
          item.id
        );

        setCurriculumPrerequisitesState(prev => prev.filter(relation => relation.id !== item.id));
      } else if (type === 'corequisites') {
        if (!item?.id) {
          setError('Unable to identify co-requisite relation for removal.');
          return;
        }

        await curriculumCourseConstraintsApi.removeCorequisite(
          curriculumId as string,
          selectedCurriculumCourseId as string,
          item.id
        );

        setCurriculumCorequisitesState(prev => prev.filter(relation => relation.id !== item.id));
      } else if (type === 'bannedCombinations') {
        if (item?.type === 'curriculumConstraint' && item?.id && curriculumId) {
          const response = await fetch(`/api/curricula/${curriculumId}/constraints/${item.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || 'Failed to remove banned combination');
          }

          await loadConstraints();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove constraint');
    } finally {
      setSaving(false);
    }
  };

  // Handle curriculum-level flag overrides with auto-save
  const handleFlagChange = (flagName: keyof CourseConstraintFlags, value: any) => {
    console.log('handleFlagChange called:', { flagName, value, curriculumId, selectedCurriculumCourseId });
    
    if (!curriculumId || !selectedCurriculumCourseId) {
      setError('Curriculum mapping not available for the selected course.');
      return;
    }

    setFlagSaving(true);
    setError(null);

    const updates: Partial<typeof overrideFlags> = {};

    if (flagName === 'requiresPermission') {
      const boolValue = Boolean(value);
      const normalized = boolValue === courseFlags.requiresPermission ? null : boolValue;
      if (normalized !== overrideFlags.overrideRequiresPermission) {
        updates.overrideRequiresPermission = normalized;
      }
    } else if (flagName === 'summerOnly') {
      const boolValue = Boolean(value);
      const normalized = boolValue === courseFlags.summerOnly ? null : boolValue;
      if (normalized !== overrideFlags.overrideSummerOnly) {
        updates.overrideSummerOnly = normalized;
      }
    } else if (flagName === 'requiresSeniorStanding') {
      const boolValue = Boolean(value);
      const normalized = boolValue === courseFlags.requiresSeniorStanding ? null : boolValue;
      if (normalized !== overrideFlags.overrideRequiresSeniorStanding) {
        updates.overrideRequiresSeniorStanding = normalized;
      }
    } else if (flagName === 'minCreditThreshold') {
      let safeValue: number | null;
      if (value === null || value === undefined) {
        safeValue = null;
      } else if (typeof value === 'number') {
        safeValue = Number.isFinite(value) ? value : null;
      } else {
        const parsed = parseInt(value, 10);
        safeValue = Number.isFinite(parsed) ? parsed : null;
      }
      const baseThreshold = courseFlags.minCreditThreshold ?? null;
      const normalized = safeValue === baseThreshold ? null : safeValue;
      if (normalized !== overrideFlags.overrideMinCreditThreshold) {
        updates.overrideMinCreditThreshold = normalized;
      }
    }

    if (Object.keys(updates).length === 0) {
      setFlagSaving(false);
      return;
    }

    const previousOverrides = { ...overrideFlags };
    const previousMerged = { ...mergedFlags };

    const nextOverrideState = { ...overrideFlags, ...updates };
    const nextMergedState = {
      requiresPermission: nextOverrideState.overrideRequiresPermission ?? courseFlags.requiresPermission,
      summerOnly: nextOverrideState.overrideSummerOnly ?? courseFlags.summerOnly,
      requiresSeniorStanding: nextOverrideState.overrideRequiresSeniorStanding ?? courseFlags.requiresSeniorStanding,
      minCreditThreshold: nextOverrideState.overrideMinCreditThreshold ?? courseFlags.minCreditThreshold ?? null,
    };

    setOverrideFlags(nextOverrideState);
    setMergedFlags(nextMergedState);

    console.log('Calling updateOverrides with:', { curriculumId, selectedCurriculumCourseId, updates });

    curriculumCourseConstraintsApi
      .updateOverrides(curriculumId as string, selectedCurriculumCourseId as string, updates)
      .then((response) => {
        console.log('updateOverrides response:', response);
        setOverrideFlags(response);
        setMergedFlags({
          requiresPermission: response.overrideRequiresPermission ?? courseFlags.requiresPermission,
          summerOnly: response.overrideSummerOnly ?? courseFlags.summerOnly,
          requiresSeniorStanding: response.overrideRequiresSeniorStanding ?? courseFlags.requiresSeniorStanding,
          minCreditThreshold: response.overrideMinCreditThreshold ?? courseFlags.minCreditThreshold ?? null,
        });
      })
      .catch((err) => {
        console.error('updateOverrides error:', err);
        setOverrideFlags(previousOverrides);
        setMergedFlags(previousMerged);
        setError(err instanceof Error ? err.message : 'Failed to save flag changes');
      })
      .finally(() => {
        setFlagSaving(false);
      });
  };

  const getConstraintTypeLabel = (type: string) => {
    switch(type) {
      case 'prerequisites': return 'Prerequisites';
      case 'bannedCombinations': return 'Banned Combinations';
      case 'corequisites': return 'Co-requisites';
      default: return type;
    }
  };

  const getConstraintColor = (type: string) => {
    switch(type) {
      case 'prerequisites': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'bannedCombinations': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'corequisites': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const basePrereqCount = constraints.prerequisites.length;
  const curriculumPrereqCount = curriculumPrerequisitesState.length;
  const totalPrereqCount = basePrereqCount + curriculumPrereqCount;

  const baseCoreqCount = constraints.corequisites.length;
  const curriculumCoreqCount = curriculumCorequisitesState.length;
  const totalCoreqCount = baseCoreqCount + curriculumCoreqCount;

  const curriculumBannedCount = (constraints.bannedCombinations as any[]).filter(item => item?.type === 'curriculumConstraint').length;
  const baseBannedCount = (constraints.bannedCombinations as any[]).filter(item => item?.type !== 'curriculumConstraint').length;
  const totalBannedCount = constraints.bannedCombinations.length;

  const overrideRequiresPermission = overrideFlags.overrideRequiresPermission;
  const overrideSummerOnly = overrideFlags.overrideSummerOnly;
  const overrideRequiresSeniorStanding = overrideFlags.overrideRequiresSeniorStanding;
  const overrideMinCreditThreshold = overrideFlags.overrideMinCreditThreshold;

  const finalRequiresPermission = overrideRequiresPermission !== null && overrideRequiresPermission !== undefined
    ? Boolean(overrideRequiresPermission)
    : courseFlags.requiresPermission;

  const finalSummerOnly = overrideSummerOnly !== null && overrideSummerOnly !== undefined
    ? Boolean(overrideSummerOnly)
    : courseFlags.summerOnly;

  const finalRequiresSeniorStanding = overrideRequiresSeniorStanding !== null && overrideRequiresSeniorStanding !== undefined
    ? Boolean(overrideRequiresSeniorStanding)
    : courseFlags.requiresSeniorStanding;

  const finalMinCreditThreshold = overrideMinCreditThreshold !== null && overrideMinCreditThreshold !== undefined
    ? overrideMinCreditThreshold
    : courseFlags.minCreditThreshold;

  const finalPermissionOrigin = overrideRequiresPermission !== null && overrideRequiresPermission !== undefined
    ? 'Curriculum override'
    : 'Course default';

  const finalSummerOrigin = overrideSummerOnly !== null && overrideSummerOnly !== undefined
    ? 'Curriculum override'
    : 'Course default';

  const finalSeniorOrigin = (overrideRequiresSeniorStanding !== null && overrideRequiresSeniorStanding !== undefined) || (overrideMinCreditThreshold !== null && overrideMinCreditThreshold !== undefined)
    ? 'Curriculum override'
    : 'Course default';

  const overrideSummary: string[] = [];
  if (overrideRequiresPermission !== null && overrideRequiresPermission !== undefined) {
    overrideSummary.push(`Permission requirement ${overrideRequiresPermission ? 'enforced' : 'removed'} for this curriculum.`);
  }
  if (overrideSummerOnly !== null && overrideSummerOnly !== undefined) {
    overrideSummary.push(`Availability set to ${overrideSummerOnly ? 'Summer session only' : 'all terms'} for this curriculum.`);
  }
  if (overrideRequiresSeniorStanding !== null && overrideRequiresSeniorStanding !== undefined) {
    overrideSummary.push(`Senior standing ${overrideRequiresSeniorStanding ? 'required' : 'not required'} for this curriculum.`);
  }
  if (overrideMinCreditThreshold !== null && overrideMinCreditThreshold !== undefined) {
    overrideSummary.push(`Minimum credit threshold adjusted to ${overrideMinCreditThreshold} credits.`);
  }

  const displayConstraints = {
    prerequisites: [
      ...constraints.prerequisites.map(course => ({
        key: `course-${course.id ?? course.code}`,
        code: course.code,
        name: course.name,
        source: 'Course default',
        isCurriculum: false,
        raw: course,
      })),
      ...curriculumPrerequisitesState.map(pr => ({
        key: `curriculum-${pr.id}`,
        code: pr.code,
        name: pr.name,
        source: 'Curriculum override',
        isCurriculum: true,
        raw: pr,
      }))
    ],
    corequisites: [
      ...constraints.corequisites.map(course => ({
        key: `course-${course.id ?? course.code}`,
        code: course.code,
        name: course.name,
        source: 'Course default',
        isCurriculum: false,
        raw: course,
      })),
      ...curriculumCorequisitesState.map(coreq => ({
        key: `curriculum-${coreq.id}`,
        code: coreq.code,
        name: coreq.name,
        source: 'Curriculum override',
        isCurriculum: true,
        raw: coreq,
      }))
    ],
    bannedCombinations: (constraints.bannedCombinations as any[])
      .map(item => {
        const isCurriculum = item?.type === 'curriculumConstraint';
        const code = isCurriculum ? item?.otherCourse?.code ?? item?.code : item?.code;
        const name = isCurriculum ? item?.otherCourse?.name ?? item?.description ?? '' : item?.name;
        if (!code) return null;
        return {
          key: `${isCurriculum ? 'curriculum' : 'course'}-${code}`,
          code,
          name,
          source: isCurriculum ? 'Curriculum override' : 'Course default',
          isCurriculum,
          raw: item,
        };
      })
      .filter((entry): entry is { key: string; code: string; name?: string; source: string; isCurriculum: boolean; raw: any } => Boolean(entry))
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      

      
      <div className="flex gap-8 min-h-[700px]">
        {/* Left Side - Course Selection */}
        <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-foreground flex items-center justify-between">
            Select Course
            {selectedCourse && (
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Clear selection"
              >
                Clear
              </button>
            )}
          </h3>
          
          {/* Search Bar */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses by code or name..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                autoFocus
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Course List */}
          <div className="flex-1 overflow-hidden">
            {/* Course count indicator */}
            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {filteredCourses.length > 0 ? (
                <>
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} 
                  {filteredCourses.length > 15 && ' (scrollable)'}
                </>
              ) : (
                'No courses found'
              )}
            </div>
            
            {/* Scrollable course list with proper container */}
            <div className="border border-gray-200 dark:border-border rounded-lg p-2 bg-gray-50 dark:bg-gray-800/30">
              <div 
                className={`space-y-2 overflow-y-auto hide-scrollbar ${
                  filteredCourses.length > 15 ? 'max-h-[480px]' : 'h-full'
                }`}
                style={{ 
                  // Calculate height for optimal display (each course item ~56px including gap)
                  maxHeight: filteredCourses.length > 15 ? '480px' : 'auto', paddingRight: '0.2rem',paddingLeft: '0.2rem',
                }}
              >
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, idx) => {
                  const courseId = getCourseIdentifier(course);
                  const isSelected = selectedCourse !== null && String(courseId) === String(selectedCourse);
                  
                  return (
                  <div
                    key={courseId || idx}
                    className={`p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      isSelected 
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary/40 dark:border-primary/50 shadow-md ring-2 ring-primary/30' 
                        : 'bg-white dark:bg-card hover:shadow-sm'
                    }`}
                    onClick={() => {
                      console.log('Clicking course:', course.code, 'ID:', course.id, 'Using identifier:', courseId);
                      setSelectedCourse(courseId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCourse(courseId);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${course.code} for constraint management`}
                    title={`Select ${course.code} - ${course.name} for constraint management`}
                  >
                    <div className="font-semibold text-sm text-foreground flex items-center justify-between">
                      <span>{course.code}</span>
                      {isSelected && (
                        <span className="text-primary text-xs font-medium">Selected</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {course.name}
                      {course.credits && (
                        <span className="ml-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                          {course.credits} cr
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center py-8">
                    <div className="text-sm">
                      {courseSearch ? 'No courses found matching your search' : 'No courses available'}
                    </div>
                    {courseSearch && (
                      <button
                        onClick={() => setCourseSearch('')}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Right Side - Constraints Management */}
        <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          {selectedCourse ? (
            <>
              <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                <span>Course Constraints for</span>
                <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg font-mono text-base border border-primary/20">
                  {getSelectedCourseData().code}
                </span>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full"></div>
                    Loading...
                  </div>
                )}
              </h3>
              
              {/* Simplified Visualization */}
              <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm border-4 border-primary/80 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg">{getSelectedCourseData().code}</div>
                      <div className="text-xs mt-1">{getSelectedCourseData().name.split(' ').slice(0, 3).join(' ')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="group hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center justify-center gap-1">
                       Prerequisites
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPrereqCount}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Course {basePrereqCount} • Curriculum {curriculumPrereqCount}
                    </div>
                  </div>
                  <div className="group hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-red-700 dark:text-red-300 mb-1 flex items-center justify-center gap-1">
                       Banned
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalBannedCount}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Course {baseBannedCount} • Curriculum {curriculumBannedCount}
                    </div>
                  </div>
                  <div className="group hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-primary mb-1 flex items-center justify-center gap-1">
                       Co-requisites
                    </div>
                    <div className="text-2xl font-bold text-primary">{totalCoreqCount}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Course {baseCoreqCount} • Curriculum {curriculumCoreqCount}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Course Selected State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-xl font-bold mb-2 text-foreground">Select a Course</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Choose a course from the list on the left to view and manage its constraints, prerequisites, and corequisites.
              </p>
            </div>
          )}
          
          {selectedCourse && (
            <>
              {/* Course Relationship Constraints */}
              <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-border rounded-xl p-6">
                <h4 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  Course Relationship Constraints
                </h4>
            
            {/* Current Constraints Display */}
            <div className="space-y-4 mb-6">
              {Object.entries(displayConstraints).map(([type, courseList]) => (
                <div key={type}>
                  <h5 className="font-semibold mb-2 text-foreground">{getConstraintTypeLabel(type)}</h5>
                  <div className="flex flex-wrap gap-2">
                    {courseList.length > 0 ? (
                      courseList.map((item: any, idx: number) => {
                        const displayCode = item.code || `Unknown-${idx}`;
                        const displayName = item.name || 'Unknown Course';
                        const itemKey = item.key || `${item.source}-${displayCode}-${idx}`;

                        return (
                          <div key={itemKey} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getConstraintColor(type)} group hover:shadow-sm transition-all`}>
                            <span className="font-medium">{displayCode}</span>
                            <span className="text-xs opacity-75">({displayName.split(' ').slice(0, 2).join(' ')})</span>
                            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${item.isCurriculum ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'}`}>
                              {item.source}
                            </span>
                            {item.isCurriculum ? (
                              <button 
                                suppressHydrationWarning
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Remove curriculum override ${displayCode}?`)) {
                                    handleRemoveConstraint(type, item.raw);
                                  }
                                }}
                                disabled={saving}
                                className="text-current hover:text-red-500 dark:hover:text-red-400 text-base font-bold disabled:opacity-50 ml-1 hover:scale-110 transition-all"
                                title={`Remove curriculum override for ${displayCode}`}
                              >
                                ×
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-600 dark:text-gray-300 ml-1">Course default</span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">No {type} set</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Constraint */}
            <div className="border-t border-gray-200 dark:border-border pt-4">
              <h5 className="font-semibold mb-3 text-foreground">Add Course Constraint</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Constraint Type</label>
                  <select 
                    value={constraintType}
                    onChange={(e) => setConstraintType(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                  >
                    <option value="prerequisites">Prerequisites</option>
                    <option value="corequisites">Co-requisites</option>
                    <option value="bannedCombinations">Banned Combinations</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Select Course</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select course..."
                      value={constraintCourseSearch}
                      onChange={(e) => setConstraintCourseSearch(e.target.value)}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                    />
                    {constraintCourseSearch && filteredConstraintCourses.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredConstraintCourses.slice(0, 10).map(course => (
                          <div
                            key={getCourseIdentifier(course)}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedConstraintCourse(getCourseIdentifier(course));
                              setConstraintCourseSearch(`${course.code} - ${course.name}`);
                            }}
                          >
                            <div className="font-medium">{course.code}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{course.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button 
                    suppressHydrationWarning
                    onClick={handleAddConstraint}
                    disabled={!selectedConstraintCourse || saving}
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Constraint'}
                  </button>
                </div>
              </div>

              {/* Constraint Type Descriptions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  {constraintType === 'prerequisites' && 'Prerequisites'}
                  {constraintType === 'corequisites' && 'Co-requisites'}
                  {constraintType === 'bannedCombinations' && 'Banned Combinations'}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  {constraintType === 'prerequisites' && 'Courses that must be completed before taking this course.'}
                  {constraintType === 'corequisites' && 'Courses that must be taken simultaneously with this course.'}
                  {constraintType === 'bannedCombinations' && 'Courses that cannot be taken together with this course.'}
                </div>
              </div>
            </div>
          </div>

          {/* Other Constraints */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-border rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
              Course Flags & Special Requirements
              {flagSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full"></div>
                  Saving...
                </div>
              )}
            </h4>
            
            <div className="space-y-4">
              {overrideSummary.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-400/40 rounded-lg text-amber-800 dark:text-amber-100 text-sm">
                  <p className="font-semibold">Curriculum overrides in effect</p>
                  <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                    {overrideSummary.map(message => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-200/80">
                    Edits below apply only to this curriculum; base course defaults stay unchanged.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Chairperson Permission Required</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Students need special approval to enroll</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Final status: {finalRequiresPermission ? 'Permission required' : 'Permission not required'} ({finalPermissionOrigin})
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={finalRequiresPermission}
                    onChange={(e) => handleFlagChange('requiresPermission', e.target.checked)}
                    disabled={flagSaving}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Summer Session Only</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Course can only be taken during summer sessions</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Final status: {finalSummerOnly ? 'Summer only' : 'Available all terms'} ({finalSummerOrigin})
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={finalSummerOnly}
                    onChange={(e) => handleFlagChange('summerOnly', e.target.checked)}
                    disabled={flagSaving}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Senior Standing Required</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Student must be a senior with specified credit threshold</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Final status: {finalRequiresSeniorStanding
                      ? `Senior standing required${finalMinCreditThreshold ? ` (${finalMinCreditThreshold}+ credits)` : ''}`
                      : 'Senior standing not required'} ({finalSeniorOrigin})
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={finalRequiresSeniorStanding}
                    onChange={(e) => handleFlagChange('requiresSeniorStanding', e.target.checked)}
                    disabled={flagSaving}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              
              {/* Credit Threshold Input - shown when Senior Standing is disabled so user can set it before enabling */}
              {!finalRequiresSeniorStanding && (
                <div className="p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                  <div className="mb-3">
                    <div className="font-semibold text-foreground">Minimum Credit Threshold</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Set minimum credits required for senior standing before enabling the requirement</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      value={overrideMinCreditThreshold ?? courseFlags.minCreditThreshold ?? ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const parsedValue = rawValue === '' ? null : Number.parseInt(rawValue, 10);
                        const sanitizedValue = typeof parsedValue === 'number' && !Number.isNaN(parsedValue)
                          ? parsedValue
                          : null;
                        handleFlagChange('minCreditThreshold', sanitizedValue);
                      }}
                      disabled={flagSaving}
                      className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm disabled:opacity-50"
                      placeholder="90"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">credits</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    NOTE: This threshold will be used when "Senior Standing Required" is enabled
                  </p>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
