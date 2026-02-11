# Student Schedule Planning Feature - Implementation Summary

## Overview
Implemented comprehensive student-side tentative schedule planning with calendar view, schedule combinations, and notification system.

## Key Features Implemented

### 1. Active Schedule Per Department (Backend)
**Database Changes:**
- Migration: `2026_02_02_000001_add_is_active_to_tentative_schedules.php`
  - Added `is_active` boolean field to `tentative_schedules` table
  - Ensures only one active schedule per department for student view

**Backend Changes:**
- Updated `TentativeSchedule` model to include `is_active` field
- Added `toggleActive()` method in `TentativeScheduleController`
  - Automatically deactivates other schedules in the same department
  - Notifies subscribers when a schedule becomes active
- Added route: `POST /api/tentative-schedules/{id}/toggle-active`

### 2. Notification System
**Database Changes:**
- Migration: `2026_02_02_000002_create_schedule_notifications_table.php`
  - New `schedule_notifications` table for email subscription tracking
  - Stores user email preferences per department

**Backend Changes:**
- Created `ScheduleNotification` model
- Created `ScheduleNotificationController` with endpoints:
  - `POST /api/schedule-notifications/subscribe` - Subscribe to notifications
  - `POST /api/schedule-notifications/unsubscribe` - Unsubscribe
  - `GET /api/schedule-notifications/status` - Check subscription status
- Added `notifySubscribers()` static method for sending notifications

### 3. Student Calendar View (Frontend)
**New Components:**
- `ScheduleCalendarView.tsx` - Weekly calendar grid showing course schedules
  - Visual time-slot based display
  - Color-coded courses
  - Interactive course selection
  - Responsive design for mobile and desktop

**Features:**
- 8:00 AM - 8:00 PM time slots
- Monday-Saturday view
- Automatic conflict highlighting
- Course legend with credits display

### 4. Schedule Notification Component (Frontend)
**New Component:**
- `ScheduleNotification.tsx` - Email subscription management
  - Subscribe/unsubscribe to schedule updates
  - Shows current subscription status
  - Per-department notification preferences

### 5. Student Schedule Planning Page (Frontend)
**New Page:** `/student/schedule-planning/page.tsx`

**Flow:**
1. Displays active schedule for student's department
2. Student selects courses they want to take
3. System generates all possible schedule combinations
4. Automatically detects time conflicts
5. Shows calendar view for selected combination
6. Option to subscribe to schedule updates

**Features:**
- Active schedule display
- Course selection interface
- Schedule combination generator (up to 20 combinations)
- Conflict detection algorithm
- Calendar visualization
- Notification subscription
- Proceed to course registration

### 6. Chairperson UI Updates
**Updated:** `/chairperson/TentativeSchedule/page.tsx`

**New Features:**
- "Active" badge on active schedules
- "Set Active" / "Active" toggle button
- Confirmation dialog explaining one-active-per-department constraint
- Visual distinction between published and active schedules

### 7. API & Type Updates
**Updated:** `src/lib/api/laravel.ts`
- Added `isActive` field to `TentativeSchedule` interface
- Added `toggleActiveTentativeSchedule()` function
- Updated type definitions for new fields

## Technical Details

### Conflict Detection Algorithm
```typescript
- Parses course time slots (days, start time, end time)
- Compares all course pairs for:
  - Shared days (e.g., both on Monday)
  - Time overlap using minute-based comparison
- Returns conflicts array with detailed messages
```

### Schedule Combination Generation
```typescript
- Uses cartesian product of course sections
- Generates all possible schedule permutations
- Limits to 20 combinations for performance
- Sorts conflict-free schedules first
```

### Database Constraints
- Active schedule constraint enforced at application level
- Unique index on `schedule_notifications` per user-department pair
- Foreign key relationships maintained

## Files Created/Modified

### Backend Files Created:
1. `edutrack-backend/database/migrations/2026_02_02_000001_add_is_active_to_tentative_schedules.php`
2. `edutrack-backend/database/migrations/2026_02_02_000002_create_schedule_notifications_table.php`
3. `edutrack-backend/app/Models/ScheduleNotification.php`
4. `edutrack-backend/app/Http/Controllers/API/Student/ScheduleNotificationController.php`

### Backend Files Modified:
1. `edutrack-backend/app/Models/TentativeSchedule.php`
2. `edutrack-backend/app/Http/Controllers/API/Chairperson/TentativeScheduleController.php`
3. `edutrack-backend/routes/api.php`

### Frontend Files Created:
1. `src/components/features/schedule/ScheduleCalendarView.tsx`
2. `src/components/features/schedule/ScheduleNotification.tsx`
3. `src/app/student/schedule-planning/page.tsx`

### Frontend Files Modified:
1. `src/lib/api/laravel.ts`
2. `src/app/chairperson/TentativeSchedule/page.tsx`

## Next Steps for Deployment

### 1. Run Migrations
```bash
cd edutrack-backend
php artisan migrate
```

### 2. Test Backend Endpoints
- Test toggle active endpoint
- Test notification subscription
- Verify only one active schedule per department

### 3. Configure Email Notifications (Optional)
- Set up mail configuration in Laravel
- Create email template for schedule updates
- Test email delivery

### 4. Frontend Navigation
- Add link to `/student/schedule-planning` in student navigation menu
- Update course planning flow to include new page

### 5. User Testing
- Test with multiple departments
- Verify active schedule constraint
- Test notification system
- Check calendar view on different screen sizes
- Verify conflict detection accuracy

## Usage Guide

### For Chairpersons:
1. Create and publish a tentative schedule
2. Click "Set Active" to make it the active schedule for students
3. Only one schedule can be active per department
4. Students will use the active schedule for planning

### For Students:
1. Navigate to `/student/schedule-planning`
2. View the active schedule for your department
3. Select courses you want to take
4. Review all possible schedule combinations
5. Check for conflicts
6. View calendar visualization
7. Subscribe to notifications for updates
8. Proceed to course registration

## Notes
- Calendar view uses 30-minute time slots
- Maximum 20 schedule combinations shown for performance
- Notification emails require mail configuration
- Active schedule takes precedence over published schedules
- Students must select courses before viewing combinations
