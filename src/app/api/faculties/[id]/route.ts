import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  context: any
) {
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
  const facultyId = context.params.id;

    // Validate input
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Check if faculty code already exists (excluding current faculty)
    const codeExists = await prisma.faculty.findFirst({
      where: {
        code,
        id: { not: facultyId },
      },
    });

    if (codeExists) {
      return NextResponse.json(
        { error: 'Faculty code already exists' },
        { status: 400 }
      );
    }

    // Update faculty
    const updatedFaculty = await prisma.faculty.update({
      where: { id: facultyId },
      data: {
        name,
        code,
      },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            curricula: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Faculty updated successfully',
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      { error: 'Error updating faculty' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      );
    }

  const { id: facultyId } = await context.params;

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            curricula: true,
          },
        },
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Check if faculty has associated data
    if (existingFaculty._count.users > 0 || existingFaculty._count.departments > 0 || existingFaculty._count.curricula > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete faculty with associated users, departments, or curricula',
          details: {
            users: existingFaculty._count.users,
            departments: existingFaculty._count.departments,
            curricula: existingFaculty._count.curricula,
          }
        },
        { status: 400 }
      );
    }

    // Delete faculty
    await prisma.faculty.delete({
      where: { id: facultyId },
    });

    return NextResponse.json({
      message: 'Faculty deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    return NextResponse.json(
      { error: 'Error deleting faculty' },
      { status: 500 }
    );
  }
} 