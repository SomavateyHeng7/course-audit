'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { NotificationSubscribeDialog } from './NotificationSubscribeDialog';

interface NotificationPromptBannerProps {
  departmentId?: string;
  curriculumId?: string;
  isAuthenticated?: boolean;
  storageKey?: string;
}

export function NotificationPromptBanner({
  departmentId,
  curriculumId,
  isAuthenticated = false,
  storageKey = 'notification-prompt-dismissed',
}: NotificationPromptBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(storageKey, 'true');
  };

  const handleSubscribe = () => {
    setShowDialog(true);
  };

  if (!showBanner) return null;

  return (
    <>
      <Alert className="relative border-blue-200 bg-blue-50 dark:bg-blue-900/20 mb-6">
        <div className="flex items-start gap-3 pr-8">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Stay Updated!</p>
              <p className="text-sm mb-3">
                Get notified when new schedules or curriculum versions are uploaded by the chairperson.
              </p>
              <Button
                size="sm"
                onClick={handleSubscribe}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                Subscribe to Notifications
              </Button>
            </AlertDescription>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </Alert>

      <NotificationSubscribeDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        departmentId={departmentId}
        curriculumId={curriculumId}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
