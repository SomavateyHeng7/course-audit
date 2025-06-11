'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/theme-provider';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show sidebar on the main auth page
  const isAuthPage = pathname === '/';
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {isAuthPage ? (
        <>{children}</>
      ) : (
        <div className="h-screen flex">
          <Sidebar />
          <main className="flex-1 ml-56 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}
