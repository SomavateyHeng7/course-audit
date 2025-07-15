import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId]/constraints - Get all constraints for a course
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

    // Get course with all constraint relationships
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true
              }
            }
          }
        },
        corequisites: {
          include: {
            corequisite: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Format the response
    const constraints = {
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits
      },
      flags: {
        requiresPermission: course.requiresPermission,
        summerOnly: course.summerOnly,
        requiresSeniorStanding: course.requiresSeniorStanding,
        minCreditThreshold: course.minCreditThreshold
      },
      prerequisites: course.prerequisites.map(p => p.prerequisite),
      corequisites: course.corequisites.map(c => c.corequisite),
      // Banned combinations will be handled at curriculum level
      bannedCombinations: []
    };

    return NextResponse.json({
      success: true,
      constraints
    });
  } catch (error) {
    console.error('Error fetching course constraints:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course constraints' } },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId]/constraints - Update course constraint flags
export async function PUT(
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
    const { 
      requiresPermission, 
      summerOnly, 
      requiresSeniorStanding, 
      minCreditThreshold 
    } = body;

    // Validate input
    if (requiresSeniorStanding && (minCreditThreshold === null || minCreditThreshold === undefined)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Minimum credit threshold is required when senior standing is enabled' } },
        { status: 400 }
      );
    }

    if (minCreditThreshold !== null && minCreditThreshold !== undefined) {
      const threshold = parseInt(minCreditThreshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 200) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Minimum credit threshold must be between 0 and 200' } },
          { status: 400 }
        );
      }
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Update course flags
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        requiresPermission: Boolean(requiresPermission),
        summerOnly: Boolean(summerOnly),
        requiresSeniorStanding: Boolean(requiresSeniorStanding),
        minCreditThreshold: requiresSeniorStanding ? parseInt(minCreditThreshold) : null
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: courseId,
        action: 'UPDATE',
        description: `Updated constraint flags for course ${existingCourse.code}`,
        changes: {
          before: {
            requiresPermission: existingCourse.requiresPermission,
            summerOnly: existingCourse.summerOnly,
            requiresSeniorStanding: existingCourse.requiresSeniorStanding,
            minCreditThreshold: existingCourse.minCreditThreshold
          },
          after: {
            requiresPermission: updatedCourse.requiresPermission,
            summerOnly: updatedCourse.summerOnly,
            requiresSeniorStanding: updatedCourse.requiresSeniorStanding,
            minCreditThreshold: updatedCourse.minCreditThreshold
          }
        },
        courseId: courseId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Course constraints updated successfully',
      course: {
        id: updatedCourse.id,
        code: updatedCourse.code,
        name: updatedCourse.name,
        flags: {
          requiresPermission: updatedCourse.requiresPermission,
          summerOnly: updatedCourse.summerOnly,
          requiresSeniorStanding: updatedCourse.requiresSeniorStanding,
          minCreditThreshold: updatedCourse.minCreditThreshold
        }
      }
    });
  } catch (error) {
    console.error('Error updating course constraints:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update course constraints' } },
      { status: 500 }
    );
  }
}
