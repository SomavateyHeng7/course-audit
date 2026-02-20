'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, X, Clock } from 'lucide-react';
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
  const [showAll, setShowAll] = useState(false); // Track whether to show all notifications

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
      setShowAll(false); // Reset to show only top 3 when opening
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

    // Navigate to submission detail - must include portalId as query parameter
    // Check for both new_submission and submission_validated types
    const submissionId = notification.data?.submission_id;
    const portalId = notification.portal?.id;
    
    if (submissionId && portalId) {
      setIsOpen(false);
      router.push(`/chairperson/GraduationPortal/${submissionId}?portalId=${portalId}`);
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
          "w-full justify-start gap-3 px-3 py-2 transition-all duration-200 text-black dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20",
          isCollapsed && "justify-center",
          isOpen && "bg-primary/10 dark:bg-primary/20"
        )}
        title="Graduation Notifications"
      >
        <div className="relative flex-shrink-0">
          <Bell className="h-5 w-5" />
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm ring-2 ring-white dark:ring-gray-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="truncate">Notifications</span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={cn(
          "absolute z-[100] w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          isCollapsed ? "left-full ml-2 top-0" : "left-full ml-2 top-0"
        )}>
          {/* Header */}
          <div className= "flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-500/10 to-teal-600/10 dark:from-teal-500/20 dark:to-teal-600/20">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Graduation Submissions
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5 font-medium">
                  {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">{unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 px-2.5 py-1.5 h-auto rounded-md font-medium"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1.5 h-auto hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <div className="text-red-500 dark:text-red-400 mb-3">
                  <X className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">You'll see graduation submission updates here</p>
              </div>
            ) : (
              <>
                {/* Display notifications (top 3 or all based on showAll state) */}
                {(showAll ? notifications : notifications.slice(0, 3)).map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "relative px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-150 group",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/70",
                      !notification.read && "bg-teal-50/60 dark:bg-teal-900/20 border-l-4 border-l-teal-500"
                  )}
                >\n                  <div className="flex items-start gap-3 pr-8">
                    {/* Unread indicator */}
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 transition-all duration-200",
                      !notification.read ? "bg-teal-500 shadow-sm shadow-teal-500/50" : "bg-transparent"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(notification.created_at)}
                        </span>
                        {notification.portal && (
                          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                            {notification.portal.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="absolute top-3.5 right-3 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all duration-150"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ))}
              
              {/* Show More/Show Less button (Facebook-style) */}
              {notifications.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-3 text-center text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-150 border-t border-gray-100 dark:border-gray-800"
                >
                  {showAll ? (
                    <>Show Less</>
                  ) : (
                    <>Show {notifications.length - 3} More {notifications.length - 3 === 1 ? 'Notification' : 'Notifications'}</>
                  )}
                </button>
              )}
            </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/chairperson/GraduationPortal');
                }}
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 h-8 px-3 rounded-md font-medium"
              >
                View all portals
              </Button>
              {notifications.some(n => n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRead}
                  className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3 rounded-md"
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
