import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating concentrations
const updateConcentrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
});

// GET /api/concentrations/[id] - Get specific concentration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    const concentration = await prisma.concentration.findFirst({
      where: {
        id: params.id,
        departmentId: department.id,
        createdById: session.user.id // Ensure user can only access their own concentrations
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
      }
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Transform for response
    const response = {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch concentration' } },
      { status: 500 }
    );
  }
}

// PUT /api/concentrations/[id] - Update concentration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    const body = await request.json();
    const validatedData = updateConcentrationSchema.parse(body);

    // Check if concentration exists and belongs to user
    const existingConcentration = await prisma.concentration.findFirst({
      where: {
        id: params.id,
        departmentId: department.id,
        createdById: session.user.id
      }
    });

    if (!existingConcentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Update the concentration
    const updatedConcentration = await prisma.concentration.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
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
      }
    });

    // Transform for response
    const response = {
      id: updatedConcentration.id,
      name: updatedConcentration.name,
      description: updatedConcentration.description,
      departmentId: updatedConcentration.departmentId,
      courseCount: updatedConcentration._count.courses,
      courses: updatedConcentration.courses.map(cc => ({
        id: cc.course.id,
        code: cc.course.code,
        name: cc.course.name,
        credits: cc.course.credits,
        creditHours: cc.course.creditHours,
        // category: cc.course.category,
        description: cc.course.description,
      })),
      createdAt: updatedConcentration.createdAt,
      updatedAt: updatedConcentration.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating concentration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update concentration' } },
      { status: 500 }
    );
  }
}

// DELETE /api/concentrations/[id] - Delete concentration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    // Check if concentration exists and belongs to user
    const existingConcentration = await prisma.concentration.findFirst({
      where: {
        id: params.id,
        departmentId: department.id,
        createdById: session.user.id
      }
    });

    if (!existingConcentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Delete the concentration (CASCADE will handle related records)
    await prisma.concentration.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Concentration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete concentration' } },
      { status: 500 }
    );
  }
}
