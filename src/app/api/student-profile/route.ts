import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        advisor: { include: { faculty: true } },
        faculty: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      studentInfo: {
        faculty: user.faculty?.name || 'SCIENCE AND TECHNOLOGY',
        department: 'COMPUTER SCIENCE', // Placeholder, update if department relation is available
        credit: user.credits || 102,
        scholarshipHour: user.scholarshipHour || 0,
      },
      advisorInfo: user.advisor ? {
        name: user.advisor.name,
        faculty: user.advisor.faculty?.name || 'SCIENCE AND TECHNOLOGY',
        department: 'COMPUTER SCIENCE', // Placeholder
        email: user.advisor.email,
        office: '102', // This would need to be added to the User model if needed
      } : null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentInfo, advisorName } = body;

    // For now, we'll just update the credits and scholarshipHour
    // Faculty and department would need to be updated through faculty/department relationships
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        credits: studentInfo.credit,
        scholarshipHour: studentInfo.scholarshipHour,
        // If advisor name is provided, update the advisor relationship
        ...(advisorName && {
          advisor: {
            connect: {
              name: advisorName,
            },
          },
        }),
      },
      include: {
        advisor: { include: { faculty: true } },
        faculty: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      studentInfo: {
        faculty: updatedUser.faculty?.name || 'SCIENCE AND TECHNOLOGY',
        department: 'COMPUTER SCIENCE', // Placeholder
        credit: updatedUser.credits || 102,
        scholarshipHour: updatedUser.scholarshipHour || 0,
      },
      advisorInfo: updatedUser.advisor ? {
        name: updatedUser.advisor.name,
        faculty: updatedUser.advisor.faculty?.name || 'SCIENCE AND TECHNOLOGY',
        department: 'COMPUTER SCIENCE', // Placeholder
        email: updatedUser.advisor.email,
        office: '102',
      } : null,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
