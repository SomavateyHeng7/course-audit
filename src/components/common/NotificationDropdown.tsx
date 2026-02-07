'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/common-utils';
import {
  getGraduationNotifications,
  getGraduationNotificationUnreadCount,
  markGraduationNotificationRead,
  markAllGraduationNotificationsRead,
  deleteGraduationNotification,
  clearReadGraduationNotifications,
  type GraduationNotification,
} from '@/lib/api/laravel';

// Format relative time (e.g., "2 minutes ago")
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface NotificationDropdownProps {
  className?: string;
  isCollapsed?: boolean;
}

export default function NotificationDropdown({ 
  className,
  isCollapsed = false 
}: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<GraduationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unread count (for badge polling)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { unread_count } = await getGraduationNotificationUnreadCount();
      setUnreadCount(unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Fetch full notifications list
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { notifications: data, total } = await getGraduationNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: GraduationNotification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await markGraduationNotificationRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Navigate to submission detail
    if (notification.type === 'new_submission' && notification.portal && notification.data.submission_id) {
      setIsOpen(false);
      router.push(`/chairperson/GraduationPortal/${notification.data.submission_id}`);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllGraduationNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteGraduationNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    try {
      await clearReadGraduationNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300",
          isCollapsed && "w-full justify-center"
        )}
        title="Graduation Notifications"
      >
        <Bell className="h-5 w-5" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={cn(
          "absolute z-[100] mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
          "left-0"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Graduation Submissions
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 px-2 py-1 h-auto"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Loading...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 text-sm">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "relative p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    !notification.read && "bg-teal-50/50 dark:bg-teal-900/20"
                  )}
                >
                  <div className="flex items-start gap-3 pr-6">
                    {/* Unread indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      !notification.read ? "bg-teal-500" : "bg-transparent"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                        {notification.portal && (
                          <span className="text-xs text-teal-600 dark:text-teal-400 truncate">
                            • {notification.portal.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="absolute top-3 right-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/chairperson/GraduationPortal');
                }}
                className="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400"
              >
                View all portals
              </Button>
              {notifications.some(n => n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRead}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Clear read
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
