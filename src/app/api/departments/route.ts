import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/departments - Get departments for user's faculty
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId') || session.user.faculty?.id;

    if (!facultyId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Faculty ID is required' } },
        { status: 400 }
      );
    }

    const departments = await prisma.department.findMany({
      where: {
        facultyId,
      },
      include: {
        faculty: true,
        _count: {
          select: {
            curricula: true,
            concentrations: true,
            blacklists: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ departments });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch departments' } },
      { status: 500 }
    );
  }
}
