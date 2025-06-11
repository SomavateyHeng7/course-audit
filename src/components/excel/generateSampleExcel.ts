import * as XLSX from 'xlsx';

export function generateSampleExcel() {
  const workbook = XLSX.utils.book_new();

  // Sample courses data
  const coursesData = [
    {
      code: 'CS101',
      name: 'Introduction to Computer Science',
      credits: 3,
      description: 'Basic concepts of computer science',
    },
    {
      code: 'CS102',
      name: 'Data Structures',
      credits: 4,
      description: 'Study of fundamental data structures',
    },
  ];

  // Sample students data
  const studentsData = [
    {
      id: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      program: 'Computer Science',
    },
    {
      id: 'S002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      program: 'Computer Science',
    },
  ];

  // Sample programs data
  const programsData = [
    {
      code: 'CS',
      name: 'Computer Science',
      department: 'Computer Science Department',
      totalCredits: 120,
    },
    {
      code: 'IT',
      name: 'Information Technology',
      department: 'Computer Science Department',
      totalCredits: 120,
    },
  ];

  // Create worksheets
  const coursesSheet = XLSX.utils.json_to_sheet(coursesData);
  const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
  const programsSheet = XLSX.utils.json_to_sheet(programsData);

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses');
  XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');
  XLSX.utils.book_append_sheet(workbook, programsSheet, 'Programs');

  return workbook;
} 