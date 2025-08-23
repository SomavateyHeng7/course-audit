import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/curricula/[id]/constraints - Get curriculum constraints
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

    // Get curriculum constraints
    const constraints = await prisma.curriculumConstraint.findMany({
      where: { curriculumId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      constraints: constraints.map(constraint => ({
        id: constraint.id,
        type: constraint.type,
        name: constraint.name,
        description: constraint.description,
        isRequired: constraint.isRequired,
        config: constraint.config,
        createdAt: constraint.createdAt,
        updatedAt: constraint.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching curriculum constraints:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum constraints' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/constraints - Add constraint to curriculum
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
    const body = await request.json();
    const { type, name, description, isRequired = true, config } = body;

    // Validate input
    if (!type || !name) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Type and name are required' } },
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

    // Check if constraint with same type and name already exists
    const existingConstraint = await prisma.curriculumConstraint.findUnique({
      where: {
        curriculumId_type_name: {
          curriculumId,
          type,
          name
        }
      }
    });

    if (existingConstraint) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Constraint with this type and name already exists' } },
        { status: 409 }
      );
    }

    // Create constraint
    const newConstraint = await prisma.curriculumConstraint.create({
      data: {
        curriculumId,
        type,
        name,
        description,
        isRequired,
        config
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'CurriculumConstraint',
        entityId: newConstraint.id,
        action: 'CREATE',
        description: `Added ${type} constraint "${name}" to curriculum ${curriculum.name}`,
        changes: {
          constraint: {
            type,
            name,
            description,
            isRequired,
            config
          }
        },
        curriculumId: curriculumId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Constraint added successfully',
      constraint: {
        id: newConstraint.id,
        type: newConstraint.type,
        name: newConstraint.name,
        description: newConstraint.description,
        isRequired: newConstraint.isRequired,
        config: newConstraint.config,
        createdAt: newConstraint.createdAt,
        updatedAt: newConstraint.updatedAt
      }
    });
  } catch (error) {
    console.error('Error adding curriculum constraint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add curriculum constraint' } },
      { status: 500 }
    );
  }
}
