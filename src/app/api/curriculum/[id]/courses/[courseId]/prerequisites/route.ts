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

    // Get user's department and faculty for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: 'User department not found' },
        { status: 403 }
      );
    }

    // Get accessible department IDs (all departments in user's faculty)
    const accessibleDepartmentIds = user.department.faculty.departments.map(dept => dept.id);

    // Verify curriculum access (department-based)
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: { in: accessibleDepartmentIds }
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

    // Get prerequisites for this course
    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
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

    const { curriculumId, courseId } = extractParamsFromUrl(req);

    // Get user's department and faculty for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: 'User department not found' },
        { status: 403 }
      );
    }

    // Get accessible department IDs (all departments in user's faculty)
    const accessibleDepartmentIds = user.department.faculty.departments.map(dept => dept.id);

    // Verify curriculum access (department-based)
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: { in: accessibleDepartmentIds }
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found or access denied' },
        { status: 404 }
      );
    }

    // Verify both courses exist in global pool
    const [course, prerequisite] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
      }),
      prisma.course.findUnique({
        where: { id: prerequisiteId },
      }),
    ]);

    if (!course || !prerequisite) {
      return NextResponse.json(
        { error: 'Course or prerequisite not found' },
        { status: 404 }
      );
    }

    // Check if prerequisite relationship already exists
    const existingPrereq = await prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteId: {
          courseId,
          prerequisiteId,
        },
      },
    });

    if (existingPrereq) {
      return NextResponse.json(
        { error: 'Prerequisite relationship already exists' },
        { status: 409 }
      );
    }

    // Create prerequisite relationship
    const prerequisiteLink = await prisma.coursePrerequisite.create({
      data: {
        courseId,
        prerequisiteId,
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CoursePrerequisite',
        entityId: prerequisiteLink.id,
        action: 'CREATE',
        description: `Added prerequisite ${prerequisite.code} to course ${course.code}`,
        curriculumId,
        courseId,
        changes: {
          added: {
            prerequisiteId,
            prerequisiteCode: prerequisite.code,
            courseCode: course.code,
          },
        },
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

    const { curriculumId, courseId } = extractParamsFromUrl(req);

    // Get user's department and faculty for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: 'User department not found' },
        { status: 403 }
      );
    }

    // Get accessible department IDs (all departments in user's faculty)
    const accessibleDepartmentIds = user.department.faculty.departments.map(dept => dept.id);

    // Verify curriculum access (department-based)
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: { in: accessibleDepartmentIds }
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found or access denied' },
        { status: 404 }
      );
    }

    // Check if prerequisite relationship exists
    const existingPrereq = await prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteId: {
          courseId,
          prerequisiteId,
        },
      },
      include: {
        course: { select: { code: true } },
        prerequisite: { select: { code: true } },
      },
    });

    if (!existingPrereq) {
      return NextResponse.json(
        { error: 'Prerequisite relationship not found' },
        { status: 404 }
      );
    }

    // Delete prerequisite relationship
    await prisma.coursePrerequisite.delete({
      where: {
        courseId_prerequisiteId: {
          courseId,
          prerequisiteId,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CoursePrerequisite',
        entityId: existingPrereq.id,
        action: 'DELETE',
        description: `Removed prerequisite ${existingPrereq.prerequisite.code} from course ${existingPrereq.course.code}`,
        curriculumId,
        courseId,
        changes: {
          removed: {
            prerequisiteId,
            prerequisiteCode: existingPrereq.prerequisite.code,
            courseCode: existingPrereq.course.code,
          },
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