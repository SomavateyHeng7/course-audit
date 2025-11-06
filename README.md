
# EduTrack – Course Audit System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

*Last Updated: November 2025*

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
- **Heroicons** - Additional icon set for enhanced UI
- **Recharts** - Interactive charts for data visualization
- **Next Themes** - Dark/light mode theme switching

### **Backend & Database**
- **Prisma ORM 6.8.2** - Type-safe database access with PostgreSQL
- **NextAuth 5.0.0 Beta** - Authentication with session management
- **bcryptjs** - Password hashing and security
- **Zod 4.0.5** - Runtime type validation and parsing
- **Axios** - HTTP client for API requests
- **SWR** - Data fetching with caching and revalidation
- **Nodemailer** - Email service integration

### **Data Processing & Export**
- **xlsx** - Excel file processing for import/export
- **Papa Parse** - CSV parsing and generation
- **csv-parse** - Advanced CSV parsing capabilities
- **jsPDF & html2canvas** - PDF report generation
- **file-saver** - Client-side file download utilities
- **React Dropzone** - Drag-and-drop file upload interface

### **Development Tools**
- **ESLint** - Code quality and style enforcement
- **PostCSS & Autoprefixer** - CSS processing and optimization
- **ts-node** - TypeScript execution for scripts
- **Turbopack** - Fast development builds with Next.js
- **PNPM** - Fast, disk space efficient package manager (recommended)

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
- **PNPM** package manager (recommended) or npm/yarn
- **Git** for version control

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
   # Create your environment file
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
   # This runs Next.js with Turbopack for faster development builds
   ```

7. **Access the application:**
   - **Main App**: [http://localhost:3000](http://localhost:3000)
   - **Student Interface**: [http://localhost:3000/student/management](http://localhost:3000/student/management)
   - **Admin Interface**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Chairperson Interface**: [http://localhost:3000/chairperson](http://localhost:3000/chairperson)

### **Quick Access by Role**

#### **For Students (No Registration Required)**
1. Visit [http://localhost:3000](http://localhost:3000)
2. Browse available curricula anonymously
3. Access the management interface at [/student/management](http://localhost:3000/student/management)
4. Import transcripts or manually track progress

#### **For Administrators**
1. Create admin account via seeded data or API
2. Login and access [/admin](http://localhost:3000/admin)
3. Manage users, faculties, and departments
4. Configure system-wide settings

#### **For Chairpersons**
1. Get chairperson role assigned by admin
2. Access [/chairperson](http://localhost:3000/chairperson)
3. Create and manage curricula for your faculty
4. Configure course requirements and constraints

### **Production Deployment**

1. **Build the application:**
   ```bash
   pnpm run build
   ```

2. **Start production server:**
   ```bash
   pnpm run start
   ```

3. **Additional development commands:**
   ```bash
   # Lint the codebase
   pnpm run lint
   
   # Generate Prisma client (runs automatically after install)
   npx prisma generate
   
   # Reset database and reseed
   npx prisma migrate reset
   
   # View database in Prisma Studio
   npx prisma studio
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
│   │   ├── student/      # Student interface pages
│   │   └── api/          # API route handlers
│   ├── components/       # Reusable UI components
│   │   ├── role-specific/ # Role-based component organization
│   │   │   ├── admin/    # Admin-specific components
│   │   │   ├── chairperson/ # Chairperson-specific components
│   │   │   └── student/  # Student-specific components
│   │   ├── shared/       # Common shared components
│   │   └── ui/           # Base UI components (shadcn/ui)
│   ├── lib/              # Utility functions and configurations
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React context providers
│   ├── types/            # TypeScript type definitions
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
- **[Student User Manual](docs/user-manuals/STUDENT_USER_MANUAL.md)**: Comprehensive guide for student features
- **[Admin User Manual](docs/user-manuals/ADMIN_README.md)**: Administrative interface documentation
- **[Chairperson User Manual](docs/user-manuals/Chairperson_Role_User_Manual.md)**: Faculty management guide

### **Technical Documentation**
- **[Architecture Analysis](docs/architecture/ARCHITECTURE_ANALYSIS.md)**: System design and implementation details
- **[API Documentation](docs/api/COMPREHENSIVE_API_AUDIT.md)**: Backend API reference
- **[Database Schema](prisma/schema.prisma)**: Complete database structure
- **[Implementation Guides](docs/implementation/)**: Detailed implementation documentation

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
- **Testing**: Write unit tests for new features (recommended)
- **Documentation**: Update relevant documentation with code changes

### **Development Guidelines**
- Use the role-specific component structure in `/src/components/role-specific/`
- Follow the established naming conventions for consistency
- Ensure responsive design for all new UI components
- Implement proper error handling and user feedback
- Use TypeScript strictly - avoid `any` types where possible

---

## �️ Roadmap

### **Upcoming Features**
- **📱 Mobile App**: React Native mobile application
- **🔔 Real-time Notifications**: Push notifications for important updates
- **📧 Email Integration**: Automated email notifications and reports
- **🤖 AI-Powered Recommendations**: Course recommendation engine
- **📊 Advanced Analytics**: Detailed reporting and insights dashboard
- **🔗 API Integrations**: Third-party system integrations
- **🌍 Internationalization**: Multi-language support

### **Technical Improvements**
- **🧪 Testing Suite**: Comprehensive unit and integration tests
- **🔒 Enhanced Security**: Advanced authentication and authorization
- **⚡ Performance Optimization**: Further speed and efficiency improvements
- **📱 PWA Support**: Progressive Web App capabilities
- **🔄 Real-time Sync**: Live data synchronization across devices

### **Version History**
- **v0.1.0** (Current) - Core functionality with role-based access
- **v0.2.0** (Planned) - Enhanced reporting and mobile responsiveness
- **v1.0.0** (Target) - Production-ready with full feature set

---

## �👥 Team

### **Core Contributors**
- **Somavatey Heng** - Lead Developer & Project Manager
- **Moe Myint Mo San** - Backend Developer & Database Design
- **Sai Thaw Zin Aung** - Frontend Developer & UI/UX Design

### **Acknowledgments**
Special thanks to all contributors who have helped improve EduTrack through bug reports, feature suggestions, and code contributions.

---

## � Performance & Scalability

### **Optimization Features**
- **Turbopack Integration**: Lightning-fast development builds with Next.js 15
- **SWR Data Fetching**: Intelligent caching and background revalidation
- **Progressive Enhancement**: Features unlock based on authentication level
- **Lazy Loading**: Components and routes loaded on demand
- **Optimized Images**: Next.js automatic image optimization

### **Scalability Considerations**
- **Role-Based Access Control**: Efficient permission management
- **Database Indexing**: Optimized queries for large datasets
- **API Rate Limiting**: Built-in protection against abuse
- **Caching Strategy**: Multiple layers of caching for performance
- **Modular Architecture**: Easy to scale individual components

### **Production Recommendations**
- **Database**: Use connection pooling for high traffic
- **CDN**: Deploy static assets via CDN for global performance
- **Monitoring**: Implement application performance monitoring
- **Backup**: Regular database backups and disaster recovery
- **Security**: SSL/TLS encryption and security headers

---

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Getting Help**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check user manuals and technical docs
- **Community**: Connect with other users and contributors

### **Common Issues & Solutions**
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Import Errors**: Check CSV/Excel file format and column headers match expected schema
- **Authentication**: Ensure NEXTAUTH_SECRET is set and NEXTAUTH_URL is correct
- **Build Errors**: Run `pnpm install` to ensure all dependencies are installed
- **Component Import Issues**: Check file paths and component exports
- **Performance**: Consider connection pooling for high-traffic deployments

### **Development Notes**
- Use **PNPM** for consistent dependency management
- Follow the **role-specific component structure** for better organization
- Run `pnpm run build` to verify there are no build errors before deployment
- Use TypeScript strictly - all new components should be properly typed

---

*EduTrack - Empowering academic excellence through intelligent course management* 🎓
