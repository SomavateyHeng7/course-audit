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
        courses: true,
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

    const { year, departmentId, courses } = await req.json();

    // Validate input
    if (!year || !departmentId || !courses) {
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
        year,
        departmentId,
        facultyId: session.user.faculty.id,
        courses: {
          create: courses.map((course: any) => ({
            code: course.code,
            name: course.name,
            credits: course.credits,
          })),
        },
      },
      include: {
        courses: true,
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