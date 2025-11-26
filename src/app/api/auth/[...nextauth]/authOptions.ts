import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database/prisma';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' as const, maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/auth',
    error: '/auth/error',
    signOut: '/',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = credentials?.password ?? '';

        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        // Pull only what you need to keep tokens small
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,          // PLAINTEXT in DB (per your seed)
            facultyId: true,
            departmentId: true,
            advisorId: true,
            // If you need faculty object in session, select minimally:
            faculty: { select: { id: true, name: true, code: true } },
          },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        // Support both plaintext and bcrypt-hashed passwords
        let isPasswordValid = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
          // bcrypt hash
          const bcrypt = require('bcryptjs');
          isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
          // plaintext
          isPasswordValid = user.password === password;
        }
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          faculty: user.faculty,       // small object
          departmentId: user.departmentId,
          advisorId: user.advisorId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      // Always ensure we return a valid object to prevent jwt.sign(null) errors
      const baseToken = (token && typeof token === 'object') ? token : {};
      const nextToken: Record<string, unknown> = { ...baseToken };

      if (user) {
        nextToken.id = user.id;
        nextToken.role = user.role;
        nextToken.faculty = user.faculty;
        nextToken.departmentId = user.departmentId;
        nextToken.advisorId = user.advisorId;
      }

      // Ensure token always has required JWT fields
      if (!nextToken.iat) {
        nextToken.iat = Math.floor(Date.now() / 1000);
      }
      if (!nextToken.exp) {
        nextToken.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      }

      return nextToken;
    },
    async session({ session, token }: any) {
      // Ensure session.user exists before assigning
      if (!session) {
        session = { user: {} };
      }
      if (!session.user) {
        session.user = {};
      }

      if (token && typeof token === 'object') {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.faculty = token.faculty;           // { id, name, code }
        session.user.departmentId = token.departmentId as string;
        session.user.advisorId = token.advisorId as string | null;
      }
      return session;
    },
  },
};

// If you want to import signIn/signOut/auth elsewhere:
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
