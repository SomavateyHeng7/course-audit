import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/faculty/concentration-label - Get the concentration label for the current user's faculty
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.faculty?.id) {
      return NextResponse.json(
        { error: 'User not authenticated or no faculty associated' },
        { status: 401 }
      );
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.user.faculty.id }
    });
    
    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    console.log('Faculty found:', faculty);
    return NextResponse.json({
      concentrationLabel: faculty.concentrationLabel || 'Concentrations'
    });

  } catch (error) {
    console.error('Error fetching concentration label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concentration label' },
      { status: 500 }
    );
  }
}

// PUT /api/faculty/concentration-label - Update the concentration label for the current user's faculty
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.faculty?.id) {
      return NextResponse.json(
        { error: 'User not authenticated or no faculty associated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { label } = body;

    console.log('Received PUT request with label:', label, 'for faculty:', session.user.faculty.id);

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Label is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (label.trim().length > 50) {
      return NextResponse.json(
        { error: 'Label must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Update the current user's faculty
    console.log('Updating faculty:', session.user.faculty.id, 'with label:', label.trim());
    const updatedFaculty = await prisma.faculty.update({
      where: { id: session.user.faculty.id },
      data: { concentrationLabel: label.trim() }
    });
    
    console.log('Updated faculty:', updatedFaculty);

    return NextResponse.json({
      concentrationLabel: updatedFaculty.concentrationLabel 
    });

  } catch (error) {
    console.error('Error updating concentration label:', error);
    return NextResponse.json(
      { error: 'Failed to update concentration label' },
      { status: 500 }
    );
  }
}
