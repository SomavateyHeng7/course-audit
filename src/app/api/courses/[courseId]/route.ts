import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId] - Get individual course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
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

    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true 
      },
      include: {
        prerequisites: {
          include: {
            prerequisite: true
          }
        },
        corequisites: {
          include: {
            corequisite: true
          }
        },
        curriculumCourses: {
          include: {
            curriculum: {
              select: {
                id: true,
                name: true
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

    return NextResponse.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course' } },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId] - Update course details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
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

    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, credits, creditHours, description } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course name is required' } },
        { status: 400 }
      );
    }

    if (typeof credits !== 'number' || credits < 0 || credits > 6) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Credits must be a number between 0 and 6' } },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true 
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        name: name.trim(),
        credits,
        creditHours: creditHours?.trim() || null,
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update course' } },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId] - Soft delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
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

    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true 
      },
      include: {
        curriculumCourses: true
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Check if course is being used in any curricula
    if (existingCourse.curriculumCourses && existingCourse.curriculumCourses.length > 0) {
      return NextResponse.json(
        { error: { 
          code: 'COURSE_IN_USE', 
          message: 'Cannot delete course that is currently used in curricula. Please remove it from all curricula first.' 
        } },
        { status: 409 }
      );
    }

    // Soft delete the course
    await prisma.course.update({
      where: { id: courseId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete course' } },
      { status: 500 }
    );
  }
}
