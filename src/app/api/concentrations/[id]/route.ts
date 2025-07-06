import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for concentration updates
const updateConcentrationSchema = z.object({
  name: z.string().min(1, 'Concentration name is required').optional(),
  description: z.string().optional(),
});

// GET /api/concentrations/[id] - Get specific concentration
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

    // Get concentration with courses
    const concentration = await prisma.concentration.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        courses: {
          include: {
            course: {
              select: { 
                id: true, 
                code: true, 
                name: true, 
                credits: true, 
                category: true,
                creditHours: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ concentration });

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
    const validatedData = updateConcentrationSchema.parse(body);

    // Check if concentration exists and user owns it
    const existingConcentration = await prisma.concentration.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existingConcentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingConcentration.name) {
      const duplicateCheck = await prisma.concentration.findFirst({
        where: {
          id: { not: id },
          name: validatedData.name,
          departmentId: existingConcentration.departmentId,
          createdById: session.user.id,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_CONCENTRATION', 
              message: 'Concentration with this name already exists in this department' 
            } 
          },
          { status: 409 }
        );
      }
    }

    // Update concentration
    const updatedConcentration = await prisma.concentration.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
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

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Concentration',
        entityId: updatedConcentration.id,
        action: 'UPDATE',
        description: `Updated concentration: ${updatedConcentration.name}`,
        concentrationId: updatedConcentration.id,
        changes: {
          name: validatedData.name ? { from: existingConcentration.name, to: validatedData.name } : undefined,
          description: validatedData.description !== undefined ? { from: existingConcentration.description, to: validatedData.description } : undefined,
        },
      },
    });

    return NextResponse.json({ concentration: updatedConcentration });

  } catch (error) {
    console.error('Error updating concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update concentration' } },
      { status: 500 }
    );
  }
}

// DELETE /api/concentrations/[id] - Delete concentration
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

    // Check if concentration exists and user owns it
    const concentration = await prisma.concentration.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            courses: true,
            curriculumConcentrations: true,
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

    // Check if concentration is being used by any curricula
    if (concentration._count.curriculumConcentrations > 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'CONCENTRATION_IN_USE', 
            message: 'Cannot delete concentration that is being used by curricula. Please remove it from all curricula first.' 
          } 
        },
        { status: 409 }
      );
    }

    // Delete concentration (courses will be deleted via cascade)
    await prisma.concentration.delete({
      where: { id },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Concentration',
        entityId: id,
        action: 'DELETE',
        description: `Deleted concentration: ${concentration.name}`,
        changes: {
          deletedConcentration: {
            id: concentration.id,
            name: concentration.name,
            courseCount: concentration._count.courses,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Concentration deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete concentration' } },
      { status: 500 }
    );
  }
} 