import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for blacklist creation
const createBlacklistSchema = z.object({
  name: z.string().min(1, 'Blacklist name is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  courseIds: z.array(z.string().min(1, 'Course ID is required')).optional().default([]),
});

// GET /api/blacklists - List blacklists for current user
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

    const where = {
      createdById: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [blacklists, total] = await Promise.all([
      prisma.blacklist.findMany({
        where,
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
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blacklist.count({ where }),
    ]);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: 'LIST',
        action: 'CREATE', // Using CREATE for list access
        description: `Listed blacklists with search: "${search}"`,
      },
    });

    return NextResponse.json({
      blacklists,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching blacklists:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch blacklists' } },
      { status: 500 }
    );
  }
}

// POST /api/blacklists - Create new blacklist
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
    const validatedData = createBlacklistSchema.parse(body);

    // Check if blacklist with same name already exists for this user and department
    const existingBlacklist = await prisma.blacklist.findFirst({
      where: {
        name: validatedData.name,
        departmentId: validatedData.departmentId,
        createdById: session.user.id,
      },
    });

    if (existingBlacklist) {
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

    // Verify department exists and user has access to it
    const department = await prisma.department.findFirst({
      where: {
        id: validatedData.departmentId,
        facultyId: session.user.faculty.id,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Department not found' } },
        { status: 404 }
      );
    }

    // Verify all courses exist if provided
    let courses: any[] = [];
    if (validatedData.courseIds.length > 0) {
      courses = await prisma.course.findMany({
        where: {
          id: { in: validatedData.courseIds },
        },
        select: { id: true, code: true, name: true, credits: true },
      });

      if (courses.length !== validatedData.courseIds.length) {
        const foundIds = courses.map(c => c.id);
        const missingIds = validatedData.courseIds.filter(id => !foundIds.includes(id));
        return NextResponse.json(
          { 
            error: { 
              code: 'COURSE_NOT_FOUND', 
              message: `Courses not found: ${missingIds.join(', ')}` 
            } 
          },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create blacklist
      const blacklist = await tx.blacklist.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          departmentId: validatedData.departmentId,
          createdById: session.user.id,
        },
      });

      // Add courses to blacklist if provided
      if (validatedData.courseIds.length > 0) {
        await tx.blacklistCourse.createMany({
          data: validatedData.courseIds.map(courseId => ({
            blacklistId: blacklist.id,
            courseId,
          })),
        });
      }

      // Return blacklist with details
      return await tx.blacklist.findUnique({
        where: { id: blacklist.id },
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
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Blacklist',
        entityId: result!.id,
        action: 'CREATE',
        description: `Created blacklist "${result!.name}" with ${result!._count.courses} courses`,
        changes: {
          createdBlacklist: {
            id: result!.id,
            name: result!.name,
            description: result!.description,
            courseCount: result!._count.courses,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Blacklist created successfully',
      blacklist: result,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating blacklist:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create blacklist' } },
      { status: 500 }
    );
  }
} 