'use client';

import { ThemeProvider } from '@/components/common/theme-provider';
import { CourseManagementProvider } from '@/app/contexts/CourseManagementContext';
import Sidebar from '@/components/common/layout/Sidebar';
import { usePathname } from 'next/navigation';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPageRoute = pathname === '/';

  return (    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
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