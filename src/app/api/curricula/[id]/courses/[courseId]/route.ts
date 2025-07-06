import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating curriculum course
const updateCurriculumCourseSchema = z.object({
  isRequired: z.boolean().optional(),
  semester: z.string().optional(),
  year: z.number().optional(),
  position: z.number().optional(),
});

// GET /api/curricula/[id]/courses/[courseId] - Get specific course in curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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

    // Get the specific course in the curriculum
    const curriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId: id,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            category: true,
            creditHours: true,
            description: true,
          },
        },
      },
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found in curriculum' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ curriculumCourse });

  } catch (error) {
    console.error('Error fetching curriculum course:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum course' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id]/courses/[courseId] - Update course in curriculum
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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
    const validatedData = updateCurriculumCourseSchema.parse(body);

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

    // Check if course exists in the curriculum
    const existingCurriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId: id,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    if (!existingCurriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found in curriculum' } },
        { status: 404 }
      );
    }

    // Store original data for audit
    const originalData = {
      isRequired: existingCurriculumCourse.isRequired,
      semester: existingCurriculumCourse.semester,
      year: existingCurriculumCourse.year,
      position: existingCurriculumCourse.position,
    };

    // Update curriculum course
    const updatedCurriculumCourse = await prisma.curriculumCourse.update({
      where: {
        curriculumId_courseId: {
          curriculumId: id,
          courseId,
        },
      },
      data: validatedData,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            category: true,
            creditHours: true,
            description: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourse',
        entityId: `${id}-${courseId}`,
        action: 'UPDATE',
        description: `Updated course "${updatedCurriculumCourse.course.name}" in curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          before: originalData,
          after: {
            isRequired: updatedCurriculumCourse.isRequired,
            semester: updatedCurriculumCourse.semester,
            year: updatedCurriculumCourse.year,
            position: updatedCurriculumCourse.position,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Course updated in curriculum successfully',
      curriculumCourse: updatedCurriculumCourse,
    });

  } catch (error) {
    console.error('Error updating course in curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update course in curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/courses/[courseId] - Remove course from curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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

    // Check if course exists in the curriculum
    const curriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId: id,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found in curriculum' } },
        { status: 404 }
      );
    }

    // Store course data for audit before deletion
    const courseData = {
      id: curriculumCourse.course.id,
      code: curriculumCourse.course.code,
      name: curriculumCourse.course.name,
      credits: curriculumCourse.course.credits,
      isRequired: curriculumCourse.isRequired,
      semester: curriculumCourse.semester,
      year: curriculumCourse.year,
      position: curriculumCourse.position,
    };

    // Remove course from curriculum
    await prisma.curriculumCourse.delete({
      where: {
        curriculumId_courseId: {
          curriculumId: id,
          courseId,
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourse',
        entityId: `${id}-${courseId}`,
        action: 'DELETE',
        description: `Removed course "${courseData.name}" from curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          removedCourse: courseData,
        },
      },
    });

    return NextResponse.json({
      message: 'Course removed from curriculum successfully',
      removedCourse: courseData,
    });

  } catch (error) {
    console.error('Error removing course from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove course from curriculum' } },
      { status: 500 }
    );
  }
} 