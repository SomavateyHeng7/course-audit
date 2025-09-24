import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');

    console.log('Fetching departments (public endpoint)...', { facultyId });

    // Build where clause based on facultyId filter
    const where = facultyId ? { facultyId } : {};

    const departments = await prisma.department.findMany({
      where,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('Public departments found:', departments?.length || 0);

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments (public):', {
      message: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack || 'No stack trace',
      name: (error as Error)?.name || 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}