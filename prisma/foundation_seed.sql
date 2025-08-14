-- Foundation Seed Data for Course Audit System
-- Assumption University Structure
-- This script creates the essential foundational data needed for user creation and testing

-- Clear existing data (in proper order to respect foreign key constraints)
DELETE FROM "users";
DELETE FROM "departments";
DELETE FROM "faculties";

-- Reset sequences (if needed)
-- Note: CUID is used, so no sequence reset needed

-- Create Faculties
INSERT INTO "faculties" (id, name, code, "concentrationLabel", "createdAt", "updatedAt") VALUES
('faculty_engineering_001', 'Faculty of Engineering', 'ENG', 'Specializations', NOW(), NOW()),
('faculty_science_001', 'Faculty of Science', 'SCI', 'Concentrations', NOW(), NOW()),
('faculty_management_001', 'Martin de Tours School of Management and Economics', 'MDE', 'Concentrations', NOW(), NOW()),
('faculty_arts_001', 'Faculty of Arts', 'ARTS', 'Concentrations', NOW(), NOW()),
('faculty_nursing_001', 'Faculty of Nursing Science', 'NURS', 'Specializations', NOW(), NOW()),
('faculty_law_001', 'Faculty of Law', 'LAW', 'Concentrations', NOW(), NOW());

-- Create Departments under each Faculty
INSERT INTO "departments" (id, name, code, "facultyId", "createdAt", "updatedAt") VALUES
-- Engineering Departments
('dept_cs_001', 'Computer Science', 'CS', 'faculty_engineering_001', NOW(), NOW()),
('dept_it_001', 'Information Technology', 'IT', 'faculty_engineering_001', NOW(), NOW()),
('dept_ce_001', 'Computer Engineering', 'CE', 'faculty_engineering_001', NOW(), NOW()),
('dept_ie_001', 'Industrial Engineering', 'IE', 'faculty_engineering_001', NOW(), NOW()),

-- Science Departments
('dept_math_001', 'Mathematics', 'MATH', 'faculty_science_001', NOW(), NOW()),
('dept_bio_001', 'Biology', 'BIO', 'faculty_science_001', NOW(), NOW()),
('dept_chem_001', 'Chemistry', 'CHEM', 'faculty_science_001', NOW(), NOW()),
('dept_phys_001', 'Physics', 'PHYS', 'faculty_science_001', NOW(), NOW()),

-- Management and Economics Departments
('dept_bba_001', 'Business Administration', 'BBA', 'faculty_management_001', NOW(), NOW()),
('dept_acc_001', 'Accounting', 'ACC', 'faculty_management_001', NOW(), NOW()),
('dept_fin_001', 'Finance', 'FIN', 'faculty_management_001', NOW(), NOW()),
('dept_mkt_001', 'Marketing', 'MKT', 'faculty_management_001', NOW(), NOW()),
('dept_mgmt_001', 'Management', 'MGMT', 'faculty_management_001', NOW(), NOW()),
('dept_econ_001', 'Economics', 'ECON', 'faculty_management_001', NOW(), NOW()),

-- Arts Departments
('dept_eng_001', 'English', 'ENG', 'faculty_arts_001', NOW(), NOW()),
('dept_comm_001', 'Communication Arts', 'COMM', 'faculty_arts_001', NOW(), NOW()),
('dept_phil_001', 'Philosophy', 'PHIL', 'faculty_arts_001', NOW(), NOW()),

-- Nursing Department
('dept_nursing_001', 'Nursing Science', 'NURS', 'faculty_nursing_001', NOW(), NOW()),

-- Law Department
('dept_law_001', 'Law', 'LAW', 'faculty_law_001', NOW(), NOW());

-- Create Course Types for each Department
INSERT INTO "course_types" (id, name, color, "departmentId", "createdAt", "updatedAt") VALUES
-- Computer Science Course Types
('ct_cs_core_001', 'CS Core', '#3B82F6', 'dept_cs_001', NOW(), NOW()),
('ct_cs_math_001', 'CS Mathematics', '#8B5CF6', 'dept_cs_001', NOW(), NOW()),
('ct_cs_elective_001', 'CS Elective', '#10B981', 'dept_cs_001', NOW(), NOW()),
('ct_cs_capstone_001', 'CS Capstone', '#F59E0B', 'dept_cs_001', NOW(), NOW()),

-- BBA Course Types (from CSV analysis)
('ct_bba_core_001', 'Business Core', '#EF4444', 'dept_bba_001', NOW(), NOW()),
('ct_bba_gened_001', 'General Education', '#6B7280', 'dept_bba_001', NOW(), NOW()),
('ct_bba_english_001', 'English', '#EC4899', 'dept_bba_001', NOW(), NOW()),
('ct_bba_conc_001', 'Concentration', '#14B8A6', 'dept_bba_001', NOW(), NOW()),
('ct_bba_elective_001', 'Free Elective', '#84CC16', 'dept_bba_001', NOW(), NOW()),

-- Marketing Course Types
('ct_mkt_core_001', 'Marketing Core', '#F97316', 'dept_mkt_001', NOW(), NOW()),
('ct_mkt_gened_001', 'General Education', '#6B7280', 'dept_mkt_001', NOW(), NOW()),
('ct_mkt_english_001', 'English', '#EC4899', 'dept_mkt_001', NOW(), NOW()),
('ct_mkt_elective_001', 'Marketing Elective', '#06B6D4', 'dept_mkt_001', NOW(), NOW()),

-- Generic Course Types for other departments
('ct_core_gen_001', 'Core Courses', '#3B82F6', 'dept_it_001', NOW(), NOW()),
('ct_elective_gen_001', 'Elective Courses', '#10B981', 'dept_it_001', NOW(), NOW()),
('ct_core_gen_002', 'Core Courses', '#3B82F6', 'dept_ce_001', NOW(), NOW()),
('ct_elective_gen_002', 'Elective Courses', '#10B981', 'dept_ce_001', NOW(), NOW()),
('ct_core_gen_003', 'Core Courses', '#3B82F6', 'dept_ie_001', NOW(), NOW()),
('ct_elective_gen_003', 'Elective Courses', '#10B981', 'dept_ie_001', NOW(), NOW()),

-- Add more generic course types for other departments as needed
('ct_major_001', 'Major Courses', '#8B5CF6', 'dept_math_001', NOW(), NOW()),
('ct_support_001', 'Supporting Courses', '#10B981', 'dept_math_001', NOW(), NOW()),
('ct_major_002', 'Major Courses', '#8B5CF6', 'dept_bio_001', NOW(), NOW()),
('ct_lab_001', 'Laboratory Courses', '#F59E0B', 'dept_bio_001', NOW(), NOW());

-- Create sample admin/faculty users
INSERT INTO "users" (id, email, password, name, role, "facultyId", "createdAt", "updatedAt") VALUES
-- System Admin
('user_admin_001', 'admin@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'ADMIN', 'faculty_management_001', NOW(), NOW()),

-- Faculty Chairpersons/Admins for each faculty
('user_chair_eng_001', 'chair.engineering@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Engineering Faculty Chair', 'CHAIRPERSON', 'faculty_engineering_001', NOW(), NOW()),
('user_chair_sci_001', 'chair.science@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Science Faculty Chair', 'CHAIRPERSON', 'faculty_science_001', NOW(), NOW()),
('user_chair_mde_001', 'chair.management@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Management Faculty Chair', 'CHAIRPERSON', 'faculty_management_001', NOW(), NOW()),

-- Department Faculty/Advisors
('user_cs_faculty_001', 'cs.faculty@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CS Department Faculty', 'ADVISOR', 'faculty_engineering_001', NOW(), NOW()),
('user_bba_faculty_001', 'bba.faculty@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'BBA Department Faculty', 'ADVISOR', 'faculty_management_001', NOW(), NOW()),
('user_mkt_faculty_001', 'mkt.faculty@assumption.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marketing Department Faculty', 'ADVISOR', 'faculty_management_001', NOW(), NOW());

-- Verification query to check data
-- SELECT 'Faculties' as type, count(*) as count FROM faculties
-- UNION ALL
-- SELECT 'Departments' as type, count(*) as count FROM departments
-- UNION ALL
-- SELECT 'Course Types' as type, count(*) as count FROM course_types
-- UNION ALL
-- SELECT 'Users' as type, count(*) as count FROM users;

COMMIT;
