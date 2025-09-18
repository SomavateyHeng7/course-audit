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
  const [showPassword, setShowPassword] = useState(false);
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
        router.push('/admin');
      }
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-background px-4 py-8">
      <div className="w-full min-w-[500px] max-w-2xl bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden">
        <div className="w-full h-32 flex items-center justify-center bg-primary">
          <div className="text-center text-primary-foreground">
            <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
          </div>
        </div>
        <div className="p-8">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
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