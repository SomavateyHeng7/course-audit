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

    // Fetch curriculum with its courses and their prerequisites
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        curriculumCourses: {
          include: {
            course: {
              include: {
                prerequisites: {
                  include: {
                    prerequisite: true
                  }
                },
                corequisites: {
                  include: {
                    corequisite: true
                  }
                },
                departmentCourseTypes: {
                  where: {
                    departmentId: departmentId
                  },
                  include: {
                    courseType: true
                  }
                },
                // Include blacklist courses for validation
                blacklistCourses: {
                  include: {
                    blacklist: {
                      include: {
                        courses: {
                          include: {
                            course: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }

    // Transform the data to match our AvailableCourse interface
    const availableCourses = curriculum.curriculumCourses.map(currCourse => {
      const course = currCourse.course;
      
      // Get course category from departmentCourseTypes with fallback logic
      let category = 'Unassigned';
      if (course.departmentCourseTypes && course.departmentCourseTypes.length > 0) {
        category = course.departmentCourseTypes[0].courseType?.name || 'Unassigned';
        console.log(`✅ Course ${course.code}: Found departmentCourseType - ${category}`);
      } else {
        console.log(`⚠️ Course ${course.code}: No departmentCourseTypes found, using fallback`);
        // Fallback categorization for courses not in the curriculum catalog
        // All courses without departmentCourseTypes should be categorized as 'Unassigned' for consistency
        category = 'Unassigned';
        console.log(`🔄 Course ${course.code}: Applied fallback category - ${category}`);
      }

      // Extract prerequisites
      const prerequisites = course.prerequisites?.map(prereq => prereq.prerequisite.code) || [];
      
      // Extract corequisites
      const corequisites = course.corequisites?.map(coreq => coreq.corequisite.code) || [];

      // Extract banned combinations (from blacklists)
      const bannedWith: string[] = [];
      
      // Extract courses that are banned with this course from blacklists
      if (course.blacklistCourses) {
        course.blacklistCourses.forEach(blacklistCourse => {
          // Get all other courses in the same blacklist
          blacklistCourse.blacklist.courses.forEach(otherBlacklistCourse => {
            if (otherBlacklistCourse.course.code !== course.code) {
              bannedWith.push(otherBlacklistCourse.course.code);
            }
          });
        });
      }

      // Determine course level from code (assuming first digit indicates level)
      const levelMatch = course.code.match(/\d/);
      const level = levelMatch ? parseInt(levelMatch[0]) : 1;

      return {
        code: course.code,
        title: course.name,
        credits: course.creditHours || course.credits || 0,
        description: course.description || '',
        prerequisites,
        corequisites,
        bannedWith: [...new Set(bannedWith)], // Remove duplicates
        category,
        level,
        // Course flags for special requirements
        requiresPermission: course.requiresPermission || false,
        summerOnly: course.summerOnly || false,
        requiresSeniorStanding: course.requiresSeniorStanding || false,
        minCreditThreshold: course.minCreditThreshold || null,
      };
    });

    // Also fetch additional courses that might not be in the curriculum but could be electives
    // This could include courses from the same department or related departments
    const departmentCourses = await prisma.course.findMany({
      where: {
        departmentCourseTypes: {
          some: {
            departmentId: departmentId
          }
        }
      },
      include: {
        prerequisites: {
          include: {
            prerequisite: true
          }
        },
        corequisites: {
          include: {
            corequisite: true
          }
        },
        departmentCourseTypes: {
          where: {
            departmentId: departmentId
          },
          include: {
            courseType: true
          }
        },
        // Include blacklist courses for additional courses too
        blacklistCourses: {
          include: {
            blacklist: {
              include: {
                courses: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Add department courses that aren't already in curriculum
    const curriculumCourseCodes = new Set(availableCourses.map(c => c.code));
    const additionalCourses = departmentCourses
      .filter(course => !curriculumCourseCodes.has(course.code))
      .map(course => {
        let category = 'Free Elective';
        if (course.departmentCourseTypes && course.departmentCourseTypes.length > 0) {
          category = course.departmentCourseTypes[0].courseType?.name || 'Free Elective';
        }

        const prerequisites = course.prerequisites?.map(prereq => prereq.prerequisite.code) || [];
        const corequisites = course.corequisites?.map(coreq => coreq.corequisite.code) || [];
        
        // Extract banned combinations for additional courses
        const bannedWith: string[] = [];
        
        if (course.blacklistCourses) {
          course.blacklistCourses.forEach(blacklistCourse => {
            // Get all other courses in the same blacklist
            blacklistCourse.blacklist.courses.forEach(otherBlacklistCourse => {
              if (otherBlacklistCourse.course.code !== course.code) {
                bannedWith.push(otherBlacklistCourse.course.code);
              }
            });
          });
        }
        
        const levelMatch = course.code.match(/\d/);
        const level = levelMatch ? parseInt(levelMatch[0]) : 1;

        return {
          code: course.code,
          title: course.name,
          credits: course.creditHours || course.credits || 0,
          description: course.description || '',
          prerequisites,
          corequisites,
          bannedWith: [...new Set(bannedWith)], // Remove duplicates
          category,
          level
        };
      });

    const allAvailableCourses = [...availableCourses, ...additionalCourses];

    return NextResponse.json({
      courses: allAvailableCourses,
      totalCourses: allAvailableCourses.length
    });

  } catch (error) {
    console.error('Error fetching available courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}