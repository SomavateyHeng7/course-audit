import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/curricula/[id]/elective-rules/settings - Update elective rules settings
export async function PUT(
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
    const { 
      freeElectiveCredits, 
      freeElectiveName,
      courseRequirements // Array of { courseId, isRequired }
    } = await request.json();

    // Verify curriculum exists and user has access
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or access denied' } },
        { status: 404 }
      );
    }

    const updates = [];

    // Handle free elective credits and name - store as a special elective rule
    if (freeElectiveCredits !== undefined || freeElectiveName !== undefined) {
      // Validate credits if provided
      if (freeElectiveCredits !== undefined && (typeof freeElectiveCredits !== 'number' || freeElectiveCredits < 0)) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Free elective credits must be a non-negative number' } },
          { status: 400 }
        );
      }

      // Validate name if provided
      if (freeElectiveName !== undefined && (typeof freeElectiveName !== 'string' || freeElectiveName.trim().length === 0)) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Free elective name must be a non-empty string' } },
          { status: 400 }
        );
      }

      // Find existing free elective rule (any rule with 'free' in the name)
      const existingRule = await prisma.electiveRule.findFirst({
        where: {
          curriculumId,
          category: {
            contains: 'free',
            mode: 'insensitive'
          }
        }
      });

      const finalName = freeElectiveName?.trim() || existingRule?.category || 'Free Electives';
      const finalCredits = freeElectiveCredits !== undefined ? freeElectiveCredits : existingRule?.requiredCredits || 0;

      if (existingRule) {
        // Update existing rule
        await prisma.electiveRule.update({
          where: { id: existingRule.id },
          data: {
            category: finalName,
            requiredCredits: finalCredits,
            description: `${finalName} allowing students to choose any courses`
          }
        });
      } else {
        // Create new rule
        await prisma.electiveRule.create({
          data: {
            curriculumId,
            category: finalName,
            requiredCredits: finalCredits,
            description: `${finalName} allowing students to choose any courses`
          }
        });
      }

      updates.push({
        type: 'freeElective',
        action: existingRule ? 'UPDATE' : 'CREATE',
        data: { 
          name: finalName,
          credits: finalCredits,
          previousName: existingRule?.category,
          previousCredits: existingRule?.requiredCredits
        }
      });
    }

    // Handle course requirement updates
    if (courseRequirements && Array.isArray(courseRequirements)) {
      for (const { courseId, isRequired } of courseRequirements) {
        if (!courseId || typeof isRequired !== 'boolean') {
          continue; // Skip invalid entries
        }

        // Verify course exists in curriculum
        const curriculumCourse = await prisma.curriculumCourse.findFirst({
          where: {
            curriculumId,
            courseId
          }
        });

        if (!curriculumCourse) {
          continue; // Skip courses not in curriculum
        }

        // Update course requirement status
        const updatedCourse = await prisma.curriculumCourse.update({
          where: { id: curriculumCourse.id },
          data: { isRequired }
        });

        updates.push({
          type: 'courseRequirement',
          action: 'UPDATE',
          data: { 
            courseId, 
            isRequired,
            previousValue: curriculumCourse.isRequired
          }
        });
      }
    }

    // Log the action
    if (updates.length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'ElectiveRule',
          entityId: curriculumId,
          action: 'UPDATE',
          changes: { updates },
          description: 'Updated elective rules settings',
          curriculumId
        }
      });
    }

    return NextResponse.json({ 
      message: 'Elective rules settings updated successfully',
      updatesCount: updates.length
    });

  } catch (error) {
    console.error('Error updating elective rules settings:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update elective rules settings' } },
      { status: 500 }
    );
  }
}
