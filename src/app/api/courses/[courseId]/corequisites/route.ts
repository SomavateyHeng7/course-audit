import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId]/corequisites - Get course corequisites
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

    // Get course corequisites
    const corequisites = await prisma.courseCorequisite.findMany({
      where: { courseId },
      include: {
        corequisite: {
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
        corequisite: {
          code: 'asc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      corequisites: corequisites.map(c => ({
        id: c.id,
        corequisite: c.corequisite,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching corequisites:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch corequisites' } },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/corequisites - Add corequisite to course
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
    const { corequisiteId } = body;

    if (!corequisiteId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Corequisite ID is required' } },
        { status: 400 }
      );
    }

    // Validate that both courses exist
    const [course, corequisiteCourse] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.course.findUnique({ where: { id: corequisiteId } })
    ]);

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    if (!corequisiteCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Corequisite course not found' } },
        { status: 404 }
      );
    }

    // Prevent self-corequisite
    if (courseId === corequisiteId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'A course cannot be a corequisite of itself' } },
        { status: 400 }
      );
    }

    // Check if corequisite relationship already exists (either direction)
    const existingCorequisite = await prisma.courseCorequisite.findFirst({
      where: {
        OR: [
          { courseId, corequisiteId },
          { courseId: corequisiteId, corequisiteId: courseId }
        ]
      }
    });

    if (existingCorequisite) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Corequisite relationship already exists' } },
        { status: 409 }
      );
    }

    // Create bi-directional corequisite relationships
    // Corequisites are mutual - if A is corequisite of B, then B is corequisite of A
    const [newCorequisite1, newCorequisite2] = await prisma.$transaction([
      prisma.courseCorequisite.create({
        data: {
          courseId,
          corequisiteId
        },
        include: {
          corequisite: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
              creditHours: true
            }
          }
        }
      }),
      prisma.courseCorequisite.create({
        data: {
          courseId: corequisiteId,
          corequisiteId: courseId
        }
      })
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: courseId,
        action: 'ASSIGN',
        description: `Added corequisite relationship between ${course.code} and ${corequisiteCourse.code}`,
        changes: {
          corequisite: {
            id: corequisiteCourse.id,
            code: corequisiteCourse.code,
            name: corequisiteCourse.name
          }
        },
        courseId: courseId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Corequisite added successfully',
      corequisite: {
        id: newCorequisite1.id,
        corequisite: newCorequisite1.corequisite,
        createdAt: newCorequisite1.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding corequisite:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add corequisite' } },
      { status: 500 }
    );
  }
}


