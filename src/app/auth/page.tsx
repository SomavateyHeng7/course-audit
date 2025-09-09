import React from 'react';
import AuthForm from '@/components/shared/AuthForm';
import { ThemeProvider } from '@/components/theme-provider';

export default function AuthPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="h-screen flex items-center justify-center overflow-hidden">
        <AuthForm />
      </div>
    </ThemeProvider>
  );
}
