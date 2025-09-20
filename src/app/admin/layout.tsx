import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/components/theme-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 