import { ThemeProvider } from '@/components/common/theme-provider';
import { CourseManagementProvider } from '../contexts/CourseManagementContext';

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CourseManagementProvider>
        {children}
      </CourseManagementProvider>
    </ThemeProvider>
  );
} 
