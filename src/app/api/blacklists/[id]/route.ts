import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/blacklists/[id] - Get specific blacklist
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

    const { id } = await params;

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

    // Use the first department of the faculty (or you might want to allow user to select)
    const department = user.faculty.departments[0];

    // Find blacklist with access control
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        departmentId: department.id,
        createdById: session.user.id // Only show blacklists created by this user
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
      }
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found or access denied' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      blacklist: {
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
      }
    });

  } catch (error) {
    console.error('Error fetching blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch blacklist' } },
      { status: 500 }
    );
  }
}

// PUT /api/blacklists/[id] - Update blacklist
export async function PUT(
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

    const { id } = await params;
    const { name, description, courseIds } = await request.json();

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

    // Find and verify ownership of blacklist
    const existingBlacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        departmentId: department.id,
        createdById: session.user.id
      },
      include: {
        courses: {
          include: {
            course: {
              select: { id: true, code: true, name: true }
            }
          }
        }
      }
    });

    if (!existingBlacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found or access denied' } },
        { status: 404 }
      );
    }

    // Validate input if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Blacklist name must be a non-empty string' } },
        { status: 400 }
      );
    }

    if (courseIds !== undefined && !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course IDs must be an array' } },
        { status: 400 }
      );
    }

    // Check for name conflicts if name is being changed
    if (name && name.trim() !== existingBlacklist.name) {
        const nameConflict = await prisma.blacklist.findFirst({
          where: {
            name: name.trim(),
            departmentId: department.id,
            createdById: session.user.id,
            NOT: { id }
          }
        });      if (nameConflict) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'A blacklist with this name already exists' } },
          { status: 409 }
        );
      }
    }

    // Verify course IDs if provided
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

    const changes: any = {};
    
    // Track changes for audit log
    if (name !== undefined && name.trim() !== existingBlacklist.name) {
      changes.name = { from: existingBlacklist.name, to: name.trim() };
    }
    
    if (description !== undefined && description !== existingBlacklist.description) {
      changes.description = { from: existingBlacklist.description, to: description };
    }

    // Update blacklist in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update basic fields if provided
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;

      if (Object.keys(updateData).length > 0) {
        await tx.blacklist.update({
          where: { id },
          data: updateData
        });
      }

      // Update courses if provided
      if (courseIds !== undefined) {
        // Remove existing course associations
        await tx.blacklistCourse.deleteMany({
          where: { blacklistId: id }
        });

        // Add new course associations
        if (courseIds.length > 0) {
          await tx.blacklistCourse.createMany({
            data: courseIds.map((courseId: string) => ({
              blacklistId: id,
              courseId
            }))
          });
        }

        changes.courses = {
          from: existingBlacklist.courses.map(bc => bc.course.code),
          to: courseIds
        };
      }

      // Log the action if there were changes
      if (Object.keys(changes).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            entityType: 'Blacklist',
            entityId: id,
            action: 'UPDATE',
            changes,
            description: `Updated blacklist "${name || existingBlacklist.name}"`
          }
        });
      }
    });

    // Fetch updated blacklist
    const updatedBlacklist = await prisma.blacklist.findUnique({
      where: { id },
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
      }
    });

    return NextResponse.json({
      blacklist: {
        id: updatedBlacklist!.id,
        name: updatedBlacklist!.name,
        description: updatedBlacklist!.description,
        departmentId: updatedBlacklist!.departmentId,
        department: updatedBlacklist!.department,
        createdBy: updatedBlacklist!.createdBy,
        courses: updatedBlacklist!.courses.map(bc => bc.course),
        courseCount: updatedBlacklist!._count.courses,
        usageCount: updatedBlacklist!._count.curriculumBlacklists,
        createdAt: updatedBlacklist!.createdAt,
        updatedAt: updatedBlacklist!.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update blacklist' } },
      { status: 500 }
    );
  }
}

// DELETE /api/blacklists/[id] - Delete blacklist
export async function DELETE(
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

    const { id } = await params;

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

    // Find and verify ownership of blacklist
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        departmentId: department.id,
        createdById: session.user.id
      },
      include: {
        _count: {
          select: {
            curriculumBlacklists: true
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

    // Check if blacklist is being used by any curricula
    if (blacklist._count.curriculumBlacklists > 0) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Cannot delete blacklist that is currently being used by curricula' } },
        { status: 409 }
      );
    }

    // Delete blacklist in transaction
    await prisma.$transaction(async (tx) => {
      // Delete the blacklist (cascade will handle courses)
      await tx.blacklist.delete({
        where: { id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Blacklist',
          entityId: id,
          action: 'DELETE',
          changes: {
            name: blacklist.name,
            description: blacklist.description
          },
          description: `Deleted blacklist "${blacklist.name}"`
        }
      });
    });

    return NextResponse.json({ 
      message: 'Blacklist deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete blacklist' } },
      { status: 500 }
    );
  }
}
