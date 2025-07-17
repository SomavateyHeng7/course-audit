import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Signup functionality has been disabled
  return NextResponse.json(
    { error: 'User registration is disabled. Please contact an administrator.' },
    { status: 403 }
  );
}

export async function GET(req: Request) {
  // Signup functionality has been disabled
  return NextResponse.json(
    { error: 'User registration is disabled. Please contact an administrator.' },
    { status: 403 }
  );
}
