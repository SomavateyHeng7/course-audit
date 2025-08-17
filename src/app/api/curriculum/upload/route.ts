import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parse } from 'csv-parse/sync';

interface CourseRecord {
  code: string;
  name: string;
  credits: number;
  category: string;
  creditHours?: string;
  description?: string;
}

export async function POST(req: Request) {
  try {
    // TODO: Debug - Add logging to verify this endpoint is being called
    console.log('📁 Curriculum upload endpoint called');
    
    const session = await auth();
    // TODO: Debug - Log session details to verify authentication
    console.log('🔐 Session user:', session?.user?.id, 'Role:', session?.user?.role);
    
    if (!session?.user || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const curriculumId = formData.get('curriculumId') as string;

    // TODO: Debug - Log form data to verify what's being received
    console.log('📋 Form data - File:', file?.name, 'CurriculumId:', curriculumId);

    if (!file || !curriculumId) {
      return NextResponse.json(
        { error: 'Missing file or curriculum ID' },
        { status: 400 }
      );
    }

    // Check if curriculum exists and user owns it
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        createdById: session.user.id, // Ensure ownership
      },
    });

    // TODO: Debug - Log curriculum lookup result
    console.log('🎓 Curriculum found:', !!curriculum, 'ID:', curriculumId);

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }

    // Read and parse CSV file
    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // TODO: Debug - Log parsed CSV data
    console.log('📊 CSV records parsed:', records.length, 'records');
    console.log('📝 First record:', records[0]);

    // Validate CSV structure
    const requiredColumns = ['code', 'name', 'credits', 'category'];
    const firstRecord = records[0];
    if (!firstRecord || !requiredColumns.every(col => col in firstRecord)) {
      return NextResponse.json(
        { error: 'Invalid CSV format. Required columns: code, name, credits, category' },
        { status: 400 }
      );
    }

    // Process records and create/update courses
    const courses: CourseRecord[] = records.map((record: any) => ({
      code: record.code,
      name: record.name,
      credits: parseInt(record.credits, 10),
      category: record.category,
      creditHours: record.creditHours || `${record.credits}-0-${record.credits * 2}`,
      description: record.description || '',
    }));

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // TODO: Debug - Log transaction start
      console.log('🔄 Starting database transaction for', courses.length, 'courses');
      
      // Remove existing course relationships for this curriculum
      await tx.curriculumCourse.deleteMany({
        where: {
          curriculumId,
        },
      });

      // TODO: Debug - Log deletion complete
      console.log('🗑️ Removed existing curriculum-course relationships');

      // Process each course
      let coursesProcessed = 0;
      for (const courseData of courses) {
        // TODO: Debug - Log each course being processed
        console.log(`📚 Processing course ${coursesProcessed + 1}/${courses.length}:`, courseData.code);
        
        // Check if course exists globally
        let course = await tx.course.findUnique({
          where: { code: courseData.code },
        });

        if (course) {
          // TODO: Debug - Log course update
          console.log(`♻️ Updating existing course:`, courseData.code);
          // Course exists - update it (global change)
          course = await tx.course.update({
            where: { code: courseData.code },
            data: {
              name: courseData.name,
              credits: courseData.credits,
              creditHours: courseData.creditHours!,
              description: courseData.description,
            },
          });
        } else {
          // TODO: Debug - Log course creation
          console.log(`✨ Creating new course:`, courseData.code);
          // Create new course in global pool
          course = await tx.course.create({
            data: {
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              creditHours: courseData.creditHours!,
              description: courseData.description,
              requiresPermission: false,
              summerOnly: false,
              requiresSeniorStanding: false,
              isActive: true,
            },
          });
        }

        // TODO: Debug - Log relationship creation
        console.log(`🔗 Creating curriculum-course relationship for:`, course.code);
        // Create curriculum-course relationship
        await tx.curriculumCourse.create({
          data: {
            curriculumId,
            courseId: course.id,
            isRequired: true,
            position: coursesProcessed,
          },
        });

        coursesProcessed++;
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          entityType: 'Curriculum',
          entityId: curriculumId,
          action: 'IMPORT',
          description: `Uploaded ${coursesProcessed} courses via CSV`,
          curriculumId,
          changes: {
            coursesUploaded: coursesProcessed,
            courseList: courses.map(c => c.code),
          },
        },
      });

      // TODO: Debug - Log transaction completion
      console.log('✅ Transaction completed successfully. Courses processed:', coursesProcessed);
      return { coursesProcessed };
    });

    return NextResponse.json({
      message: 'Curriculum updated successfully',
      coursesProcessed: result.coursesProcessed,
    });
  } catch (error) {
    console.error('❌ Error uploading curriculum:', error);
    return NextResponse.json(
      { error: 'Error uploading curriculum' },
      { status: 500 }
    );
  }
}

/*
 * 🐛 DEBUGGING NOTES FOR TOMORROW:
 * 
 * POTENTIAL ISSUES TO INVESTIGATE:
 * 
 * 1. 🔐 AUTHENTICATION:
 *    - Check if session.user.id exists and matches expected format
 *    - Verify session.user.role is exactly 'CHAIRPERSON'
 *    - Make sure auth() is working correctly with new NextAuth v5 syntax
 * 
 * 2. 📋 CURRICULUM ID:
 *    - Verify curriculumId is being passed correctly from frontend
 *    - Check if curriculum exists in database with correct createdById
 *    - Test curriculum ownership (createdById should match session.user.id)
 * 
 * 3. 📁 FILE UPLOAD:
 *    - Ensure CSV file is being received correctly
 *    - Check file.text() is working and returning expected content
 *    - Verify CSV parsing with csv-parse library
 * 
 * 4. 🗄️ DATABASE:
 *    - Check if database connection is working
 *    - Verify schema is applied correctly (run `npx prisma db pull` to check)
 *    - Make sure Prisma client is generated correctly
 *    - Check if transactions are working (might need isolation level adjustment)
 * 
 * 5. 🔍 DEBUGGING STEPS:
 *    - Check browser DevTools Network tab for API call
 *    - Look at terminal console for our debug logs
 *    - Verify response from API endpoint
 *    - Check Prisma Studio to see if data is being written
 * 
 * 6. 🎯 TEST MANUALLY:
 *    - Test with a simple 2-3 course CSV file first
 *    - Try creating curriculum via API first, then upload
 *    - Use Prisma Studio to manually verify data
 * 
 * 7. 📝 CSV FORMAT EXPECTED:
 *    Required columns: code, name, credits, category
 *    Optional columns: creditHours, description
 *    Example:
 *    code,name,credits,category,creditHours,description
 *    CS101,Intro to Programming,3,Core,3-0-6,Basic programming concepts
 *    
 * 8. 🛠️ QUICK TESTS TO RUN:
 *    - POST to /api/curricula to create a curriculum first
 *    - GET /api/curricula to see if it shows up
 *    - Then try uploading to that curriculum
 */
