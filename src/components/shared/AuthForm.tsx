'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Faculty {
  id: string;
  name: string;
  code: string;
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('/api/faculties');
        if (!response.ok) throw new Error('Failed to fetch faculties');
        const data = await response.json();
        setFaculties(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load faculties. Please try again later.');
      }
    };
    fetchFaculties();
  }, []);
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

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      facultyId: formData.get('facultyId') as string,
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Signup failed');

      setIsLogin(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background p-4">
      <div className="w-full max-w-6xl h-[500px] rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border overflow-hidden relative">
        {/* ✅ Gradient Side Panel ONLY */}
        <div
          className={`absolute top-0 w-1/2 h-full rounded-xl transition-all duration-1000 ease-in-out z-10 ${
            isLogin ? 'right-0 rounded-l-none' : 'left-0 rounded-r-none'
          }`}
          style={{
            background: 'linear-gradient(135deg, #4C9A8A 0%, #34786A 100%)',
          }}
        >
          <div className="flex flex-col justify-center items-center h-full text-white p-12">
            {isLogin ? (
              <div className="text-center transition-all duration-700 delay-300">
                <h2 className="text-4xl font-bold mb-6 animate-pulse">Welcome!</h2>
                <p className="text-lg mb-8 opacity-90 max-w-xs">Enter your info to sign up</p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="border-2 border-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-[#4C9A8A] transition-all duration-500 hover:scale-110 hover:shadow-2xl transform hover:-translate-y-1"
                >
                  SIGN UP
                </button>
              </div>
            ) : (
              <div className="text-center transition-all duration-700 delay-300">
                <h2 className="text-4xl font-bold mb-6 animate-pulse">Welcome Back!</h2>
                <p className="text-lg mb-8 opacity-90 max-w-xs">Please login to your account</p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="border-2 border-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-[#4C9A8A] transition-all duration-500 hover:scale-110 hover:shadow-2xl transform hover:-translate-y-1"
                >
                  SIGN IN
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex relative z-0 h-full">          {/* Sign In Form */}
          <div
            className={`flex-1 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-white dark:bg-card ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 -translate-x-8'
            }`}
          >
            <div className="max-w-sm mx-auto w-full">
              <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-foreground">Sign In</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your email and password</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700"
                />

                {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}

                <div className="text-center mt-6">
                  <button type="button" className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300">
                    Forget Your Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-8 rounded-lg py-3 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-all border border-emerald-700 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
            </div>
          </div>

          {/* Sign Up Form */}
          <div
            className={`flex-1 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-white dark:bg-card ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-8'
            }`}
          >
            <div className="max-w-sm mx-auto w-full">
              <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-foreground">Create Account</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your details to sign up</p>

              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700"
                />
                <select
                  name="facultyId"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                >
                  <option value="" className="text-gray-500 dark:text-gray-400">Select Faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id} className="text-gray-900 dark:text-white">
                      {faculty.name}
                    </option>
                  ))}
                </select>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700"
                />

                {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-8 rounded-lg py-3 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-all border border-emerald-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'SIGN UP'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
