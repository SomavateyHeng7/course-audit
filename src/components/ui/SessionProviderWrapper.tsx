'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CourseManagementProvider } from '@/app/contexts/CourseManagementContext';
import Sidebar from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  console.log(pathname)
  const isPageRoute = pathname === '/';

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CourseManagementProvider>
        {isPageRoute ? (
          <div className="min-h-screen">
            {children}
          </div>
        ) : (
          <div className="relative min-h-screen">
            <Sidebar />
            <main className="pl-56">
              <div className="container py-4">
                {children}
              </div>
            </main>
          </div>
        )}
      </CourseManagementProvider>
    </ThemeProvider>
  );
} 