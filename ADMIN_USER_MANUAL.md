
# Admin Side User Manual (Course Audit System)

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Management](#user-management)
3. [Faculty Management](#faculty-management)
4. [Department Management](#department-management)
5. [General Features](#general-features)
6. [Troubleshooting](#troubleshooting)
7. [Logging Out](#logging-out)
8. [Support](#support)

---

## 1. Getting Started

### 1.1 Accessing the Admin Dashboard
- Open your browser and go to `http://localhost:3000/admin` (or your deployed URL).
- Log in using your Super Administrator credentials.
- After login, you will see the sidebar on the left with navigation options:
   - Dashboard
   - User Management
   - Faculty Management
   - Department Management

### 1.2 Sidebar Navigation
- The sidebar is always visible for quick access.
- Click any section to view and manage its data.

---

## 2. User Management

### 2.1 Viewing Users
- Click **User Management** in the sidebar.
- The main panel displays a list of all users, showing:
   - Name
   - Email
   - Role (Advisor, Chairperson, Super Admin, Student)
   - Faculty assignment
   - Action buttons (Edit, Delete)

### 2.2 Creating a User
1. Click the **Add User** button (top right of the user list).
2. Fill out the form:
    - **Name**: Enter the user's full name.
    - **Email**: Enter a valid email address.
    - **Password**: Enter a secure password.
    - **Confirm Password**: Re-enter the password. Must match the Password field.
    - **Role**: Select Advisor or Chairperson.
    - **Faculty**: Choose a faculty from the dropdown (populated dynamically).
    - **Department**: Choose a department (filtered by selected faculty).
3. To view the password, click the eye icon next to the password field.
4. Click **Create**. The button will show a loading state while processing.
5. If successful, a green toast notification appears. If there is an error (e.g., passwords do not match), a red toast notification will show the reason.

### 2.3 Editing a User
1. Click the **Edit** icon next to the user you want to modify.
2. The form will open pre-filled with the user's details.
3. Update any fields as needed. If you change the password, confirm it in both fields.
4. Click **Update**. The button will show a loading state.
5. Success or error feedback will appear as a toast notification.

### 2.4 Deleting a User
1. Click the **Delete** icon next to the user.
2. A confirmation modal will appear. Click **Delete** to confirm, or **Cancel** to abort.
3. If successful, a green toast notification appears. If there is an error, a red toast notification will show the reason.

---

## 3. Faculty Management

### 3.1 Viewing Faculties
- Click **Faculty Management** in the sidebar.
- The main panel displays all faculties, showing:
   - Name
   - Code
   - Creation date
   - Counts of users, departments, curricula
   - Action buttons (Edit, Delete)

### 3.2 Creating a Faculty
1. Click the **Add Faculty** button.
2. Fill out the form:
    - **Faculty Name**: Enter the full name.
    - **Faculty Code**: Enter a unique code.
3. Click **Create**. The button will show a loading state.
4. Success or error feedback will appear as a toast notification.

### 3.3 Editing a Faculty
1. Click the **Edit** icon next to the faculty.
2. Update the name or code as needed.
3. Click **Update**. The button will show a loading state.
4. Success or error feedback will appear as a toast notification.

### 3.4 Deleting a Faculty
1. Click the **Delete** icon next to the faculty.
2. A confirmation modal will appear. Click **Delete** to confirm, or **Cancel** to abort.
3. **Important:** You must first delete all users, departments, and curricula associated with the faculty. If not, a red toast notification will show the error and list the remaining associations.

---

## 4. Department Management

### 4.1 Viewing Departments
- Click **Department Management** in the sidebar.
- The main panel displays all departments, showing:
   - Name
   - Code
   - Faculty assignment
   - Action buttons (Edit, Delete)

### 4.2 Creating a Department
1. Click the **Add Department** button.
2. Fill out the form:
    - **Department Name**: Enter the full name.
    - **Department Code**: Enter a unique code.
    - **Faculty**: Select the faculty to assign the department to.
3. Click **Create**. The button will show a loading state.
4. Success or error feedback will appear as a toast notification.

### 4.3 Editing a Department
1. Click the **Edit** icon next to the department.
2. Update the name or code as needed.
3. Click **Update**. The button will show a loading state.
4. Success or error feedback will appear as a toast notification.

### 4.4 Deleting a Department
1. Click the **Delete** icon next to the department.
2. A confirmation modal will appear. Click **Delete** to confirm, or **Cancel** to abort.
3. **Important:** You must first delete all users and curricula associated with the department. If not, a red toast notification will show the error and list the remaining associations.

---

## 5. General Features

### 5.1 Toast Notifications
- Success actions show green toasts at the top right.
- Errors show red toasts with details.

### 5.2 Modals
- All create, edit, and delete actions use modals for confirmation and form input.

### 5.3 Loading States
- Buttons show loading text (e.g., "Creating...", "Updating...") to prevent duplicate submissions.

### 5.4 Sidebar Navigation
- Sidebar is always visible for quick access to all admin features.

---

## 6. Troubleshooting

### 6.1 Common Issues
- **400 Bad Request on Delete:** Check for associated records (users, departments, curricula) and remove them first.
- **Password Mismatch:** Ensure password and confirm password fields match before submitting.
- **Dropdowns Not Populating:** Wait for loading to finish, or check backend API connectivity.

### 6.2 Error Feedback
- Always read the toast notification for details on what went wrong.
- If unsure, check the browser console for more technical error messages.

---

## 7. Logging Out

- Click **Log Out** at the bottom of the sidebar to securely end your session.

---

## 8. Support

- For further help, contact your system administrator or refer to the technical documentation.
- If you encounter persistent issues, provide screenshots and error messages to support staff.
