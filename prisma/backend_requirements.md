# Backend Requirements for Chairperson Course Audit System

## Overview
This document outlines all backend requirements for the Chairperson course audit system, including API endpoints, database operations, and business logic.

## Core Principles
1. **Global Course Pool**: All courses are globally accessible and searchable
2. **Private Ownership**: Curricula, concentrations, and blacklists are private to their creators
3. **Multi-tenant Architecture**: Each chairperson can manage their own curricula independently
4. **Audit Trail**: All changes should be logged for accountability

## 1. Authentication & Authorization

### Requirements:
- JWT-based authentication with NextAuth
- Role-based access control (Chairperson, Advisor, Student)
- Session management with proper token refresh
- Protected routes for chairperson-only functionality

### API Endpoints:
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

## 2. Course Management

### Requirements:
- Global course pool accessible to all users
- Course CRUD operations (Create, Read, Update, Delete)
- Course search and filtering
- Course prerequisites and corequisites management
- Course validation (unique codes, proper formatting)

### API Endpoints:
- `GET /api/courses` - List all courses with filtering/search
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get specific course
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course
- `GET /api/courses/search` - Search courses by code/name/description

### Database Operations:
- Course creation with validation
- Course updates with change tracking
- Course deletion with dependency checking
- Full-text search on course attributes

## 3. Curriculum Management

### Requirements:
- Private curricula per chairperson
- Curriculum CRUD operations
- Curriculum versioning and history
- Curriculum cloning/templating
- Curriculum validation and integrity checks

### API Endpoints:
- `GET /api/curricula` - List curricula for current user
- `POST /api/curricula` - Create new curriculum
- `GET /api/curricula/[id]` - Get specific curriculum
- `PUT /api/curricula/[id]` - Update curriculum
- `DELETE /api/curricula/[id]` - Delete curriculum
- `POST /api/curricula/[id]/clone` - Clone curriculum
- `GET /api/curricula/[id]/audit` - Run curriculum audit

### Database Operations:
- Curriculum creation with owner assignment
- Curriculum updates with versioning
- Curriculum deletion with cascade handling
- Access control validation

## 4. Blacklist Management

### Requirements:
- Multiple blacklists per chairperson
- Blacklist CRUD operations
- Course assignment to blacklists
- Blacklist application to curricula
- Blacklist inheritance and overrides

### API Endpoints:
- `GET /api/blacklists` - List blacklists for current user
- `POST /api/blacklists` - Create new blacklist
- `GET /api/blacklists/[id]` - Get specific blacklist
- `PUT /api/blacklists/[id]` - Update blacklist
- `DELETE /api/blacklists/[id]` - Delete blacklist
- `POST /api/blacklists/[id]/courses` - Add courses to blacklist
- `DELETE /api/blacklists/[id]/courses/[courseId]` - Remove course from blacklist

### Database Operations:
- Blacklist creation with owner assignment
- Course-blacklist relationship management
- Blacklist-curriculum assignment
- Cascade deletion handling

## 5. Concentration Management

### Requirements:
- Multiple concentrations per chairperson
- Concentration CRUD operations
- Course assignment to concentrations
- Concentration application to curricula
- Concentration validation and requirements

### API Endpoints:
- `GET /api/concentrations` - List concentrations for current user
- `POST /api/concentrations` - Create new concentration
- `GET /api/concentrations/[id]` - Get specific concentration
- `PUT /api/concentrations/[id]` - Update concentration
- `DELETE /api/concentrations/[id]` - Delete concentration
- `POST /api/concentrations/[id]/courses` - Add courses to concentration
- `DELETE /api/concentrations/[id]/courses/[courseId]` - Remove course from concentration

### Database Operations:
- Concentration creation with owner assignment
- Course-concentration relationship management
- Concentration-curriculum assignment
- Validation of concentration requirements

## 6. Curriculum Configuration

### Requirements:
- Course assignment to curricula
- Prerequisite and corequisite management
- Elective rules configuration
- Constraint management
- Semester planning

### API Endpoints:
- `GET /api/curricula/[id]/courses` - Get curriculum courses
- `POST /api/curricula/[id]/courses` - Add courses to curriculum
- `DELETE /api/curricula/[id]/courses/[courseId]` - Remove course from curriculum
- `GET /api/curricula/[id]/prerequisites` - Get prerequisite relationships
- `POST /api/curricula/[id]/prerequisites` - Add prerequisite relationship
- `DELETE /api/curricula/[id]/prerequisites/[id]` - Remove prerequisite relationship

### Database Operations:
- Course-curriculum relationship management
- Prerequisite chain validation
- Circular dependency detection
- Constraint validation

## 7. Elective Rules Management

### Requirements:
- Elective group creation and management
- Course pool assignment to elective groups
- Credit requirements per elective group
- Elective group validation

### API Endpoints:
- `GET /api/curricula/[id]/elective-rules` - Get elective rules
- `POST /api/curricula/[id]/elective-rules` - Create elective rule
- `PUT /api/curricula/[id]/elective-rules/[ruleId]` - Update elective rule
- `DELETE /api/curricula/[id]/elective-rules/[ruleId]` - Delete elective rule

### Database Operations:
- Elective rule creation and validation
- Course pool assignment
- Credit calculation and validation

## 8. Constraint Management

### Requirements:
- Multiple constraint types (GPA, credit hours, senior standing, etc.)
- Constraint validation during curriculum audit
- Constraint inheritance and overrides
- Custom constraint creation

### API Endpoints:
- `GET /api/curricula/[id]/constraints` - Get curriculum constraints
- `POST /api/curricula/[id]/constraints` - Add constraint
- `PUT /api/curricula/[id]/constraints/[constraintId]` - Update constraint
- `DELETE /api/curricula/[id]/constraints/[constraintId]` - Delete constraint

### Database Operations:
- Constraint creation and validation
- Constraint evaluation during audits
- Constraint inheritance management

## 9. Data Import/Export

### Requirements:
- Excel file import for courses and curricula
- Data validation during import
- Export functionality for curricula
- Bulk operations support

### API Endpoints:
- `POST /api/import/courses` - Import courses from Excel
- `POST /api/import/curriculum` - Import curriculum from Excel
- `GET /api/export/curriculum/[id]` - Export curriculum to Excel
- `GET /api/export/courses` - Export courses to Excel

### Database Operations:
- Bulk insert operations
- Data validation and error handling
- Transaction management for bulk operations

## 10. Audit Engine

### Requirements:
- Student transcript audit against curriculum
- Requirement validation
- Progress tracking
- Graduation eligibility checking

### API Endpoints:
- `POST /api/audit/student` - Run student audit
- `GET /api/audit/student/[id]` - Get audit results
- `GET /api/audit/curriculum/[id]/validate` - Validate curriculum integrity

### Database Operations:
- Student record retrieval
- Curriculum requirement matching
- Progress calculation
- Deficiency identification

## 11. Reporting & Analytics

### Requirements:
- Curriculum usage statistics
- Course enrollment tracking
- Audit success rates
- Progress reports

### API Endpoints:
- `GET /api/reports/curriculum/[id]/usage` - Get curriculum usage stats
- `GET /api/reports/courses/enrollment` - Get course enrollment stats
- `GET /api/reports/audit/success-rates` - Get audit success rates

### Database Operations:
- Aggregated data queries
- Statistical calculations
- Report generation

## 12. System Administration

### Requirements:
- User management
- System configuration
- Backup and recovery
- Performance monitoring

### API Endpoints:
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Database Operations:
- User CRUD operations
- System settings management
- Data integrity checks

## Database Schema Requirements

### Core Tables:
1. **Users** - User accounts with roles
2. **Courses** - Global course pool
3. **Curricula** - Private curricula per user
4. **Blacklists** - Private blacklists per user
5. **Concentrations** - Private concentrations per user
6. **Prerequisites** - Course prerequisite relationships
7. **CurriculumCourses** - Course assignments to curricula
8. **BlacklistCourses** - Course assignments to blacklists
9. **ConcentrationCourses** - Course assignments to concentrations
10. **ElectiveRules** - Elective group definitions
11. **Constraints** - Curriculum constraints
12. **AuditLogs** - Change tracking

### Relationships:
- One-to-many: User → Curricula, Blacklists, Concentrations
- Many-to-many: Courses ↔ Curricula, Blacklists, Concentrations
- One-to-many: Curricula → ElectiveRules, Constraints
- Many-to-many: Courses ↔ Prerequisites (self-referential)

### Indexes:
- Course code and name for search
- User ID for ownership queries
- Curriculum ID for related data
- Composite indexes for relationship tables

## Security Requirements

### Data Protection:
- Row-level security for private data
- Input validation and sanitization
- SQL injection prevention
- Cross-site scripting (XSS) protection

### Access Control:
- Role-based permissions
- Resource ownership validation
- API rate limiting
- Audit logging

## Performance Requirements

### Scalability:
- Support for 1000+ concurrent users
- Database query optimization
- Caching strategies
- Connection pooling

### Response Times:
- API responses < 500ms for CRUD operations
- Search results < 200ms
- Audit processing < 5 seconds
- Report generation < 10 seconds

## Error Handling

### Error Types:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Business logic errors

### Error Responses:
- Consistent error format
- Meaningful error messages
- Error codes for client handling
- Detailed logging for debugging

## Testing Requirements

### Unit Tests:
- Business logic validation
- Database operations
- API endpoint testing
- Error handling

### Integration Tests:
- End-to-end workflow testing
- Database transaction testing
- Authentication flow testing
- Data integrity testing

### Performance Tests:
- Load testing
- Stress testing
- Database performance testing
- API response time testing
