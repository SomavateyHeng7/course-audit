import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/departments - List departments for current user's faculty
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = {
      facultyId: session.user.faculty.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const departments = await prisma.department.findMany({
      where,
      include: {
        faculty: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            curricula: true,
          },
        },
      },
      orderBy: { name: 'asc' },
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

