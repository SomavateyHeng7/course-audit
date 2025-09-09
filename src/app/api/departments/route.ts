import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'CHAIRPERSON'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');

    // Build where clause based on facultyId filter
    const where = facultyId ? { facultyId } : {};

    const departments = await prisma.department.findMany({
      where,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      );
    }

    const { name, code, facultyId } = await req.json();

    // Validate input
    if (!name || !code || !facultyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Invalid faculty' },
        { status: 400 }
      );
    }

    // Check if department code already exists in this faculty
    const existingDepartment = await prisma.department.findFirst({
      where: {
        code,
        facultyId,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists in this faculty' },
        { status: 400 }
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
        facultyId,
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'Department created successfully', 
        department 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Error creating department' },
      { status: 500 }
    );
  }
}
