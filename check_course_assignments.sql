-- Query to check course type assignments for curriculum "cmeazktn7000rudfwo5zdd4j9"

-- First, let's see the curriculum details
SELECT 
    c.id as curriculum_id,
    c.name as curriculum_name,
    c."departmentId",
    d.name as department_name,
    d."facultyId",
    f.name as faculty_name
FROM curricula c
JOIN departments d ON c."departmentId" = d.id
JOIN faculties f ON d."facultyId" = f.id
WHERE c.id = 'cmeazktn7000rudfwo5zdd4j9';

-- Check courses in the curriculum
SELECT 
    cc.id as curriculum_course_id,
    c.id as course_id,
    c.code as course_code,
    c.name as course_name,
    c.credits,
    c."creditHours"
FROM "curriculum_courses" cc
JOIN courses c ON cc."courseId" = c.id
WHERE cc."curriculumId" = 'cmeazktn7000rudfwo5zdd4j9'
ORDER BY c.code;

-- Check course type assignments for courses in this curriculum
SELECT 
    dct.id as assignment_id,
    c.code as course_code,
    c.name as course_name,
    ct.name as course_type_name,
    ct.color as course_type_color,
    dct."departmentId",
    dct."assignedAt",
    u.name as assigned_by
FROM "department_course_types" dct
JOIN courses c ON dct."courseId" = c.id
JOIN "course_types" ct ON dct."courseTypeId" = ct.id
LEFT JOIN users u ON dct."assignedById" = u.id
WHERE dct."courseId" IN (
    SELECT cc."courseId" 
    FROM "curriculum_courses" cc 
    WHERE cc."curriculumId" = 'cmeazktn7000rudfwo5zdd4j9'
)
ORDER BY c.code;

-- Check all course types available in the department
SELECT 
    ct.id,
    ct.name,
    ct.color,
    ct."departmentId",
    d.name as department_name
FROM "course_types" ct
JOIN departments d ON ct."departmentId" = d.id
WHERE ct."departmentId" = (
    SELECT c."departmentId" 
    FROM curricula c 
    WHERE c.id = 'cmeazktn7000rudfwo5zdd4j9'
);

-- Summary: Courses with and without assignments
SELECT 
    c.code,
    c.name,
    c.credits,
    c."creditHours",
    CASE 
        WHEN dct.id IS NOT NULL THEN ct.name 
        ELSE 'No Category Assigned' 
    END as category_status,
    ct.color
FROM "curriculum_courses" cc
JOIN courses c ON cc."courseId" = c.id
LEFT JOIN "department_course_types" dct ON c.id = dct."courseId" 
    AND dct."departmentId" = (
        SELECT cur."departmentId" 
        FROM curricula cur 
        WHERE cur.id = 'cmeazktn7000rudfwo5zdd4j9'
    )
LEFT JOIN "course_types" ct ON dct."courseTypeId" = ct.id
WHERE cc."curriculumId" = 'cmeazktn7000rudfwo5zdd4j9'
ORDER BY c.code;
