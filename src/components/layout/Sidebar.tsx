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
} from 'lucide-react';

// Default navigation for non-chairperson users
const defaultNavigationItems = [
  {
    name: 'Management',
    href: '/management',
    icon: LayoutDashboard,
  },
  {
    name: 'Advising',
    href: '/advisor/advising',
    icon: MessageSquare,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
];

// Navigation for chairperson users
const chairpersonNavigationItems = [
  {
    name: 'Curriculum',
    href: '/chairperson',
    icon: BookOpen,
  },
  {
    name: 'Config',
    href: '/chairperson/info_config',
    icon: Settings,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
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
      className="fixed inset-y-0 left-0 z-50 border-r border-emerald-200/60 dark:border-emerald-800/40 flex flex-col bg-white dark:bg-background backdrop-blur-sm"
    >{/* Header with Menu Toggle */}        <div className={cn(
          "py-5 border-b border-emerald-200/60 dark:border-emerald-800/40",
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
                    <img
                      src="/image/logo.png"
                      alt="EduTrack Logo"
                      width={32}
                      height={32}
                      className="w-7 h-8 object-contain"
                      onError={handleLogoError}
                    />
                  ) : (
                    <div className="w-7 h-8 bg-emerald-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">E</span>
                    </div>
                  )}
                  <h1 className="text-xl font-bold" style={{ color: '#489581' }}>
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
                className="p-2 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>        {/* Profile Section */}
        <div className="px-3 py-4 border-b border-emerald-200/60 dark:border-emerald-800/40">
          <div className="bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-200/40 dark:border-emerald-800/30">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-2 ring-2 ring-emerald-200/60 dark:ring-emerald-800/60">
                <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-emerald-800 dark:text-emerald-200 text-center"
                  >
                    {session?.user?.name || 'User'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>{/* Theme Toggle */}
        <div className="px-3 py-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              // Special handling for chairperson curriculum route
              const isActive = item.href === '/chairperson/curriculum' 
                ? pathname.startsWith('/chairperson/curriculum')
                : pathname.startsWith(item.href);
              const Icon = item.icon;if (isCollapsed) {
                return (
                  <Link key={item.name} href={item.href} className="block w-full">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-center px-3 py-2 transition-all duration-200",
                        isActive 
                          ? "bg-emerald-100/70 dark:bg-emerald-900/30 text-black dark:text-white shadow-sm" 
                          : "text-black dark:text-white hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
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
                        ? "bg-emerald-100/70 dark:bg-emerald-900/30 text-black dark:text-white shadow-sm font-medium" 
                        : "text-black dark:text-white hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
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
        </nav>        {/* Logout Button */}        <div className="p-4 border-t mt-auto">
          {isCollapsed ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-center px-3 py-2 text-muted-foreground hover:bg-red-100/60 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
              title="Log Out"
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
                Log Out
              </motion.span>
            </Button>          )}
        </div>
      </motion.div>
  );
}
 