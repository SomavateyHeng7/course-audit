-- Check which indexes exist on course_types table
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'course_types' 
AND schemaname = 'public';
