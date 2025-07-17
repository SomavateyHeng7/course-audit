'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
      } else if (session?.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/management');
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
      {/* Mobile Layout */}
      <div className="block sm:hidden w-full max-w-lg">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden">
          {/* Mobile Header */}
          <div
            className="w-full h-32 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #129990 0%, #0d9488 100%)',
            }}
          >
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-sm opacity-90">Sign in to your account</p>
            </div>
          </div>

          {/* Mobile Form */}
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
                <button type="button" className="text-gray-500 dark:text-gray-300 text-sm hover:text-gray-700 dark:hover:text-white">
                  Forgot Your Password?
                </button>
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

      {/* Desktop Layout */}
      <div className="hidden sm:block w-full max-w-4xl h-[65vh] max-h-[450px] min-h-[380px] rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border overflow-hidden relative">
        <div className="flex h-full">
          {/* Welcome Panel */}
          <div
            className="w-1/2 flex flex-col justify-center items-center text-white p-8"
            style={{
              background: 'linear-gradient(135deg, #129990 0%, #0d9488 100%)',
            }}
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Welcome to EduTrack!</h2>
              <p className="text-base opacity-90 max-w-xs">
                Your comprehensive academic management system
              </p>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="w-1/2 p-8 flex flex-col justify-center bg-white dark:bg-card">
            <div className="max-w-xs mx-auto w-full">
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Sign In</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Enter your credentials to access your account</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />

                {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

                <div className="text-center mt-4">
                  <button type="button" className="text-gray-500 dark:text-gray-300 text-sm hover:text-gray-700 dark:hover:text-white">
                    Forgot Your Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 rounded-lg py-3 text-sm text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {isLoading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
