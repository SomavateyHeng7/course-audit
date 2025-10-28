import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating concentrations
const createConcentrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  departmentId: z.string().optional(), // Optional - defaults to user's department
  courses: z.array(z.object({
    code: z.string().min(1, 'Course code is required'),
    name: z.string().min(1, 'Course name is required'),
    credits: z.number().min(0, 'Credits must be non-negative'),
    creditHours: z.number().min(0, 'Credit hours must be non-negative').optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  })).optional().default([]),
});

// GET /api/concentrations - List concentrations for the user's department
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Concentrations API: Starting request...');
    
    const session = await auth();
    console.log('🔍 Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id, 
      userRole: session?.user?.role 
    });

    if (!session?.user?.id) {
      console.log('❌ No session or user ID');
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      console.log('❌ User is not a chairperson, role:', session.user.role);
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    console.log('🔍 Fetching user with faculty and departments...');
    
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

    console.log('🔍 User data:', { 
      hasUser: !!user, 
      hasFaculty: !!user?.faculty, 
      departmentCount: user?.faculty?.departments?.length || 0,
      userDepartmentId: user?.departmentId
    });

    if (!user?.faculty) {
      console.log('❌ User faculty not found');
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty not found' } },
        { status: 404 }
      );
    }

    if (!user.faculty.departments.length) {
      console.log('❌ No departments found in user faculty');
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'No departments found in faculty' } },
        { status: 404 }
      );
    }

    // Get user's accessible departments (their department + other departments in same faculty)
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);
    console.log('🔍 Accessible department IDs:', accessibleDepartmentIds);

    // Get concentrations for accessible departments
    const concentrations = await prisma.concentration.findMany({
      where: {
        departmentId: { in: accessibleDepartmentIds }
      },
      include: {
        courses: {
          include: {
            course: true
          }
        },
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 Found concentrations:', concentrations.length);

    // Transform data for frontend
    const transformedConcentrations = concentrations.map(concentration => ({
      id: concentration.id,
      name: concentration.name,
      description: concentration.description,
      departmentId: concentration.departmentId,
      courseCount: concentration._count.courses,
      courses: concentration.courses.map(cc => ({
        id: cc.course.id,
        code: cc.course.code,
        name: cc.course.name,
        credits: cc.course.credits,
        creditHours: cc.course.creditHours,
        description: cc.course.description,
      })),
      createdAt: concentration.createdAt,
      updatedAt: concentration.updatedAt,
    }));

    console.log('✅ Returning concentrations successfully');
    return NextResponse.json(transformedConcentrations);
  } catch (error) {
    console.error('❌ Error fetching concentrations:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch concentrations' } },
      { status: 500 }
    );
  }
}

// POST /api/concentrations - Create new concentration
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
    const validatedData = createConcentrationSchema.parse(body);

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

    // Validate department access if departmentId is provided, otherwise use user's department
    const targetDepartmentId = validatedData.departmentId || user.departmentId;
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);
    
    if (!accessibleDepartmentIds.includes(targetDepartmentId)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this department' } },
        { status: 403 }
      );
    }

    // Check if concentration with same name already exists in this department
    const existingConcentration = await prisma.concentration.findFirst({
      where: {
        name: validatedData.name.trim(),
        departmentId: targetDepartmentId
      }
    });

    if (existingConcentration) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'A concentration with this name already exists in this department' } },
        { status: 409 }
      );
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the concentration
      const concentration = await tx.concentration.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          department: {
            connect: { id: targetDepartmentId }
          },
          createdBy: {
            connect: { id: session.user.id }
          }
        }
      });

      // Process courses if provided
      if (validatedData.courses && validatedData.courses.length > 0) {
        const courseIds: string[] = [];

        for (const courseData of validatedData.courses) {
          // Check if course exists by code
          let course = await tx.course.findUnique({
            where: { code: courseData.code }
          });

          // Create course if it doesn't exist
          if (!course) {
            course = await tx.course.create({
              data: {
                code: courseData.code,
                name: courseData.name,
                credits: courseData.credits,
                creditHours: courseData.creditHours?.toString() || courseData.credits.toString(),
                description: courseData.description,
                // category: courseData.category || 'Elective',
              }
            });
          }

          courseIds.push(course.id);
        }

        // Create concentration-course relationships
        await tx.concentrationCourse.createMany({
          data: courseIds.map(courseId => ({
            concentrationId: concentration.id,
            courseId: courseId,
          }))
        });
      }

      return concentration;
    });

    // Fetch the complete concentration with courses
    const fullConcentration = await prisma.concentration.findUnique({
      where: { id: result.id },
      include: {
        courses: {
          include: {
            course: true
          }
        },
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    // Transform for response
    const response = {
      id: fullConcentration!.id,
      name: fullConcentration!.name,
      description: fullConcentration!.description,
      departmentId: fullConcentration!.departmentId,
      courseCount: fullConcentration!._count.courses,
      courses: fullConcentration!.courses.map(cc => ({
        id: cc.course.id,
        code: cc.course.code,
        name: cc.course.name,
        credits: cc.course.credits,
        creditHours: cc.course.creditHours,
        // category: cc.course.category,
        description: cc.course.description,
      })),
      createdAt: fullConcentration!.createdAt,
      updatedAt: fullConcentration!.updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating concentration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input'} },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create concentration' } },
      { status: 500 }
    );
  }
}
