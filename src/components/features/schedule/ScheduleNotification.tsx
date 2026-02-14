'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Mail } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';

interface ScheduleNotificationProps {
  departmentId?: string;
}

export function ScheduleNotification({ departmentId }: ScheduleNotificationProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [departmentId]);

  const checkSubscriptionStatus = async () => {
    try {
      setChecking(true);
      const params = departmentId ? `?department_id=${departmentId}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/schedule-notifications/status${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.subscribed);
        if (data.email) {
          setEmail(data.email);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      showError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/schedule-notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ 
          email,
          department_id: departmentId 
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        success('Successfully subscribed to schedule notifications!');
      } else {
        const error = await response.json();
        showError(error.error?.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showError('Failed to subscribe to notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/schedule-notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ department_id: departmentId }),
      });

      if (response.ok) {
        setIsSubscribed(false);
        success('Successfully unsubscribed from schedule notifications');
      } else {
        const error = await response.json();
        showError(error.error?.message || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      showError('Failed to unsubscribe from notifications');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading notification settings...</span>
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
          Schedule Update Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubscribed ? (
          <>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Get notified via email when the tentative schedule is updated
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="notification-email">Email Address</Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleSubscribe}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe to Notifications
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                You're subscribed to schedule updates at <strong>{email}</strong>
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Unsubscribing...
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Unsubscribe
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
