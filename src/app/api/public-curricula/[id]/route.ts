import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

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
                  where: {
                    curriculumId: id
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

    const sanitizedCurriculum = {
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
      curriculumConcentrations: curriculum.curriculumConcentrations,
      curriculumCourses: curriculum.curriculumCourses.map(currCourse => {
        const course = currCourse.course;
        const curriculumPrereqs = (currCourse.curriculumPrerequisites ?? [])
          .map(prereq => prereq.prerequisiteCourse?.course?.code)
          .filter((code): code is string => Boolean(code));
        const curriculumCoreqs = (currCourse.curriculumCorequisites ?? [])
          .map(coreq => coreq.corequisiteCourse?.course?.code)
          .filter((code): code is string => Boolean(code));

        const prerequisites = curriculumPrereqs.length > 0
          ? curriculumPrereqs
          : course.prerequisites?.map(prereq => prereq.prerequisite.code) || [];

        const corequisites = curriculumCoreqs.length > 0
          ? curriculumCoreqs
          : course.corequisites?.map(coreq => coreq.corequisite.code) || [];

        const requiresPermission = currCourse.overrideRequiresPermission ?? course.requiresPermission ?? false;
        const summerOnly = currCourse.overrideSummerOnly ?? course.summerOnly ?? false;
        const requiresSeniorStanding = currCourse.overrideRequiresSeniorStanding ?? course.requiresSeniorStanding ?? false;
        const minCreditThreshold = currCourse.overrideMinCreditThreshold ?? course.minCreditThreshold ?? null;

        const category = course.departmentCourseTypes?.[0]?.courseType?.name || 'Unassigned';

        return {
          id: currCourse.id,
          curriculumId: currCourse.curriculumId,
          courseId: currCourse.courseId,
          isRequired: currCourse.isRequired,
          semester: currCourse.semester,
          year: currCourse.year,
          position: currCourse.position,
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
      })
    };

    return NextResponse.json({ curriculum: sanitizedCurriculum });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curriculum', details: errorMessage } },
      { status: 500 }
    );
  }
}