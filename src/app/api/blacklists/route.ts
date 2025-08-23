import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/blacklists - Get all blacklists for the user's department
export async function GET(request: NextRequest) {
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

    // Get user's accessible departments (their department + other departments in same faculty)
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);

    // Get blacklists for accessible departments
    const blacklists = await prisma.blacklist.findMany({
      where: {
        departmentId: { in: accessibleDepartmentIds }
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
                description: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            courses: true,
            curriculumBlacklists: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      blacklists: blacklists.map(blacklist => ({
        id: blacklist.id,
        name: blacklist.name,
        description: blacklist.description,
        departmentId: blacklist.departmentId,
        department: blacklist.department,
        createdBy: blacklist.createdBy,
        courses: blacklist.courses.map(bc => bc.course),
        courseCount: blacklist._count.courses,
        usageCount: blacklist._count.curriculumBlacklists,
        createdAt: blacklist.createdAt,
        updatedAt: blacklist.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching blacklists:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch blacklists' } },
      { status: 500 }
    );
  }
}

// POST /api/blacklists - Create new blacklist
export async function POST(request: NextRequest) {
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

    const { name, description, courseIds, departmentId } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Blacklist name is required' } },
        { status: 400 }
      );
    }

    if (courseIds && !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course IDs must be an array' } },
        { status: 400 }
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

    // Validate department access if departmentId is provided, otherwise use user's department
    const targetDepartmentId = departmentId || user.departmentId;
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);
    
    if (!accessibleDepartmentIds.includes(targetDepartmentId)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this department' } },
        { status: 403 }
      );
    }

    // Check if blacklist with same name already exists in this department
    const existingBlacklist = await prisma.blacklist.findFirst({
      where: {
        name: name.trim(),
        departmentId: targetDepartmentId
      }
    });

    if (existingBlacklist) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'A blacklist with this name already exists in this department' } },
        { status: 409 }
      );
    }

    // Verify all course IDs exist if provided
    if (courseIds && courseIds.length > 0) {
      const existingCourses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true }
      });

      if (existingCourses.length !== courseIds.length) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Some course IDs do not exist' } },
          { status: 400 }
        );
      }
    }

    // Create blacklist with courses in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the blacklist
      const blacklist = await tx.blacklist.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          departmentId: targetDepartmentId,
          createdById: session.user.id
        }
      });

      // Add courses to blacklist if provided
      if (courseIds && courseIds.length > 0) {
        await tx.blacklistCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            blacklistId: blacklist.id,
            courseId
          }))
        });
      }

      // Log the action
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Blacklist',
          entityId: blacklist.id,
          action: 'CREATE',
          changes: {
            name: blacklist.name,
            description: blacklist.description,
            courseCount: courseIds?.length || 0
          },
          description: `Created blacklist "${blacklist.name}"`
        }
      });

      return blacklist;
    });

    // Fetch the complete blacklist data to return
    const createdBlacklist = await prisma.blacklist.findUnique({
      where: { id: result.id },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
                description: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      blacklist: {
        id: createdBlacklist!.id,
        name: createdBlacklist!.name,
        description: createdBlacklist!.description,
        departmentId: createdBlacklist!.departmentId,
        department: createdBlacklist!.department,
        createdBy: createdBlacklist!.createdBy,
        courses: createdBlacklist!.courses.map(bc => bc.course),
        courseCount: createdBlacklist!.courses.length,
        usageCount: 0,
        createdAt: createdBlacklist!.createdAt,
        updatedAt: createdBlacklist!.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create blacklist' } },
      { status: 500 }
    );
  }
}
