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

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch (serializationError) {
      return { message: 'Failed to serialize error object', serializationError: String(serializationError) };
    }
  }

  return { message: String(error) };
}

function logError(payload: { message: string; error: unknown; context?: Record<string, unknown> }) {
  const logPayload = {
    ...payload,
    error: serializeError(payload.error)
  };

  try {
    console.error(logPayload);
  } catch (loggingError) {
    console.log('Logging failure in curriculum course constraints route', {
      loggingError: serializeError(loggingError),
      originalPayload: logPayload
    });
  }
}

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

async function getCurriculumCourse<TSelect extends object>(
  curriculumId: string,
  curriculumCourseId: string,
  facultyDepartmentIds: string[],
  select: TSelect
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
    select
  });
}

const updateOverridesSchema = z.object({
  overrideRequiresPermission: z.boolean().nullable().optional(),
  overrideSummerOnly: z.boolean().nullable().optional(),
  overrideRequiresSeniorStanding: z.boolean().nullable().optional(),
  overrideMinCreditThreshold: z
    .number()
    .int()
    .min(0)
    .max(200)
    .nullable()
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one override field must be provided'
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; curriculumCourseId: string }> }
) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    logError({
      message: 'Auth error in GET constraints',
      error: authError
    });
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

    const curriculumCourse = await getCurriculumCourse(curriculumId, curriculumCourseId, facultyDepartmentIds, {
      id: true,
      curriculumId: true,
      courseId: true,
      overrideRequiresPermission: true,
      overrideSummerOnly: true,
      overrideRequiresSeniorStanding: true,
      overrideMinCreditThreshold: true,
      curriculum: {
        select: {
          id: true,
          name: true,
          departmentId: true
        }
      },
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          requiresPermission: true,
          summerOnly: true,
          requiresSeniorStanding: true,
          minCreditThreshold: true,
          prerequisites: {
            select: {
              prerequisite: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          },
          corequisites: {
            select: {
              corequisite: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          }
        }
      },
      curriculumPrerequisites: {
        select: {
          id: true,
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
      },
      curriculumCorequisites: {
        select: {
          id: true,
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
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum course not found or access denied' } },
        { status: 404 }
      );
    }

    const baseFlags = {
      requiresPermission: curriculumCourse.course.requiresPermission,
      summerOnly: curriculumCourse.course.summerOnly,
      requiresSeniorStanding: curriculumCourse.course.requiresSeniorStanding,
      minCreditThreshold: curriculumCourse.course.minCreditThreshold ?? null
    };

    const overrideFlags = {
      overrideRequiresPermission: curriculumCourse.overrideRequiresPermission,
      overrideSummerOnly: curriculumCourse.overrideSummerOnly,
      overrideRequiresSeniorStanding: curriculumCourse.overrideRequiresSeniorStanding,
      overrideMinCreditThreshold: curriculumCourse.overrideMinCreditThreshold
    };

    const mergedFlags = {
      requiresPermission: overrideFlags.overrideRequiresPermission ?? baseFlags.requiresPermission,
      summerOnly: overrideFlags.overrideSummerOnly ?? baseFlags.summerOnly,
      requiresSeniorStanding: overrideFlags.overrideRequiresSeniorStanding ?? baseFlags.requiresSeniorStanding,
      minCreditThreshold: overrideFlags.overrideMinCreditThreshold ?? baseFlags.minCreditThreshold
    };

    const curriculumPrerequisites = curriculumCourse.curriculumPrerequisites.map((relation) => ({
      id: relation.id,
      curriculumCourseId: relation.prerequisiteCourse.id,
      courseId: relation.prerequisiteCourse.courseId,
      code: relation.prerequisiteCourse.course.code,
      name: relation.prerequisiteCourse.course.name,
      credits: relation.prerequisiteCourse.course.credits
    }));

    const curriculumCorequisites = curriculumCourse.curriculumCorequisites.map((relation) => ({
      id: relation.id,
      curriculumCourseId: relation.corequisiteCourse.id,
      courseId: relation.corequisiteCourse.courseId,
      code: relation.corequisiteCourse.course.code,
      name: relation.corequisiteCourse.course.name,
      credits: relation.corequisiteCourse.course.credits
    }));

    const basePrerequisites = curriculumCourse.course.prerequisites.map((relation) => ({
      courseId: relation.prerequisite.id,
      code: relation.prerequisite.code,
      name: relation.prerequisite.name
    }));

    const baseCorequisites = curriculumCourse.course.corequisites.map((relation) => ({
      courseId: relation.corequisite.id,
      code: relation.corequisite.code,
      name: relation.corequisite.name
    }));

    return NextResponse.json({
      success: true,
      curriculumCourse: {
        id: curriculumCourse.id,
        curriculumId: curriculumCourse.curriculumId,
        courseId: curriculumCourse.courseId,
        courseCode: curriculumCourse.course.code,
        courseName: curriculumCourse.course.name,
        curriculumName: curriculumCourse.curriculum.name
      },
      baseFlags,
      overrideFlags,
      mergedFlags,
      basePrerequisites,
      baseCorequisites,
      curriculumPrerequisites,
      curriculumCorequisites
    });
  } catch (error) {
    logError({
      message: 'Error fetching curriculum course constraints',
      error,
      context: { location: 'GET handler' }
    });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum course constraints' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; curriculumCourseId: string }> }
) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    logError({
      message: 'Auth error in PUT constraints',
      error: authError
    });
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
    const overrides = updateOverridesSchema.parse(body);

    const facultyDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    const curriculumCourse = await getCurriculumCourse(curriculumId, curriculumCourseId, facultyDepartmentIds, {
      courseId: true,
      curriculum: {
        select: {
          name: true
        }
      },
      course: {
        select: {
          code: true,
          id: true
        }
      },
      overrideRequiresPermission: true,
      overrideSummerOnly: true,
      overrideRequiresSeniorStanding: true,
      overrideMinCreditThreshold: true
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum course not found or access denied' } },
        { status: 404 }
      );
    }

    const updated = await prisma.curriculumCourse.update({
      where: { id: curriculumCourseId },
      data: overrides,
      select: {
        overrideRequiresPermission: true,
        overrideSummerOnly: true,
        overrideRequiresSeniorStanding: true,
        overrideMinCreditThreshold: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourse',
        entityId: curriculumCourseId,
        action: 'UPDATE',
        description: `Updated curriculum-specific course flags for ${curriculumCourse.course.code} in ${curriculumCourse.curriculum.name}`,
        curriculumId,
        courseId: curriculumCourse.courseId,
        changes: {
          before: {
            overrideRequiresPermission: curriculumCourse.overrideRequiresPermission,
            overrideSummerOnly: curriculumCourse.overrideSummerOnly,
            overrideRequiresSeniorStanding: curriculumCourse.overrideRequiresSeniorStanding,
            overrideMinCreditThreshold: curriculumCourse.overrideMinCreditThreshold
          },
          after: updated
        }
      }
    });

    return NextResponse.json({
      success: true,
      overrides: updated
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues.map((issue) => issue.message).join(', ') } },
        { status: 400 }
      );
    }

    logError({
      message: 'Error updating curriculum course overrides',
      error
    });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update curriculum course overrides' } },
      { status: 500 }
    );
  }
}
