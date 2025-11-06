import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

// DELETE /api/courses/[courseId]/corequisites/[corequisiteRelationId] - Remove specific corequisite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; corequisiteRelationId: string }> }
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

    const { courseId, corequisiteRelationId } = await params;

    // Find the corequisite relationship to delete
    const corequisiteRelation = await prisma.courseCorequisite.findUnique({
      where: { id: corequisiteRelationId },
      include: {
        course: { select: { code: true, name: true } },
        corequisite: { select: { code: true, name: true } }
      }
    });

    if (!corequisiteRelation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Corequisite relationship not found' } },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to the specified course
    if (corequisiteRelation.courseId !== courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Corequisite relationship does not belong to this course' } },
        { status: 400 }
      );
    }

    // Find and delete both directions of the corequisite relationship
    const reverseRelation = await prisma.courseCorequisite.findUnique({
      where: {
        courseId_corequisiteId: {
          courseId: corequisiteRelation.corequisiteId,
          corequisiteId: corequisiteRelation.courseId
        }
      }
    });

    // Delete both directions in a transaction
    await prisma.$transaction([
      prisma.courseCorequisite.delete({
        where: { id: corequisiteRelationId }
      }),
      ...(reverseRelation ? [
        prisma.courseCorequisite.delete({
          where: { id: reverseRelation.id }
        })
      ] : [])
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: courseId,
        action: 'UNASSIGN',
        description: `Removed corequisite relationship between ${corequisiteRelation.course.code} and ${corequisiteRelation.corequisite.code}`,
        changes: {
          corequisite: {
            id: corequisiteRelation.corequisiteId,
            code: corequisiteRelation.corequisite.code,
            name: corequisiteRelation.corequisite.name
          }
        },
        courseId: courseId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Corequisite removed successfully'
    });
  } catch (error) {
    console.error('Error removing corequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove corequisite' } },
      { status: 500 }
    );
  }
}
