import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for adding courses to blacklist
const addCoursesSchema = z.object({
  courseIds: z.array(z.string().min(1, 'Course ID is required')).min(1, 'At least one course ID is required'),
});

// POST /api/blacklists/[id]/courses - Add courses to blacklist
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

    // Check if blacklist exists and user owns it
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found' } },
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

    // Check which courses are already in the blacklist
    const existingBlacklistCourses = await prisma.blacklistCourse.findMany({
      where: {
        blacklistId: id,
        courseId: { in: validatedData.courseIds },
      },
      select: { courseId: true },
    });

    const existingCourseIds = existingBlacklistCourses.map(bc => bc.courseId);
    const newCourseIds = validatedData.courseIds.filter(courseId => !existingCourseIds.includes(courseId));

    if (newCourseIds.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_ALREADY_EXIST', 
            message: 'All courses are already in this blacklist' 
          } 
        },
        { status: 409 }
      );
    }

    // Add new courses to blacklist
    const addedBlacklistCourses = await prisma.blacklistCourse.createMany({
      data: newCourseIds.map(courseId => ({
        blacklistId: id,
        courseId,
      })),
    });

    // Get the added courses for response
    const addedCourses = courses.filter(course => newCourseIds.includes(course.id));

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: blacklist.id,
        action: 'ASSIGN',
        description: `Added ${addedCourses.length} courses to blacklist: ${blacklist.name}`,
        blacklistId: blacklist.id,
        changes: {
          addedCourses: addedCourses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        },
      },
    });

    return NextResponse.json({
      message: 'Courses added to blacklist successfully',
      addedCourses,
      alreadyExists: existingCourseIds.length > 0 ? existingCourseIds : undefined,
    });

  } catch (error) {
    console.error('Error adding courses to blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add courses to blacklist' } },
      { status: 500 }
    );
  }
}

// DELETE /api/blacklists/[id]/courses - Remove courses from blacklist
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

    // Check if blacklist exists and user owns it
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found' } },
        { status: 404 }
      );
    }

    // Get courses that are actually in the blacklist
    const blacklistCourses = await prisma.blacklistCourse.findMany({
      where: {
        blacklistId: id,
        courseId: { in: courseIds },
      },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (blacklistCourses.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_NOT_FOUND', 
            message: 'None of the specified courses are in this blacklist' 
          } 
        },
        { status: 404 }
      );
    }

    // Remove courses from blacklist
    await prisma.blacklistCourse.deleteMany({
      where: {
        blacklistId: id,
        courseId: { in: courseIds },
      },
    });

    const removedCourses = blacklistCourses.map(bc => bc.course);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: blacklist.id,
        action: 'UNASSIGN',
        description: `Removed ${removedCourses.length} courses from blacklist: ${blacklist.name}`,
        blacklistId: blacklist.id,
        changes: {
          removedCourses: removedCourses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        },
      },
    });

    return NextResponse.json({
      message: 'Courses removed from blacklist successfully',
      removedCourses,
    });

  } catch (error) {
    console.error('Error removing courses from blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove courses from blacklist' } },
      { status: 500 }
    );
  }
} 