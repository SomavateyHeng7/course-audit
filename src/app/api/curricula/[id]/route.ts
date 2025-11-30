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

// Validation schema for curriculum updates
const updateCurriculumSchema = z.object({
  name: z.string().min(1, 'Curriculum name is required').optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/curricula/[id] - Get specific curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
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

    // Get user's accessible departments (faculty-wide access)
    const accessibleDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        departmentId: { in: accessibleDepartmentIds }, // Faculty-wide access
      },
      include: {
        department: true,
        faculty: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        curriculumCourses: {
          include: {
            course: true,
            curriculumPrerequisites: {
              include: {
                prerequisiteCourse: {
                  include: {
                    course: {
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
            curriculumCorequisites: {
              include: {
                corequisiteCourse: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { year: 'asc' },
            { semester: 'asc' },
            { position: 'asc' },
          ],
        },
        curriculumConstraints: {
          orderBy: { createdAt: 'asc' },
        },
        electiveRules: {
          orderBy: { createdAt: 'asc' },
        },
        curriculumConcentrations: {
          include: {
            concentration: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
        curriculumBlacklists: {
          include: {
            blacklist: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            curriculumCourses: true,
            curriculumConstraints: true,
            electiveRules: true,
            curriculumConcentrations: true,
            curriculumBlacklists: true,
          },
        },
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Get course type assignments for courses in this curriculum
    const courseIds = curriculum.curriculumCourses.map(cc => cc.course.id);
    
    const courseTypeAssignments = await prisma.departmentCourseType.findMany({
      where: {
        courseId: { in: courseIds },
        departmentId: curriculum.departmentId,
        curriculumId: curriculum.id
      },
      include: {
        courseType: true
      }
    });

    // Create a map of courseId -> courseType for easy lookup
    const courseTypeMap = new Map();
    courseTypeAssignments.forEach(assignment => {
      courseTypeMap.set(assignment.courseId, {
        id: assignment.courseType.id,
        name: assignment.courseType.name,
        color: assignment.courseType.color
      });
    });

    // Enhance curriculum courses with course type information
    const enhancedCurriculum = {
      ...curriculum,
      curriculumCourses: curriculum.curriculumCourses.map(cc => {
        const curriculumPrereqs = (cc.curriculumPrerequisites ?? [])
          .map(prereq => prereq.prerequisiteCourse?.course)
          .filter((course): course is { id: string; code: string; name: string } => Boolean(course?.id && course?.code && typeof course?.name === "string"))
          .map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
          }));

        const curriculumCoreqs = (cc.curriculumCorequisites ?? [])
          .map(coreq => coreq.corequisiteCourse?.course)
          .filter((course): course is { id: string; code: string; name: string } => Boolean(course?.id && course?.code && typeof course?.name === "string"))
          .map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
          }));

        return {
          ...cc,
          curriculumPrerequisites: curriculumPrereqs,
          curriculumCorequisites: curriculumCoreqs,
          course: {
            ...cc.course,
            courseType: courseTypeMap.get(cc.course.id) || null,
          }
        };
      })
    };

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'CREATE', // Using CREATE for read access
        description: `Accessed curriculum "${curriculum.name}"`,
        curriculumId: curriculum.id,
      },
    });

    return NextResponse.json({ curriculum: enhancedCurriculum });

  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id] - Update curriculum
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
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

    const body = await request.json();
    const validatedData = updateCurriculumSchema.parse(body);

    // Get user's accessible departments (faculty-wide access)
    const accessibleDepartmentIds = await getFacultyDepartmentIds(session.user.id);

    // Check if curriculum exists and user has access to it
    const existingCurriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        departmentId: { in: accessibleDepartmentIds }, // Faculty-wide access
      },
    });

    if (!existingCurriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    // Note: year, startId, endId, departmentId define uniqueness and cannot be updated
    if (validatedData.name) {
      const duplicateCheck = await prisma.curriculum.findFirst({
        where: {
          id: { not: id },
          name: validatedData.name,
          year: existingCurriculum.year,
          startId: existingCurriculum.startId,
          endId: existingCurriculum.endId,
          departmentId: existingCurriculum.departmentId,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_CURRICULUM', 
              message: `Curriculum with name "${validatedData.name}" already exists for this year and ID range in this department` 
            } 
          },
          { status: 409 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Store original data for audit
      const originalData = {
        name: existingCurriculum.name,
        version: existingCurriculum.version,
        description: existingCurriculum.description,
        isActive: existingCurriculum.isActive,
      };

      // Update curriculum
      const updatedCurriculum = await tx.curriculum.update({
        where: { id: id },
        data: validatedData,
        include: {
          department: true,
          faculty: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          curriculumCourses: {
            include: {
              course: true,
            },
          },
          curriculumConstraints: true,
          electiveRules: true,
          _count: {
            select: {
              curriculumCourses: true,
              curriculumConstraints: true,
              electiveRules: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Curriculum',
          entityId: id,
          action: 'UPDATE',
          description: `Updated curriculum "${updatedCurriculum.name}"`,
          curriculumId: id,
          changes: {
            before: originalData,
            after: validatedData,
            fieldsChanged: Object.keys(validatedData),
          },
        },
      });

      return updatedCurriculum;
    });

    return NextResponse.json({ curriculum: result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            // Optionally add details: error.issues if available in your Zod error handling
          } 
        },
        { status: 400 }
      );
    }

    console.error('Error updating curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id] - Delete curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
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

    // Get user's accessible departments (faculty-wide access)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: { include: { departments: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);

    // Check if curriculum exists and user has access to it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        departmentId: { in: accessibleDepartmentIds }, // Faculty-wide access
      },
      include: {
        _count: {
          select: {
            curriculumCourses: true,
            curriculumConstraints: true,
            electiveRules: true,
          },
        },
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Store curriculum data for audit before deletion
      const curriculumData = {
        name: curriculum.name,
        year: curriculum.year,
        version: curriculum.version,
        courseCount: curriculum._count.curriculumCourses,
        constraintCount: curriculum._count.curriculumConstraints,
        electiveRuleCount: curriculum._count.electiveRules,
      };

      // Delete curriculum (cascade will handle related records)
      await tx.curriculum.delete({
        where: { id: id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Curriculum',
          entityId: id,
          action: 'DELETE',
          description: `Deleted curriculum "${curriculumData.name}" (${curriculumData.year})`,
          changes: {
            deletedCurriculum: curriculumData,
          },
        },
      });

      return { success: true, deletedCurriculum: curriculumData };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete curriculum' } },
      { status: 500 }
    );
  }
}
