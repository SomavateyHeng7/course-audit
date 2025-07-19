import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for curriculum updates
const updateCurriculumSchema = z.object({
  name: z.string().min(1, 'Curriculum name is required').optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/curricula/[id] - Get specific curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        createdById: session.user.id, // Ensure ownership
      },
      include: {
        department: true,
        faculty: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        curriculumCourses: {
          include: {
            course: true,
          },
          orderBy: [
            { year: 'asc' },
            { semester: 'asc' },
            { position: 'asc' },
          ],
        },
        curriculumConstraints: {
          orderBy: { createdAt: 'asc' },
        },
        electiveRules: {
          orderBy: { category: 'asc' },
        },
        curriculumConcentrations: {
          include: {
            concentration: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
        curriculumBlacklists: {
          include: {
            blacklist: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            curriculumCourses: true,
            curriculumConstraints: true,
            electiveRules: true,
            curriculumConcentrations: true,
            curriculumBlacklists: true,
          },
        },
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: curriculum.id,
        action: 'CREATE', // Using CREATE for read access
        description: `Accessed curriculum "${curriculum.name}"`,
        curriculumId: curriculum.id,
      },
    });

    return NextResponse.json({ curriculum });

  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum' } },
      { status: 500 }
    );
  }
}

// PUT /api/curricula/[id] - Update curriculum
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validatedData = updateCurriculumSchema.parse(body);

    // Check if curriculum exists and user owns it
    const existingCurriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        createdById: session.user.id,
      },
    });

    if (!existingCurriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate name/year/version if name or version is being updated
    if (validatedData.name || validatedData.version) {
      const duplicateCheck = await prisma.curriculum.findFirst({
        where: {
          id: { not: id },
          name: validatedData.name || existingCurriculum.name,
          year: existingCurriculum.year,
          version: validatedData.version || existingCurriculum.version,
          departmentId: existingCurriculum.departmentId,
          createdById: session.user.id,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { 
            error: { 
              code: 'DUPLICATE_CURRICULUM', 
              message: 'Curriculum with this name, year, and version already exists' 
            } 
          },
          { status: 409 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Store original data for audit
      const originalData = {
        name: existingCurriculum.name,
        version: existingCurriculum.version,
        description: existingCurriculum.description,
        isActive: existingCurriculum.isActive,
      };

      // Update curriculum
      const updatedCurriculum = await tx.curriculum.update({
        where: { id: id },
        data: validatedData,
        include: {
          department: true,
          faculty: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          curriculumCourses: {
            include: {
              course: true,
            },
          },
          curriculumConstraints: true,
          electiveRules: true,
          _count: {
            select: {
              curriculumCourses: true,
              curriculumConstraints: true,
              electiveRules: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Curriculum',
          entityId: id,
          action: 'UPDATE',
          description: `Updated curriculum "${updatedCurriculum.name}"`,
          curriculumId: id,
          changes: {
            before: originalData,
            after: validatedData,
            fieldsChanged: Object.keys(validatedData),
          },
        },
      });

      return updatedCurriculum;
    });

    return NextResponse.json({ curriculum: result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            details: error.errors,
          } 
        },
        { status: 400 }
      );
    }

    console.error('Error updating curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update curriculum' } },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id] - Delete curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: id,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            curriculumCourses: true,
            curriculumConstraints: true,
            electiveRules: true,
          },
        },
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found' } },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Store curriculum data for audit before deletion
      const curriculumData = {
        name: curriculum.name,
        year: curriculum.year,
        version: curriculum.version,
        courseCount: curriculum._count.curriculumCourses,
        constraintCount: curriculum._count.curriculumConstraints,
        electiveRuleCount: curriculum._count.electiveRules,
      };

      // Delete curriculum (cascade will handle related records)
      await tx.curriculum.delete({
        where: { id: id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Curriculum',
          entityId: id,
          action: 'DELETE',
          description: `Deleted curriculum "${curriculumData.name}" (${curriculumData.year})`,
          changes: {
            deletedCurriculum: curriculumData,
          },
        },
      });

      return { success: true, deletedCurriculum: curriculumData };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete curriculum' } },
      { status: 500 }
    );
  }
}
