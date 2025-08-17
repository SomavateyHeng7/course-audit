import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/curricula/[id]/concentrations - Get concentrations for a curriculum
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.faculty?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const curriculumId = params.id;

    // Get curriculum concentrations
    const curriculumConcentrations = await prisma.curriculumConcentration.findMany({
      where: {
        curriculumId: curriculumId,
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

    // Transform the data
    const concentrations = curriculumConcentrations.map(cc => ({
      id: cc.concentrationId, // Fixed: use 'id' instead of 'concentrationId'
      requiredCourses: cc.requiredCourses,
      concentration: {
        id: cc.concentration.id,
        name: cc.concentration.name,
        description: cc.concentration.description, // Add description field
        courses: cc.concentration.courses.map(c => ({
          id: c.course.id,
          code: c.course.code,
          name: c.course.name,
          credits: c.course.credits,
          creditHours: c.course.creditHours,
          description: c.course.description
        })),
        createdAt: cc.concentration.createdAt.toISOString().split('T')[0]
      }
    }));

    return NextResponse.json({ concentrations });
  } catch (error) {
    // Fix console.error TypeError by ensuring error is properly formatted
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error fetching curriculum concentrations:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch curriculum concentrations' },
      { status: 500 }
    );
  }
}

// POST /api/curricula/[id]/concentrations - Add concentration to curriculum
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.faculty?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const curriculumId = params.id;
    const body = await request.json();
    const { concentrationId, requiredCourses = 1 } = body;

    if (!concentrationId) {
      return NextResponse.json({ error: 'Concentration ID is required' }, { status: 400 });
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

    // Verify concentration exists and belongs to same department
    const concentration = await prisma.concentration.findFirst({
      where: {
        id: concentrationId,
        departmentId: session.user.faculty.departmentId
      }
    });

    if (!concentration) {
      return NextResponse.json({ error: 'Concentration not found' }, { status: 404 });
    }

    // Check if concentration is already added to curriculum
    const existingCurriculumConcentration = await prisma.curriculumConcentration.findFirst({
      where: {
        curriculumId,
        concentrationId
      }
    });

    if (existingCurriculumConcentration) {
      return NextResponse.json({ error: 'Concentration already added to curriculum' }, { status: 400 });
    }

    // Add concentration to curriculum
    const curriculumConcentration = await prisma.curriculumConcentration.create({
      data: {
        curriculumId,
        concentrationId,
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

    return NextResponse.json({ curriculumConcentration: response }, { status: 201 });
  } catch (error) {
    // Fix console.error TypeError by ensuring error is properly formatted
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error adding concentration to curriculum:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    });
    
    return NextResponse.json(
      { error: 'Failed to add concentration to curriculum' },
      { status: 500 }
    );
  }
}
