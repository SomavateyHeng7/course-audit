import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, facultyId, departmentId } = await req.json();

    // Validate input
    if (!email || !password || !name || !facultyId || !departmentId) {
      return NextResponse.json(
        { error: 'Missing required fields. Department selection is required.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Validate that department belongs to the selected faculty
    const department = await prisma.department.findFirst({
      where: { 
        id: departmentId, 
        facultyId: facultyId 
      },
      include: {
        faculty: true
      }
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Invalid department for selected faculty' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with department association
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        facultyId,
        departmentId, // 🆕 Required department association
        role: 'CHAIRPERSON', // 🆕 Default role is now CHAIRPERSON
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
} 
