import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

// GET /api/curricula/[id]/elective-rules - Get all elective rules for a curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: curriculumId } = await params;

    // Get user's department for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User department or faculty not found' } },
        { status: 404 }
      );
    }

    // Get all department IDs within the user's faculty for access control
    const facultyDepartmentIds = user.department.faculty.departments.map(d => d.id);

    // Verify curriculum exists and user has faculty-wide access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Get elective rules for the curriculum
    const electiveRules = await prisma.electiveRule.findMany({
      where: { curriculumId },
      orderBy: { category: 'asc' }
    });

    // Get curriculum courses with their categories for breakdown
    const curriculumCourses = await prisma.curriculumCourse.findMany({
      where: { curriculumId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            departmentCourseTypes: {
              where: {
                departmentId: curriculum.departmentId
              },
              select: {
                courseType: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get unique categories from courses via their department course type assignments
    const courseCategories = [...new Set(
      curriculumCourses
        .map(cc => cc.course.departmentCourseTypes[0]?.courseType.name)
        .filter(Boolean)
    )];

    return NextResponse.json({
      electiveRules,
      courseCategories,
      curriculumCourses: curriculumCourses.map(cc => ({
        id: cc.course.id,
        code: cc.course.code,
        name: cc.course.name,
        category: cc.course.departmentCourseTypes[0]?.courseType.name || 'Unassigned',
        credits: cc.course.credits,
        isRequired: cc.isRequired,
        semester: cc.semester,
        year: cc.year
      }))
    });

  } catch (error) {
    console.error('Error fetching elective rules:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch elective rules' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/elective-rules - Create new elective rule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: curriculumId } = await params;
    const { category, requiredCredits, description } = await request.json();

    // Validate input
    if (!category || !requiredCredits) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Category and required credits are required' } },
        { status: 400 }
      );
    }

    if (typeof requiredCredits !== 'number' || requiredCredits < 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Required credits must be a non-negative number' } },
        { status: 400 }
      );
    }

    // Get user's department for access control
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: {
          include: {
            faculty: {
              include: {
                departments: true
              }
            }
          }
        }
      }
    });

    if (!user?.department?.faculty) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User department or faculty not found' } },
        { status: 404 }
      );
    }

    // Get all department IDs within the user's faculty for access control
    const facultyDepartmentIds = user.department.faculty.departments.map(d => d.id);

    // Verify curriculum exists and user has faculty-wide access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        departmentId: {
          in: facultyDepartmentIds
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    // Check if elective rule for this category already exists
    const existingRule = await prisma.electiveRule.findUnique({
      where: {
        curriculumId_category: {
          curriculumId,
          category
        }
      }
    });

    if (existingRule) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Elective rule for this category already exists' } },
        { status: 409 }
      );
    }

    // Create elective rule
    const electiveRule = await prisma.electiveRule.create({
      data: {
        curriculumId,
        category,
        requiredCredits,
        description
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'ElectiveRule',
        entityId: electiveRule.id,
        action: 'CREATE',
        changes: {
          category,
          requiredCredits,
          description
        },
        curriculumId
      }
    });

    return NextResponse.json({ electiveRule }, { status: 201 });

  } catch (error) {
    console.error('Error creating elective rule:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create elective rule' } },
      { status: 500 }
    );
  }
}
