# Database Schema Analysis & Optimization Report

## Overview
This document analyzes the current Prisma schema for the Course Audit System, identifying unused/unnecessary columns, potential optimization opportunities, and recommended solutions.

## Current Schema Issues

### 1. Unused/Underutilized Columns

#### User Model
- **`gpa`** - Currently unused in the application
- **`credits`** - Currently unused in the application  
- **`scholarshipHour`** - Currently unused in the application
- **`advisorId`** - Relationship exists but advisor functionality not implemented

#### Course Model
- **`requiresPermission`** - Defined but not used in course selection logic
- **`summerOnly`** - Defined but not enforced in scheduling
- **`requiresSeniorStanding`** - Defined but not validated
- **`minCreditThreshold`** - Defined but not used in senior standing calculation

#### CurriculumCourse Model
- **`semester`** - Defined but not used in curriculum planning
- **`year`** - Defined but not used in curriculum planning
- **`position`** - Defined but not used for ordering courses

#### Curriculum Model
- **`version`** - Versioning system exists but not implemented in UI
- **`isActive`** - Flag exists but no active/inactive curriculum management

### 2. Complex Relationship Structure

#### Over-normalized Junction Tables
- Multiple junction tables that could be simplified
- Some relationships might be better as direct foreign keys

#### Audit System Overhead
- Comprehensive audit system that may not be fully utilized
- AuditLog table has many nullable foreign keys

### 3. Potential Performance Issues

#### Missing Indexes
- Some frequently queried fields lack proper indexing
- Composite indexes could improve query performance

#### JSON Columns
- `CurriculumConstraint.config` uses JSON which can be hard to query
- `AuditLog.changes` uses JSON which affects search performance

## Recommended Solutions

### Phase 1: Immediate Cleanup (Low Risk)

#### Remove Unused Columns
```sql
-- Remove unused user columns
ALTER TABLE users DROP COLUMN gpa;
ALTER TABLE users DROP COLUMN credits;
ALTER TABLE users DROP COLUMN scholarship_hour;

-- Remove unused course constraint columns (if not planned for immediate use)
ALTER TABLE courses DROP COLUMN requires_permission;
ALTER TABLE courses DROP COLUMN summer_only;
ALTER TABLE courses DROP COLUMN requires_senior_standing;
ALTER TABLE courses DROP COLUMN min_credit_threshold;

-- Remove unused curriculum course columns
ALTER TABLE curriculum_courses DROP COLUMN semester;
ALTER TABLE curriculum_courses DROP COLUMN year;
ALTER TABLE curriculum_courses DROP COLUMN position;
```

#### Simplify Unused Features
```sql
-- Remove versioning if not used
ALTER TABLE curricula DROP COLUMN version;
-- Or implement proper versioning UI

-- Remove isActive if not used
ALTER TABLE curricula DROP COLUMN is_active;
-- Or implement active/inactive curriculum management
```

### Phase 2: Structural Optimization (Medium Risk)

#### Consolidate Junction Tables
Consider if some junction tables can be simplified:

```prisma
// Instead of separate ConcentrationCourse table
// Add concentrationId directly to Course model for simpler 1:many
model Course {
  // ... existing fields
  concentrationId String?
  concentration   Concentration? @relation(fields: [concentrationId], references: [id])
}
```

#### Optimize Audit System
```prisma
// Simplify audit log to focus on essential tracking
model AuditLog {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  
  entityType  String     // "Curriculum", "Course", etc.
  entityId    String     
  action      String     // "CREATE", "UPDATE", "DELETE"
  summary     String     // Human-readable change summary
  
  createdAt   DateTime   @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Phase 3: Feature Implementation (High Risk)

#### Implement Missing Features
1. **Advisor System**: Complete the advisor-student relationship
2. **Course Constraints**: Implement permission, summer-only, senior standing checks
3. **Curriculum Planning**: Use semester/year fields for course scheduling
4. **Versioning**: Implement curriculum versioning system

### Phase 4: Performance Optimization

#### Add Strategic Indexes
```sql
-- Improve query performance
CREATE INDEX idx_curriculum_department_active ON curricula(department_id, is_active);
CREATE INDEX idx_course_category_active ON courses(category, is_active);
CREATE INDEX idx_user_faculty_role ON users(faculty_id, role);
```

#### Consider Materialized Views
For complex queries involving multiple joins:
```sql
CREATE MATERIALIZED VIEW curriculum_summary AS
SELECT 
  c.id,
  c.name,
  c.year,
  d.name as department_name,
  f.name as faculty_name,
  COUNT(cc.course_id) as total_courses
FROM curricula c
JOIN departments d ON c.department_id = d.id
JOIN faculties f ON c.faculty_id = f.id
LEFT JOIN curriculum_courses cc ON c.id = cc.curriculum_id
GROUP BY c.id, c.name, c.year, d.name, f.name;
```

## Implementation Priority

### High Priority (Immediate)
1. Fix faculty-specific concentration label issue ✅
2. Remove unused user fields (gpa, credits, scholarshipHour)
3. Add proper error handling for missing relationships

### Medium Priority (Next Sprint)
1. Implement course constraint validation
2. Add curriculum active/inactive management
3. Optimize junction table queries

### Low Priority (Future)
1. Implement advisor system
2. Add curriculum versioning
3. Create materialized views for reporting

## Migration Strategy

### Safe Migration Approach
1. **Backup Database**: Always backup before schema changes
2. **Feature Flags**: Use feature flags to gradually enable new functionality
3. **Rollback Plan**: Ensure each migration can be rolled back
4. **Testing**: Test migrations on staging environment first

### Example Migration Script
```sql
-- Phase 1: Remove unused columns (safe)
BEGIN;

-- Backup data if needed
CREATE TABLE users_backup AS SELECT * FROM users;

-- Remove unused columns
ALTER TABLE users DROP COLUMN IF EXISTS gpa;
ALTER TABLE users DROP COLUMN IF EXISTS credits;
ALTER TABLE users DROP COLUMN IF EXISTS scholarship_hour;

-- Verify data integrity
-- Check that no critical functionality is broken

COMMIT;
```

## Monitoring & Maintenance

### Regular Schema Health Checks
1. **Monthly**: Review query performance and slow queries
2. **Quarterly**: Analyze table sizes and growth patterns
3. **Annually**: Full schema review and optimization

### Recommended Tools
- **pganalyze** or **pg_stat_statements** for query analysis
- **EXPLAIN ANALYZE** for query plan optimization
- **pg_stat_user_tables** for table usage statistics

## Conclusion

The current schema is comprehensive but contains unused elements that can be safely removed or optimized. The immediate focus should be on:

1. Fixing the faculty-specific concentration label issue ✅
2. Removing unused columns to reduce complexity
3. Implementing missing constraint validations
4. Optimizing query performance through better indexing

This cleanup will improve maintainability, reduce confusion for new developers, and potentially improve performance.
