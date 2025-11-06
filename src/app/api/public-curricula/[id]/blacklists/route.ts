import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/public-curricula/[id]/blacklists - Get curriculum blacklists (public/student access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First verify curriculum exists and is active
    const curriculum = await prisma.curriculum.findUnique({
      where: { 
        id,
        isActive: true
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or inactive' } },
        { status: 404 }
      );
    }

    // Get blacklists for this curriculum through curriculum blacklists relation
    const curriculumBlacklists = await prisma.curriculumBlacklist.findMany({
      where: {
        curriculumId: id,
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
                    description: true,
                    credits: true,
                    creditHours: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to just return the blacklists
    const blacklists = curriculumBlacklists.map(cb => cb.blacklist);

    return NextResponse.json({ blacklists });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch blacklists', details: errorMessage } },
      { status: 500 }
    );
  }
}