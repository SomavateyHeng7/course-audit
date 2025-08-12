import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // First test basic database connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', connectionTest);
    
    console.log('Fetching faculties...');
    const faculties = await prisma.faculty.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log('Faculties found:', faculties?.length || 0);

    return NextResponse.json(faculties, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching faculties:', {
      message: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack || 'No stack trace',
      name: (error as Error)?.name || 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Error fetching faculties' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 
