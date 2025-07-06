import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for concentration creation
const createConcentrationSchema = z.object({
  name: z.string().min(1, 'Concentration name is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
});

// GET /api/concentrations - List concentrations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where = {
      createdById: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [concentrations, total] = await Promise.all([
      prisma.concentration.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          courses: {
            include: {
              course: {
                select: { id: true, code: true, name: true, credits: true, category: true },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.concentration.count({ where }),
    ]);

    return NextResponse.json({
      concentrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching concentrations:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch concentrations' } },
      { status: 500 }
    );
  }
}

// POST /api/concentrations - Create new concentration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHAIRPERSON') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Chairperson access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createConcentrationSchema.parse(body);

    // Check if concentration with same name already exists for this user and department
    const existingConcentration = await prisma.concentration.findFirst({
      where: {
        name: validatedData.name,
        departmentId: validatedData.departmentId,
        createdById: session.user.id,
      },
    });

    if (existingConcentration) {
      return NextResponse.json(
        { 
          error: { 
            code: 'DUPLICATE_CONCENTRATION', 
            message: 'Concentration with this name already exists in this department' 
          } 
        },
        { status: 409 }
      );
    }

    // Verify department exists and user has access to it
    const department = await prisma.department.findFirst({
      where: {
        id: validatedData.departmentId,
        facultyId: session.user.faculty.id,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Department not found' } },
        { status: 404 }
      );
    }

    // Create concentration
    const concentration = await prisma.concentration.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        departmentId: validatedData.departmentId,
        createdById: session.user.id,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        entityType: 'Concentration',
        entityId: concentration.id,
        action: 'CREATE',
        description: `Created concentration: ${concentration.name}`,
        concentrationId: concentration.id,
      },
    });

    return NextResponse.json({ concentration }, { status: 201 });

  } catch (error) {
    console.error('Error creating concentration:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create concentration' } },
      { status: 500 }
    );
  }
} 