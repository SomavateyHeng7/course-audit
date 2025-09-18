import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    const { name, code, facultyId } = await req.json();
  const { id: departmentId } = await context.params;

    // Validate input
    if (!name || !code || !facultyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
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

    // Check if department code already exists in this faculty (excluding current department)
    const codeExists = await prisma.department.findFirst({
      where: {
        code,
        facultyId,
        id: { not: departmentId },
      },
    });

    if (codeExists) {
      return NextResponse.json(
        { error: 'Department code already exists in this faculty' },
        { status: 400 }
      );
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
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
        _count: {
          select: {
            curricula: true,
            blacklists: true,
            concentrations: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Department updated successfully',
      department: updatedDepartment,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Error updating department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
  const { id: departmentId } = await context.params;

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            curricula: true,
            blacklists: true,
            concentrations: true,
          },
        },
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if department has associated data
    if (existingDepartment._count.curricula > 0 || existingDepartment._count.blacklists > 0 || existingDepartment._count.concentrations > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete department with associated curricula, blacklists, or concentrations',
          details: {
            curricula: existingDepartment._count.curricula,
            blacklists: existingDepartment._count.blacklists,
            concentrations: existingDepartment._count.concentrations,
          }
        },
        { status: 400 }
      );
    }

    // Delete department
    await prisma.department.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Error deleting department' },
      { status: 500 }
    );
  }
} 