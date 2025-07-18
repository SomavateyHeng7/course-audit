-- Test SQL for Elective Rules API functionality
-- This file tests the elective rules backend implementation

-- First, check if there are any curricula to work with
SELECT 'Available Curricula:' as info;
SELECT 
  id, 
  name, 
  version,
  "createdById",
  "createdAt"
FROM "Curriculum"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check current elective rules (if any)
SELECT 'Existing Elective Rules:' as info;
SELECT 
  er.id,
  er."curriculumId",
  er.category,
  er."requiredCredits",
  er.description,
  c.name as curriculum_name,
  er."createdAt"
FROM "ElectiveRule" er
JOIN "Curriculum" c ON c.id = er."curriculumId"
ORDER BY er."createdAt" DESC;

-- Check curriculum courses for a specific curriculum
-- Replace 'YOUR_CURRICULUM_ID_HERE' with actual curriculum ID from above
/*
SELECT 'Curriculum Courses for Testing:' as info;
SELECT 
  cc.id as curriculum_course_id,
  co.id as course_id,
  co.code,
  co.name,
  co.category,
  co.credits,
  cc."isRequired",
  cc.semester,
  cc.year
FROM "CurriculumCourse" cc
JOIN "Course" co ON co.id = cc."courseId"
WHERE cc."curriculumId" = 'YOUR_CURRICULUM_ID_HERE'
ORDER BY co.category, co.code;
*/

-- Check course categories available in the system
SELECT 'Available Course Categories:' as info;
SELECT DISTINCT category, COUNT(*) as course_count
FROM "Course"
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;

-- Insert sample elective rules for testing (uncomment and replace curriculum ID)
/*
INSERT INTO "ElectiveRule" (
  id,
  "curriculumId",
  category,
  "requiredCredits",
  description,
  "createdAt",
  "updatedAt"
) VALUES 
(
  'test_major_elective_rule',
  'YOUR_CURRICULUM_ID_HERE',
  'Major Elective',
  12,
  'Students must complete 12 credits from major elective courses',
  NOW(),
  NOW()
),
(
  'test_free_elective_rule',
  'YOUR_CURRICULUM_ID_HERE', 
  'Free Elective',
  6,
  'Free elective credits allowing students to choose any courses',
  NOW(),
  NOW()
);
*/

-- Query to verify elective rules were created
SELECT 'Verification - Check if elective rules were added:' as info;
SELECT 
  id,
  category,
  "requiredCredits",
  description,
  "createdAt"
FROM "ElectiveRule"
WHERE category IN ('Major Elective', 'Free Elective')
ORDER BY "createdAt" DESC;

-- Test credit breakdown calculation
SELECT 'Credit Breakdown by Category:' as info;
SELECT 
  co.category,
  SUM(CASE WHEN cc."isRequired" = true THEN co.credits ELSE 0 END) as required_credits,
  SUM(CASE WHEN cc."isRequired" = false THEN co.credits ELSE 0 END) as elective_credits,
  SUM(co.credits) as total_credits,
  COUNT(*) as total_courses
FROM "CurriculumCourse" cc
JOIN "Course" co ON co.id = cc."courseId"
WHERE co.category IS NOT NULL
GROUP BY co.category
ORDER BY co.category;

-- Check audit logs for elective rule operations
SELECT 'Recent Audit Logs for Elective Rules:' as info;
SELECT 
  al.id,
  al."entityType",
  al."entityId",
  al.action,
  al.changes,
  al.description,
  u.name as user_name,
  al."createdAt"
FROM "AuditLog" al
JOIN "User" u ON u.id = al."userId"
WHERE al."entityType" = 'ElectiveRule'
ORDER BY al."createdAt" DESC
LIMIT 10;

-- Clean up test data (uncomment to remove test entries)
/*
DELETE FROM "ElectiveRule" 
WHERE id IN ('test_major_elective_rule', 'test_free_elective_rule');
*/

-- API Testing Guidelines:
-- 
-- 1. GET /api/curricula/[id]/elective-rules
--    - Should return electiveRules, courseCategories, and curriculumCourses
--    - Only accessible by curriculum owner
--
-- 2. POST /api/curricula/[id]/elective-rules
--    - Create new elective rule with category, requiredCredits, description
--    - Should prevent duplicates for same category
--
-- 3. PUT /api/curricula/[id]/elective-rules/[ruleId]
--    - Update requiredCredits and/or description
--    - Should create audit log
--
-- 4. DELETE /api/curricula/[id]/elective-rules/[ruleId]
--    - Remove elective rule
--    - Should create audit log
--
-- 5. PUT /api/curricula/[id]/elective-rules/settings
--    - Update freeElectiveCredits and courseRequirements
--    - Should handle batch updates

-- Expected JSON response format for GET /api/curricula/[id]/elective-rules:
/*
{
  "electiveRules": [
    {
      "id": "rule_id",
      "curriculumId": "curriculum_id",
      "category": "Major Elective",
      "requiredCredits": 12,
      "description": "Students must complete 12 credits from major elective courses",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "courseCategories": ["Core", "Major", "Major Elective", "General Education", "Free Elective"],
  "curriculumCourses": [
    {
      "id": "course_id",
      "code": "CSX 3101",
      "name": "Mobile App Development",
      "category": "Major Elective",
      "credits": 3,
      "isRequired": false,
      "semester": "Fall",
      "year": 3
    }
  ]
}
*/

-- Test free elective name customization
SELECT 'Testing Free Elective Name Updates:' as info;

-- Create a free elective rule with custom name
INSERT INTO "ElectiveRule" ("curriculumId", category, "requiredCredits", description)
VALUES 
  ('clx123456789', 'General Electives', 6, 'General electives allowing students to choose any courses'),
  ('clx123456789', 'Open Electives', 9, 'Open electives for broad learning')
ON CONFLICT ("curriculumId", category) DO UPDATE SET
  "requiredCredits" = EXCLUDED."requiredCredits",
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- Verify the insertion
SELECT 'Custom Free Elective Rules:' as info;
SELECT 
  id,
  category,
  "requiredCredits",
  description,
  "createdAt",
  "updatedAt"
FROM "ElectiveRule"
WHERE "curriculumId" = 'clx123456789'
  AND (category ILIKE '%elective%' OR category ILIKE '%free%' OR category ILIKE '%general%' OR category ILIKE '%open%')
ORDER BY "createdAt";

-- Test updating free elective name
UPDATE "ElectiveRule" 
SET 
  category = 'Flexible Electives',
  description = 'Flexible electives allowing students maximum choice'
WHERE "curriculumId" = 'clx123456789' 
  AND category ILIKE '%general%';

-- Verify the update
SELECT 'Updated Free Elective Name:' as info;
SELECT 
  id,
  category,
  "requiredCredits",
  description,
  "updatedAt"
FROM "ElectiveRule"
WHERE "curriculumId" = 'clx123456789'
  AND category = 'Flexible Electives';

-- Test curriculum isolation - ensure elective rules only affect their specific curriculum
SELECT 'Testing Curriculum Isolation:' as info;

-- Check that elective rules are isolated by curriculum
-- This should show that each curriculum has its own separate elective rules
SELECT 
  c.id as curriculum_id,
  c.name as curriculum_name,
  c."createdById",
  COUNT(er.id) as elective_rules_count,
  STRING_AGG(er.category, ', ') as rule_categories
FROM "Curriculum" c
LEFT JOIN "ElectiveRule" er ON er."curriculumId" = c.id
GROUP BY c.id, c.name, c."createdById"
ORDER BY c."createdAt" DESC;

-- Verify foreign key constraints and cascade deletion
SELECT 'Testing Cascade Constraints:' as info;
SELECT 
  schemaname,
  tablename,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
JOIN pg_class ON pg_class.oid = conrelid 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE tablename = 'elective_rules'
  AND schemaname = 'public';

-- Test unique constraint on (curriculumId, category)
SELECT 'Testing Unique Constraint (curriculumId, category):' as info;
-- This should show the unique constraint exists to prevent duplicate categories per curriculum
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'elective_rules'
  AND schemaname = 'public'
  AND indexdef LIKE '%UNIQUE%';
