# Course Audit System - System Architecture Overview

## Architecture Summary

This document provides a detailed system architecture overview for the Course Audit System, a Next.js-based web application with PostgreSQL database, designed to support four distinct user access levels with role-based permissions and faculty-scoped collaboration.

## Files Analyzed (Current Implementation Status)

### ✅ Current & Accurate Documentation
- `package.json` - Technology stack and dependencies
- `prisma/schema.prisma` - Database schema (437 lines) 
- `src/middleware.ts` - Authentication and authorization middleware
- `FINAL_IMPLEMENTATION_REVIEW.md` - Complete implementation status
- `BACKEND_IMPLEMENTATION_SUMMARY.md` - API implementation details
- `App_Flow_Presentation_Content.md` - User flow specifications

### ⚠️ Partially Outdated Documentation  
- `ARCHITECTURE_ANALYSIS.md` - Contains some outdated analysis but useful for understanding design decisions

### 📁 Code Structure Analyzed
- 42 page components (`src/app/**/page.tsx`)
- 96+ API routes (`src/app/api/**/route.ts`) 
- 70+ UI components (`src/components/**/*.tsx`)
- Complete file structure exploration

---

## System Architecture Layers

### **1. CLIENT LAYER (Frontend/Presentation)**

#### **User Interface Components**
- **Next.js 15.1.6 App Router** - Modern React framework with file-based routing
- **React 19.0.0** - Latest React with concurrent features
- **TypeScript** - Type safety and development experience
- **Tailwind CSS + Radix UI** - Design system and component library
- **Framer Motion** - Animation and interactions

#### **File Management System**
- **Excel/CSV Processing**: 
  - Upload: `react-dropzone` + `xlsx` + `papaparse`
  - Download: `file-saver` + `xlsx`
  - Validation: Server-side parsing and validation
- **PDF Generation**: `jspdf` + `html2canvas` for progress reports
- **Drag & Drop Interface**: Multi-format file support

#### **Session Management**
- **NextAuth.js v5** - Authentication with session management
- **Role-based Navigation**: Dynamic routing based on user roles
- **Persistent Sessions**: Auto-save capabilities for student progress
- **Real-time Updates**: SWR for data fetching and caching

#### **User Access Interfaces**
```
/                    - Landing page (anonymous)
/auth                - Authentication
/management          - Authenticated student dashboard
/management/data-entry - Student course entry
/management/progress - Student progress tracking  
/chairperson         - Chairperson dashboard
/admin               - Admin interface
/allCurricula        - Public curriculum browsing
```

---

### **2. SERVER LAYER (Backend/Business Logic)**

#### **Authentication & Authorization**
- **NextAuth.js Integration**: Email/password authentication
- **Role-based Access Control**: Admin, Chairperson, Student, Anonymous
- **Department-scoped Permissions**: Faculty-wide collaboration model
- **Session Middleware**: Route protection and role validation

#### **Course Management Logic**
- **Course Validation**: Credit requirements, prerequisites, co-requisites
- **Academic Rules Engine**: GPA requirements, senior standing, constraints
- **Progress Calculation**: Credit tracking, completion percentages
- **Graduation Planning**: Timeline estimation and requirement checking

#### **Curriculum Processing**
- **Bulk Import System**: Excel/CSV to database processing
- **Curriculum Creation Workflow**: Two-step validation process  
- **Academic Rule Validation**: Complex constraint checking
- **Faculty Collaboration**: Cross-department curriculum sharing

#### **Export & Reporting**
- **PDF Generation**: Comprehensive progress reports
- **Excel Export**: Current academic progress data
- **Graduation Checklist**: Detailed requirement validation
- **Semester Planning**: Future course recommendation engine

#### **API Architecture (96+ endpoints)**
```
/api/auth/*          - Authentication endpoints
/api/curricula/*     - Curriculum management 
/api/courses/*       - Course operations
/api/concentrations/* - Specialization management
/api/blacklists/*    - Course restrictions
/api/admin/*         - Administrative functions
/api/public-curricula/* - Anonymous access endpoints
```

---

### **3. DATA LAYER (Database/Persistence)**

#### **PostgreSQL Database**
- **Prisma ORM 6.8.2** - Type-safe database access
- **Connection Pooling** - Optimized for concurrent users
- **Database Migrations** - Version-controlled schema changes

#### **Core Data Models (19 entities)**
```
Users (4 roles: Admin, Chairperson, Student, Anonymous)
├── Faculty (organizational hierarchy)
├── Department (scoped access control)
├── Curriculum (academic programs)  
├── Course (academic content)
├── StudentCourse (progress tracking)
├── Concentration (specializations)
├── Blacklist (restrictions)
├── ElectiveRule (graduation requirements)
└── AuditLog (change tracking)
```

#### **Temporary Session Data**
- **Student Progress Sessions**: Non-authenticated user data
- **File Upload Processing**: Temporary data validation
- **Session Persistence**: Browser storage for data continuity
- **Excel Import State**: Multi-step upload process management

#### **Performance Optimizations**
- **Database Indexes**: Department, faculty, and role-based queries
- **Query Optimization**: Faculty-scoped data access patterns
- **Unique Constraints**: Department-scoped entity validation
- **Cascade Relationships**: Referential integrity maintenance

---

## User Access Architecture

### **Anonymous Students** (Public Access)
- **Data Access**: Read-only course catalog and curriculum information
- **No Authentication**: Direct access to public endpoints
- **Temporary Sessions**: Browser-based progress tracking
- **Features**: Course search, curriculum browsing, basic progress planning

### **Authenticated Students** (Personal Management)  
- **Data Access**: Personal academic progress and course management
- **Session Management**: Persistent progress tracking across visits
- **Import/Export**: Excel/CSV academic data management
- **Features**: Progress visualization, graduation planning, PDF reports

### **Chairpersons** (Faculty-scoped Management)
- **Data Access**: All departments within assigned faculty
- **Collaborative Access**: Cross-department curriculum editing
- **Department Context**: Default to own department with override capability
- **Features**: Curriculum creation, course management, academic rule configuration

### **Administrators** (System-wide Control)
- **Data Access**: Complete system access across all faculties
- **User Management**: Create/edit users, assign roles and departments
- **System Configuration**: Faculty/department structure, global settings
- **Features**: System monitoring, user administration, data integrity management

---

## Security & Access Control

### **Authentication Flow**
1. **Registration**: Faculty + Department selection required
2. **Role Assignment**: Admin-controlled role and department association
3. **Session Management**: NextAuth.js with role-based routing
4. **Route Protection**: Middleware-based access control

### **Data Isolation**
- **Faculty Boundaries**: Complete isolation between faculties
- **Department Context**: Default scoping with collaboration override
- **Role-based Features**: UI and API access based on user role
- **Audit Logging**: All data changes tracked with user attribution

### **File Processing Security**
- **Upload Validation**: Server-side file type and content validation
- **Temporary Storage**: Secure handling of uploaded files
- **Data Sanitization**: Content validation before database insertion
- **Error Handling**: Comprehensive validation and error reporting

---

## Technology Stack Integration

### **Frontend Technologies**
```json
"next": "15.1.6",           // App Router, Server Components
"react": "19.0.0",          // Latest React features  
"typescript": "5.x",        // Type safety
"tailwindcss": "3.x",       // Utility-first CSS
"@radix-ui/react-*": "2.x", // Accessible UI components
"framer-motion": "12.x",    // Animations
"next-auth": "5.0.0-beta",  // Authentication
```

### **Backend Technologies**
```json
"prisma": "6.8.2",          // Database ORM
"@prisma/client": "6.8.2",  // Type-safe queries
"bcryptjs": "3.0.2",        // Password hashing
"zod": "4.0.5",             // Runtime validation
```

### **File Processing**
```json
"xlsx": "0.18.5",           // Excel file processing
"papaparse": "5.5.3",       // CSV parsing
"file-saver": "2.0.5",      // File downloads
"jspdf": "3.0.1",           // PDF generation
```

---

## Deployment Architecture

### **Next.js Application**
- **Server-Side Rendering**: Performance optimization
- **Static Site Generation**: Public pages optimization  
- **API Routes**: Serverless function architecture
- **Edge Runtime**: Global performance optimization

### **Database**
- **PostgreSQL**: Production-grade relational database
- **Connection Pooling**: Concurrent user support
- **Migration System**: Version-controlled schema updates
- **Backup Strategy**: Data integrity and recovery

### **File Storage**
- **Temporary Processing**: Server memory for file uploads
- **Generated Reports**: Dynamic PDF/Excel generation
- **Static Assets**: Next.js optimized asset delivery
- **Session Persistence**: Browser storage for anonymous users

---

## Key Implementation Patterns

### **Faculty-Scoped Collaboration**
- Users belong to specific departments within faculties
- Chairpersons can access all departments in their faculty
- Complete isolation between different faculties
- Department defaults with override capabilities

### **Progressive Enhancement**
- Anonymous users can explore without registration
- Authenticated users get persistent progress tracking
- Role-based feature activation
- Graceful degradation for different access levels

### **Bulk Data Processing**
- Excel/CSV import with comprehensive validation
- Multi-step curriculum creation workflow
- Bulk course assignment operations
- Error handling and rollback capabilities

### **Academic Rules Engine**
- Complex prerequisite and co-requisite validation
- GPA and credit requirement checking
- Graduation timeline calculation
- Flexible elective rule configuration

This architecture supports a scalable, secure, and user-friendly academic management system with comprehensive progress tracking and institutional curriculum management capabilities.
