import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CourseCreateData {
  code: string;
  name: string;
  credits: number;
  creditHours?: string;
  category: string;
  description?: string;
  isActive: boolean;
  isBlacklistCourse?: boolean;
}

// POST /api/courses/bulk-create - Create multiple courses at once
export async function POST(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
      console.log('Received request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }

    const { courses } = body;
    console.log('Extracted courses:', courses);

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Courses array is required' } },
        { status: 400 }
      );
    }

    // Validate course data
    for (const course of courses) {
      if (!course.code || !course.name || course.credits === undefined) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Course code, name, and credits are required' } },
          { status: 400 }
        );
      }
    }

    // Check for duplicate codes in the request
    const codes = courses.map((c: CourseCreateData) => c.code.toLowerCase());
    const uniqueCodes = new Set(codes);
    if (codes.length !== uniqueCodes.size) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Duplicate course codes in request' } },
        { status: 400 }
      );
    }

    // Check if any courses already exist (with better normalization)
    const normalizedCodes = courses.map((c: CourseCreateData) => c.code.trim().toLowerCase());
    const existingCourses = await prisma.course.findMany({
      where: {
        code: {
          in: normalizedCodes,
          mode: 'insensitive'
        }
      },
      select: { code: true, id: true }
    });

    if (existingCourses.length > 0) {
      const existingCodes = existingCourses.map(c => c.code);
      console.log('Found existing courses:', existingCodes);
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: `Courses already exist: ${existingCodes.join(', ')}` } },
        { status: 409 }
      );
    }

    // Create courses in a transaction with optimized bulk operations
    console.log('Starting transaction to create courses...');
    const result = await prisma.$transaction(async (tx) => {
      const createdCourses = [];
      const auditLogs = [];

      // First, create all courses
      for (let i = 0; i < courses.length; i++) {
        const courseData = courses[i];
        console.log(`Creating course ${i + 1}/${courses.length}:`, courseData.code);
        
        try {
          // Extract creditHours from description if it's in the format (x-x-x)
          let creditHours = courseData.creditHours;
          if (!creditHours && courseData.description) {
            const match = courseData.description.match(/\((\d+-\d+-\d+)\)/);
            creditHours = match ? match[1] : `${courseData.credits}-0-${courseData.credits * 2}`;
          } else if (!creditHours) {
            creditHours = `${courseData.credits}-0-${courseData.credits * 2}`;
          }

          const course = await tx.course.create({
            data: {
              code: courseData.code.trim(),
              name: courseData.name.trim(),
              credits: courseData.credits,
              creditHours: creditHours,
              category: courseData.category || 'General',
              description: courseData.description?.trim() || null,
              isActive: courseData.isActive !== false, // Default to true
            }
          });

          console.log(`Course created successfully:`, course.code);
          createdCourses.push(course);

          // Prepare audit log data (but don't create yet to optimize transaction)
          auditLogs.push({
            userId: session.user.id,
            entityType: 'Course',
            entityId: course.id,
            action: 'CREATE' as const,
            changes: {
              code: course.code,
              name: course.name,
              credits: course.credits,
              category: course.category,
              isBlacklistCourse: courseData.isBlacklistCourse || false
            },
            description: `Created course ${course.code} via bulk creation${courseData.isBlacklistCourse ? ' (for blacklist)' : ''}`
          });
        } catch (courseError) {
          console.error(`Error creating course ${courseData.code}:`, courseError);
          // Convert any error to a proper Error object
          const errorMessage = courseError instanceof Error 
            ? courseError.message 
            : (courseError && typeof courseError === 'object' && 'message' in courseError)
              ? String(courseError.message)
              : `Failed to create course ${courseData.code}`;
          throw new Error(errorMessage);
        }
      }

      // Then, create all audit logs in one batch operation
      if (auditLogs.length > 0) {
        console.log('Creating audit logs...');
        await tx.auditLog.createMany({
          data: auditLogs
        });
      }

      console.log(`Successfully created ${createdCourses.length} courses`);
      return createdCourses;
    }, {
      timeout: 120000, // 2 minutes timeout
      maxWait: 10000,  // 10 seconds max wait for transaction to start
    });

    console.log('Transaction completed successfully');

    return NextResponse.json({
      courses: result.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        category: course.category,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt
      })),
      message: `Successfully created ${result.length} courses`
    });

  } catch (error) {
    // Handle both Error objects and other types that might be thrown
    let errorMessage = 'Failed to create courses';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error creating courses in bulk:', error.message);
      console.error('Stack trace:', error.stack);
    } else if (error && typeof error === 'object') {
      console.error('Non-Error object thrown:', error);
      errorMessage = 'message' in error ? String(error.message) : 'Unknown database error';
      errorDetails = error;
    } else {
      console.error('Primitive value thrown:', error, typeof error);
      errorMessage = String(error) || 'Unknown error';
    }
    
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: errorMessage,
          details: errorDetails
        } 
      },
      { status: 500 }
    );
  }
}
