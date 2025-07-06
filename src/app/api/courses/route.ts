import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses - Global course search and listing
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const credits = searchParams.get('credits');

    // Build where clause for filtering
    const where: any = {
      isActive: true, // Only show active courses
    };

    // Search across code, name, and description
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    // Filter by credits
    if (credits) {
      where.credits = parseInt(credits);
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          prerequisites: {
            include: {
              prerequisite: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          corequisites: {
            include: {
              corequisite: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          _count: {
            select: {
              curriculumCourses: true,
              studentCourses: true,
            },
          },
        },
        orderBy: [
          { code: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    // Log access for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Course',
        entityId: 'SEARCH',
        action: 'CREATE', // Using CREATE for search access
        description: `Searched courses with term: "${search}", category: "${category}"`,
        changes: {
          searchTerm: search,
          category,
          credits,
          resultCount: courses.length,
        },
      },
    });

    return NextResponse.json({
      courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search courses' } },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course (global pool)
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

    const body = await request.json();
    const {
      code,
      name,
      credits,
      creditHours,
      description,
      category,
      requiresPermission = false,
      summerOnly = false,
      requiresSeniorStanding = false,
      minCreditThreshold,
    } = body;

    // Validate required fields
    if (!code || !name || credits === undefined || !creditHours || !category) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: code, name, credits, creditHours, category' 
          } 
        },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      return NextResponse.json(
        { 
          error: { 
            code: 'DUPLICATE_COURSE', 
            message: 'Course with this code already exists' 
          } 
        },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create new course in global pool
      const course = await tx.course.create({
        data: {
          code,
          name,
          credits,
          creditHours,
          description,
          category,
          requiresPermission,
          summerOnly,
          requiresSeniorStanding,
          minCreditThreshold,
          isActive: true,
        },
        include: {
          prerequisites: {
            include: {
              prerequisite: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          corequisites: {
            include: {
              corequisite: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Course',
          entityId: course.id,
          action: 'CREATE',
          description: `Created new course "${course.code}: ${course.name}"`,
          courseId: course.id,
          changes: {
            created: {
              code: course.code,
              name: course.name,
              credits: course.credits,
              category: course.category,
            },
          },
        },
      });

      return course;
    });

    return NextResponse.json({ course: result }, { status: 201 });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create course' } },
      { status: 500 }
    );
  }
}
