import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const DEFAULT_COURSE_TYPES: Array<{ name: string; color: string }> = [
  { name: 'Core', color: '#ef4444' },
  { name: 'Major', color: '#22c55e' },
  { name: 'Major Elective', color: '#eab308' },
  { name: 'General Education', color: '#6366f1' },
  { name: 'Free Elective', color: '#6b7280' }
];

// Validation schema for creating course types
const createCourseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  departmentId: z.string().optional(),
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
    const facultyDepartmentIds = user.faculty.departments.map((dept) => dept.id);

    const { courseTypes, seeded } = await prisma.$transaction(async (tx) => {
      const existing = await tx.courseType.findMany({
        where: {
          departmentId: targetDepartment.id
        },
        orderBy: [{ name: 'asc' }]
      });

      if (existing.length > 0) {
        return { courseTypes: existing, seeded: false };
      }

      const facultyCourseTypes = await tx.courseType.findMany({
        where: {
          departmentId: { in: facultyDepartmentIds }
        },
        orderBy: [{ name: 'asc' }]
      });

      const templateTypes = facultyCourseTypes.length > 0
        ? Array.from(
            facultyCourseTypes.reduce((map, type) => {
              if (!map.has(type.name)) {
                map.set(type.name, { name: type.name, color: type.color });
              }
              return map;
            }, new Map<string, { name: string; color: string }>()
          ).values()
        )
        : DEFAULT_COURSE_TYPES;

      await tx.courseType.createMany({
        data: templateTypes.map((type) => ({
          name: type.name,
          color: type.color,
          departmentId: targetDepartment.id
        }))
      });

      const seededTypes = await tx.courseType.findMany({
        where: {
          departmentId: targetDepartment.id
        },
        orderBy: [{ name: 'asc' }]
      });

      return { courseTypes: seededTypes, seeded: true };
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
      seeded,
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

    const accessibleDepartments = user.faculty.departments;
    const body = await request.json();
    const validatedData = createCourseTypeSchema.parse(body);

    const department = validatedData.departmentId
      ? accessibleDepartments.find((dept) => dept.id === validatedData.departmentId)
      : accessibleDepartments[0];

    if (!department) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Department not accessible' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const { name, color } = validatedData;

    // Check if course type name already exists in this department
    const existingCourseType = await prisma.courseType.findFirst({
      where: {
        name,
        departmentId: department.id
      }
    });

    if (existingCourseType) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Course type name already exists' } },
        { status: 409 }
      );
    }

    const facultyDepartmentIds = accessibleDepartments.map((dept) => dept.id);

    const createdCourseType = await prisma.$transaction(async (tx) => {
      const courseType = await tx.courseType.create({
        data: {
          name,
          color,
          departmentId: department.id
        }
      });

      if (facultyDepartmentIds.length > 1) {
        const existingAcrossFaculty = await tx.courseType.findMany({
          where: {
            name,
            departmentId: { in: facultyDepartmentIds }
          },
          select: { departmentId: true }
        });

        const departmentsWithType = new Set(existingAcrossFaculty.map((type) => type.departmentId));

        const missingDepartmentIds = facultyDepartmentIds.filter((deptId) => !departmentsWithType.has(deptId));

        if (missingDepartmentIds.length > 0) {
          await tx.courseType.createMany({
            data: missingDepartmentIds.map((deptId) => ({
              name,
              color,
              departmentId: deptId
            }))
          });
        }
      }

      return courseType;
    });

    const response = {
      id: createdCourseType.id,
      name: createdCourseType.name,
      color: createdCourseType.color,
      departmentId: createdCourseType.departmentId,
      createdAt: createdCourseType.createdAt.toISOString(),
      updatedAt: createdCourseType.updatedAt.toISOString(),
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
