import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function extractParamsFromUrl(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const curriculumId = segments[segments.indexOf('curriculum') + 1];
  const courseId = segments[segments.indexOf('courses') + 1];
  return { curriculumId, courseId };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { curriculumId, courseId } = extractParamsFromUrl(req);

    // Verify curriculum ownership
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found or access denied' },
        { status: 404 }
      );
    }

    // Verify course is in curriculum
    const curriculumCourse = await prisma.curriculumCourse.findFirst({
      where: {
        curriculumId,
        courseId,
      },
    });

    if (!curriculumCourse) {
      return NextResponse.json(
        { error: 'Course not found in curriculum' },
        { status: 404 }
      );
    }

    // Get corequisites for this course
    const corequisites = await prisma.courseCorequisite.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        corequisite: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(corequisites);
  } catch (error) {
    console.error('Error fetching corequisites:', error);
    return NextResponse.json(
      { error: 'Error fetching corequisites' },
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

    const { corequisiteId } = await req.json();
    if (!corequisiteId) {
      return NextResponse.json(
        { error: 'Missing corequisite ID' },
        { status: 400 }
      );
    }

    const { curriculumId, courseId } = extractParamsFromUrl(req);

    // Verify curriculum ownership
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found or access denied' },
        { status: 404 }
      );
    }

    // Verify both courses exist in global pool
    const [course, corequisite] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
      }),
      prisma.course.findUnique({
        where: { id: corequisiteId },
      }),
    ]);

    if (!course || !corequisite) {
      return NextResponse.json(
        { error: 'Course or corequisite not found' },
        { status: 404 }
      );
    }

    // Check if corequisite relationship already exists
    const existingCoreq = await prisma.courseCorequisite.findUnique({
      where: {
        courseId_corequisiteId: {
          courseId,
          corequisiteId,
        },
      },
    });

    if (existingCoreq) {
      return NextResponse.json(
        { error: 'Corequisite relationship already exists' },
        { status: 409 }
      );
    }

    // Create bidirectional corequisite relationships
    const [corequisiteLink1, corequisiteLink2] = await prisma.$transaction([
      prisma.courseCorequisite.create({
        data: {
          courseId,
          corequisiteId,
        },
        include: {
          corequisite: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
              category: true,
            },
          },
        },
      }),
      prisma.courseCorequisite.create({
        data: {
          courseId: corequisiteId,
          corequisiteId: courseId,
        },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CourseCorequisite',
        entityId: corequisiteLink1.id,
        action: 'CREATE',
        description: `Added corequisite relationship between ${course.code} and ${corequisite.code}`,
        curriculumId,
        courseId,
        changes: {
          added: {
            corequisiteId,
            corequisiteCode: corequisite.code,
            courseCode: course.code,
            bidirectional: true,
          },
        },
      },
    });

    return NextResponse.json(corequisiteLink1, { status: 201 });
  } catch (error) {
    console.error('Error adding corequisite:', error);
    return NextResponse.json(
      { error: 'Error adding corequisite' },
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

    const { corequisiteId } = await req.json();
    if (!corequisiteId) {
      return NextResponse.json(
        { error: 'Missing corequisite ID' },
        { status: 400 }
      );
    }

    const { curriculumId, courseId } = extractParamsFromUrl(req);

    // Verify curriculum ownership
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found or access denied' },
        { status: 404 }
      );
    }

    // Check if corequisite relationship exists
    const existingCoreq = await prisma.courseCorequisite.findUnique({
      where: {
        courseId_corequisiteId: {
          courseId,
          corequisiteId,
        },
      },
      include: {
        course: { select: { code: true } },
        corequisite: { select: { code: true } },
      },
    });

    if (!existingCoreq) {
      return NextResponse.json(
        { error: 'Corequisite relationship not found' },
        { status: 404 }
      );
    }

    // Delete bidirectional corequisite relationships
    await prisma.$transaction([
      prisma.courseCorequisite.delete({
        where: {
          courseId_corequisiteId: {
            courseId,
            corequisiteId,
          },
        },
      }),
      prisma.courseCorequisite.delete({
        where: {
          courseId_corequisiteId: {
            courseId: corequisiteId,
            corequisiteId: courseId,
          },
        },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CourseCorequisite',
        entityId: existingCoreq.id,
        action: 'DELETE',
        description: `Removed corequisite relationship between ${existingCoreq.course.code} and ${existingCoreq.corequisite.code}`,
        curriculumId,
        courseId,
        changes: {
          removed: {
            corequisiteId,
            corequisiteCode: existingCoreq.corequisite.code,
            courseCode: existingCoreq.course.code,
            bidirectional: true,
          },
        },
      },
    });

    return NextResponse.json({ message: 'Corequisite removed successfully' });
  } catch (error) {
    console.error('Error removing corequisite:', error);
    return NextResponse.json(
      { error: 'Error removing corequisite' },
      { status: 500 }
    );
  }
}
