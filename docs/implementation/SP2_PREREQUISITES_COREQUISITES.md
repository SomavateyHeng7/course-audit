# SP2 Curriculum-Specific Prerequisites & Corequisites

**Date:** November 5, 2025  
**Feature:** Curriculum-Specific Course Dependencies  
**Schema File:** `prisma/schema_for_sp2.prisma`

---

## 🎯 Overview

The SP2 schema now includes **curriculum-specific prerequisites and corequisites**, allowing the same course to have different dependency requirements in different curricula.

### ✅ What's Now Curriculum-Specific:

1. ✅ **Course Categories** (Core, Elective, etc.) - via `DepartmentCourseType`
2. ✅ **Required vs Elective Status** - via `CurriculumCourse.isRequired`
3. ✅ **Course Rule Overrides** - via `CurriculumCourse.override*` fields
4. ✅ **Prerequisites** - via `CurriculumCoursePrerequisite` (NEW)
5. ✅ **Corequisites** - via `CurriculumCourseCorequisite` (NEW)
6. ✅ **Banned Combinations** - via `CurriculumBlacklist` (already existed)

---

## 📊 New Schema Models

### 1. CurriculumCoursePrerequisite

```prisma
model CurriculumCoursePrerequisite {
  id                   String           @id @default(cuid())
  curriculumCourseId   String           // The course that has the prerequisite
  prerequisiteCourseId String           // The course that is the prerequisite
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  curriculumCourse     CurriculumCourse @relation("CurriculumCoursePrerequisites", ...)
  prerequisiteCourse   CurriculumCourse @relation("DependentCurriculumCourses", ...)

  @@unique([curriculumCourseId, prerequisiteCourseId])
  @@index([curriculumCourseId])
  @@index([prerequisiteCourseId])
  @@map("curriculum_course_prerequisites")
}
```

**Key Points:**
- Links two `CurriculumCourse` records (not Course records)
- Curriculum-scoped: Prerequisites only apply within that curriculum
- Can supplement or override global prerequisites

### 2. CurriculumCourseCorequisite

```prisma
model CurriculumCourseCorequisite {
  id                    String           @id @default(cuid())
  curriculumCourseId    String           // The course that has the corequisite
  corequisiteCourseId   String           // The course that is the corequisite
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  curriculumCourse      CurriculumCourse @relation("CurriculumCourseCorequisites", ...)
  corequisiteCourse     CurriculumCourse @relation("DependentCurriculumCorequisites", ...)

  @@unique([curriculumCourseId, corequisiteCourseId])
  @@index([curriculumCourseId])
  @@index([corequisiteCourseId])
  @@map("curriculum_course_corequisites")
}
```

**Key Points:**
- Links two `CurriculumCourse` records
- Curriculum-scoped: Corequisites only apply within that curriculum
- Can supplement or override global corequisites

---

## 🔍 How It Works: Fallback Strategy

### Two-Tier System:

#### Tier 1: Curriculum-Specific (Priority)
Check `CurriculumCoursePrerequisite` / `CurriculumCourseCorequisite` first.

#### Tier 2: Global Fallback
If no curriculum-specific dependencies exist, fall back to `CoursePrerequisite` / `CourseCorequisite`.

### Logic Flow:

```typescript
function getPrerequisites(curriculumCourseId: string) {
  // Step 1: Check curriculum-specific prerequisites
  const curriculumPrereqs = await prisma.curriculumCoursePrerequisite.findMany({
    where: { curriculumCourseId }
  });
  
  // Step 2: If curriculum-specific exist, use them
  if (curriculumPrereqs.length > 0) {
    return curriculumPrereqs.map(p => p.prerequisiteCourse);
  }
  
  // Step 3: Otherwise, fall back to global prerequisites
  const globalPrereqs = await prisma.coursePrerequisite.findMany({
    where: { courseId: curriculumCourse.courseId }
  });
  
  return globalPrereqs.map(p => p.prerequisite);
}
```

---

## 💡 Use Cases

### Use Case 1: Additional Prerequisites in Advanced Curriculum

**Scenario:**
- Course: "Advanced Algorithms"
- Global prerequisite: "Data Structures"
- Honors curriculum: Needs "Data Structures" AND "Discrete Math"

**Solution:**
```typescript
// Regular Curriculum - uses global prerequisite
// No curriculum-specific prerequisites defined
// → Falls back to global: requires "Data Structures"

// Honors Curriculum - has curriculum-specific prerequisites
await prisma.curriculumCoursePrerequisite.createMany({
  data: [
    {
      curriculumCourseId: advAlgoInHonors.id,
      prerequisiteCourseId: dataStructuresInHonors.id
    },
    {
      curriculumCourseId: advAlgoInHonors.id,
      prerequisiteCourseId: discreteMathInHonors.id
    }
  ]
});
// → Honors curriculum requires both courses
```

### Use Case 2: Relaxed Prerequisites in Accelerated Program

**Scenario:**
- Course: "Senior Project"
- Global prerequisite: "Junior Standing" (course)
- Accelerated curriculum: No prerequisite (students progress faster)

**Solution:**
```typescript
// Regular Curriculum - uses global prerequisite
// No curriculum-specific prerequisites defined
// → Falls back to global: requires "Junior Standing"

// Accelerated Curriculum - explicitly has NO prerequisites
// Leave curriculum-specific prerequisites empty
// → No prerequisites required
```

### Use Case 3: Different Corequisite Requirements

**Scenario:**
- Course: "Programming Lab"
- Global corequisite: "Programming Theory"
- Part-time curriculum: Can take Lab and Theory separately

**Solution:**
```typescript
// Full-time Curriculum - uses global corequisite
// No curriculum-specific corequisites defined
// → Falls back to global: must take "Programming Theory" together

// Part-time Curriculum - explicitly has NO corequisites
// Leave curriculum-specific corequisites empty
// → Can take Lab and Theory separately
```

---

## 🔧 Implementation: Helper Functions

### Create Utility File: `src/lib/coursePrerequisiteHelpers.ts`

```typescript
import { PrismaClient, CurriculumCourse } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all effective prerequisites for a course in a curriculum
 * Returns curriculum-specific prerequisites if they exist,
 * otherwise falls back to global prerequisites
 */
export async function getEffectivePrerequisites(
  curriculumCourseId: string
): Promise<CurriculumCourse[]> {
  // Step 1: Get the curriculum course
  const curriculumCourse = await prisma.curriculumCourse.findUnique({
    where: { id: curriculumCourseId },
    include: { course: true }
  });

  if (!curriculumCourse) {
    throw new Error('Curriculum course not found');
  }

  // Step 2: Check for curriculum-specific prerequisites
  const curriculumPrereqs = await prisma.curriculumCoursePrerequisite.findMany({
    where: { curriculumCourseId },
    include: {
      prerequisiteCourse: {
        include: { course: true }
      }
    }
  });

  // Step 3: If curriculum-specific prerequisites exist, use them
  if (curriculumPrereqs.length > 0) {
    return curriculumPrereqs.map(p => p.prerequisiteCourse);
  }

  // Step 4: Fall back to global prerequisites
  const globalPrereqs = await prisma.coursePrerequisite.findMany({
    where: { courseId: curriculumCourse.courseId },
    include: { prerequisite: true }
  });

  // Step 5: Convert global prerequisites to curriculum courses
  const prerequisiteCourses = await prisma.curriculumCourse.findMany({
    where: {
      curriculumId: curriculumCourse.curriculumId,
      courseId: { in: globalPrereqs.map(p => p.prerequisiteId) }
    },
    include: { course: true }
  });

  return prerequisiteCourses;
}

/**
 * Get all effective corequisites for a course in a curriculum
 */
export async function getEffectiveCorequisites(
  curriculumCourseId: string
): Promise<CurriculumCourse[]> {
  const curriculumCourse = await prisma.curriculumCourse.findUnique({
    where: { id: curriculumCourseId },
    include: { course: true }
  });

  if (!curriculumCourse) {
    throw new Error('Curriculum course not found');
  }

  // Check for curriculum-specific corequisites
  const curriculumCoreqs = await prisma.curriculumCourseCorequisite.findMany({
    where: { curriculumCourseId },
    include: {
      corequisiteCourse: {
        include: { course: true }
      }
    }
  });

  if (curriculumCoreqs.length > 0) {
    return curriculumCoreqs.map(c => c.corequisiteCourse);
  }

  // Fall back to global corequisites
  const globalCoreqs = await prisma.courseCorequisite.findMany({
    where: { courseId: curriculumCourse.courseId },
    include: { corequisite: true }
  });

  const corequisiteCourses = await prisma.curriculumCourse.findMany({
    where: {
      curriculumId: curriculumCourse.curriculumId,
      courseId: { in: globalCoreqs.map(c => c.corequisiteId) }
    },
    include: { course: true }
  });

  return corequisiteCourses;
}

/**
 * Check if a student has completed all prerequisites for a course in their curriculum
 */
export async function hasCompletedPrerequisites(
  studentId: string,
  curriculumCourseId: string
): Promise<{ satisfied: boolean; missing: CurriculumCourse[] }> {
  const prerequisites = await getEffectivePrerequisites(curriculumCourseId);

  const completedCourses = await prisma.studentCourse.findMany({
    where: {
      studentId,
      status: 'COMPLETED',
      courseId: { in: prerequisites.map(p => p.courseId) }
    }
  });

  const completedCourseIds = new Set(completedCourses.map(c => c.courseId));
  const missingPrereqs = prerequisites.filter(
    p => !completedCourseIds.has(p.courseId)
  );

  return {
    satisfied: missingPrereqs.length === 0,
    missing: missingPrereqs
  };
}

/**
 * Check if a student is enrolled in all required corequisites
 */
export async function hasEnrolledInCorequisites(
  studentId: string,
  curriculumCourseId: string,
  currentSemester: string
): Promise<{ satisfied: boolean; missing: CurriculumCourse[] }> {
  const corequisites = await getEffectiveCorequisites(curriculumCourseId);

  const enrolledCourses = await prisma.studentCourse.findMany({
    where: {
      studentId,
      semester: currentSemester,
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      courseId: { in: corequisites.map(c => c.courseId) }
    }
  });

  const enrolledCourseIds = new Set(enrolledCourses.map(c => c.courseId));
  const missingCoreqs = corequisites.filter(
    c => !enrolledCourseIds.has(c.courseId)
  );

  return {
    satisfied: missingCoreqs.length === 0,
    missing: missingCoreqs
  };
}

/**
 * Check if a course has curriculum-specific prerequisites defined
 */
export async function hasCurriculumSpecificPrerequisites(
  curriculumCourseId: string
): Promise<boolean> {
  const count = await prisma.curriculumCoursePrerequisite.count({
    where: { curriculumCourseId }
  });
  return count > 0;
}

/**
 * Check if a course has curriculum-specific corequisites defined
 */
export async function hasCurriculumSpecificCorequisites(
  curriculumCourseId: string
): Promise<boolean> {
  const count = await prisma.curriculumCourseCorequisite.count({
    where: { curriculumCourseId }
  });
  return count > 0;
}
```

---

## 📡 API Changes Required

### 1. Course Prerequisites API (New/Update)

**File:** `src/app/api/curricula/[id]/courses/[courseId]/prerequisites/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const prerequisiteSchema = z.object({
  prerequisiteCourseIds: z.array(z.string().min(1)),
});

// GET prerequisites for a course in a curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: curriculumId, courseId } = await params;

    // Get curriculum course
    const curriculumCourse = await prisma.curriculumCourse.findUnique({
      where: {
        curriculumId_courseId: { curriculumId, courseId }
      },
      include: {
        course: {
          include: {
            prerequisites: {
              include: { prerequisite: true }
            }
          }
        },
        curriculumPrerequisites: {
          include: {
            prerequisiteCourse: {
              include: { course: true }
            }
          }
        }
      }
    });

    if (!curriculumCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Determine if using curriculum-specific or global prerequisites
    const hasCurriculumSpecific = curriculumCourse.curriculumPrerequisites.length > 0;
    const prerequisites = hasCurriculumSpecific
      ? curriculumCourse.curriculumPrerequisites.map(p => ({
          id: p.prerequisiteCourse.course.id,
          code: p.prerequisiteCourse.course.code,
          name: p.prerequisiteCourse.course.name,
          isCurriculumSpecific: true
        }))
      : curriculumCourse.course.prerequisites.map(p => ({
          id: p.prerequisite.id,
          code: p.prerequisite.code,
          name: p.prerequisite.name,
          isCurriculumSpecific: false
        }));

    return NextResponse.json({
      prerequisites,
      hasCurriculumSpecificPrerequisites: hasCurriculumSpecific
    });

  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST/PUT to set curriculum-specific prerequisites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: curriculumId, courseId } = await params;
    const body = await request.json();
    const { prerequisiteCourseIds } = prerequisiteSchema.parse(body);

    // Get curriculum course ID
    const curriculumCourse = await prisma.curriculumCourse.findUnique({
      where: {
        curriculumId_courseId: { curriculumId, courseId }
      }
    });

    if (!curriculumCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get curriculum course IDs for prerequisites
    const prerequisiteCurriculumCourses = await prisma.curriculumCourse.findMany({
      where: {
        curriculumId,
        courseId: { in: prerequisiteCourseIds }
      }
    });

    if (prerequisiteCurriculumCourses.length !== prerequisiteCourseIds.length) {
      return NextResponse.json(
        { error: 'Some prerequisite courses not found in curriculum' },
        { status: 400 }
      );
    }

    // Delete existing curriculum-specific prerequisites
    await prisma.curriculumCoursePrerequisite.deleteMany({
      where: { curriculumCourseId: curriculumCourse.id }
    });

    // Create new curriculum-specific prerequisites
    await prisma.curriculumCoursePrerequisite.createMany({
      data: prerequisiteCurriculumCourses.map(prereq => ({
        curriculumCourseId: curriculumCourse.id,
        prerequisiteCourseId: prereq.id
      }))
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error setting prerequisites:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE to remove curriculum-specific prerequisites (revert to global)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: curriculumId, courseId } = await params;

    const curriculumCourse = await prisma.curriculumCourse.findUnique({
      where: {
        curriculumId_courseId: { curriculumId, courseId }
      }
    });

    if (!curriculumCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Delete all curriculum-specific prerequisites
    await prisma.curriculumCoursePrerequisite.deleteMany({
      where: { curriculumCourseId: curriculumCourse.id }
    });

    return NextResponse.json({ success: true, message: 'Reverted to global prerequisites' });

  } catch (error) {
    console.error('Error deleting prerequisites:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. Similar API for Corequisites

Create similar endpoints for corequisites:
- `GET/POST/DELETE /api/curricula/[id]/courses/[courseId]/corequisites`

---

## 🎨 Frontend Components

### 1. Prerequisite/Corequisite Manager Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrerequisiteManagerProps {
  curriculumId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
}

export function PrerequisiteManager({
  curriculumId,
  courseId,
  courseCode,
  courseName
}: PrerequisiteManagerProps) {
  const [prerequisites, setPrerequisites] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isCurriculumSpecific, setIsCurriculumSpecific] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchPrerequisites();
    fetchAvailableCourses();
  }, [curriculumId, courseId]);

  const fetchPrerequisites = async () => {
    const res = await fetch(`/api/curricula/${curriculumId}/courses/${courseId}/prerequisites`);
    const data = await res.json();
    setPrerequisites(data.prerequisites);
    setIsCurriculumSpecific(data.hasCurriculumSpecificPrerequisites);
  };

  const fetchAvailableCourses = async () => {
    const res = await fetch(`/api/curricula/${curriculumId}/courses`);
    const data = await res.json();
    setAvailableCourses(data.courses.filter((c: any) => c.id !== courseId));
  };

  const handleAddPrerequisite = async () => {
    if (!selectedCourse) return;

    const updatedPrereqs = [...prerequisites.map(p => p.id), selectedCourse];
    
    const res = await fetch(`/api/curricula/${curriculumId}/courses/${courseId}/prerequisites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prerequisiteCourseIds: updatedPrereqs })
    });

    if (res.ok) {
      fetchPrerequisites();
      setSelectedCourse('');
    }
  };

  const handleRemovePrerequisite = async (prereqId: string) => {
    const updatedPrereqs = prerequisites.filter(p => p.id !== prereqId).map(p => p.id);
    
    const res = await fetch(`/api/curricula/${curriculumId}/courses/${courseId}/prerequisites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prerequisiteCourseIds: updatedPrereqs })
    });

    if (res.ok) {
      fetchPrerequisites();
    }
  };

  const handleRevertToGlobal = async () => {
    const res = await fetch(`/api/curricula/${curriculumId}/courses/${courseId}/prerequisites`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchPrerequisites();
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prerequisites for {courseCode}</h3>
          <p className="text-sm text-gray-600">{courseName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isCurriculumSpecific && (
            <Badge variant="secondary">Curriculum-Specific</Badge>
          )}
          {!isCurriculumSpecific && (
            <Badge variant="outline">Using Global</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Current Prerequisites */}
      <div className="space-y-2">
        {prerequisites.length === 0 && (
          <p className="text-sm text-gray-500 italic">No prerequisites</p>
        )}
        
        {prerequisites.map((prereq) => (
          <div key={prereq.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <span className="font-medium">{prereq.code}</span>
              <span className="text-sm text-gray-600 ml-2">{prereq.name}</span>
            </div>
            
            {isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemovePrerequisite(prereq.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Prerequisite */}
      {isEditing && (
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {availableCourses
                .filter(c => !prerequisites.some(p => p.id === c.id))
                .map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleAddPrerequisite} disabled={!selectedCourse}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* Revert to Global */}
      {isEditing && isCurriculumSpecific && (
        <Button
          variant="outline"
          onClick={handleRevertToGlobal}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Revert to Global Prerequisites
        </Button>
      )}
    </div>
  );
}
```

---

## ✅ Complete Feature Matrix

| Feature | Current Schema | SP2 Schema | Curriculum-Specific |
|---------|---------------|------------|-------------------|
| **Course Categories** | Department-wide | ✅ Added `curriculumId` | ✅ YES |
| **Required/Elective Status** | ✅ `isRequired` in `CurriculumCourse` | ✅ Unchanged | ✅ YES |
| **Course Rules** | Global in `Course` | ✅ Override fields in `CurriculumCourse` | ✅ YES (optional) |
| **Prerequisites** | Global in `CoursePrerequisite` | ✅ `CurriculumCoursePrerequisite` (new) | ✅ YES (with fallback) |
| **Corequisites** | Global in `CourseCorequisite` | ✅ `CurriculumCourseCorequisite` (new) | ✅ YES (with fallback) |
| **Banned Combinations** | ✅ `CurriculumBlacklist` (existed) | ✅ Unchanged | ✅ YES |
| **Elective Rules** | ✅ `ElectiveRule` per curriculum | ✅ Unchanged | ✅ YES |

---

## 📋 Updated Implementation Checklist

### Schema & Migration
- [x] Add `CurriculumCoursePrerequisite` model
- [x] Add `CurriculumCourseCorequisite` model
- [x] Add relations to `CurriculumCourse`
- [x] Validate schema
- [ ] Create database migration

### Backend APIs
- [ ] Create prerequisite management API
- [ ] Create corequisite management API
- [ ] Update course validation to check curriculum-specific dependencies
- [ ] Update student eligibility checks
- [ ] Create helper functions for fallback logic

### Frontend Components
- [ ] Create `PrerequisiteManager` component
- [ ] Create `CorequisiteManager` component
- [ ] Update curriculum editor to include dependency management
- [ ] Add visual indicators for curriculum-specific vs global

### Testing
- [ ] Test prerequisite fallback logic
- [ ] Test corequisite fallback logic
- [ ] Test student validation with curriculum-specific dependencies
- [ ] Test revert to global functionality

---

**Status:** ✅ Schema updated and validated  
**Next Steps:** Implement APIs and helper functions for prerequisite/corequisite management
