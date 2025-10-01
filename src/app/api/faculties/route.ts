import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    console.log('Session in faculties API:', JSON.stringify(session, null, 2));
    
    if (!session?.user || !['SUPER_ADMIN', 'CHAIRPERSON'].includes(session.user.role || '')) {
      console.log('Authorization failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role,
        allowedRoles: ['SUPER_ADMIN', 'CHAIRPERSON']
      });
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('Testing database connection...');
    
    // First test basic database connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', connectionTest);
    
    console.log('Fetching faculties with counts...');
    const faculties = await prisma.faculty.findMany({
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
            curricula: true,
          },
        },
      },
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
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      );
    }

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
