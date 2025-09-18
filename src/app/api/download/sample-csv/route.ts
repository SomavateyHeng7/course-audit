import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the CSV file from the public directory
    const filePath = join(process.cwd(), 'public', 'curriculum_creation_courses.csv');
    const csvContent = readFileSync(filePath, 'utf8');

    // Create response with proper headers for CSV download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sample_curriculum_courses.csv"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving CSV file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}