import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

// DELETE /api/courses/[courseId]/prerequisites/[prerequisiteRelationId] - Remove specific prerequisite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; prerequisiteRelationId: string }> }
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

    const { courseId, prerequisiteRelationId } = await params;

    // Find the prerequisite relationship to delete
    const prerequisiteRelation = await prisma.coursePrerequisite.findUnique({
      where: { id: prerequisiteRelationId },
      include: {
        course: { select: { code: true, name: true } },
        prerequisite: { select: { code: true, name: true } }
      }
    });

    if (!prerequisiteRelation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Prerequisite relationship not found' } },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to the specified course
    if (prerequisiteRelation.courseId !== courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Prerequisite relationship does not belong to this course' } },
        { status: 400 }
      );
    }

    // Delete the prerequisite relationship
    await prisma.coursePrerequisite.delete({
      where: { id: prerequisiteRelationId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: courseId,
        action: 'UNASSIGN',
        description: `Removed prerequisite ${prerequisiteRelation.prerequisite.code} from course ${prerequisiteRelation.course.code}`,
        changes: {
          prerequisite: {
            id: prerequisiteRelation.prerequisiteId,
            code: prerequisiteRelation.prerequisite.code,
            name: prerequisiteRelation.prerequisite.name
          }
        },
        courseId: courseId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Prerequisite removed successfully'
    });
  } catch (error) {
    console.error('Error removing prerequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove prerequisite' } },
      { status: 500 }
    );
  }
}
