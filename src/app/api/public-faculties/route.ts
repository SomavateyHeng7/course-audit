import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching faculties (public endpoint)...');
    
    const faculties = await prisma.faculty.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log('Public faculties found:', faculties?.length || 0);

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties (public):', {
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