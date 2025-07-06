import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for constraint updates
const updateConstraintSchema = z.object({
  type: z.enum(['MINIMUM_GPA', 'SENIOR_STANDING', 'TOTAL_CREDITS', 'CATEGORY_CREDITS', 'CUSTOM']).optional(),
  name: z.string().min(1, 'Constraint name is required').optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  config: z.record(z.any()).optional(), // JSON configuration
});

// GET /api/curricula/[id]/constraints/[constraintId] - Get specific constraint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; constraintId: string }> }
) {
  try {
    const { id, constraintId } = await params;
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

    // Get the specific constraint
    const constraint = await prisma.curriculumConstraint.findFirst({
      where: {
        id: constraintId,
        curriculumId: id,
      },
    });

    if (!constraint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Constraint not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ constraint });

  } catch (error) {
    console.error('Error fetching constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch constraint' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id]/constraints/[constraintId] - Update constraint
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; constraintId: string }> }
) {
  try {
    const { id, constraintId } = await params;
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
    const validatedData = updateConstraintSchema.parse(body);

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

    // Check if constraint exists and belongs to the curriculum
    const existingConstraint = await prisma.curriculumConstraint.findFirst({
      where: {
        id: constraintId,
        curriculumId: id,
      },
    });

    if (!existingConstraint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Constraint not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingConstraint.name) {
      const duplicateCheck = await prisma.curriculumConstraint.findFirst({
        where: {
          id: { not: constraintId },
          curriculumId: id,
          name: validatedData.name,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_CONSTRAINT', 
              message: 'Constraint with this name already exists in this curriculum' 
            } 
          },
          { status: 409 }
        );
      }
    }

    // Store original data for audit
    const originalData = {
      type: existingConstraint.type,
      name: existingConstraint.name,
      description: existingConstraint.description,
      isRequired: existingConstraint.isRequired,
      config: existingConstraint.config,
    };

    // Update constraint
    const updatedConstraint = await prisma.curriculumConstraint.update({
      where: { id: constraintId },
      data: validatedData,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: constraintId,
        action: 'UPDATE',
        description: `Updated constraint "${updatedConstraint.name}" in curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          before: originalData,
          after: {
            type: updatedConstraint.type,
            name: updatedConstraint.name,
            description: updatedConstraint.description,
            isRequired: updatedConstraint.isRequired,
            config: updatedConstraint.config,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Constraint updated successfully',
      constraint: updatedConstraint,
    });

  } catch (error) {
    console.error('Error updating constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update constraint' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/constraints/[constraintId] - Delete constraint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; constraintId: string }> }
) {
  try {
    const { id, constraintId } = await params;
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

    // Check if constraint exists and belongs to the curriculum
    const constraint = await prisma.curriculumConstraint.findFirst({
      where: {
        id: constraintId,
        curriculumId: id,
      },
    });

    if (!constraint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Constraint not found' } },
        { status: 404 }
      );
    }

    // Store constraint data for audit before deletion
    const constraintData = {
      id: constraint.id,
      name: constraint.name,
      type: constraint.type,
      description: constraint.description,
      isRequired: constraint.isRequired,
    };

    // Delete constraint
    await prisma.curriculumConstraint.delete({
      where: { id: constraintId },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: constraintId,
        action: 'DELETE',
        description: `Deleted constraint "${constraintData.name}" from curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          deletedConstraint: constraintData,
        },
      },
    });

    return NextResponse.json({
      message: 'Constraint deleted successfully',
      deletedConstraint: constraintData,
    });

  } catch (error) {
    console.error('Error deleting constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete constraint' } },
      { status: 500 }
    );
  }
} 