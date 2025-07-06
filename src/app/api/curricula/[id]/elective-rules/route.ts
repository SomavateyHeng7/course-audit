import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for elective rule creation/update
const electiveRuleSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  requiredCredits: z.number().min(0, 'Required credits must be non-negative'),
  description: z.string().optional(),
});

// Add Zod schema for update/delete
const updateElectiveRuleSchema = z.object({
  ruleId: z.string().min(1, 'Rule ID is required'),
  category: z.string().min(1, 'Category is required'),
  requiredCredits: z.number().min(1, 'Required credits must be at least 1'),
  description: z.string().optional(),
});
const deleteElectiveRuleSchema = z.object({
  ruleId: z.string().min(1, 'Rule ID is required'),
});

// GET /api/curricula/[id]/elective-rules - Get elective rules for curriculum
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

    // Get elective rules
    const electiveRules = await prisma.electiveRule.findMany({
      where: {
        curriculumId: id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ electiveRules });

  } catch (error) {
    console.error('Error fetching elective rules:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch elective rules' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/elective-rules - Create elective rule
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
    const validatedData = electiveRuleSchema.parse(body);

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

    // Check if elective rule with same category already exists
    const existingRule = await prisma.electiveRule.findFirst({
      where: {
        curriculumId: id,
        category: validatedData.category,
      },
    });

    if (existingRule) {
      return NextResponse.json(
        { 
          error: { 
            code: 'DUPLICATE_ELECTIVE_RULE', 
            message: 'Elective rule for this category already exists' 
          } 
        },
        { status: 409 }
      );
    }

    // Create elective rule
    const electiveRule = await prisma.electiveRule.create({
      data: {
        curriculumId: id,
        category: validatedData.category,
        requiredCredits: validatedData.requiredCredits,
        description: validatedData.description,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'CREATE',
        description: `Created elective rule for category "${validatedData.category}"`,
        curriculumId: curriculum.id,
        changes: {
          createdElectiveRule: {
            id: electiveRule.id,
            category: electiveRule.category,
            requiredCredits: electiveRule.requiredCredits,
            description: electiveRule.description,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Elective rule created successfully',
      electiveRule,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating elective rule:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create elective rule' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id]/elective-rules/[ruleId] - Update elective rule
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

    const validatedData = updateElectiveRuleSchema.parse(await request.json());

    // Check if elective rule exists and belongs to user's curriculum
    const electiveRule = await prisma.electiveRule.findFirst({
      where: {
        id: validatedData.ruleId,
        curriculum: {
          id,
          createdById: session.user.id,
        },
      },
    });

    if (!electiveRule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Elective rule not found' } },
        { status: 404 }
      );
    }

    // Check if category is being changed and if it conflicts with another rule
    if (validatedData.category !== electiveRule.category) {
      const conflictingRule = await prisma.electiveRule.findFirst({
        where: {
          curriculumId: id,
          category: validatedData.category,
          id: { not: validatedData.ruleId },
        },
      });

      if (conflictingRule) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_ELECTIVE_RULE', 
              message: 'Elective rule for this category already exists' 
            } 
          },
          { status: 409 }
        );
      }
    }

    // Update elective rule
    const updatedElectiveRule = await prisma.electiveRule.update({
      where: { id: validatedData.ruleId },
      data: {
        category: validatedData.category,
        requiredCredits: validatedData.requiredCredits,
        description: validatedData.description,
        curriculumId: id,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: id,
        action: 'UPDATE',
        description: `Updated elective rule for category "${validatedData.category}"`,
        curriculumId: id,
        changes: {
          category: validatedData.category !== electiveRule.category ? { from: electiveRule.category, to: validatedData.category } : undefined,
          requiredCredits: validatedData.requiredCredits !== electiveRule.requiredCredits ? { from: electiveRule.requiredCredits, to: validatedData.requiredCredits } : undefined,
          description: validatedData.description !== electiveRule.description ? { from: electiveRule.description, to: validatedData.description } : undefined,
        },
      },
    });

    return NextResponse.json({
      message: 'Elective rule updated successfully',
      electiveRule: updatedElectiveRule,
    });

  } catch (error) {
    console.error('Error updating elective rule:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update elective rule' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/elective-rules/[ruleId] - Delete elective rule
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

    const validatedData = deleteElectiveRuleSchema.parse(await request.json());

    // Check if elective rule exists and belongs to user's curriculum
    const electiveRule = await prisma.electiveRule.findFirst({
      where: {
        id: validatedData.ruleId,
        curriculum: {
          id,
          createdById: session.user.id,
        },
      },
    });

    if (!electiveRule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Elective rule not found' } },
        { status: 404 }
      );
    }

    // Delete elective rule
    await prisma.electiveRule.delete({
      where: { id: validatedData.ruleId },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: id,
        action: 'DELETE',
        description: `Deleted elective rule for category "${electiveRule.category}"`,
        curriculumId: id,
        changes: {
          deletedElectiveRule: {
            id: electiveRule.id,
            category: electiveRule.category,
            requiredCredits: electiveRule.requiredCredits,
            description: electiveRule.description,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Elective rule deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting elective rule:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete elective rule' } },
      { status: 500 }
    );
  }
} 