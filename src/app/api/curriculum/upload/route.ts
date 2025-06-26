import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/authOptions';
import { parse } from 'csv-parse/sync';

interface CourseRecord {
  code: string;
  name: string;
  credits: number;
  category: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const curriculumId = formData.get('curriculumId') as string;

    if (!file || !curriculumId) {
      return NextResponse.json(
        { error: 'Missing file or curriculum ID' },
        { status: 400 }
      );
    }

    // Check if curriculum exists and belongs to faculty
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        id: curriculumId,
        facultyId: session.user.faculty.id,
      },
    });

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
    }));

    // Delete existing courses and create new ones
    await prisma.course.deleteMany({
      where: {
        curriculumId,
      },
    });

    const createdCourses = await prisma.course.createMany({
      data: courses.map((course: CourseRecord) => ({
        ...course,
        curriculumId,
      })),
    });

    return NextResponse.json({
      message: 'Curriculum updated successfully',
      coursesCreated: createdCourses.count,
    });
  } catch (error) {
    console.error('Error uploading curriculum:', error);
    return NextResponse.json(
      { error: 'Error uploading curriculum' },
      { status: 500 }
    );
  }
} 