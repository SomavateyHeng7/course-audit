import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

// GET /api/blacklists/courses/search - Search for courses in blacklists
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
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Course code is required' } },
        { status: 400 }
      );
    }

    // Get user's department
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

    // Use accessible department IDs (all departments in user's faculty)
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);

    // Search for course in blacklists accessible by this user (department-based)
    const blacklistCourse = await prisma.blacklistCourse.findFirst({
      where: {
        course: {
          code: {
            equals: code,
            mode: 'insensitive'
          }
        },
        blacklist: {
          departmentId: { in: accessibleDepartmentIds }
        }
      },
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
    });

    return NextResponse.json({
      course: blacklistCourse?.course || null
    });

  } catch (error) {
    console.error('Error searching blacklist courses:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search blacklist courses' } },
      { status: 500 }
    );
  }
}
