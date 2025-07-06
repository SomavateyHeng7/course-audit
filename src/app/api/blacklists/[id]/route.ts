import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for blacklist updates
const updateBlacklistSchema = z.object({
  name: z.string().min(1, 'Blacklist name is required').optional(),
  description: z.string().optional(),
});

// GET /api/blacklists/[id] - Get specific blacklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get blacklist with courses
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
                category: true,
                creditHours: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            courses: true,
            curriculumBlacklists: true,
          },
        },
      },
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ blacklist });

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
    const { id } = await params;
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

    const body = await request.json();
    const validatedData = updateBlacklistSchema.parse(body);

    // Check if blacklist exists and user owns it
    const existingBlacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existingBlacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingBlacklist.name) {
      const duplicateCheck = await prisma.blacklist.findFirst({
        where: {
          id: { not: id },
          name: validatedData.name,
          departmentId: existingBlacklist.departmentId,
          createdById: session.user.id,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_BLACKLIST', 
              message: 'Blacklist with this name already exists in this department' 
            } 
          },
          { status: 409 }
        );
      }
    }

    // Store original data for audit
    const originalData = {
      name: existingBlacklist.name,
      description: existingBlacklist.description,
    };

    // Update blacklist
    const updatedBlacklist = await prisma.blacklist.update({
      where: { id },
      data: validatedData,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
                category: true,
                creditHours: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: {
            courses: true,
            curriculumBlacklists: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: id,
        action: 'UPDATE',
        description: `Updated blacklist "${updatedBlacklist.name}"`,
        changes: {
          before: originalData,
          after: {
            name: updatedBlacklist.name,
            description: updatedBlacklist.description,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Blacklist updated successfully',
      blacklist: updatedBlacklist,
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
    const { id } = await params;
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

    // Check if blacklist exists and user owns it
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            courses: true,
            curriculumBlacklists: true,
          },
        },
      },
    });

    if (!blacklist) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blacklist not found' } },
        { status: 404 }
      );
    }

    // Check if blacklist is being used by any curricula
    if (blacklist._count.curriculumBlacklists > 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'BLACKLIST_IN_USE', 
            message: 'Cannot delete blacklist that is being used by curricula. Please remove it from all curricula first.' 
          } 
        },
        { status: 409 }
      );
    }

    // Store blacklist data for audit before deletion
    const blacklistData = {
      id: blacklist.id,
      name: blacklist.name,
      description: blacklist.description,
      courseCount: blacklist._count.courses,
    };

    // Delete blacklist (courses will be deleted via cascade)
    await prisma.blacklist.delete({
      where: { id },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: id,
        action: 'DELETE',
        description: `Deleted blacklist "${blacklistData.name}"`,
        changes: {
          deletedBlacklist: blacklistData,
        },
      },
    });

    return NextResponse.json({
      message: 'Blacklist deleted successfully',
      deletedBlacklist: blacklistData,
    });

  } catch (error) {
    console.error('Error deleting blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete blacklist' } },
      { status: 500 }
    );
  }
} 