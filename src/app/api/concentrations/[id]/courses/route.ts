import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for adding courses to concentration
const addCoursesSchema = z.object({
  courseIds: z.array(z.string().min(1, 'Course ID is required')).min(1, 'At least one course ID is required'),
});

// POST /api/concentrations/[id]/courses - Add courses to concentration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validatedData = addCoursesSchema.parse(body);

    // Check if concentration exists and user owns it
    const concentration = await prisma.concentration.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Verify all courses exist
    const courses = await prisma.course.findMany({
      where: {
        id: { in: validatedData.courseIds },
      },
      select: { id: true, code: true, name: true },
    });

    if (courses.length !== validatedData.courseIds.length) {
      const foundIds = courses.map(c => c.id);
      const missingIds = validatedData.courseIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSE_NOT_FOUND', 
            message: `Courses not found: ${missingIds.join(', ')}` 
          } 
        },
        { status: 404 }
      );
    }

    // Check which courses are already in the concentration
    const existingConcentrationCourses = await prisma.concentrationCourse.findMany({
      where: {
        concentrationId: id,
        courseId: { in: validatedData.courseIds },
      },
      select: { courseId: true },
    });

    const existingCourseIds = existingConcentrationCourses.map(cc => cc.courseId);
    const newCourseIds = validatedData.courseIds.filter(courseId => !existingCourseIds.includes(courseId));

    if (newCourseIds.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_ALREADY_EXIST', 
            message: 'All courses are already in this concentration' 
          } 
        },
        { status: 409 }
      );
    }

    // Add new courses to concentration
    const addedConcentrationCourses = await prisma.concentrationCourse.createMany({
      data: newCourseIds.map(courseId => ({
        concentrationId: id,
        courseId,
      })),
    });

    // Get the added courses for response
    const addedCourses = courses.filter(course => newCourseIds.includes(course.id));

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Concentration',
        entityId: concentration.id,
        action: 'ASSIGN',
        description: `Added ${addedCourses.length} courses to concentration: ${concentration.name}`,
        concentrationId: concentration.id,
        changes: {
          addedCourses: addedCourses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        },
      },
    });

    return NextResponse.json({
      message: 'Courses added to concentration successfully',
      addedCourses,
      alreadyExists: existingCourseIds.length > 0 ? existingCourseIds : undefined,
    });

  } catch (error) {
    console.error('Error adding courses to concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add courses to concentration' } },
      { status: 500 }
    );
  }
}

// DELETE /api/concentrations/[id]/courses - Remove courses from concentration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course IDs array is required' } },
        { status: 400 }
      );
    }

    // Check if concentration exists and user owns it
    const concentration = await prisma.concentration.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Get courses that are actually in the concentration
    const concentrationCourses = await prisma.concentrationCourse.findMany({
      where: {
        concentrationId: id,
        courseId: { in: courseIds },
      },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (concentrationCourses.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_NOT_FOUND', 
            message: 'None of the specified courses are in this concentration' 
          } 
        },
        { status: 404 }
      );
    }

    // Remove courses from concentration
    await prisma.concentrationCourse.deleteMany({
      where: {
        concentrationId: id,
        courseId: { in: courseIds },
      },
    });

    const removedCourses = concentrationCourses.map(cc => cc.course);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Concentration',
        entityId: concentration.id,
        action: 'UNASSIGN',
        description: `Removed ${removedCourses.length} courses from concentration: ${concentration.name}`,
        concentrationId: concentration.id,
        changes: {
          removedCourses: removedCourses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        },
      },
    });

    return NextResponse.json({
      message: 'Courses removed from concentration successfully',
      removedCourses,
    });

  } catch (error) {
    console.error('Error removing courses from concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove courses from concentration' } },
      { status: 500 }
    );
  }
} 