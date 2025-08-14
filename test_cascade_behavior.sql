-- Test Cascade Behavior for Course Type Operations
-- This script tests what happens when a course type is deleted or modified

-- 1. Check current state of course type assignments
SELECT 
  ct.name as course_type_name,
  ct.color as course_type_color,
  d.name as department_name,
  c.code as course_code,
  c.name as course_name,
  dct.assignedAt
FROM "department_course_types" dct
JOIN "course_types" ct ON dct."courseTypeId" = ct.id
JOIN "courses" c ON dct."courseId" = c.id
JOIN "departments" d ON dct."departmentId" = d.id
ORDER BY ct.name, c.code;

-- 2. Count assignments per course type
SELECT 
  ct.name as course_type_name,
  COUNT(dct.id) as assignment_count
FROM "course_types" ct
LEFT JOIN "department_course_types" dct ON ct.id = dct."courseTypeId"
GROUP BY ct.id, ct.name
ORDER BY assignment_count DESC;

-- 3. Test: Find course types that can be safely deleted (no assignments)
SELECT 
  ct.id,
  ct.name,
  ct.color,
  d.name as department_name,
  COUNT(dct.id) as assignment_count
FROM "course_types" ct
JOIN "departments" d ON ct."departmentId" = d.id
LEFT JOIN "department_course_types" dct ON ct.id = dct."courseTypeId"
GROUP BY ct.id, ct.name, ct.color, d.name
HAVING COUNT(dct.id) = 0;

-- 4. Test: Find course types that cannot be deleted (have assignments)
SELECT 
  ct.id,
  ct.name,
  ct.color,
  d.name as department_name,
  COUNT(dct.id) as assignment_count,
  STRING_AGG(c.code, ', ') as assigned_courses
FROM "course_types" ct
JOIN "departments" d ON ct."departmentId" = d.id
LEFT JOIN "department_course_types" dct ON ct.id = dct."courseTypeId"
LEFT JOIN "courses" c ON dct."courseId" = c.id
GROUP BY ct.id, ct.name, ct.color, d.name
HAVING COUNT(dct.id) > 0;

-- 5. Test: Simulate what happens when a course type is deleted
-- (This shows the cascade delete behavior)
-- Note: This is just a SELECT to show what would be affected
-- The actual DELETE would be handled by the onDelete: Cascade in the schema

SELECT 
  'WOULD DELETE CourseType:' as action,
  ct.id,
  ct.name,
  ct.color
FROM "course_types" ct
WHERE ct.name = 'Core' -- Example course type
UNION ALL
SELECT 
  'WOULD CASCADE DELETE DepartmentCourseType:' as action,
  dct.id,
  CONCAT('Assignment for course ', c.code),
  ''
FROM "department_course_types" dct
JOIN "course_types" ct ON dct."courseTypeId" = ct.id
JOIN "courses" c ON dct."courseId" = c.id
WHERE ct.name = 'Core'; -- Example course type

-- 6. Test: Check for orphaned assignments (should be none with proper cascade)
SELECT 
  dct.id,
  dct."courseId",
  dct."courseTypeId",
  'ORPHANED - CourseType does not exist' as issue
FROM "department_course_types" dct
LEFT JOIN "course_types" ct ON dct."courseTypeId" = ct.id
WHERE ct.id IS NULL
UNION ALL
SELECT 
  dct.id,
  dct."courseId",
  dct."courseTypeId",
  'ORPHANED - Course does not exist' as issue
FROM "department_course_types" dct
LEFT JOIN "courses" c ON dct."courseId" = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 
  dct.id,
  dct."courseId",
  dct."courseTypeId",
  'ORPHANED - Department does not exist' as issue
FROM "department_course_types" dct
LEFT JOIN "departments" d ON dct."departmentId" = d.id
WHERE d.id IS NULL;

-- 7. Test: Verify referential integrity
-- All course type assignments should have valid references
SELECT 
  COUNT(*) as total_assignments,
  COUNT(ct.id) as valid_course_type_refs,
  COUNT(c.id) as valid_course_refs,
  COUNT(d.id) as valid_department_refs
FROM "department_course_types" dct
LEFT JOIN "course_types" ct ON dct."courseTypeId" = ct.id
LEFT JOIN "courses" c ON dct."courseId" = c.id
LEFT JOIN "departments" d ON dct."departmentId" = d.id;
