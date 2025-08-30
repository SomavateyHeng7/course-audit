'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  facultyId: string;
}

export default function AuthForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      // Fetch user session to get role information
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      // Redirect based on user role
      if (session?.user?.role === 'CHAIRPERSON') {
        router.push('/chairperson');
      } else {
        router.push('/home');
      }
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-background p-4">
      <div className="w-full max-w-lg bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden">
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #129990 0%, #0d9488 100%)' }}
        >
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Sign In</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Enter your email and password</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
            />
            {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <div className="text-center mt-4">
              <a
                href="/auth/forgot-password"
                className="text-gray-500 dark:text-gray-300 text-sm hover:text-gray-700 dark:hover:text-white underline cursor-pointer"
              >
                Forget Your Password?
              </a>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 rounded-lg py-3 text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
