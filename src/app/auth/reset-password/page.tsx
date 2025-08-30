'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/auth'), 2000);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-background p-4">
      <div className="w-full max-w-md bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 text-center">Reset Password</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Enter your new password below.</p>
        {success ? (
          <div className="text-green-600 dark:text-green-400 text-center mb-4">
            Password reset successful! Redirecting to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
            />
            {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>

  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
