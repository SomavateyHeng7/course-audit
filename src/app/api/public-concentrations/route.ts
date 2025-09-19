import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const curriculumId = searchParams.get('curriculumId');
    const departmentId = searchParams.get('departmentId');

    if (!curriculumId || !departmentId) {
      return NextResponse.json(
        { error: 'Missing curriculumId or departmentId parameter' },
        { status: 400 }
      );
    }

    // Fetch concentrations available for this curriculum and department
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

    // Also fetch all concentrations for the department
    const allDepartmentConcentrations = await prisma.concentration.findMany({
      where: {
        departmentId: departmentId
      },
      include: {
        courses: {
          include: {
            course: true
          }
        },
        curriculumConcentrations: {
          where: {
            curriculumId: curriculumId
          }
        }
      }
    });

    // Transform data for frontend
    const concentrations = allDepartmentConcentrations.map(concentration => {
      const curriculumInfo = concentration.curriculumConcentrations[0];
      const requiredCourses = curriculumInfo?.requiredCourses || concentration.courses.length;
      
      return {
        id: concentration.id,
        name: concentration.name,
        description: concentration.description,
        requiredCourses,
        totalCourses: concentration.courses.length,
        courses: concentration.courses.map(cc => ({
          code: cc.course.code,
          name: cc.course.name,
          credits: cc.course.credits,
          description: cc.course.description
        }))
      };
    });

    return NextResponse.json({
      concentrations,
      totalConcentrations: concentrations.length
    });

  } catch (error) {
    console.error('Error fetching concentrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}