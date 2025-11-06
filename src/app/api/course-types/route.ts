import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Validation schema for creating course types
const createCourseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
});

// GET /api/course-types - List course types for the user's department
export async function GET(request: NextRequest) {
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

    // Check if a specific departmentId is requested
    const { searchParams } = new URL(request.url);
    const requestedDepartmentId = searchParams.get('departmentId');
    
    let targetDepartment;
    if (requestedDepartmentId) {
      // Verify the requested department belongs to the user's faculty
      targetDepartment = user.faculty.departments.find(dept => dept.id === requestedDepartmentId);
      if (!targetDepartment) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Department not accessible' } },
          { status: 403 }
        );
      }
    } else {
      // Use the first department of the faculty
      targetDepartment = user.faculty.departments[0];
    }

    // Get all course types for this department
    const courseTypes = await prisma.courseType.findMany({
      where: {
        departmentId: targetDepartment.id
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    const response = {
      courseTypes: courseTypes.map(type => ({
        id: type.id,
        name: type.name,
        color: type.color,
        departmentId: type.departmentId,
        createdAt: type.createdAt.toISOString(),
        updatedAt: type.updatedAt.toISOString(),
      })),
      total: courseTypes.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching course types:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course types' } },
      { status: 500 }
    );
  }
}

// POST /api/course-types - Create new course type
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
    const validatedData = createCourseTypeSchema.parse(body);

    // Check if course type name already exists in this department
    const existingCourseType = await prisma.courseType.findFirst({
      where: {
        name: validatedData.name,
        departmentId: department.id
      }
    });

    if (existingCourseType) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Course type name already exists' } },
        { status: 409 }
      );
    }

    // Create the course type
    const courseType = await prisma.courseType.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        departmentId: department.id
      }
    });

    const response = {
      id: courseType.id,
      name: courseType.name,
      color: courseType.color,
      departmentId: courseType.departmentId,
      createdAt: courseType.createdAt.toISOString(),
      updatedAt: courseType.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating course type:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create course type' } },
      { status: 500 }
    );
  }
}
