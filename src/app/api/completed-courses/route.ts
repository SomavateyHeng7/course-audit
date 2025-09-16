import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const curriculumId = searchParams.get('curriculumId');
    const studentId = searchParams.get('studentId'); // This would come from authentication in a real app

    if (!curriculumId) {
      return NextResponse.json(
        { error: 'Missing curriculumId parameter' },
        { status: 400 }
      );
    }

    // For now, we'll simulate completed courses since we don't have proper student authentication
    // In a real application, this would fetch from the StudentCourse table
    // based on the authenticated student's ID

    // This is a mock response that could be replaced with real data
    // The course planning page can override this with localStorage data from the data entry page
    const mockCompletedCourses = [
      'CSX3003', // Data Structure and Algorithm
      'CSX3009', // Algorithm Design  
      'CSX2003', // Principles of Statistics
      'ITX3002', // Introduction to Information Technology
      'CSX3001', // Fundamentals of Computer Programming
      'CSX3002', // Object-Oriented Concept and Programming
      'CSX3004', // Programming Language
      'CSX2009', // Cloud Computing
      'CSX2006', // Mathematics and Statistics for Data Science
      'CSX2008', // Mathematics Foundation for Computer Science
      'ITX2005', // Design Thinking
      'ITX2007', // Data Science
      'ITX3007', // Software Engineering
    ];

    // In production, this would be:
    /*
    const completedCourses = await prisma.studentCourse.findMany({
      where: {
        studentId: studentId,
        status: {
          in: ['COMPLETED', 'PASSED']
        }
      },
      include: {
        course: true
      }
    });

    const completedCourseCodes = completedCourses.map(sc => sc.course.code);
    */

    return NextResponse.json({
      completedCourses: mockCompletedCourses,
      source: 'mock_data', // Indicates this is mock data
      note: 'In production, this would fetch from StudentCourse table based on authenticated student'
    });

  } catch (error) {
    console.error('Error fetching completed courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to update completed courses (for when data is imported from data entry page)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { curriculumId, completedCourses } = body;

    if (!curriculumId || !Array.isArray(completedCourses)) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    // In a real application, this would update the StudentCourse table
    // For now, we'll just return success since we're using localStorage

    return NextResponse.json({
      success: true,
      message: 'Completed courses updated',
      completedCourses
    });

  } catch (error) {
    console.error('Error updating completed courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}