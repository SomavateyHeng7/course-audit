import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public-curricula/[id]/elective-rules - Get curriculum elective rules (public/student access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First verify curriculum exists and is active
    const curriculum = await prisma.curriculum.findUnique({
      where: { 
        id,
        isActive: true
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Curriculum not found or inactive' } },
        { status: 404 }
      );
    }

    // Get elective rules for this curriculum
    const electiveRules = await prisma.electiveRule.findMany({
      where: {
        curriculumId: id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ electiveRules });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch elective rules', details: errorMessage } },
      { status: 500 }
    );
  }
}