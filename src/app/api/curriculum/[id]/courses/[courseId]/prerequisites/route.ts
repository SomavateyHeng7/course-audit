import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prerequisites = await prisma.courseLink.findMany({
      where: {
        postrequisiteId: params.courseId,
      },
      include: {
        prerequisite: true,
      },
    });

    return NextResponse.json(prerequisites);
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    return NextResponse.json(
      { error: 'Error fetching prerequisites' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prerequisiteId } = await req.json();

    if (!prerequisiteId) {
      return NextResponse.json(
        { error: 'Missing prerequisite ID' },
        { status: 400 }
      );
    }

    // Check if both courses exist in the curriculum
    const [course, prerequisite] = await Promise.all([
      prisma.course.findFirst({
        where: {
          id: params.courseId,
          curriculumId: params.id,
        },
      }),
      prisma.course.findFirst({
        where: {
          id: prerequisiteId,
          curriculumId: params.id,
        },
      }),
    ]);

    if (!course || !prerequisite) {
      return NextResponse.json(
        { error: 'Course or prerequisite not found in curriculum' },
        { status: 404 }
      );
    }

    // Create prerequisite link
    const prerequisiteLink = await prisma.courseLink.create({
      data: {
        prerequisiteId,
        postrequisiteId: params.courseId,
      },
      include: {
        prerequisite: true,
      },
    });

    return NextResponse.json(prerequisiteLink, { status: 201 });
  } catch (error) {
    console.error('Error adding prerequisite:', error);
    return NextResponse.json(
      { error: 'Error adding prerequisite' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prerequisiteId } = await req.json();

    if (!prerequisiteId) {
      return NextResponse.json(
        { error: 'Missing prerequisite ID' },
        { status: 400 }
      );
    }

    // Delete prerequisite link
    await prisma.courseLink.delete({
      where: {
        prerequisiteId_postrequisiteId: {
          prerequisiteId,
          postrequisiteId: params.courseId,
        },
      },
    });

    return NextResponse.json({ message: 'Prerequisite removed successfully' });
  } catch (error) {
    console.error('Error removing prerequisite:', error);
    return NextResponse.json(
      { error: 'Error removing prerequisite' },
      { status: 500 }
    );
  }
} 