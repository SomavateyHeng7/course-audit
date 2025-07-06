import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for constraint creation/update
const constraintSchema = z.object({
  type: z.enum(['MINIMUM_GPA', 'SENIOR_STANDING', 'TOTAL_CREDITS', 'CATEGORY_CREDITS', 'CUSTOM']),
  name: z.string().min(1, 'Constraint name is required'),
  description: z.string().optional(),
  isRequired: z.boolean().optional().default(true),
  config: z.record(z.any()).optional(), // JSON configuration
});

// GET /api/curricula/[id]/constraints - Get constraints for a curriculum
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

    // Get constraints for the curriculum
    const constraints = await prisma.curriculumConstraint.findMany({
      where: {
        curriculumId: id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ constraints });

  } catch (error) {
    console.error('Error fetching curriculum constraints:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum constraints' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/constraints - Add constraint to curriculum
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
    const validatedData = constraintSchema.parse(body);

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

    // Check if constraint with same name already exists for this curriculum
    const existingConstraint = await prisma.curriculumConstraint.findFirst({
      where: {
        curriculumId: id,
        name: validatedData.name,
      },
    });

    if (existingConstraint) {
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

    // Create constraint
    const constraint = await prisma.curriculumConstraint.create({
      data: {
        curriculumId: id,
        type: validatedData.type,
        name: validatedData.name,
        description: validatedData.description,
        isRequired: validatedData.isRequired,
        config: validatedData.config || {},
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: constraint.id,
        action: 'CREATE',
        description: `Added constraint "${constraint.name}" to curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          addedConstraint: {
            id: constraint.id,
            name: constraint.name,
            type: constraint.type,
            isRequired: constraint.isRequired,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Constraint added to curriculum successfully',
      constraint,
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding constraint to curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add constraint to curriculum' } },
      { status: 500 }
    );
  }
} 