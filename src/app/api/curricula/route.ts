import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for curriculum creation
const createCurriculumSchema = z.object({
  name: z.string().min(1, 'Curriculum name is required'),
  year: z.string().min(1, 'Year is required'),
  version: z.string().optional().default('1.0'),
  description: z.string().optional(),
  startId: z.string().min(1, 'Start ID is required'),
  endId: z.string().min(1, 'End ID is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  // Course data from Excel upload
  courses: z.array(z.object({
    code: z.string().min(1, 'Course code is required'),
    name: z.string().min(1, 'Course name is required'),
    credits: z.number().min(0, 'Credits must be non-negative'),
    creditHours: z.string().min(1, 'Credit hours format required'),
    description: z.string().optional(),
    requiresPermission: z.boolean().optional().default(false),
    summerOnly: z.boolean().optional().default(false),
    requiresSeniorStanding: z.boolean().optional().default(false),
    minCreditThreshold: z.number().optional(),
    // Curriculum-specific properties
    isRequired: z.boolean().optional().default(true),
    semester: z.string().optional(),
    year: z.number().optional(),
    position: z.number().optional(),
  })).optional().default([]),
  // Initial constraints
  constraints: z.array(z.object({
    type: z.enum(['MINIMUM_GPA', 'SENIOR_STANDING', 'TOTAL_CREDITS', 'CATEGORY_CREDITS', 'CUSTOM']),
    name: z.string().min(1, 'Constraint name is required'),
    description: z.string().optional(),
    isRequired: z.boolean().optional().default(true),
    config: z.record(z.string(), z.any()).optional(), // JSON configuration
  })).optional().default([]),
  // Initial elective rules
  electiveRules: z.array(z.object({
    category: z.string().min(1, 'Category is required'),
    requiredCredits: z.number().min(0, 'Required credits must be non-negative'),
    description: z.string().optional(),
  })).optional().default([]),
});

// GET /api/curricula - List curricula for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    // Get user's department for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: true,
        faculty: { include: { departments: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Get accessible department IDs (user's department + other departments in same faculty)
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const where = {
      departmentId: { in: accessibleDepartmentIds }, // Department-based filtering
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { year: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [curricula, total] = await Promise.all([
      prisma.curriculum.findMany({
        where,
        include: {
          department: true,
          faculty: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          curriculumCourses: {
            include: {
              course: true,
            },
          },
          curriculumConstraints: true,
          electiveRules: true,
          _count: {
            select: {
              curriculumCourses: true,
              curriculumConstraints: true,
              electiveRules: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.curriculum.count({ where }),
    ]);

    // Log audit event - with safety check for user existence
    try {
      if (session?.user?.id) {
        // Verify user exists before creating audit log
        const userExists = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true }
        });
        
        if (userExists) {
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              entityType: 'Curriculum',
              entityId: 'LIST',
              action: 'CREATE', // Using CREATE for list access
              description: `Listed curricula with search: "${search}"`,
            },
          });
        }
      }
    } catch (auditError) {
      // Don't fail the main request if audit logging fails
      console.warn('Audit logging failed:', auditError instanceof Error ? auditError.message : String(auditError));
    }

    return NextResponse.json({
      curricula,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    // Fix console.error TypeError by ensuring error is properly formatted
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error fetching curricula:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    });
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch curricula' } },
      { status: 500 }
    );
  }
}

// POST /api/curricula - Create new curriculum
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/curricula called');
    
    const session = await auth();
    console.log('👤 Session:', session?.user?.id, 'Role:', session?.user?.role);
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID');
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      console.log('❌ User is not chairperson, role:', session.user.role);
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📝 Request body received, keys:', Object.keys(body));
    console.log('📚 Number of courses:', body.courses?.length || 0);
    
    const validatedData = createCurriculumSchema.parse(body);
    console.log('✅ Data validation passed');

    // Validate department access - user must be able to access the specified department
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        department: true,
        faculty: { include: { departments: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Check if user can access the target department (same faculty)
    const accessibleDepartmentIds = user.faculty.departments.map(dept => dept.id);
    if (!accessibleDepartmentIds.includes(validatedData.departmentId)) {
      console.log('❌ Department access denied:', validatedData.departmentId);
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this department' } },
        { status: 403 }
      );
    }

    // Check if curriculum with same year/startId/endId in the same department already exists
    const existingCurriculum = await prisma.curriculum.findFirst({
      where: {
        year: validatedData.year,
        startId: validatedData.startId,
        endId: validatedData.endId,
        departmentId: validatedData.departmentId,
      },
    });

    if (existingCurriculum) {
      console.log('❌ Duplicate curriculum found:', existingCurriculum.id);
      
      return NextResponse.json(
        { 
          error: { 
            code: 'DUPLICATE_CURRICULUM', 
            message: `Curriculum for year ${validatedData.year} with ID range ${validatedData.startId}-${validatedData.endId} already exists in this department.`,
            existingCurriculum: {
              id: existingCurriculum.id,
              name: existingCurriculum.name,
              year: existingCurriculum.year,
              startId: existingCurriculum.startId,
              endId: existingCurriculum.endId
            }
          } 
        },
        { status: 409 }
      );
    }

    console.log('🔄 Starting database transaction...');
    // Use transaction to ensure data consistency with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      console.log('📚 Processing', validatedData.courses.length, 'courses...');
      
      // 1. Create or update courses in global pool (optimized)
      const courseData: Array<{
        course: any;
        curriculumSpecific: {
          isRequired?: boolean;
          semester?: string;
          year?: number;
          position?: number;
        };
      }> = [];

      console.log('🔍 Fetching existing courses in batch...');
      // First, get all existing courses in one query
      const existingCourses = await tx.course.findMany({
        where: {
          code: {
            in: validatedData.courses.map(c => c.code)
          }
        }
      });
      
      const existingCoursesMap = new Map(existingCourses.map(c => [c.code, c]));
      console.log(`📚 Found ${existingCourses.length} existing courses out of ${validatedData.courses.length}`);

      // Process each course
      let coursesProcessed = 0;
      for (const courseInfo of validatedData.courses) {
        try {
          console.log(`🔍 Processing course ${coursesProcessed + 1}/${validatedData.courses.length}: ${courseInfo.code}`);
          
          let course = existingCoursesMap.get(courseInfo.code);

          if (course) {
            // Course exists - update if needed (global change)
            console.log('🔄 Updating existing course:', courseInfo.code);
            course = await tx.course.update({
              where: { code: courseInfo.code },
              data: {
                name: courseInfo.name,
                credits: courseInfo.credits,
                creditHours: courseInfo.creditHours,
                description: courseInfo.description,
                requiresPermission: courseInfo.requiresPermission,
                summerOnly: courseInfo.summerOnly,
                requiresSeniorStanding: courseInfo.requiresSeniorStanding,
                minCreditThreshold: courseInfo.minCreditThreshold,
              },
            });
          } else {
            // Create new course in global pool
            console.log('➕ Creating new course:', courseInfo.code);
            course = await tx.course.create({
              data: {
                code: courseInfo.code,
                name: courseInfo.name,
                credits: courseInfo.credits,
                creditHours: courseInfo.creditHours,
                description: courseInfo.description,
                requiresPermission: courseInfo.requiresPermission || false,
                summerOnly: courseInfo.summerOnly || false,
                requiresSeniorStanding: courseInfo.requiresSeniorStanding || false,
                minCreditThreshold: courseInfo.minCreditThreshold,
              },
            });
          }

          courseData.push({
            course,
            curriculumSpecific: {
              isRequired: courseInfo.isRequired,
              semester: courseInfo.semester,
              year: courseInfo.year,
              position: courseInfo.position,
            },
          });

          coursesProcessed++;
          console.log(`✅ Course ${courseInfo.code} processed successfully (${coursesProcessed}/${validatedData.courses.length})`);
        } catch (courseError) {
          console.log(`❌ Error processing course ${courseInfo.code}:`);
          console.log('❌ Course error type:', typeof courseError);
          console.log('❌ Course data:', JSON.stringify(courseInfo, null, 2));
          if (courseError && typeof courseError === 'object') {
            try {
              console.log('❌ Course error details:', JSON.stringify(courseError, null, 2));
            } catch {
              console.log('❌ Course error could not be serialized:', courseError);
            }
          } else {
            console.log('❌ Course error value:', courseError);
          }
          throw courseError; // Re-throw to be caught by outer catch
        }
      }

      // 2. Create curriculum
      console.log('🏛️ Creating curriculum...');
      const curriculum = await tx.curriculum.create({
        data: {
          name: validatedData.name,
          year: validatedData.year,
          version: validatedData.version,
          description: validatedData.description,
          startId: validatedData.startId,
          endId: validatedData.endId,
          departmentId: validatedData.departmentId,
          facultyId: validatedData.facultyId,
          createdById: session.user.id,
        },
        include: {
          department: true,
          faculty: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      console.log('✅ Curriculum created:', curriculum.id);

      // 3. Create curriculum-course relationships (batch operation)
      console.log('🔗 Creating curriculum-course relationships in batch...');
      const curriculumCourses = await tx.curriculumCourse.createMany({
        data: courseData.map((item, index) => ({
          curriculumId: curriculum.id,
          courseId: item.course.id,
          isRequired: item.curriculumSpecific.isRequired ?? true,
          semester: item.curriculumSpecific.semester,
          year: item.curriculumSpecific.year,
          position: item.curriculumSpecific.position ?? index,
        })),
      });

      console.log(`✅ Created ${curriculumCourses.count} curriculum-course relationships`);

      // Get the created relationships with course details for response
      const curriculumCoursesWithDetails = await tx.curriculumCourse.findMany({
        where: { curriculumId: curriculum.id },
        include: { course: true },
      });

      // 4. Create initial constraints (batch operation)
      let constraints: any[] = [];
      if (validatedData.constraints.length > 0) {
        console.log('📋 Creating constraints in batch...');
        await tx.curriculumConstraint.createMany({
          data: validatedData.constraints.map((constraint) => ({
            curriculumId: curriculum.id,
            type: constraint.type,
            name: constraint.name,
            description: constraint.description,
            isRequired: constraint.isRequired ?? true,
            config: constraint.config as any || {},
          })),
        });

        constraints = await tx.curriculumConstraint.findMany({
          where: { curriculumId: curriculum.id },
        });
      }

      // 5. Create initial elective rules (batch operation)
      let electiveRules: any[] = [];
      if (validatedData.electiveRules.length > 0) {
        console.log('📚 Creating elective rules in batch...');
        await tx.electiveRule.createMany({
          data: validatedData.electiveRules.map((rule) => ({
            curriculumId: curriculum.id,
            category: rule.category,
            requiredCredits: rule.requiredCredits,
            description: rule.description,
          })),
        });

        electiveRules = await tx.electiveRule.findMany({
          where: { curriculumId: curriculum.id },
        });
      }

      // 6. Create audit log - with safety check
      if (session?.user?.id) {
        // Verify user exists before creating audit log
        const userExists = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { id: true }
        });
        
        if (userExists) {
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              entityType: 'Curriculum',
              entityId: curriculum.id,
              action: 'CREATE',
              description: `Created curriculum "${curriculum.name}" for year ${curriculum.year}`,
              curriculumId: curriculum.id,
              changes: {
                courseCount: courseData.length,
                constraintCount: constraints.length,
                electiveRuleCount: electiveRules.length,
              },
            },
          });
        }
      }

      return {
        curriculum: {
          ...curriculum,
          curriculumCourses: curriculumCoursesWithDetails,
          curriculumConstraints: constraints,
          electiveRules,
        },
      };
    }, {
      maxWait: 20000, // Maximum time to wait to acquire a transaction in milliseconds
      timeout: 30000, // Maximum time a transaction can run before being cancelled in milliseconds
    });

    console.log('✅ Transaction completed successfully');
    console.log('📋 Created curriculum:', result.curriculum.id);
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    // Safe error logging - avoid console.error with potentially null objects
    try {
      console.log('❌ Error in POST /api/curricula - Type:', typeof error);
      console.log('❌ Error constructor:', error?.constructor?.name);
      if (error && typeof error === 'object') {
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('❌ Error value:', error);
      }
    } catch (logError) {
      console.log('❌ Error occurred but could not be logged safely');
    }
    
    if (error instanceof z.ZodError) {
      console.log('📝 Validation error details:', error.issues);
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data'
          } 
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : (error ? String(error) : 'Unknown error');
    console.log('💥 Final error message:', errorMessage);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create curriculum', details: errorMessage } },
      { status: 500 }
    );
  }
}
