import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for applying blacklists to curriculum
const applyBlacklistSchema = z.object({
  blacklistIds: z.array(z.string().min(1, 'Blacklist ID is required')).min(1, 'At least one blacklist ID is required'),
});

// GET /api/curricula/[id]/blacklists - Get blacklists applied to curriculum
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

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Get applied blacklists
    const curriculumBlacklists = await prisma.curriculumBlacklist.findMany({
      where: {
        curriculumId: id,
      },
      include: {
        blacklist: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ curriculumBlacklists });

  } catch (error) {
    console.error('Error fetching curriculum blacklists:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum blacklists' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/blacklists - Apply blacklists to curriculum
export async function POST(
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
    const validatedData = applyBlacklistSchema.parse(body);

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Verify all blacklists exist and user owns them
    const blacklists = await prisma.blacklist.findMany({
      where: {
        id: { in: validatedData.blacklistIds },
        createdById: session.user.id,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (blacklists.length !== validatedData.blacklistIds.length) {
      const foundIds = blacklists.map(b => b.id);
      const missingIds = validatedData.blacklistIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: { 
            code: 'BLACKLIST_NOT_FOUND', 
            message: `Blacklists not found: ${missingIds.join(', ')}` 
          } 
        },
        { status: 404 }
      );
    }

    // Check which blacklists are already applied to the curriculum
    const existingCurriculumBlacklists = await prisma.curriculumBlacklist.findMany({
      where: {
        curriculumId: id,
        blacklistId: { in: validatedData.blacklistIds },
      },
      select: { blacklistId: true },
    });

    const existingBlacklistIds = existingCurriculumBlacklists.map(cb => cb.blacklistId);
    const newBlacklistIds = validatedData.blacklistIds.filter(blacklistId => !existingBlacklistIds.includes(blacklistId));

    if (newBlacklistIds.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'BLACKLISTS_ALREADY_APPLIED', 
            message: 'All blacklists are already applied to this curriculum' 
          } 
        },
        { status: 409 }
      );
    }

    // Apply new blacklists to curriculum
    const appliedBlacklists = await prisma.curriculumBlacklist.createMany({
      data: newBlacklistIds.map(blacklistId => ({
        curriculumId: id,
        blacklistId,
      })),
    });

    // Get the applied blacklists for response
    const appliedBlacklistData = blacklists.filter(blacklist => newBlacklistIds.includes(blacklist.id));

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'ASSIGN',
        description: `Applied ${appliedBlacklistData.length} blacklists to curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          appliedBlacklists: appliedBlacklistData.map(b => ({ 
            id: b.id, 
            name: b.name, 
            courseCount: b._count.courses 
          })),
        },
      },
    });

    return NextResponse.json({
      message: 'Blacklists applied to curriculum successfully',
      appliedBlacklists: appliedBlacklistData,
      alreadyApplied: existingBlacklistIds.length > 0 ? existingBlacklistIds : undefined,
    });

  } catch (error) {
    console.error('Error applying blacklists to curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to apply blacklists to curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/blacklists - Remove blacklists from curriculum
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

    const body = await request.json();
    const { blacklistIds } = body;

    if (!blacklistIds || !Array.isArray(blacklistIds) || blacklistIds.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Blacklist IDs array is required' } },
        { status: 400 }
      );
    }

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Get blacklists that are actually applied to the curriculum
    const curriculumBlacklists = await prisma.curriculumBlacklist.findMany({
      where: {
        curriculumId: id,
        blacklistId: { in: blacklistIds },
      },
      include: {
        blacklist: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
    });

    if (curriculumBlacklists.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'BLACKLISTS_NOT_FOUND', 
            message: 'None of the specified blacklists are applied to this curriculum' 
          } 
        },
        { status: 404 }
      );
    }

    // Remove blacklists from curriculum
    await prisma.curriculumBlacklist.deleteMany({
      where: {
        curriculumId: id,
        blacklistId: { in: blacklistIds },
      },
    });

    const removedBlacklists = curriculumBlacklists.map(cb => cb.blacklist);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'UNASSIGN',
        description: `Removed ${removedBlacklists.length} blacklists from curriculum: ${curriculum.name}`,
        curriculumId: curriculum.id,
        changes: {
          removedBlacklists: removedBlacklists.map(b => ({ 
            id: b.id, 
            name: b.name, 
            courseCount: b._count.courses 
          })),
        },
      },
    });

    return NextResponse.json({
      message: 'Blacklists removed from curriculum successfully',
      removedBlacklists,
    });

  } catch (error) {
    console.error('Error removing blacklists from curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove blacklists from curriculum' } },
      { status: 500 }
    );
  }
} 