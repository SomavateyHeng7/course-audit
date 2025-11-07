# SP2 Course Rule Overrides - Implementation Guide

**Date:** November 5, 2025  
**Feature:** Curriculum-Specific Course Rule Overrides  
**Schema File:** `prisma/schema_for_sp2.prisma`

---

## 📋 Overview

The SP2 schema now supports **curriculum-specific overrides** for course rules, allowing the same course to have different requirements in different curricula.

### New Fields in `CurriculumCourse`:
```prisma
overrideRequiresPermission     Boolean?  // NULL = use Course default
overrideSummerOnly             Boolean?  // NULL = use Course default
overrideRequiresSeniorStanding Boolean?  // NULL = use Course default
overrideMinCreditThreshold     Int?      // NULL = use Course default
```

---

## 🎯 Use Cases

### Scenario 1: Summer-Only Override
**Problem:** "Internship" course is summer-only in old curricula, but available year-round in new 2025 curriculum.

**Solution:**
- Course model: `summerOnly = true` (global default)
- Old curricula: `overrideSummerOnly = NULL` (uses default = true)
- New curriculum: `overrideSummerOnly = false` (override = false)

### Scenario 2: Senior Standing Requirement
**Problem:** "Advanced Algorithms" requires senior standing in CS curriculum, but not in Software Engineering curriculum.

**Solution:**
- Course model: `requiresSeniorStanding = false` (global default)
- CS curriculum: `overrideRequiresSeniorStanding = true` (override = true)
- SE curriculum: `overrideRequiresSeniorStanding = NULL` (uses default = false)

### Scenario 3: Permission Requirements
**Problem:** "Special Topics" requires permission in most curricula, but not in honors program.

**Solution:**
- Course model: `requiresPermission = true` (global default)
- Regular curricula: `overrideRequiresPermission = NULL` (uses default = true)
- Honors curriculum: `overrideRequiresPermission = false` (override = false)

---

## 🔧 Implementation: Helper Functions

### Create Utility File: `src/lib/courseRuleHelpers.ts`

```typescript
import { Course, CurriculumCourse } from '@prisma/client';

/**
 * Get the effective value for requiresPermission in a curriculum
 * @param course The course with global defaults
 * @param curriculumCourse The curriculum-course junction with potential overrides
 * @returns The effective permission requirement for this curriculum
 */
export function requiresPermissionInCurriculum(
  course: Course,
  curriculumCourse: CurriculumCourse
): boolean {
  // If override is set (not null), use it; otherwise use course default
  return curriculumCourse.overrideRequiresPermission ?? course.requiresPermission;
}

/**
 * Get the effective value for summerOnly in a curriculum
 */
export function isSummerOnlyInCurriculum(
  course: Course,
  curriculumCourse: CurriculumCourse
): boolean {
  return curriculumCourse.overrideSummerOnly ?? course.summerOnly;
}

/**
 * Get the effective value for requiresSeniorStanding in a curriculum
 */
export function requiresSeniorStandingInCurriculum(
  course: Course,
  curriculumCourse: CurriculumCourse
): boolean {
  return curriculumCourse.overrideRequiresSeniorStanding ?? course.requiresSeniorStanding;
}

/**
 * Get the effective value for minCreditThreshold in a curriculum
 */
export function getMinCreditThresholdInCurriculum(
  course: Course,
  curriculumCourse: CurriculumCourse
): number | null {
  return curriculumCourse.overrideMinCreditThreshold ?? course.minCreditThreshold;
}

/**
 * Get all effective course rules for a curriculum
 * Useful for validation and display
 */
export function getCourseRulesInCurriculum(
  course: Course,
  curriculumCourse: CurriculumCourse
) {
  return {
    requiresPermission: requiresPermissionInCurriculum(course, curriculumCourse),
    summerOnly: isSummerOnlyInCurriculum(course, curriculumCourse),
    requiresSeniorStanding: requiresSeniorStandingInCurriculum(course, curriculumCourse),
    minCreditThreshold: getMinCreditThresholdInCurriculum(course, curriculumCourse),
    
    // Metadata about overrides (for UI display)
    overrides: {
      hasPermissionOverride: curriculumCourse.overrideRequiresPermission !== null,
      hasSummerOnlyOverride: curriculumCourse.overrideSummerOnly !== null,
      hasSeniorStandingOverride: curriculumCourse.overrideRequiresSeniorStanding !== null,
      hasMinCreditThresholdOverride: curriculumCourse.overrideMinCreditThreshold !== null,
    }
  };
}

/**
 * Check if a course has any overrides in a curriculum
 */
export function hasAnyOverrides(curriculumCourse: CurriculumCourse): boolean {
  return (
    curriculumCourse.overrideRequiresPermission !== null ||
    curriculumCourse.overrideSummerOnly !== null ||
    curriculumCourse.overrideRequiresSeniorStanding !== null ||
    curriculumCourse.overrideMinCreditThreshold !== null
  );
}

/**
 * Type-safe override setter for API routes
 */
export type CourseRuleOverrides = {
  overrideRequiresPermission?: boolean | null;
  overrideSummerOnly?: boolean | null;
  overrideRequiresSeniorStanding?: boolean | null;
  overrideMinCreditThreshold?: number | null;
};

/**
 * Validate course rule overrides before saving
 */
export function validateCourseRuleOverrides(
  overrides: CourseRuleOverrides
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate minCreditThreshold if provided
  if (overrides.overrideMinCreditThreshold !== null && 
      overrides.overrideMinCreditThreshold !== undefined) {
    if (overrides.overrideMinCreditThreshold < 0) {
      errors.push('Minimum credit threshold cannot be negative');
    }
    if (overrides.overrideMinCreditThreshold > 200) {
      errors.push('Minimum credit threshold seems unreasonably high');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 📡 API Changes Required

### 1. Update Curriculum Course Creation/Update API

**File:** `src/app/api/curricula/[id]/courses/route.ts` (or wherever you manage curriculum courses)

#### Add Override Fields to Request Schema:

```typescript
import { z } from 'zod';

const updateCurriculumCourseSchema = z.object({
  isRequired: z.boolean().optional(),
  semester: z.string().optional(),
  year: z.number().optional(),
  position: z.number().optional(),
  
  // 🆕 SP2: Course rule overrides
  overrideRequiresPermission: z.boolean().nullable().optional(),
  overrideSummerOnly: z.boolean().nullable().optional(),
  overrideRequiresSeniorStanding: z.boolean().nullable().optional(),
  overrideMinCreditThreshold: z.number().min(0).max(200).nullable().optional(),
});
```

#### Update API Handler:

```typescript
// POST/PUT handler
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... auth checks ...
  
  const body = await request.json();
  const data = updateCurriculumCourseSchema.parse(body);
  
  const updatedCourse = await prisma.curriculumCourse.update({
    where: { 
      curriculumId_courseId: {
        curriculumId: params.id,
        courseId: body.courseId
      }
    },
    data: {
      isRequired: data.isRequired,
      semester: data.semester,
      year: data.year,
      position: data.position,
      
      // 🆕 SP2: Update overrides
      overrideRequiresPermission: data.overrideRequiresPermission,
      overrideSummerOnly: data.overrideSummerOnly,
      overrideRequiresSeniorStanding: data.overrideRequiresSeniorStanding,
      overrideMinCreditThreshold: data.overrideMinCreditThreshold,
    },
    include: {
      course: true
    }
  });
  
  return NextResponse.json(updatedCourse);
}
```

---

### 2. Update Course Validation API

**File:** `src/lib/courseValidation.ts`

Update validation logic to use curriculum-specific rules:

```typescript
import { 
  requiresPermissionInCurriculum, 
  isSummerOnlyInCurriculum,
  requiresSeniorStandingInCurriculum,
  getMinCreditThresholdInCurriculum
} from '@/lib/courseRuleHelpers';

export async function validateCourseEligibility(
  studentId: string,
  courseId: string,
  curriculumId: string
) {
  // Fetch course with curriculum context
  const curriculumCourse = await prisma.curriculumCourse.findUnique({
    where: {
      curriculumId_courseId: {
        curriculumId,
        courseId
      }
    },
    include: {
      course: true
    }
  });
  
  if (!curriculumCourse) {
    return { eligible: false, reason: 'Course not in curriculum' };
  }
  
  const { course } = curriculumCourse;
  const errors: string[] = [];
  
  // ✅ Use curriculum-specific rules instead of global ones
  
  // Check permission requirement
  if (requiresPermissionInCurriculum(course, curriculumCourse)) {
    // Check if student has permission
    const hasPermission = await checkStudentPermission(studentId, courseId);
    if (!hasPermission) {
      errors.push('This course requires instructor permission');
    }
  }
  
  // Check summer-only restriction
  if (isSummerOnlyInCurriculum(course, curriculumCourse)) {
    const currentSemester = await getCurrentSemester();
    if (currentSemester !== 'summer') {
      errors.push('This course is only offered in summer');
    }
  }
  
  // Check senior standing requirement
  if (requiresSeniorStandingInCurriculum(course, curriculumCourse)) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { credits: true }
    });
    
    if (!student || (student.credits ?? 0) < 90) {
      errors.push('This course requires senior standing (90+ credits)');
    }
  }
  
  // Check minimum credit threshold
  const minThreshold = getMinCreditThresholdInCurriculum(course, curriculumCourse);
  if (minThreshold !== null) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { credits: true }
    });
    
    if (!student || (student.credits ?? 0) < minThreshold) {
      errors.push(`This course requires at least ${minThreshold} credits`);
    }
  }
  
  return {
    eligible: errors.length === 0,
    errors
  };
}
```

---

### 3. Update Available Courses API

**File:** `src/app/api/available-courses/route.ts`

Include override information in response:

```typescript
import { getCourseRulesInCurriculum } from '@/lib/courseRuleHelpers';

export async function GET(request: NextRequest) {
  // ... existing code to fetch curriculum courses ...
  
  const availableCourses = curriculum.curriculumCourses.map(currCourse => {
    const course = currCourse.course;
    
    // 🆕 SP2: Get effective rules for this curriculum
    const effectiveRules = getCourseRulesInCurriculum(course, currCourse);
    
    return {
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      
      // Use curriculum-specific rules instead of global ones
      requiresPermission: effectiveRules.requiresPermission,
      summerOnly: effectiveRules.summerOnly,
      requiresSeniorStanding: effectiveRules.requiresSeniorStanding,
      minCreditThreshold: effectiveRules.minCreditThreshold,
      
      // Include override metadata for UI
      hasOverrides: effectiveRules.overrides.hasPermissionOverride ||
                    effectiveRules.overrides.hasSummerOnlyOverride ||
                    effectiveRules.overrides.hasSeniorStandingOverride ||
                    effectiveRules.overrides.hasMinCreditThresholdOverride,
      
      // ... other fields ...
    };
  });
  
  return NextResponse.json(availableCourses);
}
```

---

## 🎨 Frontend Components

### 1. Course Rule Override Editor

**Component:** `src/components/CourseRuleOverrideEditor.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CourseRuleOverrideEditorProps {
  courseDefaults: {
    requiresPermission: boolean;
    summerOnly: boolean;
    requiresSeniorStanding: boolean;
    minCreditThreshold: number | null;
  };
  currentOverrides: {
    overrideRequiresPermission: boolean | null;
    overrideSummerOnly: boolean | null;
    overrideRequiresSeniorStanding: boolean | null;
    overrideMinCreditThreshold: number | null;
  };
  onChange: (overrides: typeof currentOverrides) => void;
}

export function CourseRuleOverrideEditor({
  courseDefaults,
  currentOverrides,
  onChange
}: CourseRuleOverrideEditorProps) {
  const [localOverrides, setLocalOverrides] = useState(currentOverrides);
  
  const updateOverride = <K extends keyof typeof localOverrides>(
    key: K,
    value: typeof localOverrides[K]
  ) => {
    const updated = { ...localOverrides, [key]: value };
    setLocalOverrides(updated);
    onChange(updated);
  };
  
  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Curriculum-Specific Course Rules
        </h3>
        <p className="text-sm text-gray-600">
          Override course rules for this curriculum only. Leave unset to use course defaults.
        </p>
      </div>
      
      {/* Requires Permission */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label>Requires Permission</Label>
          <p className="text-sm text-gray-500">
            Default: {courseDefaults.requiresPermission ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localOverrides.overrideRequiresPermission !== null && (
            <Badge variant="secondary">Override Active</Badge>
          )}
          <Switch
            checked={localOverrides.overrideRequiresPermission ?? courseDefaults.requiresPermission}
            onCheckedChange={(checked) => 
              updateOverride('overrideRequiresPermission', checked)
            }
          />
          <button
            onClick={() => updateOverride('overrideRequiresPermission', null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset to Default
          </button>
        </div>
      </div>
      
      {/* Summer Only */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label>Summer Only</Label>
          <p className="text-sm text-gray-500">
            Default: {courseDefaults.summerOnly ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localOverrides.overrideSummerOnly !== null && (
            <Badge variant="secondary">Override Active</Badge>
          )}
          <Switch
            checked={localOverrides.overrideSummerOnly ?? courseDefaults.summerOnly}
            onCheckedChange={(checked) => 
              updateOverride('overrideSummerOnly', checked)
            }
          />
          <button
            onClick={() => updateOverride('overrideSummerOnly', null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset to Default
          </button>
        </div>
      </div>
      
      {/* Senior Standing Required */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label>Requires Senior Standing</Label>
          <p className="text-sm text-gray-500">
            Default: {courseDefaults.requiresSeniorStanding ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localOverrides.overrideRequiresSeniorStanding !== null && (
            <Badge variant="secondary">Override Active</Badge>
          )}
          <Switch
            checked={localOverrides.overrideRequiresSeniorStanding ?? courseDefaults.requiresSeniorStanding}
            onCheckedChange={(checked) => 
              updateOverride('overrideRequiresSeniorStanding', checked)
            }
          />
          <button
            onClick={() => updateOverride('overrideRequiresSeniorStanding', null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset to Default
          </button>
        </div>
      </div>
      
      {/* Min Credit Threshold */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label>Minimum Credit Threshold</Label>
          <p className="text-sm text-gray-500">
            Default: {courseDefaults.minCreditThreshold ?? 'None'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localOverrides.overrideMinCreditThreshold !== null && (
            <Badge variant="secondary">Override Active</Badge>
          )}
          <Input
            type="number"
            min={0}
            max={200}
            className="w-24"
            value={localOverrides.overrideMinCreditThreshold ?? courseDefaults.minCreditThreshold ?? ''}
            onChange={(e) => 
              updateOverride('overrideMinCreditThreshold', 
                e.target.value ? parseInt(e.target.value) : null)
            }
          />
          <button
            onClick={() => updateOverride('overrideMinCreditThreshold', null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. Course Card with Override Indicators

**Component:** `src/components/CourseCardWithOverrides.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface CourseCardWithOverridesProps {
  course: {
    code: string;
    name: string;
    requiresPermission: boolean;
    summerOnly: boolean;
    requiresSeniorStanding: boolean;
    hasOverrides?: boolean;
  };
}

export function CourseCardWithOverrides({ course }: CourseCardWithOverridesProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{course.code}</h3>
          <p className="text-sm text-gray-600">{course.name}</p>
        </div>
        
        {course.hasOverrides && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Curriculum-Specific Rules
          </Badge>
        )}
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2">
        {course.requiresPermission && (
          <Badge variant="secondary">Permission Required</Badge>
        )}
        {course.summerOnly && (
          <Badge variant="secondary">Summer Only</Badge>
        )}
        {course.requiresSeniorStanding && (
          <Badge variant="secondary">Senior Standing</Badge>
        )}
      </div>
    </div>
  );
}
```

---

## 🗄️ Database Migration

### Migration SQL for Override Fields:

```sql
-- Add override columns to curriculum_courses table
ALTER TABLE curriculum_courses 
ADD COLUMN "overrideRequiresPermission" BOOLEAN,
ADD COLUMN "overrideSummerOnly" BOOLEAN,
ADD COLUMN "overrideRequiresSeniorStanding" BOOLEAN,
ADD COLUMN "overrideMinCreditThreshold" INTEGER;

-- All columns are nullable by default (NULL = use Course defaults)
-- No data migration needed - existing records will use course defaults
```

---

## ✅ Testing Scenarios

### Test 1: Override Summer-Only Rule
1. Course "Internship" has `summerOnly = true` globally
2. Create Curriculum A with Internship
3. Set `overrideSummerOnly = false` for Curriculum A
4. Verify Internship shows as year-round in Curriculum A
5. Create Curriculum B with same Internship
6. Leave `overrideSummerOnly = null` for Curriculum B
7. Verify Internship shows as summer-only in Curriculum B

### Test 2: Override Permission Requirement
1. Course "Special Topics" has `requiresPermission = true` globally
2. In Honors Curriculum, set `overrideRequiresPermission = false`
3. Verify honors students can register without permission
4. Regular curriculum uses NULL override
5. Verify regular students still need permission

### Test 3: Reset to Default
1. Set override for a course in curriculum
2. Click "Reset to Default" button
3. Verify override becomes NULL
4. Verify course now uses global default again

---

## 📋 Implementation Checklist

- [ ] Update `schema_for_sp2.prisma` with override fields (DONE)
- [ ] Create `courseRuleHelpers.ts` utility functions
- [ ] Update curriculum course APIs to accept overrides
- [ ] Update course validation logic to use curriculum-specific rules
- [ ] Update available courses API to return effective rules
- [ ] Create `CourseRuleOverrideEditor` component
- [ ] Update curriculum editor to include override editor
- [ ] Add override indicators to course cards
- [ ] Create database migration
- [ ] Test all override scenarios
- [ ] Update API documentation
- [ ] Update user manual for chairpersons

---

## 🎯 Benefits

✅ **Complete Curriculum Isolation** - Course rules are fully curriculum-specific  
✅ **Backward Compatible** - NULL overrides = use global defaults  
✅ **Flexible** - Can override any combination of rules  
✅ **Consistent** - Matches pattern of course types and elective rules  
✅ **User-Friendly** - Clear UI for setting and resetting overrides  

---

**Status:** ✅ Schema updated - Ready for implementation  
**Next Steps:** Review schema changes, then implement helper functions and API updates
