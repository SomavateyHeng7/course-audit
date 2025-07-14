import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/curricula/[id]/courses - Add course to curriculum
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: curriculumId } = await params;
    const body = await request.json();
    const { courseId, isRequired = true, year = 1, semester = '1', position } = body;

    // Debug logging
    console.log('Add course request body:', body);
    console.log('Parsed values:', { courseId, isRequired, year, semester, position });

    // Convert year to integer if it's a string, keep semester as string
    const yearInt = typeof year === 'string' ? parseInt(year) : year;
    const semesterStr = typeof semester === 'number' ? semester.toString() : semester;

    console.log('Converted values:', { yearInt, semesterStr, yearType: typeof yearInt, semesterType: typeof semesterStr });

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    // Validate year and semester
    if (isNaN(yearInt) || yearInt < 1 || yearInt > 6) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Year must be between 1 and 6' } },
        { status: 400 }
      );
    }

    if (!semesterStr || !['1', '2', '3'].includes(semesterStr)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Semester must be 1, 2, or 3' } },
        { status: 400 }
      );
    }

    // Verify curriculum ownership
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true 
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Check if course is already in curriculum
    const existingCurriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId,
        courseId,
      },
    });

    if (existingCurriculumCourse) {
      return NextResponse.json(
        { error: { code: 'COURSE_ALREADY_EXISTS', message: 'Course is already in this curriculum' } },
        { status: 409 }
      );
    }

    // Add course to curriculum
    const curriculumCourse = await prisma.curriculumCourse.create({
      data: {
        curriculumId,
        courseId,
        isRequired,
        year: yearInt,
        semester: semesterStr,
        ...(position !== undefined && { position }),
      },
      include: {
        course: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourse',
        entityId: curriculumCourse.id,
        action: 'CREATE',
        description: `Added course ${course.code} to curriculum ${curriculum.name}`,
        changes: {
          courseId,
          curriculumId,
          isRequired,
          year: yearInt,
          semester: semesterStr,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course added to curriculum successfully',
      curriculumCourse,
    });
  } catch (error) {
    console.error('Error adding course to curriculum:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add course to curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/courses/[courseId] - Remove course from curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: curriculumId } = await params;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    // Verify curriculum ownership
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Find and remove curriculum course
    const curriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId,
        courseId,
      },
      include: {
        course: true,
      },
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found in curriculum' } },
        { status: 404 }
      );
    }

    await prisma.curriculumCourse.delete({
      where: { id: curriculumCourse.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumCourse',
        entityId: curriculumCourse.id,
        action: 'DELETE',
        description: `Removed course ${curriculumCourse.course.code} from curriculum ${curriculum.name}`,
        changes: {
          courseId,
          curriculumId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course removed from curriculum successfully',
    });
  } catch (error) {
    console.error('Error removing course from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove course from curriculum' } },
      { status: 500 }
    );
  }
}

