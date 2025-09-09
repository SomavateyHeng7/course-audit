import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cache for faculty department lists to improve performance
const facultyDepartmentCache = new Map<string, { departments: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper function to get cached faculty departments
async function getFacultyDepartments(userId: string): Promise<string[]> {
  const cached = facultyDepartmentCache.get(userId);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.departments;
  }
  
  // Optimized query - only fetch what we need
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      department: {
        select: {
          faculty: {
            select: {
              departments: {
                select: { id: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user?.department?.faculty) {
    throw new Error('User department or faculty not found');
  }

  const departmentIds = user.department.faculty.departments.map(d => d.id);
  
  // Cache the result
  facultyDepartmentCache.set(userId, {
    departments: departmentIds,
    timestamp: Date.now()
  });
  
  return departmentIds;
}

// PUT /api/curricula/[id]/constraints/[constraintId] - Update curriculum constraint
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; constraintId: string }> }
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

    const { id: curriculumId, constraintId } = await params;
    const body = await request.json();
    const { name, description, isRequired, config } = body;

    // Use optimized cached faculty department lookup
    const facultyDepartmentIds = await getFacultyDepartments(session.user.id);

    // Find constraint and verify faculty-wide access with optimized query
    const constraint = await prisma.curriculumConstraint.findFirst({
      where: {
        id: constraintId,
        curriculum: {
          id: curriculumId,
          departmentId: {
            in: facultyDepartmentIds
          }
        }
      },
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        isRequired: true,
        config: true,
        curriculum: { 
          select: { name: true } 
        }
      }
    });

    if (!constraint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Constraint not found or access denied' } },
        { status: 404 }
      );
    }

    // Store original values for audit log
    const originalConstraint = {
      name: constraint.name,
      description: constraint.description,
      isRequired: constraint.isRequired,
      config: constraint.config
    };

    // Update constraint
    const updatedConstraint = await prisma.curriculumConstraint.update({
      where: { id: constraintId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isRequired !== undefined && { isRequired }),
        ...(config !== undefined && { config })
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: constraintId,
        action: 'UPDATE',
        description: `Updated ${constraint.type} constraint "${constraint.name}" in curriculum ${constraint.curriculum.name}`,
        changes: {
          before: originalConstraint,
          after: {
            name: updatedConstraint.name,
            description: updatedConstraint.description,
            isRequired: updatedConstraint.isRequired,
            config: updatedConstraint.config
          }
        },
        curriculumId: curriculumId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Constraint updated successfully',
      constraint: {
        id: updatedConstraint.id,
        type: updatedConstraint.type,
        name: updatedConstraint.name,
        description: updatedConstraint.description,
        isRequired: updatedConstraint.isRequired,
        config: updatedConstraint.config,
        createdAt: updatedConstraint.createdAt,
        updatedAt: updatedConstraint.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating curriculum constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update curriculum constraint' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/constraints/[constraintId] - Delete curriculum constraint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; constraintId: string }> }
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

    const { id: curriculumId, constraintId } = await params;

    // Use optimized cached faculty department lookup
    const facultyDepartmentIds = await getFacultyDepartments(session.user.id);

    // Find constraint and verify faculty-wide access with optimized query
    const constraint = await prisma.curriculumConstraint.findFirst({
      where: {
        id: constraintId,
        curriculum: {
          id: curriculumId,
          departmentId: {
            in: facultyDepartmentIds
          }
        }
      },
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        isRequired: true,
        config: true,
        curriculum: { 
          select: { name: true } 
        }
      }
    });

    if (!constraint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Constraint not found or access denied' } },
        { status: 404 }
      );
    }

    // Delete constraint
    await prisma.curriculumConstraint.delete({
      where: { id: constraintId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: constraintId,
        action: 'DELETE',
        description: `Deleted ${constraint.type} constraint "${constraint.name}" from curriculum ${constraint.curriculum.name}`,
        changes: {
          deleted: {
            type: constraint.type,
            name: constraint.name,
            description: constraint.description,
            isRequired: constraint.isRequired,
            config: constraint.config
          }
        },
        curriculumId: curriculumId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Constraint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting curriculum constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete curriculum constraint' } },
      { status: 500 }
    );
  }
}
