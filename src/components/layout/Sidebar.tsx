'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
  Menu,
  BookOpen,
  Settings,
  Book,
  Users,
  Building,
  GraduationCap,
  CalendarClock,
  UserCheck,
  Library,
  Folders,
} from 'lucide-react';
import Image from 'next/image';

// Default navigation for student users
const defaultNavigationItems = [
  {
    name: 'Course Management',
    href: '/student/management',
    icon: LayoutDashboard,
  },
  {
    name: 'Plan Future Courses',
    href: '/student/FutureCourses',
    icon: Library,
  },
  {
    name: 'Next Semester Course',
    href: '/student/SemesterCourse',
    icon: Book,
  },
  {
    name: 'All Curricula',
    href: '/student/allCurricula',
    icon: Folders,
  },
];

// Navigation for admin users
const adminNavigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'User Management',
    href: '/admin/user',
    icon: Users,
  },
  {
    name: 'Faculty Management',
    href: '/admin/faculty',
    icon: GraduationCap,
  },
  {
    name: 'Department Management',
    href: '/admin/department',
    icon: Building,
  }
];

// Navigation for chairperson users
const chairpersonNavigationItems = [
  {
    name: 'Manage Curriculum',
    href: '/chairperson',
    icon: BookOpen,
  },
  {
    name: 'Configuration',
    href: '/chairperson/info_config',
    icon: Settings,
  },
  {
    name: 'Tentative Schedule',
    href: '/chairperson/TentativeSchedule',
    icon: CalendarClock,
  },
  {
    name: 'Student',
    href: '/chairperson/StudentCheckList',
    icon: UserCheck,
  }
  
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { data: session } = useSession();

  // Determine navigation items based on user role
  const navigationItems = session?.user?.role === 'CHAIRPERSON' 
    ? chairpersonNavigationItems 
    : session?.user?.role === 'SUPER_ADMIN'
    ? adminNavigationItems
    : defaultNavigationItems;

  useEffect(() => {
    setMounted(true);
  }, []);
  const handleLogoError = () => {
    if (!logoError) {
      console.warn('Logo failed to load');
      setLogoError(true);
    }
  };

  const handleLogout = async () => {
    try {
      // For anonymous users (no session), just clear storage and redirect
      if (!session?.user) {
        // Clear any local/session storage for anonymous users
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to landing page
        window.location.href = '/';
        return;
      }
      
      // For authenticated users, use the full signOut process
      // Clear any local/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out with redirect to landing page
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect to landing page
      window.location.href = '/';
    }
  };

  if (!mounted) {
    return null;
  }  return (    <motion.div
      initial={{ width: 224 }}
      animate={{ width: isCollapsed ? 80 : 224 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-y-0 left-0 z-50 border-r border-teal-200/60 dark:border-teal-800/40 flex flex-col bg-white dark:bg-background backdrop-blur-sm"
    >{/* Header with Menu Toggle */}        <div className={cn(
          "py-5 border-b border-teal-200/60 dark:border-teal-800/40",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "flex-col gap-3" : "justify-between"
          )}>
            <AnimatePresence mode="wait">
              {!isCollapsed ? (                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}                  className="flex items-center gap-1 mr-8"
                >
                  {!logoError ? (
                    // Use Next.js Image component for logo
                    <Image
                      src="/image/logo.png"
                      alt="EduTrack Logo"
                      width={32}
                      height={32}
                      className="w-7 h-8 object-contain"
                      onError={handleLogoError}
                      priority
                    />
                  ) : (
                    <div className="w-7 h-8 bg-primary rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">E</span>
                    </div>
                  )}
                  <h1 className="text-xl font-bold text-primary">
                    EduTrack
                  </h1>
                </motion.div>
              ) : (                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}                  className="flex items-center justify-center"
                >
                  <img
                    src="/image/logo.png"
                    alt="EduTrack Logo"
                    width={32}
                    height={32}
                    className="w-7 h-8 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      // Prevent infinite fallback loops
                      if (!target.dataset.fallbackAttempted) {
                        target.dataset.fallbackAttempted = 'true';
                        target.src = '/next.svg';
                      } else {
                        // Hide the image if fallback also fails
                        target.style.display = 'none';
                      }
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>       
        {/* Profile Section */}
        <div className="px-3 py-4 border-b border-teal-200/60 dark:border-teal-800/40">
          <div className="bg-teal-100/50 dark:bg-teal-900/30 rounded-lg p-3 border border-teal-200/40 dark:border-teal-800/30">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 rounded-full flex items-center justify-center mb-2 ring-2 ring-teal-200/60 dark:ring-teal-800/60">
                <User className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-primary dark:text-primary text-center"
                  >
                    {session?.user?.name || 'User'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Theme Toggle */}
        <div className="px-3 py-2 border-b border-teal-200/60 dark:border-teal-800/40">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              // More precise active state logic for all routes
              const isActive = item.href === '/admin'
                ? pathname === '/admin'  // Exact match for admin dashboard
                : item.href === '/chairperson' 
                ? pathname === '/chairperson'  // Exact match for main chairperson page
                : pathname.startsWith(item.href);
              const Icon = item.icon;if (isCollapsed) {
                return (
                  <Link key={item.name} href={item.href} className="block w-full">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-3 py-2 transition-all duration-200",
                        isActive 
                          ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" 
                          : "text-black dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20"
                      )}
                      title={item.name}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </Button>
                  </Link>
                );
              }              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2 transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm font-medium" 
                        : "text-black dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <motion.span
                      initial={{ opacity: 1, x: 0 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>        
        {/* Logout/Clear Data Button */}       
        <div className="p-4 border-t mt-auto">
          {isCollapsed ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-center px-3 py-2 text-muted-foreground hover:bg-red-100/60 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
              title={session?.user ? "Log Out" : "Clear Data"}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:bg-red-100/60 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 px-3 py-2 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <motion.span
                initial={{ opacity: 1, x: 0 }}
              >
                {session?.user ? "Log Out" : "Clear Data"}
              </motion.span>
            </Button>          )}
        </div>
      </motion.div>
  );
}
 