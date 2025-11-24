import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

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
                  where: {
                    curriculumId: { not: null }
                  },
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
            curriculumPrerequisites: {
              include: {
                prerequisiteCourse: {
                  include: {
                    course: {
                      select: {
                        code: true
                      }
                    }
                  }
                }
              }
            },
            curriculumCorequisites: {
              include: {
                corequisiteCourse: {
                  include: {
                    course: {
                      select: {
                        code: true
                      }
                    }
                  }
                }
              }
            }
          },
        },
        curriculumConstraints: true,
        electiveRules: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const sanitizedCurricula = curricula.map(curriculum => {
      const courses = curriculum.curriculumCourses.map(curriculumCourse => {
        const course = curriculumCourse.course;

        const curriculumPrereqs = (curriculumCourse.curriculumPrerequisites ?? [])
          .map(prereq => prereq.prerequisiteCourse?.course?.code)
          .filter((code): code is string => Boolean(code));
        const curriculumCoreqs = (curriculumCourse.curriculumCorequisites ?? [])
          .map(coreq => coreq.corequisiteCourse?.course?.code)
          .filter((code): code is string => Boolean(code));

        const prerequisites = curriculumPrereqs.length > 0
          ? curriculumPrereqs
          : course.prerequisites?.map(prereq => prereq.prerequisite.code) || [];

        const corequisites = curriculumCoreqs.length > 0
          ? curriculumCoreqs
          : course.corequisites?.map(coreq => coreq.corequisite.code) || [];

        const requiresPermission = curriculumCourse.overrideRequiresPermission ?? course.requiresPermission ?? false;
        const summerOnly = curriculumCourse.overrideSummerOnly ?? course.summerOnly ?? false;
        const requiresSeniorStanding = curriculumCourse.overrideRequiresSeniorStanding ?? course.requiresSeniorStanding ?? false;
        const minCreditThreshold = curriculumCourse.overrideMinCreditThreshold ?? course.minCreditThreshold ?? null;

        const category = course.departmentCourseTypes
          .filter(typeAssignment => typeAssignment.curriculumId === curriculum.id)
          .map(typeAssignment => typeAssignment.courseType?.name)
          .find(Boolean) || 'Unassigned';

        return {
          id: curriculumCourse.id,
          curriculumId: curriculumCourse.curriculumId,
          courseId: curriculumCourse.courseId,
          isRequired: curriculumCourse.isRequired,
          semester: curriculumCourse.semester,
          year: curriculumCourse.year,
          position: curriculumCourse.position,
          requiresPermission,
          summerOnly,
          requiresSeniorStanding,
          minCreditThreshold,
          course: {
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            creditHours: course.creditHours,
            description: course.description,
            category,
            prerequisites,
            corequisites,
          },
        };
      });

      return {
        id: curriculum.id,
        name: curriculum.name,
        year: curriculum.year,
        version: curriculum.version,
        description: curriculum.description,
        startId: curriculum.startId,
        endId: curriculum.endId,
        department: curriculum.department,
        faculty: curriculum.faculty,
        curriculumConstraints: curriculum.curriculumConstraints,
        electiveRules: curriculum.electiveRules,
        curriculumCourses: courses,
      };
    });

    return NextResponse.json({ curricula: sanitizedCurricula });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curricula', details: errorMessage } },
      { status: 500 }
    );
  }
}
