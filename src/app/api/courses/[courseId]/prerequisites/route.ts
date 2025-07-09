import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId]/prerequisites - Get course prerequisites
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Get course prerequisites
    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisite: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            creditHours: true
          }
        }
      },
      orderBy: {
        prerequisite: {
          code: 'asc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      prerequisites: prerequisites.map(p => ({
        id: p.id,
        prerequisite: p.prerequisite,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch prerequisites' } },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/prerequisites - Add prerequisite to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await params;
    const body = await request.json();
    const { prerequisiteId } = body;

    if (!prerequisiteId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Prerequisite ID is required' } },
        { status: 400 }
      );
    }

    // Validate that both courses exist
    const [course, prerequisiteCourse] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.course.findUnique({ where: { id: prerequisiteId } })
    ]);

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    if (!prerequisiteCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Prerequisite course not found' } },
        { status: 404 }
      );
    }

    // Prevent self-prerequisite
    if (courseId === prerequisiteId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'A course cannot be a prerequisite of itself' } },
        { status: 400 }
      );
    }

    // Check if prerequisite relationship already exists
    const existingPrerequisite = await prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteId: {
          courseId,
          prerequisiteId
        }
      }
    });

    if (existingPrerequisite) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Prerequisite relationship already exists' } },
        { status: 409 }
      );
    }

    // Check for circular dependencies (prerequisite course can't have this course as prerequisite)
    const circularCheck = await prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteId: {
          courseId: prerequisiteId,
          prerequisiteId: courseId
        }
      }
    });

    if (circularCheck) {
      return NextResponse.json(
        { error: { code: 'CIRCULAR_DEPENDENCY', message: 'Cannot create circular prerequisite dependency' } },
        { status: 400 }
      );
    }

    // Create prerequisite relationship
    const newPrerequisite = await prisma.coursePrerequisite.create({
      data: {
        courseId,
        prerequisiteId
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            creditHours: true
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: courseId,
        action: 'ASSIGN',
        description: `Added prerequisite ${prerequisiteCourse.code} to course ${course.code}`,
        changes: {
          prerequisite: {
            id: prerequisiteCourse.id,
            code: prerequisiteCourse.code,
            name: prerequisiteCourse.name
          }
        },
        courseId: courseId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Prerequisite added successfully',
      prerequisite: {
        id: newPrerequisite.id,
        prerequisite: newPrerequisite.prerequisite,
        createdAt: newPrerequisite.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding prerequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add prerequisite' } },
      { status: 500 }
    );
  }
}

