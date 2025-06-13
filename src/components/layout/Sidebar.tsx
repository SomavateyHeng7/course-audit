'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
  Menu,
} from 'lucide-react';

const navigationItems = [
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({
        redirect: false,
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!mounted) {
    return null;
  }
  return (
    <TooltipProvider>
      <motion.div
        initial={{ width: 224 }}
        animate={{ width: isCollapsed ? 80 : 224 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-50 bg-background border-r flex flex-col"
      >        {/* Header with Menu Toggle */}
        <div className={cn(
          "py-5 border-b",
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
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1 mr-8"
                >
                  <Image
                    src='/image/logo.png'
                    alt="EduTrack Logo"
                    width={32}
                    height={32}
                    className="w-7 h-8"
                    priority
                  />
                  <h1 className="text-xl font-bold" style={{ color: '#489581' }}>
                    EduTrack
                  </h1>
                </motion.div>
              ) : (                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Image
                    src='/image/logo.png'
                    alt="EduTrack Logo"
                    width={32}
                    height={32}
                    className="w-7 h-8"
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-muted"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>        {/* Profile Section */}
        <div className="px-3 py-4 border-b">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-2 ring-1 ring-border">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium"
                  >
                    NICKNAME
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-b">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              
              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-center px-3 py-2",
                          isActive && "bg-muted font-medium"
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2",
                    isActive && "bg-muted font-medium"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <motion.span
                      initial={{ opacity: 1, x: 0 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t mt-auto">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-center px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Log Out
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-3 py-2"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <motion.span
                initial={{ opacity: 1, x: 0 }}
              >
                Log Out
              </motion.span>
            </Button>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
 