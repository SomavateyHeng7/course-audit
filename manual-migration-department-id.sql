-- Manual Migration Script: Add departmentId to User model
-- Run this when database becomes available

-- Step 1: Add departmentId column (initially nullable for migration)
ALTER TABLE users ADD COLUMN department_id TEXT;

-- Step 2: Update existing users to have a default department
-- Option A: Assign to first department of their faculty
UPDATE users 
SET department_id = (
  SELECT d.id 
  FROM departments d 
  WHERE d.faculty_id = users.faculty_id 
  LIMIT 1
) 
WHERE role IN ('CHAIRPERSON', 'STUDENT', 'ADVISOR');

-- Step 3: Make departmentId NOT NULL for all users
-- (After ensuring all users have a department assigned)
ALTER TABLE users 
ALTER COLUMN department_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT users_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id);

-- Step 5: Add index for performance
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_faculty_department ON users(faculty_id, department_id);

-- Verification queries:
-- SELECT COUNT(*) FROM users WHERE department_id IS NULL; -- Should return 0
-- SELECT u.name, u.email, f.name as faculty, d.name as department 
-- FROM users u 
-- JOIN faculties f ON u.faculty_id = f.id 
-- JOIN departments d ON u.department_id = d.id 
-- LIMIT 10;
