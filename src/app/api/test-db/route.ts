import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    console.log('=== Database Connection Test ===');
    
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    const basicTest = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Basic connection test result:', basicTest);
    
    // Test 2: Check if tables exist
    console.log('Test 2: Checking if tables exist...');
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'faculties', 'curricula')
    `;
    console.log('Tables found:', tableCheck);
    
    // Test 3: Count records in key tables
    console.log('Test 3: Counting records...');
    const userCount = await prisma.user.count();
    const facultyCount = await prisma.faculty.count();
    console.log('User count:', userCount);
    console.log('Faculty count:', facultyCount);
    
    // Test 4: Try to fetch one faculty
    console.log('Test 4: Fetching one faculty...');
    const oneFaculty = await prisma.faculty.findFirst();
    console.log('Sample faculty:', oneFaculty);
    
    return NextResponse.json({
      success: true,
      tests: {
        basicConnection: 'PASSED',
        tableCheck: tableCheck,
        userCount,
        facultyCount,
        sampleFaculty: oneFaculty
      }
    });
    
  } catch (error) {
    console.error('=== Database Test Failed ===');
    console.error('Error details:', {
      message: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack || 'No stack trace',
      name: (error as Error)?.name || 'Unknown error type',
      cause: (error as any)?.cause || 'No cause',
      code: (error as any)?.code || 'No error code'
    });
    
    return NextResponse.json({
      success: false,
      error: {
        message: (error as Error)?.message || 'Unknown error',
        name: (error as Error)?.name || 'Unknown error type',
        code: (error as any)?.code || 'No error code'
      }
    }, { status: 500 });
  }
}
