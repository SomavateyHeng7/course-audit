'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SanctumAuthContext';

interface NotificationPreferencesProps {
  departmentId?: string;
  curriculumId?: string;
}

export function NotificationPreferences({
  departmentId,
  curriculumId,
}: NotificationPreferencesProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [lastNotifiedAt, setLastNotifiedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const deptId = departmentId || user?.department_id;

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchStatus();
    }
  }, [user, deptId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/schedule-notifications/status${
          deptId ? `?department_id=${deptId}` : ''
        }`,
        {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubscribed(data.subscribed || false);
        setEmail(data.email || user?.email || '');
        setLastNotifiedAt(data.notification?.last_notified_at || null);
      }
    } catch (err) {
      console.error('Failed to fetch notification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/schedule-notifications/subscribe`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email,
            department_id: deptId,
            curriculum_id: curriculumId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to subscribe');
      }

      setSubscribed(true);
      setMessage({ type: 'success', text: data.message || 'Successfully subscribed to notifications!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to subscribe. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/schedule-notifications/unsubscribe${
          deptId ? `?department_id=${deptId}` : ''
        }`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to unsubscribe');
      }

      setSubscribed(false);
      setMessage({ type: 'success', text: 'Successfully unsubscribed from notifications.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to unsubscribe. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading your notification settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive updates about schedules and curriculum changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {subscribed ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {subscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscribed
                  ? 'You will receive email updates'
                  : 'Subscribe to receive email updates'}
              </p>
            </div>
          </div>
          <Badge variant={subscribed ? 'default' : 'secondary'}>
            {subscribed ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}
            className={message.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="notification-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="notification-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={saving}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Notifications will be sent to this email address
          </p>
        </div>

        {lastNotifiedAt && (
          <div className="text-sm text-muted-foreground">
            Last notification: {new Date(lastNotifiedAt).toLocaleString()}
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
          <p className="font-medium">You'll be notified about:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>New tentative schedules published by chairperson</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Curriculum updates and new versions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Important course scheduling changes</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-2">
          {subscribed ? (
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Unsubscribe
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={saving || !email}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe to Notifications
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
