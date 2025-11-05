// Simple test script to verify CSV parsing
const { parseTranscriptCSV } = require('./src/components/excel/ExcelUtils.ts');

const sampleCSV = `
GENERAL EDUCATION COURSES (30 Credits),,,,,
E1,Introduction to Islamic Studies,ENG101,3,B+,
E2,English Composition,ENG102,3,A-,
E3,Business Communication,ENG103,3,B,

FOUNDATION COURSES (18 Credits),,,,,
F1,Introduction to Computing,CS101,3,A,
F2,Programming Fundamentals,CS102,3,A-,
F3,Object Oriented Programming,CS103,3,B+,

CORE COURSES (78 Credits),,,,,
C1,Data Structures and Algorithms,CS201,4,A,
C2,Computer Organization and Assembly Language,CS202,4,B+,
C10,Final Year Project - I,CS491,3,,Currently Taking
C11,Final Year Project - II,CS492,3,,Pending
`;

try {
  console.log('Testing transcript parsing...');
  const result = parseTranscriptCSV(sampleCSV);
  console.log('Success! Parsed', result.summary.totalCourses, 'courses');
  console.log('Categories:', result.summary.categoriesFound.join(', '));
  console.log('Completed:', result.summary.completedCourses);
  console.log('In Progress:', result.summary.inProgressCourses);
  console.log('Sample course:', result.courses[0]);
} catch (error) {
  console.error('Parsing failed:', error.message);
}
