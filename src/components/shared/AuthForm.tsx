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
  // Allow toggling between login and signup
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('/api/faculties');
        if (!response.ok) throw new Error('Failed to fetch faculties');
        const data = await response.json();
        setFaculties(data.faculties);
      } catch (err) {
        console.error(err);
        setError('Unable to load faculties. Please try again later.');
      }
    };
    fetchFaculties();
  }, []);

  // Fetch departments when faculty is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedFaculty) {
        setDepartments([]);
        setSelectedDepartment('');
        return;
      }

      try {
        const response = await fetch(`/api/departments?facultyId=${selectedFaculty}`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        setDepartments(data.departments || []);
        setSelectedDepartment(''); // Reset department selection when faculty changes
      } catch (err) {
        console.error(err);
        setError('Unable to load departments. Please try again later.');
      }
    };
    fetchDepartments();
  }, [selectedFaculty]);
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
    <div className="h-screen flex items-center justify-center bg-white dark:bg-background p-4">

      {/* Mobile Layout: Only Sign In */}
      <div className="block sm:hidden w-full max-w-lg">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden">
          <div
            className="w-full h-32 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #129990 0%, #0d9488 100%)' }}
          >
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
            </div>
          </div>
          <div className="p-6">
            {isLogin ? (
              <div>
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
                      Forget Your Password?
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
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Create Account</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Enter your details to sign up</p>
                <form onSubmit={handleSignup} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    required
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                  />
                  <select
                    name="facultyId"
                    required
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
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
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                  />
                  {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 rounded-lg py-3 text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isLoading ? 'Creating account...' : 'SIGN UP'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - Full viewport responsive */}
      <div className="hidden sm:block w-full max-w-7xl h-[65vh] max-h-[450px] min-h-[380px] rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border overflow-hidden relative">
        {/* Gradient Side Panel ONLY */}
        <div
          className={`absolute top-0 w-1/2 h-full rounded-xl transition-all duration-1000 ease-in-out z-10 ${
            isLogin ? 'right-0 rounded-l-none' : 'left-0 rounded-r-none'
          }`}
          style={{
            background: 'linear-gradient(135deg, #129990 0%, #0d9488 100%)',
          }}
        >
          <div className="flex flex-col justify-center items-center h-full text-white p-8">
            {isLogin ? (
              <div className="text-center transition-all duration-700 delay-300">
                <h2 className="text-3xl font-bold mb-4 animate-pulse">Welcome!</h2>
                <p className="text-base mb-6 opacity-90 max-w-xs">Enter your info to sign up</p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="border-2 border-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-white hover:text-[#129990] transition-all duration-500 hover:scale-105 hover:shadow-xl transform hover:-translate-y-1"
                >
                  SIGN UP
                </button>
              </div>
            ) : (
              <div className="text-center transition-all duration-700 delay-300">
                <h2 className="text-3xl font-bold mb-4 animate-pulse">Welcome Back!</h2>
                <p className="text-base mb-6 opacity-90 max-w-xs">Please login to your account</p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="border-2 border-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-white hover:text-[#129990] transition-all duration-500 hover:scale-105 hover:shadow-xl transform hover:-translate-y-1"
                >
                  SIGN IN
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex relative z-0 h-full">
          {/* Sign In Form */}
          <div
            className={`flex-1 p-8 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-white dark:bg-card ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 -translate-x-8'
            }`}
          >
            <div className="max-w-xs mx-auto w-full">
              <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">Sign In</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Enter your email and password</p>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />

                {error && <div className="text-red-600 dark:text-red-400 text-xs">{error}</div>}

                <div className="text-center mt-3">
                  <button type="button" className="text-gray-500 dark:text-gray-300 text-xs hover:text-gray-700 dark:hover:text-white">
                    Forget Your Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 rounded-lg py-2.5 text-sm text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {isLoading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
            </div>
          </div>

          {/* Sign Up Form */}
          <div
            className={`flex-1 p-8 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-white dark:bg-card ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-8'
            }`}
          >
            <div className="max-w-xs mx-auto w-full">
              <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">Create Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Enter your details to sign up</p>

              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />
                <select
                  name="facultyId"
                  required
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
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
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
                />

                {error && <div className="text-red-600 dark:text-red-400 text-xs">{error}</div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 rounded-lg py-2.5 text-sm text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
