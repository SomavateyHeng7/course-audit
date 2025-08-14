import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating course types
const updateCourseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
});

// GET /api/course-types/[id] - Get specific course type
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Get user's faculty and department
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

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    const department = user.faculty.departments[0];

    // Find the course type
    const courseType = await prisma.courseType.findFirst({
      where: {
        id: params.id,
        departmentId: department.id
      }
    });

    if (!courseType) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course type not found' } },
        { status: 404 }
      );
    }

    const response = {
      id: courseType.id,
      name: courseType.name,
      color: courseType.color,
      departmentId: courseType.departmentId,
      createdAt: courseType.createdAt.toISOString(),
      updatedAt: courseType.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching course type:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course type' } },
      { status: 500 }
    );
  }
}

// PUT /api/course-types/[id] - Update course type
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Get user's faculty and department
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

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    const department = user.faculty.departments[0];

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateCourseTypeSchema.parse(body);

    // Check if course type exists and belongs to user's department
    const existingCourseType = await prisma.courseType.findFirst({
      where: {
        id: params.id,
        departmentId: department.id
      }
    });

    if (!existingCourseType) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course type not found' } },
        { status: 404 }
      );
    }

    // Check if the new name conflicts with another course type
    if (validatedData.name !== existingCourseType.name) {
      const nameConflict = await prisma.courseType.findFirst({
        where: {
          name: validatedData.name,
          departmentId: department.id,
          NOT: {
            id: params.id
          }
        }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'Course type name already exists' } },
          { status: 409 }
        );
      }
    }

    // Update the course type
    const updatedCourseType = await prisma.courseType.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        color: validatedData.color
      }
    });

    const response = {
      id: updatedCourseType.id,
      name: updatedCourseType.name,
      color: updatedCourseType.color,
      departmentId: updatedCourseType.departmentId,
      createdAt: updatedCourseType.createdAt.toISOString(),
      updatedAt: updatedCourseType.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating course type:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update course type' } },
      { status: 500 }
    );
  }
}

// DELETE /api/course-types/[id] - Delete course type
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Get user's faculty and department
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

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    const department = user.faculty.departments[0];

    // Check if course type exists and belongs to user's department
    const existingCourseType = await prisma.courseType.findFirst({
      where: {
        id: params.id,
        departmentId: department.id
      }
    });

    if (!existingCourseType) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course type not found' } },
        { status: 404 }
      );
    }

    // Check if course type is in use by any course assignments
    const assignmentsUsingType = await prisma.departmentCourseType.findFirst({
      where: {
        courseTypeId: params.id
      }
    });

    if (assignmentsUsingType) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Cannot delete course type that is currently assigned to courses' } },
        { status: 409 }
      );
    }

    // Delete the course type
    await prisma.courseType.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Course type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course type:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete course type' } },
      { status: 500 }
    );
  }
}
