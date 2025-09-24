import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public-curricula/[id] - Get specific curriculum details (public/student access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const curriculum = await prisma.curriculum.findUnique({
      where: { 
        id,
        isActive: true
      },
      include: {
        department: true,
        faculty: true,
        curriculumCourses: {
          include: { 
            course: {
              include: {
                departmentCourseTypes: {
                  include: {
                    courseType: true,
                  },
                },
                prerequisites: {
                  include: {
                    prerequisite: true,
                  },
                },
                corequisites: {
                  include: {
                    corequisite: true,
                  },
                },
              },
            },
          },
        },
        curriculumConstraints: true,
        electiveRules: true,
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
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or inactive' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ curriculum });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum', details: errorMessage } },
      { status: 500 }
    );
  }
}