import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/curricula/[id]/concentrations/[concentrationId] - Update concentration requirement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; concentrationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.faculty?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const curriculumId = params.id;
    const concentrationId = params.concentrationId;
    const body = await request.json();
    const { requiredCourses } = body;

    if (!requiredCourses || requiredCourses < 1) {
      return NextResponse.json({ error: 'Required courses must be at least 1' }, { status: 400 });
    }

    // Verify curriculum belongs to user's faculty
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        facultyId: session.user.faculty.id
      }
    });

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
    }

    // Update the curriculum concentration
    const curriculumConcentration = await prisma.curriculumConcentration.update({
      where: {
        curriculumId_concentrationId: {
          curriculumId,
          concentrationId
        }
      },
      data: {
        requiredCourses: Math.max(1, requiredCourses)
      },
      include: {
        concentration: {
          include: {
            courses: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    // Transform the response
    const response = {
      id: curriculumConcentration.concentrationId, // Fixed: use 'id' instead of 'concentrationId'
      requiredCourses: curriculumConcentration.requiredCourses,
      concentration: {
        id: curriculumConcentration.concentration.id,
        name: curriculumConcentration.concentration.name,
        description: curriculumConcentration.concentration.description, // Add description field
        courses: curriculumConcentration.concentration.courses.map(c => ({
          id: c.course.id,
          code: c.course.code,
          name: c.course.name,
          credits: c.course.credits,
          creditHours: c.course.creditHours,
          description: c.course.description
        })),
        createdAt: curriculumConcentration.concentration.createdAt.toISOString().split('T')[0]
      }
    };

    return NextResponse.json({ curriculumConcentration: response });
  } catch (error) {
    console.error('Error updating curriculum concentration:', error);
    return NextResponse.json(
      { error: 'Failed to update curriculum concentration' },
      { status: 500 }
    );
  }
}

// DELETE /api/curricula/[id]/concentrations/[concentrationId] - Remove concentration from curriculum
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; concentrationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.faculty?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const curriculumId = params.id;
    const concentrationId = params.concentrationId;

    // Verify curriculum belongs to user's faculty
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        facultyId: session.user.faculty.id
      }
    });

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
    }

    // Remove the curriculum concentration
    await prisma.curriculumConcentration.delete({
      where: {
        curriculumId_concentrationId: {
          curriculumId,
          concentrationId
        }
      }
    });

    return NextResponse.json({ message: 'Concentration removed from curriculum successfully' });
  } catch (error) {
    console.error('Error removing concentration from curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to remove concentration from curriculum' },
      { status: 500 }
    );
  }
}
