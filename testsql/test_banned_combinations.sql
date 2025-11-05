-- SQL to check banned combinations for CSX 3004 and test the functionality

-- First, let's find the CSX 3004 course
SELECT 'CSX 3004 Course Info:' as info;
SELECT id, code, name, credits 
FROM "Course" 
WHERE code = 'CSX 3004';

-- Check existing curriculum constraints that might involve CSX 3004
SELECT 'Existing Curriculum Constraints (all):' as info;
SELECT 
  id, 
  "curriculumId", 
  type, 
  name, 
  description, 
  "isRequired",
  config::text as config_text,
  "createdAt"
FROM "CurriculumConstraint" 
WHERE type = 'CUSTOM'
ORDER BY "createdAt" DESC;

-- Check for specific banned combinations involving CSX 3004
SELECT 'Banned Combinations involving CSX 3004:' as info;
SELECT 
  cc.id,
  cc."curriculumId",
  cc.name,
  cc.description,
  cc.config::text as config_text,
  c.name as curriculum_name
FROM "CurriculumConstraint" cc
JOIN "Curriculum" c ON c.id = cc."curriculumId"
WHERE cc.type = 'CUSTOM' 
  AND cc.config::text LIKE '%banned_combination%'
  AND cc.config::text LIKE '%cmcogpvw6000eudxczvazvqys%';

-- Check all curricula to see which ones exist
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

-- Insert a test banned combination for CSX 3004 + CSX 7777
-- (Replace 'YOUR_CURRICULUM_ID_HERE' with actual curriculum ID from above query)
/*
INSERT INTO "CurriculumConstraint" (
  id, 
  "curriculumId", 
  type, 
  name, 
  description, 
  "isRequired", 
  config, 
  "createdAt", 
  "updatedAt"
) VALUES (
  'test_banned_csx3004_csx7777',
  'YOUR_CURRICULUM_ID_HERE', -- Replace with actual curriculum ID
  'CUSTOM',
  'Banned: CSX 3004 + CSX 7777',
  'Students cannot take CSX 3004 (Programming Language) and CSX 7777 (wrk itttt) together',
  true,
  '{
    "type": "banned_combination", 
    "courses": [
      {
        "id": "cmcogpvw6000eudxczvazvqys", 
        "code": "CSX 3004", 
        "name": "Programming Language"
      }, 
      {
        "id": "cmcuvxne30002udjkqy8rc71a", 
        "code": "CSX 7777", 
        "name": "wrk itttt"
      }
    ]
  }'::json,
  NOW(),
  NOW()
);
*/

-- Query to verify the insertion worked
SELECT 'Verification - Check if banned combination was added:' as info;
SELECT 
  id,
  name,
  description,
  config->'courses' as banned_courses,
  "createdAt"
FROM "CurriculumConstraint" 
WHERE type = 'CUSTOM' 
  AND config->>'type' = 'banned_combination'
  AND config::text LIKE '%CSX 3004%';

-- Clean up test data (uncomment to remove test entries)
/*
DELETE FROM "CurriculumConstraint" 
WHERE id = 'test_banned_csx3004_csx7777';
*/

-- For Checking all the Banned combination for a course(currently CSX 3004)

-- This section is for checking all the banned combinations
SELECT * FROM curriculum_constraints WHERE type = 'CUSTOM' AND config::text LIKE '%banned_combination%';