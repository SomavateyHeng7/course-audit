import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for applying concentrations to curriculum
const applyConcentrationSchema = z.object({
  concentrationId: z.string().min(1, 'Concentration ID is required'),
  requiredCourses: z.number().min(1, 'Required courses must be at least 1'),
});

// GET /api/curricula/[id]/concentrations - Get concentrations applied to curriculum
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

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Get applied concentrations
    const curriculumConcentrations = await prisma.curriculumConcentration.findMany({
      where: {
        curriculumId: id,
      },
      include: {
        concentration: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ curriculumConcentrations });

  } catch (error) {
    console.error('Error fetching curriculum concentrations:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum concentrations' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/concentrations - Apply concentration to curriculum
export async function POST(
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
    const validatedData = applyConcentrationSchema.parse(body);

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Verify concentration exists and user owns it
    const concentration = await prisma.concentration.findFirst({
      where: {
        id: validatedData.concentrationId,
        createdById: session.user.id,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Check if concentration is already applied to the curriculum
    const existingCurriculumConcentration = await prisma.curriculumConcentration.findUnique({
      where: {
        curriculumId_concentrationId: {
          curriculumId: id,
          concentrationId: validatedData.concentrationId,
        },
      },
    });

    if (existingCurriculumConcentration) {
      return NextResponse.json(
        { 
          error: { 
            code: 'CONCENTRATION_ALREADY_APPLIED', 
            message: 'This concentration is already applied to this curriculum' 
          } 
        },
        { status: 409 }
      );
    }

    // Apply concentration to curriculum
    const curriculumConcentration = await prisma.curriculumConcentration.create({
      data: {
        curriculumId: id,
        concentrationId: validatedData.concentrationId,
        requiredCourses: validatedData.requiredCourses,
      },
      include: {
        concentration: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'ASSIGN',
        description: `Applied concentration "${concentration.name}" to curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        concentrationId: concentration.id,
        changes: {
          appliedConcentration: {
            id: concentration.id,
            name: concentration.name,
            courseCount: concentration._count.courses,
            requiredCourses: curriculumConcentration.requiredCourses,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Concentration applied to curriculum successfully',
      curriculumConcentration,
    });

  } catch (error) {
    console.error('Error applying concentration to curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to apply concentration to curriculum' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id]/concentrations/[concentrationId] - Update concentration requirements
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; concentrationId: string }> }
) {
  try {
    const { id, concentrationId } = await params;
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
    const { requiredCourses } = body;

    if (!requiredCourses || typeof requiredCourses !== 'number' || requiredCourses < 1) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Required courses must be a number greater than 0' } },
        { status: 400 }
      );
    }

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Verify concentration is applied to the curriculum
    const curriculumConcentration = await prisma.curriculumConcentration.findUnique({
      where: {
        curriculumId_concentrationId: {
          curriculumId: id,
          concentrationId,
        },
      },
      include: {
        curriculum: true,
        concentration: {
          include: {
            _count: { select: { courses: true } },
          },
        },
      },
    });

    if (!curriculumConcentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum concentration not found' } },
        { status: 404 }
      );
    }

    // Verify user owns both curriculum and concentration
    if (curriculumConcentration.curriculum.createdById !== session.user.id ||
        curriculumConcentration.concentration.createdById !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const oldRequiredCourses = curriculumConcentration.requiredCourses;

    // Update required courses
    const updatedCurriculumConcentration = await prisma.curriculumConcentration.update({
      where: {
        curriculumId_concentrationId: {
          curriculumId: id,
          concentrationId,
        },
      },
      data: {
        requiredCourses,
      },
      include: {
        concentration: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'UPDATE',
        description: `Updated required courses for concentration "${curriculumConcentration.concentration.name}" in curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        concentrationId: curriculumConcentration.concentration.id,
        changes: {
          requiredCourses: { from: oldRequiredCourses, to: updatedCurriculumConcentration.requiredCourses },
        },
      },
    });

    return NextResponse.json({
      message: 'Concentration requirements updated successfully',
      curriculumConcentration: updatedCurriculumConcentration,
    });

  } catch (error) {
    console.error('Error updating concentration requirements:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update concentration requirements' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/concentrations/[concentrationId] - Remove concentration from curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; concentrationId: string }> }
) {
  try {
    const { id, concentrationId } = await params;
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

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Verify concentration is applied to the curriculum
    const curriculumConcentration = await prisma.curriculumConcentration.findUnique({
      where: {
        curriculumId_concentrationId: {
          curriculumId: id,
          concentrationId,
        },
      },
      include: {
        curriculum: true,
        concentration: true,
      },
    });

    if (!curriculumConcentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum concentration not found' } },
        { status: 404 }
      );
    }

    // Verify user owns both curriculum and concentration
    if (curriculumConcentration.curriculum.createdById !== session.user.id ||
        curriculumConcentration.concentration.createdById !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Remove concentration from curriculum
    await prisma.curriculumConcentration.delete({
      where: {
        curriculumId_concentrationId: {
          curriculumId: id,
          concentrationId,
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'UNASSIGN',
        description: `Removed concentration "${curriculumConcentration.concentration.name}" from curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        concentrationId: curriculumConcentration.concentration.id,
        changes: {
          removedConcentration: {
            id: curriculumConcentration.concentration.id,
            name: curriculumConcentration.concentration.name,
            courseCount: (curriculumConcentration.concentration as any)._count?.courses ?? 0,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Concentration removed from curriculum successfully',
    });

  } catch (error) {
    console.error('Error removing concentration from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove concentration from curriculum' } },
      { status: 500 }
    );
  }
} 