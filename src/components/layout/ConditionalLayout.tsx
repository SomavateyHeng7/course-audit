'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  // Don't show sidebar on the landing page and auth page
  const isLandingOrAuthPage = pathname === '/' || pathname === '/auth';
  
  if (isLandingOrAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex">
      <Sidebar />
      <main 
        className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isCollapsed ? '80px' : '224px'
        }}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}
