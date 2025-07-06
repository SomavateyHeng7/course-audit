import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/search - Optimized course search for frontend components
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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const excludeIds = searchParams.get('exclude')?.split(',') || [];

    // Return all courses if no query (for dropdown population)
    const where: any = {
      isActive: true,
    };

    // Exclude specific course IDs (useful for avoiding duplicates)
    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    // Search across code and name if query provided
    if (query.trim()) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        creditHours: true,
        description: true,
        category: true,
        requiresPermission: true,
        summerOnly: true,
        requiresSeniorStanding: true,
        minCreditThreshold: true,
        // Include basic prerequisite info for display
        prerequisites: {
          select: {
            prerequisite: {
              select: { code: true, name: true },
            },
          },
        },
        corequisites: {
          select: {
            corequisite: {
              select: { code: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { code: 'asc' },
      ],
      take: limit,
    });

    // Transform to simpler format for frontend consumption
    const transformedCourses = courses.map(course => ({
      ...course,
      prerequisites: course.prerequisites.map(p => p.prerequisite),
      corequisites: course.corequisites.map(c => c.corequisite),
      displayName: `${course.code}: ${course.name}`,
      searchableText: `${course.code} ${course.name} ${course.description || ''}`.toLowerCase(),
    }));

    return NextResponse.json({
      courses: transformedCourses,
      total: transformedCourses.length,
    });

  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search courses' } },
      { status: 500 }
    );
  }
}
