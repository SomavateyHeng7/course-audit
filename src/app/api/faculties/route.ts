import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties:', error);
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
