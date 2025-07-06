import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for curriculum cloning
const cloneCurriculumSchema = z.object({
  name: z.string().min(1, 'Curriculum name is required'),
  year: z.string().min(1, 'Year is required'),
  version: z.string().optional().default('1.0'),
  description: z.string().optional(),
});

// POST /api/curricula/[id]/clone - Clone curriculum
export async function POST(
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
    const validatedData = cloneCurriculumSchema.parse(body);

    // Check if source curriculum exists and user owns it
    const sourceCurriculum = await prisma.curriculum.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        curriculumCourses: {
          include: {
            course: true,
          },
          orderBy: { position: 'asc' },
        },
        curriculumConstraints: true,
        electiveRules: true,
      },
    });

    if (!sourceCurriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Source curriculum not found' } },
        { status: 404 }
      );
    }

    // Check if curriculum with same name/year/version already exists for this user
    const existingCurriculum = await prisma.curriculum.findFirst({
      where: {
        name: validatedData.name,
        year: validatedData.year,
        version: validatedData.version,
        departmentId: sourceCurriculum.departmentId,
        createdById: session.user.id,
      },
    });

    if (existingCurriculum) {
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

    // Clone curriculum with all related data
    const clonedCurriculum = await prisma.$transaction(async (tx) => {
      // Create new curriculum
      const newCurriculum = await tx.curriculum.create({
        data: {
          name: validatedData.name,
          year: validatedData.year,
          version: validatedData.version,
          description: validatedData.description || sourceCurriculum.description,
          departmentId: sourceCurriculum.departmentId,
          facultyId: sourceCurriculum.facultyId,
          createdById: session.user.id,
          isActive: true,
        },
      });

      // Clone curriculum courses
      if (sourceCurriculum.curriculumCourses.length > 0) {
        await tx.curriculumCourse.createMany({
          data: sourceCurriculum.curriculumCourses.map((cc, index) => ({
            curriculumId: newCurriculum.id,
            courseId: cc.courseId,
            isRequired: cc.isRequired,
            position: cc.position,
            semester: cc.semester,
            year: cc.year,
          })),
        });
      }

      // Clone curriculum constraints
      if (sourceCurriculum.curriculumConstraints.length > 0) {
        await tx.curriculumConstraint.createMany({
          data: sourceCurriculum.curriculumConstraints.map(cc => ({
            curriculumId: newCurriculum.id,
            type: cc.type,
            name: cc.name,
            description: cc.description,
            isRequired: cc.isRequired,
            config: cc.config ?? undefined,
          })),
        });
      }

      // Clone elective rules
      if (sourceCurriculum.electiveRules.length > 0) {
        await tx.electiveRule.createMany({
          data: sourceCurriculum.electiveRules.map(er => ({
            curriculumId: newCurriculum.id,
            category: er.category,
            requiredCredits: er.requiredCredits,
            description: er.description,
          })),
        });
      }

      // Return the new curriculum with counts
      return await tx.curriculum.findUnique({
        where: { id: newCurriculum.id },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          faculty: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              curriculumCourses: true,
              curriculumConstraints: true,
              electiveRules: true,
            },
          },
        },
      });
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Curriculum',
        entityId: clonedCurriculum!.id,
        action: 'CREATE',
        description: `Cloned curriculum "${sourceCurriculum.name}" to "${clonedCurriculum!.name}"`,
        curriculumId: clonedCurriculum!.id,
        changes: {
          clonedFrom: {
            id: sourceCurriculum.id,
            name: sourceCurriculum.name,
            courseCount: sourceCurriculum.curriculumCourses.length,
            constraintCount: sourceCurriculum.curriculumConstraints.length,
            electiveRuleCount: sourceCurriculum.electiveRules.length,
          },
          clonedTo: {
            id: clonedCurriculum!.id,
            name: clonedCurriculum!.name,
            courseCount: clonedCurriculum!._count.curriculumCourses,
            constraintCount: clonedCurriculum!._count.curriculumConstraints,
            electiveRuleCount: clonedCurriculum!._count.electiveRules,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Curriculum cloned successfully',
      curriculum: clonedCurriculum,
    }, { status: 201 });

  } catch (error) {
    console.error('Error cloning curriculum:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to clone curriculum' } },
      { status: 500 }
    );
  }
} 