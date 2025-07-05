# Course Audit System - Backend Development Plan

## Overview
This document provides a comprehensive backend development plan for the Course Audit System, including all requirements, database schema, API specifications, and implementation roadmap.

## 🎯 Project Status

### ✅ Completed Frontend Features
- Multi-blacklist/concentration management with CRUD operations
- Enhanced tab UI with responsive design, icons, and keyboard shortcuts
- Inline course addition with search and manual entry capabilities
- Senior standing constraint with configurable credit threshold
- Info modals displaying detailed course information
- Removed Excel+ functionality as requested
- Comprehensive UI/UX improvements

### 📋 Backend Development Requirements

## 1. Core Architecture Principles

### Data Ownership Model
- **Global Course Pool**: All courses are globally accessible and searchable
- **Private Resources**: Curricula, concentrations, and blacklists are private to their creators
- **Multi-tenant Architecture**: Each chairperson manages their own resources independently
- **Audit Trail**: Complete change tracking for accountability

### Security Model
- **Role-based Access Control**: Chairperson, Advisor, Student roles
- **Row-level Security**: Private resources only accessible by owners
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive sanitization and validation

## 2. Database Schema (Enhanced)

### New Tables Added
1. **CoursePrerequisite** - Replaces complex constraint system
2. **CourseCorequisite** - New corequisite management
3. **CurriculumConstraint** - Flexible constraint system with JSON config
4. **AuditLog** - Comprehensive change tracking
5. **SystemSetting** - Application configuration

### Key Enhancements
- **Better Relationships**: Proper cascade deletion and foreign keys
- **Performance Indexes**: Strategic indexing for common queries
- **Flexible Constraints**: JSON configuration for extensible constraint types
- **Audit Trail**: Complete change tracking across all entities
- **Data Integrity**: Unique constraints and validation rules

### Schema Files
- `enhanced_schema.prisma` - Complete enhanced schema
- `schema_improvements.md` - Detailed comparison and improvements
- `backend_requirements.md` - Complete backend requirements document

## 3. API Specification

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Session management

### Core Resource Endpoints
- **Courses**: Full CRUD with search, filtering, prerequisites/corequisites
- **Curricula**: Private CRUD with versioning and configuration
- **Blacklists**: Private CRUD with course management
- **Concentrations**: Private CRUD with course management
- **Constraints**: Flexible constraint system with JSON configuration

### Advanced Features
- **Audit Logs**: Complete change tracking and reporting
- **Search**: Full-text search across courses and curricula
- **Bulk Operations**: Import/export functionality
- **Reporting**: Usage statistics and analytics

## 4. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
1. **Database Setup**
   - Implement enhanced Prisma schema
   - Create migration scripts
   - Set up seed data
   - Configure database indexes

2. **Authentication System**
   - Implement JWT authentication with NextAuth
   - Set up role-based access control
   - Create middleware for protected routes
   - Implement session management

3. **Basic API Structure**
   - Set up API route handlers
   - Implement error handling middleware
   - Create validation schemas
   - Set up logging system

### Phase 2: Core Functionality (Week 3-4)
1. **Course Management**
   - Global course pool CRUD operations
   - Course search and filtering
   - Prerequisites and corequisites management
   - Course validation and constraints

2. **Curriculum Management**
   - Private curriculum CRUD operations
   - Course assignment to curricula
   - Curriculum versioning
   - Basic validation

### Phase 3: Advanced Features (Week 5-6)
1. **Blacklist Management**
   - Private blacklist CRUD operations
   - Course assignment to blacklists
   - Blacklist-curriculum relationships
   - Bulk operations

2. **Concentration Management**
   - Private concentration CRUD operations
   - Course assignment to concentrations
   - Concentration-curriculum relationships
   - Requirement validation

### Phase 4: Configuration & Constraints (Week 7-8)
1. **Elective Rules**
   - Elective rule configuration
   - Credit requirement management
   - Category-based rules
   - Validation logic

2. **Curriculum Constraints**
   - Flexible constraint system
   - Senior standing constraints
   - GPA requirements
   - Credit hour constraints
   - Custom constraint types

### Phase 5: Integration & Testing (Week 9-10)
1. **Frontend Integration**
   - Connect all frontend components to APIs
   - Implement real-time updates
   - Error handling and validation
   - Performance optimization

2. **Testing & Quality Assurance**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - Database transaction testing
   - Performance testing

### Phase 6: Advanced Features (Week 11-12)
1. **Audit System**
   - Complete audit log implementation
   - Change tracking across all entities
   - Audit report generation
   - Historical data analysis

2. **Import/Export**
   - Excel import functionality
   - Data validation during import
   - Export capabilities
   - Bulk operations

## 5. Database Migration Strategy

### Migration Steps
1. **Schema Migration**
   ```bash
   # Create new migration
   npx prisma migrate dev --name enhanced_schema
   
   # Generate new Prisma client
   npx prisma generate
   
   # Apply migration to production
   npx prisma migrate deploy
   ```

2. **Data Migration**
   - Convert existing course constraints to new format
   - Migrate prerequisite/corequisite relationships
   - Set up initial audit logs
   - Validate data integrity

3. **Cleanup**
   - Remove deprecated tables
   - Update foreign key relationships
   - Add row-level security policies
   - Optimize indexes

## 6. API Implementation Examples

### Course Management API
```typescript
// pages/api/courses/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getCourses(req, res);
    case 'POST':
      return await createCourse(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCourses(req: NextApiRequest, res: NextApiResponse) {
  const { search, category, page = 1, limit = 20 } = req.query;
  
  const courses = await prisma.course.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { code: { contains: search as string, mode: 'insensitive' } },
            { name: { contains: search as string, mode: 'insensitive' } },
          ]
        } : {},
        category ? { category: category as string } : {},
        { isActive: true }
      ]
    },
    include: {
      prerequisites: {
        include: {
          prerequisite: {
            select: { id: true, code: true, name: true, credits: true }
          }
        }
      },
      corequisites: {
        include: {
          corequisite: {
            select: { id: true, code: true, name: true, credits: true }
          }
        }
      }
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { code: 'asc' }
  });

  const total = await prisma.course.count({
    where: {
      AND: [
        search ? {
          OR: [
            { code: { contains: search as string, mode: 'insensitive' } },
            { name: { contains: search as string, mode: 'insensitive' } },
          ]
        } : {},
        category ? { category: category as string } : {},
        { isActive: true }
      ]
    }
  });

  return res.status(200).json({
    courses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}
```

### Curriculum Management API
```typescript
// pages/api/curricula/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  
  if (!session || session.user.role !== 'CHAIRPERSON') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return await getCurricula(req, res, session);
    case 'POST':
      return await createCurriculum(req, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCurricula(req: NextApiRequest, res: NextApiResponse, session: any) {
  const { search, year, isActive, page = 1, limit = 20 } = req.query;
  
  const curricula = await prisma.curriculum.findMany({
    where: {
      AND: [
        { createdById: session.user.id }, // Only user's curricula
        search ? {
          name: { contains: search as string, mode: 'insensitive' }
        } : {},
        year ? { year: year as string } : {},
        isActive !== undefined ? { isActive: isActive === 'true' } : {}
      ]
    },
    include: {
      department: {
        select: { id: true, name: true, code: true }
      },
      faculty: {
        select: { id: true, name: true, code: true }
      },
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: {
          curriculumCourses: true,
          electiveRules: true,
          curriculumConcentrations: true,
          curriculumBlacklists: true
        }
      }
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { updatedAt: 'desc' }
  });

  const total = await prisma.curriculum.count({
    where: {
      AND: [
        { createdById: session.user.id },
        search ? {
          name: { contains: search as string, mode: 'insensitive' }
        } : {},
        year ? { year: year as string } : {},
        isActive !== undefined ? { isActive: isActive === 'true' } : {}
      ]
    }
  });

  return res.status(200).json({
    curricula,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}
```

## 7. Testing Strategy

### Unit Tests
- Business logic validation
- Database operations
- Utility functions
- Validation schemas

### Integration Tests
- API endpoint testing
- Database transaction testing
- Authentication flow testing
- Error handling validation

### Performance Tests
- Load testing for concurrent users
- Database query optimization
- API response time validation
- Memory usage monitoring

## 8. Deployment Strategy

### Development Environment
```bash
# Set up development database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build application
npm run build

# Run database migrations
npm run db:migrate:prod

# Start production server
npm start
```

## 9. Monitoring & Maintenance

### Performance Monitoring
- API response time tracking
- Database query performance
- Memory usage monitoring
- Error rate tracking

### Security Monitoring
- Authentication attempt tracking
- Unauthorized access attempts
- Data modification auditing
- Security vulnerability scanning

### Maintenance Tasks
- Regular database cleanup
- Audit log archival
- Performance optimization
- Security updates

## 10. Next Steps

1. **Review and Approval**
   - Review all documentation
   - Approve database schema changes
   - Confirm API specifications
   - Validate business requirements

2. **Development Setup**
   - Set up development environment
   - Configure database connections
   - Install required dependencies
   - Set up testing frameworks

3. **Implementation**
   - Follow the phased implementation roadmap
   - Regular testing and validation
   - Frontend integration
   - Performance optimization

## 📚 Documentation Files

All documentation is available in the `prisma/` directory:
- `backend_requirements.md` - Complete backend requirements
- `enhanced_schema.prisma` - Enhanced database schema
- `schema_improvements.md` - Schema comparison and improvements
- `api_specification.md` - Complete API documentation
- `backend_plan.md` - This comprehensive plan

## 🔄 Status Summary

The Course Audit System is ready for backend development with:
- ✅ Complete frontend implementation
- ✅ Comprehensive backend requirements
- ✅ Enhanced database schema
- ✅ Detailed API specifications
- ✅ Implementation roadmap
- ✅ Testing strategy
- ✅ Deployment plan

The system supports all required features including global course pools, private curricula/concentrations/blacklists, flexible constraints, audit trails, and comprehensive course management capabilities.
