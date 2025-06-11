'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Management',
    href: '/management',
    icon: LayoutDashboard,
  },
  {
    name: 'Advising',
    href: '/advising',
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-56 bg-background border-r">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src='/image/title.png'
                alt="EduTrack Logo"
                width={64}
                height={32}
                className="w-20 h-8"
                priority
              />
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-3 py-4 border-b">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center mb-2 ring-1 ring-border">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">NICKNAME</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-muted font-medium"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
 