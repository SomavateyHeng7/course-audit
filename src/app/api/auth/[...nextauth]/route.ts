// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from './authOptions';

async function handler(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const params = await ctx.params;
  return NextAuth(authOptions)(req, { params: { nextauth: params.nextauth } });
}

export { handler as GET, handler as POST };