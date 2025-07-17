'use client';

import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/components/theme-provider';
import Sidebar from '@/components/layout/Sidebar';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="h-screen flex">
      <Sidebar />
      <main 
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-56'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AdminContent>
          {children}
        </AdminContent>
      </SidebarProvider>
    </ThemeProvider>
  );
} 