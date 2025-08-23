
'use client';
import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-background p-4">
      <div className="w-full max-w-md bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 text-center">Forgot Password</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Enter your email to receive a password reset link.</p>
        {submitted ? (
          <div className="text-green-600 dark:text-green-400 text-center mb-4">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 border border-gray-200 dark:border-gray-700"
            />
            {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full rounded-lg py-3 text-white font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
