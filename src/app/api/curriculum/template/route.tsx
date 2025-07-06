import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create CSV template content
    const csvContent = `code,name,credits
CS101,Introduction to Computer Science,3
CS102,Data Structures and Algorithms,3
CS103,Database Systems,3
CS104,Software Engineering,3
CS105,Computer Networks,3`;

    // Create response with CSV file
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set(
      'Content-Disposition',
      'attachment; filename="curriculum_template.csv"'
    );

    return response;
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Error generating template' },
      { status: 500 }
    );
  }
} 
