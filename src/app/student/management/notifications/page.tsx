'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationPreferences } from '@/components/features/notifications/NotificationPreferences';

export default function NotificationSettingsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how you receive updates about course schedules and curriculum changes
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
