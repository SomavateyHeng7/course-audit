import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; curriculumCourseId: string; relationId: string }> }
) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    console.error('Auth error in DELETE prerequisite:', authError);
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

    const { id: curriculumId, curriculumCourseId, relationId } = await params;
    const facultyDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    const relation = await prisma.curriculumCoursePrerequisite.findFirst({
      where: {
        id: relationId,
        curriculumCourseId,
        curriculumCourse: {
          curriculumId,
          curriculum: {
            departmentId: {
              in: facultyDepartmentIds
            }
          }
        }
      },
      include: {
        curriculumCourse: {
          select: {
            courseId: true,
            curriculum: {
              select: {
                name: true
              }
            },
            course: {
              select: {
                code: true
              }
            }
          }
        },
        prerequisiteCourse: {
          select: {
            courseId: true,
            course: {
              select: {
                code: true
              }
            }
          }
        }
      }
    });

    if (!relation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Prerequisite relation not found or access denied' } },
        { status: 404 }
      );
    }

    await prisma.curriculumCoursePrerequisite.delete({
      where: { id: relation.id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCoursePrerequisite',
        entityId: relation.id,
        action: 'DELETE',
        curriculumId,
        courseId: relation.curriculumCourse.courseId,
        description: `Removed curriculum-specific prerequisite ${relation.prerequisiteCourse.course.code} from ${relation.curriculumCourse.course.code} in ${relation.curriculumCourse.curriculum.name}`,
        changes: {
          deleted: {
            prerequisiteCourseId: relation.prerequisiteCourse.courseId
          }
        }
      }
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting curriculum prerequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete curriculum prerequisite' } },
      { status: 500 }
    );
  }
}
