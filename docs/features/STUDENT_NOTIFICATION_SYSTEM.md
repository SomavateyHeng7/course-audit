# Student Notification System Implementation

## Overview
This document describes the implementation of a notification system that alerts students when chairpersons upload new versions of schedules or curricula. The system supports both authenticated and guest (free) users.

## Features

### 1. **For Guest/Free Users**
- Email subscription dialog when viewing schedules or curricula
- Persistent notification banner (dismissible, stored in localStorage)
- No login required to subscribe
- Email-only tracking for notifications

### 2. **For Authenticated Students**
- Full notification preferences page
- Linked from student sidebar navigation
- Email management and subscription status
- View last notification timestamp
- Subscribe/unsubscribe functionality

### 3. **Automatic Notifications**
- Triggered when chairperson publishes a tentative schedule
- Triggered when chairperson uploads curriculum courses
- Department-specific and curriculum-specific filtering
- Email notifications sent to all subscribed users

---

## Backend Implementation

### Database Schema

#### Migration: `2026_02_11_000001_update_schedule_notifications_for_guests.php`

Updates the `schedule_notifications` table to support:
- **Nullable `user_id`**: Allows guest user subscriptions
- **`curriculum_id`**: Optional curriculum-specific subscriptions
- **Email indexing**: For efficient guest user lookups
- **Composite indexing**: For department/curriculum filtering

### API Endpoints

#### 1. **Public Subscription** (No Authentication Required)
```
POST /api/schedule-notifications/subscribe
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "department_id": "uuid-here",
  "curriculum_id": "uuid-here"  // optional
}
```

**Response:**
```json
{
  "message": "Successfully subscribed to schedule notifications! You will receive updates when new versions are uploaded.",
  "notification": {
    "id": "uuid",
    "email": "student@example.com",
    "is_active": true,
    "is_guest": true
  }
}
```

#### 2. **Unsubscribe** (Requires Authentication)
```
POST /api/schedule-notifications/unsubscribe
```

**Query Parameters:**
- `department_id` (optional): Specific department to unsubscribe from

**Response:**
```json
{
  "message": "Successfully unsubscribed from schedule notifications"
}
```

#### 3. **Check Status** (Requires Authentication)
```
GET /api/schedule-notifications/status?department_id=uuid
```

**Response:**
```json
{
  "subscribed": true,
  "email": "student@example.com",
  "notification": {
    "id": "uuid",
    "email": "student@example.com",
    "is_active": true,
    "last_notified_at": "2026-02-11T10:30:00Z"
  }
}
```

### Controller Methods

#### `ScheduleNotificationController`

**`subscribe(Request $request)`**
- Supports both authenticated and guest users
- Creates or updates subscription by user_id OR email
- Validates email format

**`notifySubscribers(TentativeSchedule $schedule)`**
- Automatically called when schedule is published
- Filters by department_id
- Only notifies active subscriptions
- Updates `last_notified_at` timestamp

**`notifyCurriculumSubscribers(Curriculum $curriculum, string $action)`**
- Called when curriculum is uploaded/updated
- Filters by department_id OR curriculum_id
- Tracks action type ('uploaded' or 'updated')

### Trigger Points

#### 1. **Tentative Schedule Publication**
Location: `TentativeScheduleController::togglePublish()`

```php
// Notify subscribers if publishing
if ($schedule->is_published && $schedule->is_active) {
    ScheduleNotificationController::notifySubscribers($schedule);
}
```

#### 2. **Curriculum Upload**
Location: `CurriculumController::upload()`

```php
// Notify subscribers about curriculum update
$curriculum = Curriculum::find($curriculumId);
if ($curriculum) {
    ScheduleNotificationController::notifyCurriculumSubscribers($curriculum, 'uploaded');
}
```

---

## Frontend Implementation

### Components

#### 1. **NotificationSubscribeDialog**
Location: `/src/components/features/notifications/NotificationSubscribeDialog.tsx`

**Purpose**: Modal dialog for subscribing to notifications

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Handle open/close
- `departmentId?: string` - Optional department filter
- `curriculumId?: string` - Optional curriculum filter
- `isAuthenticated?: boolean` - Shows different UI for auth/guest users

**Features:**
- Email input with validation
- Success/error messaging
- Information about what users will receive
- Loading states

**Usage:**
```tsx
<NotificationSubscribeDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  departmentId="dept-uuid"
  isAuthenticated={false}
/>
```

#### 2. **NotificationPromptBanner**
Location: `/src/components/features/notifications/NotificationPromptBanner.tsx`

**Purpose**: Dismissible banner that prompts users to subscribe

**Props:**
- `departmentId?: string` - Optional department filter
- `curriculumId?: string` - Optional curriculum filter
- `isAuthenticated?: boolean` - Display context
- `storageKey?: string` - LocalStorage key for dismissal state

**Features:**
- Auto-displays after 2-second delay
- Dismissible (stores in localStorage)
- Opens subscription dialog on click
- Responsive design

**Usage:**
```tsx
<NotificationPromptBanner
  departmentId={selectedDepartment}
  isAuthenticated={false}
  storageKey="sbase-notification-prompt-dismissed"
/>
```

#### 3. **NotificationPreferences**
Location: `/src/components/features/notifications/NotificationPreferences.tsx`

**Purpose**: Full preferences management for authenticated users

**Props:**
- `departmentId?: string` - Optional department filter
- `curriculumId?: string` - Optional curriculum filter

**Features:**
- View subscription status
- Update email address
- Subscribe/unsubscribe buttons
- View last notification timestamp
- Status badges
- Information about notification types

**Usage:**
```tsx
<NotificationPreferences
  departmentId={user?.department_id}
/>
```

### Pages

#### 1. **Notification Settings Page**
Location: `/src/app/student/management/notifications/page.tsx`

**Purpose**: Dedicated page for managing notification preferences

**Features:**
- Back navigation button
- Page header with description
- Embedded NotificationPreferences component
- Authenticated user only

**Route:** `/student/management/notifications`

#### 2. **Free Student Homepage (sbase)**
Location: `/src/app/sbase/page.tsx`

**Changes:**
- Added `NotificationPromptBanner` after header
- Banner shows to unauthenticated users
- Department context passed when available

### Navigation

#### Student Sidebar
Location: `/src/components/common/layout/Sidebar.tsx`

**Added:**
```tsx
{
  name: 'Notifications',
  href: '/student/management/notifications',
  icon: Bell,
}
```

Now appears in student navigation menu between "Graduation Portal" and logout.

---

## User Flows

### Flow 1: Guest User Subscribes

1. Guest visits `/sbase` (free student page)
2. After 2 seconds, notification banner appears
3. Guest clicks "Subscribe to Notifications"
4. Dialog opens with email input
5. Guest enters email and clicks "Subscribe"
6. Success message shows
7. Guest is now subscribed (no login required)
8. **Result**: Guest will receive email when schedules/curricula are updated

### Flow 2: Authenticated Student Manages Notifications

1. Student logs in and navigates to student portal
2. Clicks "Notifications" in sidebar
3. Views current subscription status
4. Updates email if needed
5. Clicks "Subscribe" or "Unsubscribe"
6. Status updates immediately
7. **Result**: Student manages their notification preferences

### Flow 3: Chairperson Publishes Schedule

1. Chairperson creates/edits tentative schedule
2. Chairperson clicks "Publish" button
3. **Automatic backend process**:
   - Schedule status changes to published
   - `ScheduleNotificationController::notifySubscribers()` is called
   - System finds all subscribed users for that department
   - Email notifications are queued/sent
   - `last_notified_at` timestamp is updated
4. **Result**: All subscribed students receive email notification

### Flow 4: Chairperson Uploads Curriculum

1. Chairperson navigates to curriculum management
2. Uploads CSV file with course list
3. Curriculum is processed and saved
4. **Automatic backend process**:
   - `ScheduleNotificationController::notifyCurriculumSubscribers()` is called
   - System finds subscribers by department OR curriculum ID
   - Email notifications are queued/sent
   - `last_notified_at` timestamp is updated
5. **Result**: Relevant students receive email notification

---

## Email Notification Content (To Be Implemented)

Currently, the system logs notifications but doesn't send actual emails. To implement email sending:

### Required Laravel Mail Setup

1. **Configure `.env`:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@courseaudit.edu
MAIL_FROM_NAME="Course Audit System"
```

2. **Create Mail Classes:**

```php
// app/Mail/ScheduleUpdatedMail.php
class ScheduleUpdatedMail extends Mailable
{
    public function __construct(
        public TentativeSchedule $schedule
    ) {}

    public function build()
    {
        return $this->subject('New Schedule Published: ' . $this->schedule->name)
            ->markdown('emails.schedule-updated');
    }
}

// app/Mail/CurriculumUpdatedMail.php
class CurriculumUpdatedMail extends Mailable
{
    public function __construct(
        public Curriculum $curriculum,
        public string $action
    ) {}

    public function build()
    {
        return $this->subject('Curriculum Updated: ' . $this->curriculum->name)
            ->markdown('emails.curriculum-updated');
    }
}
```

3. **Uncomment email sending in controller:**

```php
// In ScheduleNotificationController
Mail::to($subscriber->email)->send(new ScheduleUpdatedMail($schedule));
Mail::to($subscriber->email)->send(new CurriculumUpdatedMail($curriculum, $action));
```

---

## Testing

### Backend Testing

#### 1. Run Database Migration
```bash
cd edutrack-backend
php artisan migrate
```

#### 2. Test Guest Subscription
```bash
curl -X POST http://localhost:8000/api/schedule-notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "department_id": "dept-uuid-here"
  }'
```

#### 3. Test Authenticated Subscription
```bash
# First login to get session
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "password"}' \
  -c cookies.txt

# Then subscribe
curl -X POST http://localhost:8000/api/schedule-notifications/subscribe \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "student@example.com",
    "department_id": "dept-uuid-here"
  }'
```

### Frontend Testing

#### 1. Test Guest Banner (Free Users)
1. Navigate to `http://localhost:3000/sbase`
2. Wait 2 seconds for banner to appear
3. Click "Subscribe to Notifications"
4. Enter email and submit
5. Verify success message
6. Dismiss banner and check localStorage

#### 2. Test Authenticated Preferences
1. Login as student
2. Navigate to `/student/management/notifications`
3. View current subscription status
4. Update email address
5. Click Subscribe/Unsubscribe
6. Verify status updates

#### 3. Test Notification Triggering
1. Login as chairperson
2. Navigate to tentative schedule management
3. Create or select a schedule
4. Click "Publish"
5. Check server logs for notification entries
6. Verify `last_notified_at` timestamp updated in database

---

## Database Queries

### Check All Subscriptions
```sql
SELECT * FROM schedule_notifications WHERE is_active = true;
```

### Check Guest Subscriptions
```sql
SELECT * FROM schedule_notifications WHERE user_id IS NULL AND is_active = true;
```

### Check Subscriptions for Department
```sql
SELECT * FROM schedule_notifications 
WHERE department_id = 'dept-uuid' 
AND is_active = true;
```

### Check Recent Notifications
```sql
SELECT email, last_notified_at 
FROM schedule_notifications 
WHERE last_notified_at IS NOT NULL 
ORDER BY last_notified_at DESC 
LIMIT 10;
```

---

## Security Considerations

1. **Email Validation**: All emails are validated before storage
2. **Rate Limiting**: Should be added to prevent spam subscriptions
3. **Unsubscribe Links**: Should be added to emails (not yet implemented)
4. **GDPR Compliance**: Guest emails should have retention policy
5. **Spam Protection**: Consider adding CAPTCHA to public subscribe endpoint

---

## Future Enhancements

1. **Email Templates**: Design beautiful HTML email templates
2. **Unsubscribe Links**: One-click unsubscribe from email
3. **Notification History**: Show users their notification history
4. **Multiple Departments**: Allow subscription to multiple departments
5. **Digest Mode**: Daily/weekly digest instead of immediate notifications
6. **In-App Notifications**: Show notifications in the app itself
7. **Push Notifications**: Browser push notifications
8. **SMS Notifications**: Optional SMS alerts
9. **Notification Preferences**: Granular control (schedules only, curricula only, etc.)
10. **Queue System**: Use Laravel queues for email sending

---

## File Structure

```
Backend:
├── app/
│   ├── Http/Controllers/API/Student/
│   │   └── ScheduleNotificationController.php         (Updated)
│   ├── Http/Controllers/API/Chairperson/
│   │   ├── TentativeScheduleController.php           (Trigger added)
│   │   └── CurriculumController.php                  (Trigger added)
│   └── Models/
│       └── ScheduleNotification.php                   (Updated)
├── database/migrations/
│   └── 2026_02_11_000001_update_schedule_notifications_for_guests.php
└── routes/
    └── api.php                                        (Public route added)

Frontend:
├── src/
│   ├── components/features/notifications/
│   │   ├── NotificationSubscribeDialog.tsx           (New)
│   │   ├── NotificationPromptBanner.tsx              (New)
│   │   ├── NotificationPreferences.tsx               (New)
│   │   └── index.ts                                  (New)
│   ├── components/common/layout/
│   │   └── Sidebar.tsx                                (Updated)
│   └── app/
│       ├── sbase/
│       │   └── page.tsx                               (Updated)
│       └── student/management/notifications/
│           └── page.tsx                               (New)
```

---

## Author Notes

Implementation Date: February 11, 2026

This notification system provides a complete solution for keeping students informed about schedule and curriculum updates. The system is designed to be:
- **User-friendly**: Simple subscription process for both guest and authenticated users
- **Extensible**: Easy to add new notification types
- **Scalable**: Database design supports efficient querying
- **Privacy-conscious**: Minimal data collection, clear purpose

Next steps should focus on implementing actual email sending with proper templates and adding more sophisticated notification preferences.
