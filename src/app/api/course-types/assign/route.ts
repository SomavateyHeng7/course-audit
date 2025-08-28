import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for bulk assignment
const bulkAssignSchema = z.object({
  courseIds: z.array(z.string().min(1)),
  courseTypeId: z.string().min(1),
  departmentId: z.string().min(1),
});

// POST /api/course-types/assign - Bulk assign course types to courses
export async function POST(request: NextRequest) {
  try {
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
    const { courseIds, courseTypeId, departmentId } = bulkAssignSchema.parse(body);

    // Get user's faculty and verify department access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: {
          include: {
            departments: true
          }
        }
      }
    });

    if (!user?.faculty) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty not found' } },
        { status: 404 }
      );
    }

    // Verify department belongs to user's faculty
    const department = user.faculty.departments.find(d => d.id === departmentId);
    if (!department) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this department' } },
        { status: 403 }
      );
    }

    // Verify course type exists and belongs to the department
    const courseType = await prisma.courseType.findFirst({
      where: {
        id: courseTypeId,
        departmentId: departmentId
      }
    });

    if (!courseType) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course type not found or does not belong to department' } },
        { status: 404 }
      );
    }

    // Verify all courses exist
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true
      }
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'One or more courses not found' } },
        { status: 404 }
      );
    }

    // Bulk assign course types in transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, remove existing assignments for these courses in this department
      await tx.departmentCourseType.deleteMany({
        where: {
          courseId: { in: courseIds },
          departmentId: departmentId
        }
      });

      // Create new assignments
      const assignments = await tx.departmentCourseType.createMany({
        data: courseIds.map(courseId => ({
          courseId,
          departmentId,
          courseTypeId,
          assignedById: session.user.id
        }))
      });

      // Log the bulk assignment
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'DepartmentCourseType',
          entityId: courseTypeId,
          action: 'CREATE',
          description: `Bulk assigned course type "${courseType.name}" to ${courseIds.length} courses`,
          changes: {
            courseTypeId,
            courseTypeName: courseType.name,
            departmentId,
            courseCount: courseIds.length,
            courseIds
          }
        }
      });

      return assignments;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned course category "${courseType.name}" to ${courseIds.length} courses`,
      assignments: result.count,
      courseType: {
        id: courseType.id,
        name: courseType.name,
        color: courseType.color
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
          },
        },
        { status: 400 }
      );
    }

    console.error('Error in bulk course type assignment:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to assign course types' } },
      { status: 500 }
    );
  }
}
