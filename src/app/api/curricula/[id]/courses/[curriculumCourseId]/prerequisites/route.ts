import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

type FacultyDepartmentCacheEntry = {
  departments: string[];
  timestamp: number;
};

const facultyDepartmentCache = new Map<string, FacultyDepartmentCacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

async function getFacultyDepartmentIds(userId: string): Promise<string[]> {
  const cached = facultyDepartmentCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.departments;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      department: {
        select: {
          faculty: {
            select: {
              departments: {
                select: { id: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user?.department?.faculty) {
    throw new Error('User department or faculty not found');
  }

  const departmentIds = user.department.faculty.departments.map((dept) => dept.id);
  facultyDepartmentCache.set(userId, {
    departments: departmentIds,
    timestamp: Date.now()
  });

  return departmentIds;
}

async function ensureCurriculumCourseAccess(
  curriculumId: string,
  curriculumCourseId: string,
  facultyDepartmentIds: string[]
) {
  return prisma.curriculumCourse.findFirst({
    where: {
      id: curriculumCourseId,
      curriculumId,
      curriculum: {
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    },
    select: {
      id: true,
      curriculumId: true,
      courseId: true,
      curriculum: {
        select: {
          name: true
        }
      },
      course: {
        select: {
          code: true,
          name: true
        }
      }
    }
  });
}

const createPrerequisiteSchema = z.object({
  targetCurriculumCourseId: z.string().optional(),
  targetCourseId: z.string().optional()
}).refine((data) => data.targetCurriculumCourseId || data.targetCourseId, {
  message: 'Provide either targetCurriculumCourseId or targetCourseId'
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; curriculumCourseId: string }> }
) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    console.error('Auth error in GET prerequisites:', authError);
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: 'Authentication service error' } },
      { status: 500 }
    );
  }

  try {
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    const { id: curriculumId, curriculumCourseId } = await params;
    const facultyDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    const curriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        id: curriculumCourseId,
        curriculumId,
        curriculum: {
          departmentId: {
            in: facultyDepartmentIds
          }
        }
      },
      select: {
        id: true,
        curriculumPrerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                id: true,
                courseId: true,
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    credits: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum course not found or access denied' } },
        { status: 404 }
      );
    }

    const prerequisites = curriculumCourse.curriculumPrerequisites.map((relation) => ({
      id: relation.id,
      curriculumCourseId: relation.prerequisiteCourse.id,
      courseId: relation.prerequisiteCourse.courseId,
      code: relation.prerequisiteCourse.course.code,
      name: relation.prerequisiteCourse.course.name,
      credits: relation.prerequisiteCourse.course.credits
    }));

    return NextResponse.json({
      success: true,
      prerequisites
    });
  } catch (error) {
    console.error('Error fetching curriculum prerequisites:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum prerequisites' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; curriculumCourseId: string }> }
) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    console.error('Auth error in POST prerequisites:', authError);
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: 'Authentication service error' } },
      { status: 500 }
    );
  }

  try {
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    const { id: curriculumId, curriculumCourseId } = await params;
    const body = await request.json();
    const payload = createPrerequisiteSchema.parse(body);

    const facultyDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    const sourceCourse = await ensureCurriculumCourseAccess(curriculumId, curriculumCourseId, facultyDepartmentIds);
    if (!sourceCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum course not found or access denied' } },
        { status: 404 }
      );
    }

    const targetCurriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId,
        ...(payload.targetCurriculumCourseId
          ? { id: payload.targetCurriculumCourseId }
          : { courseId: payload.targetCourseId ?? undefined })
      },
      select: {
        id: true,
        courseId: true,
        course: {
          select: {
            code: true,
            name: true,
            credits: true
          }
        }
      }
    });

    if (!targetCurriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Target course not found in this curriculum' } },
        { status: 404 }
      );
    }

    if (targetCurriculumCourse.id === curriculumCourseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'A course cannot be a prerequisite of itself' } },
        { status: 400 }
      );
    }

    const existingRelation = await prisma.curriculumCoursePrerequisite.findFirst({
      where: {
        curriculumCourseId,
        prerequisiteCourseId: targetCurriculumCourse.id
      }
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Prerequisite already exists for this curriculum course' } },
        { status: 409 }
      );
    }

    const relation = await prisma.curriculumCoursePrerequisite.create({
      data: {
        curriculumCourseId,
        prerequisiteCourseId: targetCurriculumCourse.id
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCoursePrerequisite',
        entityId: relation.id,
        action: 'CREATE',
        curriculumId,
        courseId: sourceCourse.courseId,
        description: `Added curriculum-specific prerequisite ${targetCurriculumCourse.course.code} to ${sourceCourse.course.code} in ${sourceCourse.curriculum.name}`,
        changes: {
          prerequisiteCourseId: targetCurriculumCourse.courseId,
          curriculumCourseId
        }
      }
    });

    return NextResponse.json({
      success: true,
      prerequisite: {
        id: relation.id,
        curriculumCourseId: targetCurriculumCourse.id,
        courseId: targetCurriculumCourse.courseId,
        code: targetCurriculumCourse.course.code,
        name: targetCurriculumCourse.course.name,
        credits: targetCurriculumCourse.course.credits
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues.map((issue) => issue.message).join(', ') } },
        { status: 400 }
      );
    }

    console.error('Error creating curriculum prerequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create curriculum prerequisite' } },
      { status: 500 }
    );
  }
}
