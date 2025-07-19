import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    const { name, year, departmentId, courses } = await req.json();

    // Validate input
    if (!name || !year || !departmentId || !courses) {
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

    // Create curriculum with courses
    const curriculum = await prisma.curriculum.create({
      data: {
        name: name,
        year: year,
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
                category: course.category || 'General'
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
