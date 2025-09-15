# Super Admin Dashboard - Course Audit System

## Overview

The super admin dashboard provides comprehensive system management capabilities for the Course Audit System. The Super Administrator can manage users, departments, and faculties across the entire system through an intuitive web interface.

## Features

### 🔐 User Management
- **View all users** in the system with their roles and faculty associations
- **Create new users** with password and confirm password fields (must match)
- **Update user information** including name, email, role, faculty, and password (with confirm password validation)
- **Delete users** with confirmation modal and detailed toast notifications
- **Role-based access control** with STUDENT, ADVISOR, CHAIRPERSON, and SUPER_ADMIN roles
- **Dynamic dropdowns** for faculty and department selection
- **Loading states** and prevention of duplicate submissions
- **Success and error toast notifications** for all actions

### 🏢 Department Management
- **View all departments** organized by faculty
- **Create new departments** with unique codes within each faculty
- **Update department information** including name, code, and faculty association
- **Delete departments** with confirmation modal and validation (cannot delete if associated users or curricula exist)
- **Statistics tracking** showing user and curriculum counts per department
- **Loading states** and toast notifications for all actions

### 🎓 Faculty Management
- **View all faculties** with comprehensive statistics
- **Create new faculties** with unique codes
- **Update faculty information** including name and code
- **Delete faculties** with confirmation modal and validation (cannot delete if associated users, departments, or curricula exist)
- **Statistics tracking** showing user, department, and curriculum counts per faculty
- **Loading states** and toast notifications for all actions

## Color Scheme

The admin interface uses a consistent color scheme:
- **Navy Blue (#1F3A93)**: Primary headings and user management
- **Forest Green (#2ECC71)**: Department management and approval actions
- **Amber/Gold (#F39C12)**: Faculty management and pending actions
- **Dark Red (#C0392B)**: Rejections and alerts
- **Light Gray (#D5D8DC)**: Borders and dividers

## API Endpoints

### User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Department Management
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create new department
- `PUT /api/departments/[id]` - Update department
- `DELETE /api/departments/[id]` - Delete department

### Faculty Management
- `GET /api/faculties` - List all faculties
- `POST /api/faculties` - Create new faculty
- `PUT /api/faculties/[id]` - Update faculty
- `DELETE /api/faculties/[id]` - Delete faculty

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  facultyId String
  faculty   Faculty  @relation(fields: [facultyId], references: [id])
  // ... other fields
}

enum Role {
  STUDENT
  ADVISOR
  CHAIRPERSON
  SUPER_ADMIN
}
```

### Department Model
```prisma
model Department {
  id        String   @id @default(cuid())
  name      String
  code      String
  facultyId String
  faculty   Faculty  @relation(fields: [facultyId], references: [id])
  // ... other fields
}
```

### Faculty Model
```prisma
model Faculty {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  // ... other fields
}
```

## Security Features

- **Input validation** on all API endpoints
- **Unique constraint validation** for codes and emails
- **Cascade deletion protection** to prevent data loss
- **Role-based access control** with proper authorization
- **Audit trail** for all changes (via AuditLog model)

## UI Components

### Core Components
- **Tabs**: Multi-tab interface for different management areas
- **Cards**: Information display with statistics
- **Modals**: Create/edit/delete forms with validation and confirmation
- **Badges**: Role and status indicators
- **Buttons**: Action buttons with proper styling and loading states
- **Toast Notifications**: Success and error feedback for all actions
- **Password Visibility Toggle**: Eye icon to show/hide password fields

### Management Components
- **RoleManagement**: User management with role assignment, password validation, and dynamic dropdowns
- **DepartmentManagement**: Department CRUD operations with validation and feedback
- **FacultyManagement**: Faculty CRUD operations with validation and feedback

## Getting Started

1. **Access the super admin dashboard** at `/admin`
2. **Log in with your SUPER_ADMIN credentials**
3. **Set up the database** with proper migrations
4. **Configure environment variables** in `.env`
5. **Run the seed script** to create the super admin user

## Super Admin Setup

### Database Seeding
The system includes a seed script that creates:
- Default faculty
- Super admin user with credentials:
  - Email: `superadmin@edutrack.com`
  - Password: `superadmin123`

### Running the Seed
```bash
npx prisma db seed
```

## Dependencies

- **@radix-ui/react-tabs**: Tab component functionality
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library
- **framer-motion**: Animation library
- **@prisma/client**: Database client

## Future Enhancements

- **Bulk operations** for user management
- **Advanced filtering** and search capabilities
- **Export functionality** for reports
- **Audit log viewer** for change tracking
- **Email notifications** for user creation
- **Role permission matrix** for fine-grained access control
- **Password strength indicator** for user creation
- **Improved error details in toast notifications**