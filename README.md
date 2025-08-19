
# EduTrack – Course Audit System

EduTrack is a modern web application for university students and administrators to manage academic progress, curricula, and course requirements. The platform supports anonymous access for students, advanced management for chairpersons/admins, and seamless export features.


## Features

### For Students
- **Anonymous Access:** Browse and use all course management and progress features without signing in.
- **Browse Curricula:** View all available curricula and courses by faculty and department.
- **Search & Filter:** Quickly find courses and curricula with search and filter tools.
- **Manual Course Entry:** Enter and track your courses manually, including status and grades.
- **Excel Upload:** Import previous course records using Excel files.
- **Progress Tracking:** Visualize your academic progress, completed, pending, and planned courses.
- **Export:** Download your progress as **PDF** (from the progress page) or **Excel** (from the manual course entry page). All export features are available to anonymous students—no login required.

### For Chairpersons & Admins
- Full curriculum management (create, edit, delete, assign courses)
- Course management with advanced filtering and categorization
- Constraint management (prerequisites, corequisites, banned combinations)
- Elective rules and credit requirements configuration
- Blacklist management (department-scoped, curriculum assignment)
- Bulk course creation via Excel/CSV upload
- Role-based access control (Student, Advisor, Chairperson, Super Admin)
- Audit logging for all changes

## Getting Started

1. **Install dependencies:**
	```bash
	pnpm install
	```
2. **Set up the database:**
	```bash
	npx prisma migrate dev --name init
	npx prisma db seed
	```
3. **Run the development server:**
	```bash
	pnpm run dev
	```
4. **Access the app:**
	Open [http://localhost:3000](http://localhost:3000) in your browser.


## Technologies Used
- Next.js 15, React 19, TypeScript
- Prisma ORM (PostgreSQL)
- NextAuth for authentication
- Tailwind CSS for styling
- jsPDF & html2canvas for PDF export
- xlsx & file-saver for Excel export

## Team Members
- Somavatey Heng
- Moe Myint Mo San
- Sai Thaw Zin Aung
