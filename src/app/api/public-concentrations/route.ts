import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const curriculumId = searchParams.get('curriculumId');
    const departmentId = searchParams.get('departmentId');

    console.log('🔍 DEBUG: Concentrations API called with:', {
      curriculumId,
      departmentId,
      fullUrl: request.url
    });

    if (!curriculumId || !departmentId) {
      console.log('🔍 DEBUG: Missing parameters - curriculumId:', curriculumId, 'departmentId:', departmentId);
      return NextResponse.json(
        { error: 'Missing curriculumId or departmentId parameter' },
        { status: 400 }
      );
    }

    // Fetch concentrations available for this curriculum and department
    console.log('🔍 DEBUG: Querying curriculumConcentrations with curriculumId:', curriculumId);
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

    console.log('🔍 DEBUG: Found curriculumConcentrations:', curriculumConcentrations.length);

    // Also fetch all concentrations for the department
    console.log('🔍 DEBUG: Querying allDepartmentConcentrations with departmentId:', departmentId);
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

    console.log('🔍 DEBUG: Found allDepartmentConcentrations:', allDepartmentConcentrations.length);

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

    console.log('🔍 DEBUG: Final concentrations array length:', concentrations.length);
    console.log('🔍 DEBUG: Final concentrations:', concentrations.map(c => ({ id: c.id, name: c.name })));

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