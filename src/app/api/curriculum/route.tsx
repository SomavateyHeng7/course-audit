import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const curricula = await prisma.curriculum.findMany({
      where: {
        facultyId: session.user.faculty.id,
      },
      include: {
        department: true,
        curriculumCourses: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        year: 'desc',
      },
    });

    return NextResponse.json(curricula);
  } catch (error) {
    console.error('Error fetching curricula:', error);
    return NextResponse.json(
      { error: 'Error fetching curricula' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, year, departmentId, startId, endId, courses } = await req.json();

    // Validate input
    if (!name || !year || !departmentId || !startId || !endId || !courses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if department exists and belongs to faculty
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        facultyId: session.user.faculty.id,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Invalid department' },
        { status: 400 }
      );
    }

    // Check if curriculum with same year/startId/endId in the same department already exists
    const existingCurriculum = await prisma.curriculum.findFirst({
      where: {
        year: year,
        startId: startId,
        endId: endId,
        departmentId: departmentId,
      },
    });

    if (existingCurriculum) {
      return NextResponse.json(
        { error: `Curriculum for year ${year} with ID range ${startId}-${endId} already exists in this department.` },
        { status: 409 }
      );
    }

    // Create curriculum with courses
    const curriculum = await prisma.curriculum.create({
      data: {
        name: name,
        year: year,
        startId: startId,
        endId: endId,
        departmentId: departmentId,
        facultyId: session.user.faculty.id,
        createdById: session.user.id,
        curriculumCourses: {
          create: courses.map((course: any, index: number) => ({
            course: {
              create: {
                code: course.code,
                name: course.name,
                credits: course.credits,
                creditHours: `${course.credits}-0-${course.credits * 2}`,
              }
            },
            year: course.year || 1,
            semester: course.semester || 1,
            position: index + 1
          })),
        },
      },
      include: {
        curriculumCourses: {
          include: {
            course: true
          }
        }
      },
    });

    return NextResponse.json(curriculum, { status: 201 });
  } catch (error) {
    console.error('Error creating curriculum:', error);
    return NextResponse.json(
      { error: 'Error creating curriculum' },
      { status: 500 }
    );
  }
} 
