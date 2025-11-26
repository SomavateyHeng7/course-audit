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

const createCorequisiteSchema = z.object({
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
    console.error('Auth error in GET corequisites:', authError);
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
        curriculumCorequisites: {
          include: {
            corequisiteCourse: {
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

    const corequisites = curriculumCourse.curriculumCorequisites.map((relation) => ({
      id: relation.id,
      curriculumCourseId: relation.corequisiteCourse.id,
      courseId: relation.corequisiteCourse.courseId,
      code: relation.corequisiteCourse.course.code,
      name: relation.corequisiteCourse.course.name,
      credits: relation.corequisiteCourse.course.credits
    }));

    return NextResponse.json({
      success: true,
      corequisites
    });
  } catch (error) {
    console.error('Error fetching curriculum corequisites:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum corequisites' } },
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
    console.error('Auth error in POST corequisites:', authError);
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
    const payload = createCorequisiteSchema.parse(body);

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
        { error: { code: 'INVALID_INPUT', message: 'A course cannot be a co-requisite of itself' } },
        { status: 400 }
      );
    }

    const existingRelation = await prisma.curriculumCourseCorequisite.findFirst({
      where: {
        curriculumCourseId,
        corequisiteCourseId: targetCurriculumCourse.id
      }
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Co-requisite already exists for this curriculum course' } },
        { status: 409 }
      );
    }

    const relation = await prisma.curriculumCourseCorequisite.create({
      data: {
        curriculumCourseId,
        corequisiteCourseId: targetCurriculumCourse.id
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourseCorequisite',
        entityId: relation.id,
        action: 'CREATE',
        curriculumId,
        courseId: sourceCourse.courseId,
        description: `Added curriculum-specific co-requisite ${targetCurriculumCourse.course.code} to ${sourceCourse.course.code} in ${sourceCourse.curriculum.name}`,
        changes: {
          corequisiteCourseId: targetCurriculumCourse.courseId,
          curriculumCourseId
        }
      }
    });

    return NextResponse.json({
      success: true,
      corequisite: {
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

    console.error('Error creating curriculum corequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create curriculum corequisite' } },
      { status: 500 }
    );
  }
}
