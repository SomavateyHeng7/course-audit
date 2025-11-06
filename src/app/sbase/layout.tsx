import { ThemeProvider } from '@/components/common/theme-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  GraduationCap, 
  Building2, 
  LogIn 
} from 'lucide-react';

export default function StudentLayout({
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
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#1F3A93]" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduTrack
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/student">
                <Button variant="ghost" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Courses
                </Button>
              </Link>
              <Link href="/student">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Curricula
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-[#1F3A93] hover:bg-[#1F3A93]/90 flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </ThemeProvider>
  );
} 