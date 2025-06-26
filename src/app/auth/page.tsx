import React from 'react';
import AuthForm from '@/components/shared/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <AuthForm />
      </div>
    </div>
  );
}
