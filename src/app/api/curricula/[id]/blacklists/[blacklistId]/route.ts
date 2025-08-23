import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/curricula/[id]/blacklists/[blacklistId] - Remove blacklist from curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blacklistId: string }> }
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

    const { id: curriculumId, blacklistId } = await params;

    // Get user's department and faculty for access control
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
        { error: 'User department not found' },
        { status: 403 }
      );
    }

    // Get accessible department IDs (all departments in user's faculty)
    const accessibleDepartmentIds = user.department.faculty.departments.map(dept => dept.id);

    // Verify curriculum access (department-based)
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: { in: accessibleDepartmentIds }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Find the assignment
    const assignment = await prisma.curriculumBlacklist.findFirst({
      where: {
        curriculumId: curriculumId,
        blacklistId: blacklistId
      },
      include: {
        blacklist: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            createdById: true,
            _count: {
              select: {
                courses: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist assignment not found' } },
        { status: 404 }
      );
    }

    // Verify blacklist access (department-based security check)
    if (!accessibleDepartmentIds.includes(assignment.blacklist.departmentId)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this blacklist' } },
        { status: 403 }
      );
    }

    // Remove assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Store assignment data for audit before deletion
      const assignmentData = {
        id: assignment.id,
        blacklistId: assignment.blacklistId,
        blacklistName: assignment.blacklist.name,
        courseCount: assignment.blacklist._count.courses,
        assignedAt: assignment.createdAt
      };

      // Delete the assignment
      await tx.curriculumBlacklist.delete({
        where: { id: assignment.id }
      });

      // Log the removal
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'CurriculumBlacklist',
          entityId: assignment.id,
          action: 'DELETE',
          description: `Removed blacklist "${assignment.blacklist.name}" from curriculum "${curriculum.name}"`,
          curriculumId: curriculumId,
          changes: {
            removedAssignment: assignmentData
          }
        }
      });

      return assignmentData;
    });

    return NextResponse.json({
      message: `Blacklist "${result.blacklistName}" removed successfully from curriculum`,
      removedAssignment: result
    });

  } catch (error) {
    console.error('Error removing blacklist from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove blacklist from curriculum' } },
      { status: 500 }
    );
  }
}
