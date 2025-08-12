import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/concentrations/[id]/courses - Get courses in concentration
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

    // Get user's faculty and department
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: {
          include: {
            departments: true
          }
        }
      }
    });

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    // Verify concentration exists and belongs to user
    const concentration = await prisma.concentration.findFirst({
      where: {
        id: id,
        departmentId: department.id,
        createdById: session.user.id
      }
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Get courses in concentration
    const concentrationCourses = await prisma.concentrationCourse.findMany({
      where: {
        concentrationId: id
      },
      include: {
        course: true
      },
      orderBy: {
        course: {
          code: 'asc'
        }
      }
    });

    const courses = concentrationCourses.map(cc => ({
      id: cc.course.id,
      code: cc.course.code,
      name: cc.course.name,
      credits: cc.course.credits,
      creditHours: cc.course.creditHours,
      category: cc.course.category,
      description: cc.course.description,
    }));

    return NextResponse.json({
      concentrationId: id,
      concentrationName: concentration.name,
      courses: courses,
      totalCourses: courses.length
    });
  } catch (error) {
    console.error('Error fetching concentration courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch concentration courses' } },
      { status: 500 }
    );
  }
}

// POST /api/concentrations/[id]/courses - Add courses to concentration via upload
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

    // Get user's faculty and department
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: {
          include: {
            departments: true
          }
        }
      }
    });

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    // Verify concentration exists and belongs to user
    const concentration = await prisma.concentration.findFirst({
      where: {
        id: id,
        departmentId: department.id,
        createdById: session.user.id
      }
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { courses } = body;

    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Courses must be an array' } },
        { status: 400 }
      );
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const courseData of courses) {
      try {
        const { code, name, credits, creditHours, category, description } = courseData;

        if (!code || !name) {
          results.errors.push(`Course missing required fields: ${JSON.stringify(courseData)}`);
          continue;
        }

        // Check if course exists, create if it doesn't
        let course = await prisma.course.findFirst({
          where: {
            code: code.toString().trim()
          }
        });

        if (!course) {
          // Create new course
          course = await prisma.course.create({
            data: {
              code: code.toString().trim(),
              name: name.toString().trim(),
              credits: credits ? Number(credits) : 3,
              creditHours: creditHours?.toString() || "3-0-3",
              category: category?.toString() || "General",
              description: description?.toString() || null,
            }
          });
        }

        // Check if course is already in concentration
        const existingCourseInConcentration = await prisma.concentrationCourse.findFirst({
          where: {
            concentrationId: id,
            courseId: course.id
          }
        });

        if (existingCourseInConcentration) {
          results.skipped++;
        } else {
          // Add course to concentration
          await prisma.concentrationCourse.create({
            data: {
              concentrationId: id,
              courseId: course.id
            }
          });
          results.added++;
        }

      } catch (courseError) {
        console.error('Error processing course:', courseError);
        results.errors.push(`Failed to process course: ${JSON.stringify(courseData)}`);
      }
    }

    return NextResponse.json({
      message: 'Courses upload completed',
      results: results
    });

  } catch (error) {
    console.error('Error uploading concentration courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload courses' } },
      { status: 500 }
    );
  }
}

// DELETE /api/concentrations/[id]/courses?courseId=xxx - Remove specific course from concentration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

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

    // Get user's faculty and department
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: {
          include: {
            departments: true
          }
        }
      }
    });

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    // Use the first department of the faculty
    const department = user.faculty.departments[0];

    // Verify concentration exists and belongs to user
    const concentration = await prisma.concentration.findFirst({
      where: {
        id: id,
        departmentId: department.id,
        createdById: session.user.id
      }
    });

    if (!concentration) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Concentration not found' } },
        { status: 404 }
      );
    }

    // Remove course from concentration
    const deleted = await prisma.concentrationCourse.deleteMany({
      where: {
        concentrationId: id,
        courseId: courseId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found in concentration' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Course removed from concentration successfully'
    });

  } catch (error) {
    console.error('Error removing course from concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove course from concentration' } },
      { status: 500 }
    );
  }
}
