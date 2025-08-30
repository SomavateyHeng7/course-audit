import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

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
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';

        if (!email || !password) throw new Error('Email and password are required');

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

        if (!user) throw new Error('No user found with this email');

        // PLAINTEXT compare (matches your seed)
        const isPasswordValid = user.password === password;
        if (!isPasswordValid) throw new Error('Invalid password');

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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.faculty = user.faculty;
        token.departmentId = user.departmentId;
        token.advisorId = user.advisorId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
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
