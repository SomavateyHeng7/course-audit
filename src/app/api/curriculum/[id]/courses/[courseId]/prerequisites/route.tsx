import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function extractParamsFromUrl(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.indexOf('curriculum') + 1];
  const courseId = segments[segments.indexOf('courses') + 1];
  return { id, courseId };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = extractParamsFromUrl(req);

    const prerequisites = await prisma.courseLink.findMany({
      where: {
        postrequisiteId: courseId,
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

export async function POST(req: NextRequest) {
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

    const { id, courseId } = extractParamsFromUrl(req);

    const [course, prerequisite] = await Promise.all([
      prisma.course.findFirst({
        where: { id: courseId, curriculumId: id },
      }),
      prisma.course.findFirst({
        where: { id: prerequisiteId, curriculumId: id },
      }),
    ]);

    if (!course || !prerequisite) {
      return NextResponse.json(
        { error: 'Course or prerequisite not found in curriculum' },
        { status: 404 }
      );
    }

    const prerequisiteLink = await prisma.courseLink.create({
      data: {
        prerequisiteId,
        postrequisiteId: courseId,
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

export async function DELETE(req: NextRequest) {
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

    const { courseId } = extractParamsFromUrl(req);

    await prisma.courseLink.delete({
      where: {
        prerequisiteId_postrequisiteId: {
          prerequisiteId,
          postrequisiteId: courseId,
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
