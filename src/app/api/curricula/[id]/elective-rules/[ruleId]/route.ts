import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

// PUT /api/curricula/[id]/elective-rules/[ruleId] - Update elective rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
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

    const { id: curriculumId, ruleId } = await params;
    const { requiredCredits, description } = await request.json();

    // Validate input
    if (requiredCredits !== undefined && (typeof requiredCredits !== 'number' || requiredCredits < 0)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Required credits must be a non-negative number' } },
        { status: 400 }
      );
    }

    // Get user's department for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User department or faculty not found' } },
        { status: 404 }
      );
    }

    // Get all department IDs within the user's faculty for access control
    const facultyDepartmentIds = user.department.faculty.departments.map(d => d.id);

    // Verify curriculum exists and user has faculty-wide access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Get existing elective rule
    const existingRule = await prisma.electiveRule.findFirst({
      where: {
        id: ruleId,
        curriculumId
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Elective rule not found' } },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (requiredCredits !== undefined) updateData.requiredCredits = requiredCredits;
    if (description !== undefined) updateData.description = description;

    // Update elective rule
    const updatedRule = await prisma.electiveRule.update({
      where: { id: ruleId },
      data: updateData
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'ElectiveRule',
        entityId: ruleId,
        action: 'UPDATE',
        changes: {
          before: {
            requiredCredits: existingRule.requiredCredits,
            description: existingRule.description
          },
          after: {
            requiredCredits: updatedRule.requiredCredits,
            description: updatedRule.description
          }
        },
        curriculumId
      }
    });

    return NextResponse.json({ electiveRule: updatedRule });

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
  { params }: { params: Promise<{ id: string; ruleId: string }> }
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

    const { id: curriculumId, ruleId } = await params;

    // Get user's department for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User department or faculty not found' } },
        { status: 404 }
      );
    }

    // Get all department IDs within the user's faculty for access control
    const facultyDepartmentIds = user.department.faculty.departments.map(d => d.id);

    // Verify curriculum exists and user has faculty-wide access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Get existing elective rule for audit log
    const existingRule = await prisma.electiveRule.findFirst({
      where: {
        id: ruleId,
        curriculumId
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Elective rule not found' } },
        { status: 404 }
      );
    }

    // Delete elective rule
    await prisma.electiveRule.delete({
      where: { id: ruleId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'ElectiveRule',
        entityId: ruleId,
        action: 'DELETE',
        changes: {
          deleted: {
            category: existingRule.category,
            requiredCredits: existingRule.requiredCredits,
            description: existingRule.description
          }
        },
        curriculumId
      }
    });

    return NextResponse.json({ 
      message: 'Elective rule deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting elective rule:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete elective rule' } },
      { status: 500 }
    );
  }
}
