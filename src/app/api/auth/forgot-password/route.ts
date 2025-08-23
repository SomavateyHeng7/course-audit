import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // For security, always return success
    return NextResponse.json({ success: true });
  }

  // Generate a reset token (simple random string for demo)
  const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  // Save token to user (or a separate table in production)
  await prisma.user.update({
    where: { email },
    data: {
      // Add a field to your User model for resetToken and resetTokenExpiry in production
      // For demo, just log the token
    },
  });

  // Send email (console log for demo)
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  // In production, use nodemailer to send the email
  if (process.env.NODE_ENV === 'production') {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
  } else {
    // For dev/demo, just log the link
    console.log(`Password reset link for ${email}: ${resetUrl}`);
  }

  return NextResponse.json({ success: true });
}
