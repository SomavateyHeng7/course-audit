import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // First test basic database connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', connectionTest);
    
    console.log('Fetching faculties...');
    const faculties = await prisma.faculty.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log('Faculties found:', faculties?.length || 0);

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties:', {
      message: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack || 'No stack trace',
      name: (error as Error)?.name || 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, code } = await req.json();

    // Validate input
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if faculty code already exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { code },
    });

    if (existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty code already exists' },
        { status: 400 }
      );
    }

    // Create faculty
    const faculty = await prisma.faculty.create({
      data: {
        name,
        code,
      },
    });

    return NextResponse.json(
      { 
        message: 'Faculty created successfully', 
        faculty 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      { error: 'Error creating faculty' },
      { status: 500 }
    );
  }
} 
