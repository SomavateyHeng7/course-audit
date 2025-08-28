import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for blacklist assignment
const assignBlacklistSchema = z.object({
  blacklistId: z.string().min(1, 'Blacklist ID is required'),
});

// GET /api/curricula/[id]/blacklists - Get curriculum blacklists and available blacklists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: curriculumId } = await params;

    // Get user's department for access control
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
        { error: { code: 'NOT_FOUND', message: 'User department or faculty not found' } },
        { status: 404 }
      );
    }

    // Get all department IDs within the user's faculty for access control
    const facultyDepartmentIds = user.department.faculty.departments.map(d => d.id);

    // Verify curriculum exists and user has faculty-wide access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Get all available blacklists within the user's faculty departments
    const availableBlacklists = await prisma.blacklist.findMany({
      where: {
        departmentId: {
          in: facultyDepartmentIds
        }
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
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get assigned blacklists for this curriculum
    const assignedBlacklists = await prisma.curriculumBlacklist.findMany({
      where: {
        curriculumId: curriculumId
      },
      include: {
        blacklist: {
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
            _count: {
              select: {
                courses: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedAvailableBlacklists = availableBlacklists.map(blacklist => ({
      id: blacklist.id,
      name: blacklist.name,
      description: blacklist.description,
      courses: blacklist.courses.map(bc => ({
        id: bc.course.id,
        code: bc.course.code,
        name: bc.course.name,
        credits: bc.course.credits,
        description: bc.course.description
      })),
      courseCount: blacklist._count.courses,
      createdAt: blacklist.createdAt,
      updatedAt: blacklist.updatedAt
    }));

    const formattedAssignedBlacklists = assignedBlacklists.map(cb => ({
      id: cb.id,
      blacklistId: cb.blacklistId,
      assignedAt: cb.createdAt,
      blacklist: {
        id: cb.blacklist.id,
        name: cb.blacklist.name,
        description: cb.blacklist.description,
        courses: cb.blacklist.courses.map(bc => ({
          id: bc.course.id,
          code: bc.course.code,
          name: bc.course.name,
          credits: bc.course.credits,
          description: bc.course.description
        })),
        courseCount: cb.blacklist._count.courses,
        createdAt: cb.blacklist.createdAt,
        updatedAt: cb.blacklist.updatedAt
      }
    }));

    return NextResponse.json({
      availableBlacklists: formattedAvailableBlacklists,
      assignedBlacklists: formattedAssignedBlacklists,
      stats: {
        totalAvailable: formattedAvailableBlacklists.length,
        totalAssigned: formattedAssignedBlacklists.length,
        totalBlacklistedCourses: formattedAssignedBlacklists.reduce((total, ab) => 
          total + ab.blacklist.courseCount, 0
        )
      }
    });

  } catch (error) {
    console.error('Error fetching curriculum blacklists:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum blacklists' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/blacklists - Assign blacklist to curriculum
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: curriculumId } = await params;
    const body = await request.json();
    const { blacklistId } = assignBlacklistSchema.parse(body);

    // Verify curriculum access (department-based, not ownership-based)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        faculty: { include: { departments: true } }
      }
    });

    if (!user?.faculty || !user.faculty.departments.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User faculty or department not found' } },
        { status: 404 }
      );
    }

    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);

    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: { in: accessibleDepartmentIds }, // Faculty-wide access
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Verify blacklist access (department-based, not ownership-based)
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id: blacklistId,
        departmentId: { in: accessibleDepartmentIds }, // Faculty-wide access
      },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found or access denied' } },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existingAssignment = await prisma.curriculumBlacklist.findUnique({
      where: {
        curriculumId_blacklistId: {
          curriculumId,
          blacklistId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Blacklist is already assigned to this curriculum' } },
        { status: 409 }
      );
    }

    // Create assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.curriculumBlacklist.create({
        data: {
          curriculumId,
          blacklistId
        },
        include: {
          blacklist: {
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
              }
            }
          }
        }
      });

      // Log the assignment
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'CurriculumBlacklist',
          entityId: assignment.id,
          action: 'CREATE',
          description: `Assigned blacklist "${blacklist.name}" to curriculum "${curriculum.name}"`,
          curriculumId: curriculumId,
          changes: {
            blacklistId: blacklistId,
            blacklistName: blacklist.name,
            courseCount: blacklist._count.courses
          }
        }
      });

      return assignment;
    });

    return NextResponse.json({
      assignment: {
        id: result.id,
        blacklistId: result.blacklistId,
        assignedAt: result.createdAt,
        blacklist: {
          id: result.blacklist.id,
          name: result.blacklist.name,
          description: result.blacklist.description,
          courses: result.blacklist.courses.map(bc => ({
            id: bc.course.id,
            code: bc.course.code,
            name: bc.course.name,
            credits: bc.course.credits,
            description: bc.course.description
          })),
          courseCount: result.blacklist.courses.length
        }
      },
      message: `Blacklist "${blacklist.name}" assigned successfully and is now effective for this curriculum`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
          },
        },
        { status: 400 }
      );
    }

    console.error('Error assigning blacklist to curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to assign blacklist to curriculum' } },
      { status: 500 }
    );
  }
}
