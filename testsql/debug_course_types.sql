-- Run this in your database to check course type assignments for curriculum cmeazktn7000rudfwo5zdd4j9

-- First, check if there are any course type assignments at all
SELECT COUNT(*) as total_assignments FROM "department_course_types";

-- Check the specific curriculum
SELECT 
    c.id as curriculum_id,
    c.name as curriculum_name,
    c."departmentId",
    d.name as department_name
FROM curricula c
JOIN departments d ON c."departmentId" = d.id
WHERE c.id = 'cmeazktn7000rudfwo5zdd4j9';

-- Check courses in this curriculum and their assignments
SELECT 
    cc.id as curriculum_course_id,
    c.id as course_id,
    c.code as course_code,
    c.name as course_name,
    c.credits,
    c."creditHours",
    CASE 
        WHEN dct.id IS NOT NULL THEN ct.name 
        ELSE 'No Assignment' 
    END as course_type_assignment,
    ct.color as course_type_color,
    dct."assignedAt",
    dct."departmentId" as assignment_dept_id
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

-- Check what course types are available in this department
SELECT 
    ct.id,
    ct.name,
    ct.color,
    ct."departmentId"
FROM "course_types" ct
WHERE ct."departmentId" = (
    SELECT c."departmentId" 
    FROM curricula c 
    WHERE c.id = 'cmeazktn7000rudfwo5zdd4j9'
);
