import { parseTranscriptCSV, TranscriptParseResult } from './ExcelUtils';

// Sample transcript data from the Credits.csv file structure
const sampleTranscriptCSV = `
GENERAL EDUCATION COURSES (30 Credits),,,,,
E1,Introduction to Islamic Studies,ENG101,3,B+,
E2,English Composition,ENG102,3,A-,
E3,Business Communication,ENG103,3,B,
E4,Advanced English,ENG104,3,A,
E5,Pakistani Culture & Civilization,URD101,3,B+,
E6,Urdu (Functional),URD102,3,A,
E7,Pakistan Studies,PST101,3,B,
E8,Philosophy,PHI101,3,A-,
E9,Introduction to Psychology,PSY101,3,B+,
E10,Introduction to Sociology,SOC101,3,A,

FOUNDATION COURSES (18 Credits),,,,,
F1,Introduction to Computing,CS101,3,A,
F2,Programming Fundamentals,CS102,3,A-,
F3,Object Oriented Programming,CS103,3,B+,
F4,Discrete Mathematics,MTH104,3,A,
F5,Calculus and Analytical Geometry,MTH105,4,B,
F6,Linear Algebra,MTH106,2,A-,

CORE COURSES (78 Credits),,,,,
C1,Data Structures and Algorithms,CS201,4,A,
C2,Computer Organization and Assembly Language,CS202,4,B+,
C3,Database Systems,CS301,3,A-,
C4,Operating Systems,CS302,3,B,
C5,Software Engineering,CS303,3,A,
C6,Computer Networks,CS401,3,B+,
C7,Web Engineering,CS402,3,A-,
C8,Artificial Intelligence,CS403,3,A,
C9,Human Computer Interaction,CS404,3,B,
C10,Final Year Project - I,CS491,3,,Currently Taking
C11,Final Year Project - II,CS492,3,,Pending

ELECTIVE COURSES (12 Credits),,,,,
E1,Mobile Application Development,CS501,3,A,
E2,Machine Learning,CS502,3,B+,
E3,Cybersecurity,CS503,3,A-,
E4,Cloud Computing,CS504,3,,Currently Taking

Total Credits: 138,,,,,
`;

/**
 * Test the transcript parsing functionality
 */
export function testTranscriptParsing(): void {
  console.log('Testing transcript CSV parsing...\n');
  
  try {
    const result: TranscriptParseResult = parseTranscriptCSV(sampleTranscriptCSV);
    
    console.log('Parse Result Summary:');
    console.log('===================');
    console.log(`Total courses parsed: ${result.summary.totalCourses}`);
    console.log(`Completed courses: ${result.summary.completedCourses}`);
    console.log(`In-progress courses: ${result.summary.inProgressCourses}`);
    console.log(`Pending courses: ${result.summary.pendingCourses}`);
    console.log(`Total credits completed: ${result.summary.totalCreditsCompleted}`);
    console.log(`Categories found: ${result.summary.categoriesFound.join(', ')}`);
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
    console.log('\nSample Courses by Category:');
    console.log('===========================');
    
    const categorizedCourses = result.courses.reduce((acc, course) => {
      const category = course.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(course);
      return acc;
    }, {} as Record<string, typeof result.courses>);
    
    Object.entries(categorizedCourses).forEach(([category, courses]) => {
      console.log(`\n${category} (${courses.length} courses):`);
      courses.slice(0, 3).forEach(course => {
        console.log(`  ${course.courseCode}: ${course.courseName} (${course.credits} credits) - ${course.status} ${course.grade ? `[${course.grade}]` : ''}`);
      });
      if (courses.length > 3) {
        console.log(`  ... and ${courses.length - 3} more`);
      }
    });
    
    console.log('\nStatus Distribution:');
    console.log('===================');
    const statusCounts = result.courses.reduce((acc, course) => {
      acc[course.status || 'UNKNOWN'] = (acc[course.status || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} courses`);
    });
    
  } catch (error) {
    console.error('Parsing failed:', error);
  }
}

// Export for potential use in development/testing
export { sampleTranscriptCSV };
