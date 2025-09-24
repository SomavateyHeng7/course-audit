
# EduTrack – Course Audit System

## 🎓 Overview

EduTrack is a comprehensive academic management platform designed for universities to streamline curriculum management, student progress tracking, and administrative oversight. The system features a modern, role-based architecture with four distinct access levels, supporting everything from anonymous course browsing to full administrative control.

### 🌟 Key Highlights
- **🌐 Anonymous Access**: Students can explore curricula and plan courses without registration
- **📊 Progress Tracking**: Comprehensive academic progress visualization with GPA calculation
- **📁 Data Import/Export**: Excel/CSV support for transcript import and progress reports
- **🏛️ Multi-Role Architecture**: Tailored interfaces for students, chairpersons, and administrators
- **🔧 Advanced Management**: Full curriculum lifecycle management with constraints and rules

---

## 🎯 Features by User Role

### 👨‍🎓 For Students (Anonymous & Authenticated)

#### **Anonymous Access (No Registration Required)**
- **📚 Browse All Curricula**: Explore academic programs across faculties and departments
- **🔍 Course Search & Filtering**: Find courses by code, name, department, or faculty
- **📋 Curriculum Details**: View program requirements, credit breakdowns, and course sequences
- **🎯 Academic Planning**: Plan course sequences and graduation timelines

#### **Enhanced Features with Local Storage**
- **✅ Course Progress Tracking**: Mark courses as completed, failed, or withdrawn
- **📊 GPA Calculation**: Automatic GPA computation with grade tracking (A, A-, B+, B, B-, C+, C, C-, D, S)
- **📈 Progress Visualization**: Interactive charts showing completion percentage and category breakdowns
- **📑 Transcript Import**: Upload Excel/CSV files to automatically populate course data
- **📄 Report Generation**: Download progress reports as PDF or export data as Excel
- **📅 Course Planning**: Plan future semesters with prerequisite validation
- **🎓 Graduation Analysis**: Track requirements completion and estimate graduation timeline

#### **Course Management Capabilities**
- **Manual Course Entry**: Add courses individually with status and grade tracking
- **Free Elective Management**: Add custom courses outside standard curriculum
- **Category Organization**: Courses organized by General Education, Core, Major, Major Elective, Free Elective
- **Credit Tracking**: Monitor total credits and requirements by category
- **Status Management**: Track course completion status with detailed grade recording

### 👨‍💼 For Chairpersons (Faculty-Scoped Management)

#### **Curriculum Management**
- **🆕 Create New Curricula**: Comprehensive curriculum creation workflow
- **✏️ Edit Existing Programs**: Modify curriculum details, requirements, and structure
- **📚 Course Assignment**: Add/remove courses and organize by categories
- **🎯 Concentration Management**: Configure specialization tracks within programs
- **📏 Credit Requirements**: Set minimum credits per category and concentration

#### **Advanced Configuration**
- **🔗 Constraint Management**: Define prerequisites, corequisites, and course dependencies
- **🚫 Blacklist Management**: Configure course exclusions and incompatible combinations
- **⚖️ Elective Rules**: Set flexible requirements for elective course categories
- **📊 Course Type Configuration**: Organize courses into academic categories
- **🏢 Department Access**: Manage curricula within faculty boundaries

#### **Bulk Operations**
- **📤 Excel/CSV Import**: Bulk upload curricula and course data
- **🔄 Data Validation**: Comprehensive validation with error reporting
- **📋 Curriculum Templates**: Reusable templates for similar programs
- **📊 Analytics Dashboard**: Track curriculum usage and student enrollment

### 🔧 For System Administrators

#### **User Management**
- **👥 User Account Control**: Create, edit, and delete user accounts
- **🛡️ Role Assignment**: Manage STUDENT, ADVISOR, CHAIRPERSON, SUPER_ADMIN roles
- **🏛️ Faculty/Department Assignment**: Associate users with organizational units
- **🔐 Permission Management**: Configure access levels and restrictions

#### **System Configuration**
- **🏢 Organizational Structure**: Manage faculties, departments, and hierarchies
- **⚙️ Global Settings**: Configure system-wide parameters and defaults
- **📊 Performance Monitoring**: Track system usage and performance metrics
- **🔒 Security Management**: Audit logs, access controls, and data integrity

#### **Data Management**
- **💾 Database Operations**: Backup, restore, and maintenance operations
- **📈 Reporting**: Generate system-wide reports and analytics
- **🔍 Audit Trails**: Track all system changes and user activities
- **🛠️ System Maintenance**: Perform updates and troubleshooting

---

## 🚀 Technology Stack

### **Frontend Framework**
- **Next.js 15.1.6** - React-based full-stack framework with App Router
- **React 19.0.0** - Modern UI library with latest features
- **TypeScript** - Type-safe development with enhanced developer experience
- **Tailwind CSS** - Utility-first styling with responsive design

### **UI Components & Styling**
- **Radix UI** - Accessible component primitives (@radix-ui/react-*)
- **Shadcn/UI** - Modern component library built on Radix
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **React Icons** - Comprehensive icon collection

### **Backend & Database**
- **Prisma ORM 6.8.2** - Type-safe database access with PostgreSQL
- **NextAuth 5.0.0** - Authentication with session management
- **bcryptjs** - Password hashing and security
- **Zod** - Runtime type validation and parsing

### **Data Processing & Export**
- **xlsx** - Excel file processing for import/export
- **Papa Parse** - CSV parsing and generation
- **jsPDF & html2canvas** - PDF report generation
- **file-saver** - Client-side file download utilities

### **Development Tools**
- **ESLint** - Code quality and style enforcement
- **PostCSS & Autoprefixer** - CSS processing and optimization
- **ts-node** - TypeScript execution for scripts
- **Turbopack** - Fast development builds

---

## 🏗️ System Architecture

### **Multi-Layer Architecture**
```
┌─────────────────────────────────────────┐
│              CLIENT LAYER               │
│  Next.js Frontend + UI Components      │
│  Anonymous Access + Authenticated UI   │
└─────────────────────────────────────────┘
           │ HTTP/API Calls │
┌─────────────────────────────────────────┐
│              SERVER LAYER               │
│     API Routes + Business Logic        │
│     Authentication + Authorization     │
└─────────────────────────────────────────┘
           │ Prisma ORM │
┌─────────────────────────────────────────┐
│               DATA LAYER                │
│        PostgreSQL Database             │
│    Curricula + Courses + Users         │
└─────────────────────────────────────────┘
```

### **Access Control Architecture**
- **Anonymous Students**: Public curriculum browsing with local progress tracking
- **Authenticated Students**: Personal academic management with persistent data
- **Chairpersons**: Faculty-scoped curriculum and course management
- **Administrators**: System-wide control and user management

### **Data Flow Patterns**
- **Progressive Enhancement**: Features unlock based on user authentication
- **Local-First Storage**: Anonymous users get full functionality via localStorage
- **Real-time Validation**: Immediate feedback for academic rules and constraints
- **Bulk Processing**: Efficient import/export for large datasets

---

## 🛠️ Installation & Setup

### **Prerequisites**
- **Node.js 18+** (recommended: Node.js 20+)
- **PostgreSQL 14+** database
- **pnpm** package manager (recommended) or npm/yarn

### **Quick Start**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SomavateyHeng7/course-audit.git
   cd course-audit
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and auth configuration
   ```

4. **Database setup:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Seed sample curricula (optional):**
   ```bash
   # Computer Science curricula
   npx ts-node prisma/bscs_seed.ts
   npx ts-node prisma/bscs_651_652_seed.ts
   
   # Business Administration curricula
   npx ts-node prisma/bba_seed.ts
   npx ts-node prisma/bba66x_seed.ts
   
   # Information Technology curricula
   npx ts-node prisma/bsit_653_seed.ts
   ```

6. **Start development server:**
   ```bash
   pnpm run dev
   ```

7. **Access the application:**
   - **Main App**: [http://localhost:3000](http://localhost:3000)
   - **Student Interface**: [http://localhost:3000/management](http://localhost:3000/management)
   - **Admin Interface**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Chairperson Interface**: [http://localhost:3000/chairperson](http://localhost:3000/chairperson)

### **Production Deployment**

1. **Build the application:**
   ```bash
   pnpm run build
   ```

2. **Start production server:**
   ```bash
   pnpm run start
   ```

3. **Environment variables for production:**
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="https://yourdomain.com"
   NEXTAUTH_SECRET="your-secret-key"
   ```

---

## 📊 Database Schema Overview

### **Core Entities**
- **Users**: Authentication and role management
- **Faculties**: Top-level organizational units
- **Departments**: Faculty subdivisions
- **Curricula**: Academic programs with version control
- **Courses**: Individual course definitions
- **CurriculumCourses**: Many-to-many relationships with course categorization

### **Academic Rules Engine**
- **Constraints**: Prerequisites, corequisites, course dependencies
- **ElectiveRules**: Flexible requirements for elective categories
- **Blacklists**: Course exclusions and incompatible combinations
- **CourseTypes**: Academic categorization system

### **Progress Tracking**
- **StudentCourses**: Individual course completion records
- **Concentrations**: Specialization tracks within curricula
- **Academic Progress**: GPA calculations and graduation tracking

---

## 📁 Project Structure

```
course-audit/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma      # Main database schema
│   ├── migrations/        # Database migration files
│   └── seed.ts           # Database seeding scripts
├── public/                # Static assets and sample data
│   ├── curriculum_files/  # Sample curriculum CSV/XLSX files
│   └── image/            # UI assets and icons
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin interface pages
│   │   ├── chairperson/  # Chairperson interface pages
│   │   ├── management/   # Student interface pages
│   │   └── api/          # API route handlers
│   ├── components/       # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── chairperson/  # Chairperson-specific components
│   │   ├── student/      # Student-specific components
│   │   └── ui/           # Base UI components
│   ├── lib/              # Utility functions and configurations
│   └── services/         # API service layers
├── docs/                 # Documentation files
│   ├── STUDENT_USER_MANUAL.md
│   ├── ADMIN_USER_MANUAL.md
│   └── ARCHITECTURE_ANALYSIS.md
└── README.md            # This file
```

---

## 🔧 Configuration

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/course_audit"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: Email configuration for notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### **Database Configuration**
The system supports PostgreSQL with Prisma ORM. For production, consider:
- **Connection pooling** for better performance
- **Read replicas** for large-scale deployments
- **Backup strategies** for data protection

---

## 📚 Documentation

### **User Manuals**
- **[Student User Manual](STUDENT_USER_MANUAL.md)**: Comprehensive guide for student features
- **[Admin User Manual](ADMIN_USER_MANUAL.md)**: Administrative interface documentation
- **[Chairperson User Manual](Chairperson_Role_User_Manual.md)**: Faculty management guide

### **Technical Documentation**
- **[Architecture Analysis](ARCHITECTURE_ANALYSIS.md)**: System design and implementation details
- **[API Documentation](prisma/api_specification.md)**: Backend API reference
- **[Database Schema](prisma/enhanced_schema.prisma)**: Complete database structure

---

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with appropriate tests
4. Commit with descriptive messages: `git commit -m "feat: add course import validation"`
5. Push to your fork: `git push origin feature/your-feature`
6. Submit a pull request with detailed description

### **Code Standards**
- **TypeScript**: All new code should be written in TypeScript
- **ESLint**: Follow the project's ESLint configuration
- **Component Structure**: Use functional components with hooks
- **API Design**: Follow RESTful principles for new endpoints

---

## 👥 Team

### **Core Contributors**
- **Somavatey Heng** - Lead Developer & Project Manager
- **Moe Myint Mo San** - Backend Developer & Database Design
- **Sai Thaw Zin Aung** - Frontend Developer & UI/UX Design

### **Acknowledgments**
Special thanks to all contributors who have helped improve EduTrack through bug reports, feature suggestions, and code contributions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Getting Help**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check user manuals and technical docs
- **Community**: Connect with other users and contributors

### **Common Issues & Solutions**
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Import Errors**: Check CSV/Excel file format and column headers
- **Authentication**: Ensure NEXTAUTH_SECRET is set and URL is correct
- **Performance**: Consider connection pooling for high-traffic deployments

---

*EduTrack - Empowering academic excellence through intelligent course management* 🎓
