import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for adding courses to curriculum
const addCoursesSchema = z.object({
  courseIds: z.array(z.string().min(1, 'Course ID is required')).min(1, 'At least one course ID is required'),
  isRequired: z.boolean().optional().default(true),
  semester: z.string().optional(),
  year: z.number().optional(),
  position: z.number().optional(),
});

// Validation schema for updating curriculum course
const updateCurriculumCourseSchema = z.object({
  isRequired: z.boolean().optional(),
  semester: z.string().optional(),
  year: z.number().optional(),
  position: z.number().optional(),
});

// GET /api/curricula/[id]/courses - Get courses in curriculum
export async function GET(
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

    // Get courses in the curriculum
    const curriculumCourses = await prisma.curriculumCourse.findMany({
      where: {
        curriculumId: id,
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
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
        { position: 'asc' },
      ],
    });

    return NextResponse.json({ curriculumCourses });

  } catch (error) {
    console.error('Error fetching curriculum courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum courses' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/courses - Add courses to curriculum
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

    // Verify all courses exist
    const courses = await prisma.course.findMany({
      where: {
        id: { in: validatedData.courseIds },
      },
      select: { id: true, code: true, name: true, credits: true },
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

    // Check which courses are already in the curriculum
    const existingCurriculumCourses = await prisma.curriculumCourse.findMany({
      where: {
        curriculumId: id,
        courseId: { in: validatedData.courseIds },
      },
      select: { courseId: true },
    });

    const existingCourseIds = existingCurriculumCourses.map(cc => cc.courseId);
    const newCourseIds = validatedData.courseIds.filter(courseId => !existingCourseIds.includes(courseId));

    if (newCourseIds.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_ALREADY_EXIST', 
            message: 'All courses are already in this curriculum' 
          } 
        },
        { status: 409 }
      );
    }

    // Get the next position if not specified
    let nextPosition = validatedData.position;
    if (nextPosition === undefined) {
      const maxPosition = await prisma.curriculumCourse.aggregate({
        where: { curriculumId: id },
        _max: { position: true },
      });
      nextPosition = (maxPosition._max.position || 0) + 1;
    }

    // Add new courses to curriculum
    const addedCurriculumCourses = await prisma.curriculumCourse.createMany({
      data: newCourseIds.map((courseId, index) => ({
        curriculumId: id,
        courseId,
        isRequired: validatedData.isRequired,
        semester: validatedData.semester,
        year: validatedData.year,
        position: nextPosition + index,
      })),
    });

    // Get the added courses for response
    const addedCourses = courses.filter(course => newCourseIds.includes(course.id));

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'ASSIGN',
        description: `Added ${addedCourses.length} courses to curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          addedCourses: addedCourses.map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
          })),
        },
      },
    });

    return NextResponse.json({
      message: 'Courses added to curriculum successfully',
      addedCourses,
      count: addedCurriculumCourses.count,
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding courses to curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add courses to curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/courses - Remove courses from curriculum
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

    // Get courses that are actually in the curriculum
    const curriculumCourses = await prisma.curriculumCourse.findMany({
      where: {
        curriculumId: id,
        courseId: { in: courseIds },
      },
      include: {
        course: {
          select: { id: true, code: true, name: true, credits: true },
        },
      },
    });

    if (curriculumCourses.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'COURSES_NOT_FOUND', 
            message: 'None of the specified courses are in this curriculum' 
          } 
        },
        { status: 404 }
      );
    }

    // Store course data for audit before deletion
    const courseData = curriculumCourses.map(cc => ({
      id: cc.course.id,
      code: cc.course.code,
      name: cc.course.name,
      credits: cc.course.credits,
    }));

    // Remove courses from curriculum
    await prisma.curriculumCourse.deleteMany({
      where: {
        curriculumId: id,
        courseId: { in: courseIds },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'UNASSIGN',
        description: `Removed ${courseData.length} courses from curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          removedCourses: courseData,
        },
      },
    });

    return NextResponse.json({
      message: 'Courses removed from curriculum successfully',
      removedCourses: courseData,
      count: courseData.length,
    });

  } catch (error) {
    console.error('Error removing courses from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove courses from curriculum' } },
      { status: 500 }
    );
  }
} 