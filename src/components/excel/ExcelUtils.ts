import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface CourseData {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  semester?: string;
  status?: 'completed' | 'ongoing' | 'pending';
}

export interface ExcelData {
  courses: CourseData[];
  students: any[];
  programs: any[];
  studentId?: string;
  faculty?: string;
  department?: string;
  curriculum?: string;
}

export function readExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const parsed = Papa.parse(csv, { header: true });
          // Map CSV columns to CourseData fields
          const courses = (parsed.data as any[]).map(row => ({
            courseCode: row['courseCode'] || row['COURSE NO.'] || row['Course Code'] || row['Code'] || '',
            courseName: row['courseName'] || row['COURSE TITLE'] || row['Course Name'] || row['Name'] || '',
            credits: Number(row['credits'] || row['CREDITS'] || row['Credit'] || row['Credits'] || 0),
            grade: row['grade'] || row['GRADE'] || row['Grade'] || '',
            semester: row['semester'] || row['SEMESTER'] || row['Semester'] || '',
            status: row['status'] || row['STATUS'] || row['Status'] || '',
          })).filter(c => c.courseCode && c.courseName);
          resolve({ courses, students: [], programs: [] });
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const courses = XLSX.utils.sheet_to_json(workbook.Sheets['Courses']) as CourseData[];
          const students = XLSX.utils.sheet_to_json(workbook.Sheets['Students']);
          const programs = XLSX.utils.sheet_to_json(workbook.Sheets['Programs']);
          resolve({ courses, students, programs });
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    }
  });
}

export function validateExcelData(data: ExcelData): string[] {
  const errors: string[] = [];
  // Validate courses
  if (!Array.isArray(data.courses)) {
    errors.push('Courses sheet is missing or invalid');
  } else {
    data.courses.forEach((course, index) => {
      if (!course.courseCode) errors.push(`Course ${index + 1} is missing course code`);
      if (!course.courseName) errors.push(`Course ${index + 1} is missing course name`);
      if (!course.credits) errors.push(`Course ${index + 1} is missing credits`);
    });
  }

  // Validate students
  if (!Array.isArray(data.students)) {
    errors.push('Students sheet is missing or invalid');
  } else {
    data.students.forEach((student, index) => {
      if (!student.id) errors.push(`Student ${index + 1} is missing ID`);
      if (!student.name) errors.push(`Student ${index + 1} is missing name`);
    });
  }

  // Validate programs
  if (!Array.isArray(data.programs)) {
    errors.push('Programs sheet is missing or invalid');
  } else {
    data.programs.forEach((program, index) => {
      if (!program.code) errors.push(`Program ${index + 1} is missing code`);
      if (!program.name) errors.push(`Program ${index + 1} is missing name`);
    });
  }

  return errors;
} 