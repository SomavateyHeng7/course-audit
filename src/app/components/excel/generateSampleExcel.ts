import * as XLSX from 'xlsx';
import { ExcelData } from './ExcelUtils';

export const generateSampleExcelFile = (): Blob => {
  // Sample data
  const sampleData: ExcelData = {
    studentId: '6501234567',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    curriculum: '2566',
    courses: [
      {
        courseCode: '2110101',
        courseName: 'Computer Programming',
        credits: 3,
        grade: 'A',
        semester: '1/2566',
        status: 'completed'
      },
      {
        courseCode: '2110102',
        courseName: 'Digital Systems',
        credits: 3,
        grade: 'B+',
        semester: '1/2566',
        status: 'completed'
      },
      {
        courseCode: '2110103',
        courseName: 'Data Structures',
        credits: 3,
        grade: 'A-',
        semester: '2/2566',
        status: 'completed'
      },
      {
        courseCode: '2110104',
        courseName: 'Computer Architecture',
        credits: 3,
        grade: 'B',
        semester: '2/2566',
        status: 'completed'
      },
      {
        courseCode: '2110105',
        courseName: 'Database Systems',
        credits: 3,
        grade: 'A',
        semester: '1/2567',
        status: 'completed'
      },
      {
        courseCode: '2110106',
        courseName: 'Software Engineering',
        credits: 3,
        semester: '2/2567',
        status: 'ongoing'
      },
      {
        courseCode: '2110107',
        courseName: 'Computer Networks',
        credits: 3,
        status: 'pending'
      },
      {
        courseCode: '2110108',
        courseName: 'Operating Systems',
        credits: 3,
        status: 'pending'
      },
      {
        courseCode: '2110109',
        courseName: 'Artificial Intelligence',
        credits: 3,
        status: 'pending'
      },
      {
        courseCode: '2110110',
        courseName: 'Web Development',
        credits: 3,
        status: 'pending'
      }
    ]
  };

  // Transform data into worksheet format
  const worksheetData = [
    {
      'Student ID': sampleData.studentId,
      'Faculty': sampleData.faculty,
      'Department': sampleData.department,
      'Curriculum': sampleData.curriculum
    },
    ...sampleData.courses.map(course => ({
      'Course Code': course.courseCode,
      'Course Name': course.courseName,
      'Credits': course.credits,
      'Grade': course.grade || '',
      'Semester': course.semester || '',
      'Status': course.status
    }))
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Academic Record');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}; 