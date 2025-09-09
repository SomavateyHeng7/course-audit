import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/curriculum/bscs2022
export async function GET(req: NextRequest) {
  try {
    // Find the BSCS 2022 curriculum
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        name: 'BSCS2022',
        year: '2022',
        isActive: true,
      },
      include: {
        curriculumCourses: {
          include: {
            course: true,
          },
          orderBy: { position: 'asc' },
        },
        department: true,
        faculty: true,
      },
    });
    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
    }
    // Flatten course data
    const courses = curriculum.curriculumCourses.map((cc) => cc.course);
    return NextResponse.json({
      curriculum: {
        id: curriculum.id,
        name: curriculum.name,
        year: curriculum.year,
        department: curriculum.department?.name,
        faculty: curriculum.faculty?.name,
        courses,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch curriculum' }, { status: 500 });
  }
}
