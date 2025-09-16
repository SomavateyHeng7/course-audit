import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public-curricula - List all active curricula and their courses (public/student access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const departmentId = searchParams.get('departmentId');
    const year = searchParams.get('year');
    const curriculumId = searchParams.get('curriculumId');

    const where: any = { isActive: true };
    if (facultyId) where.facultyId = facultyId;
    if (departmentId) where.departmentId = departmentId;
    if (year) where.year = year;
    if (curriculumId) where.id = curriculumId;

    const curricula = await prisma.curriculum.findMany({
      where,
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
              },
            },
          },
        },
        curriculumConstraints: true,
        electiveRules: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ curricula });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curricula', details: errorMessage } },
      { status: 500 }
    );
  }
}
