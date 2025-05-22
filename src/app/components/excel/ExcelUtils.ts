import * as XLSX from 'xlsx';

export interface CourseData {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  semester?: string;
  status: 'completed' | 'ongoing' | 'pending';
}

export interface ExcelData {
  studentId: string;
  faculty: string;
  department: string;
  curriculum: string;
  courses: CourseData[];
}

export const readExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Transform the data into our expected format
        const excelData: ExcelData = {
          studentId: jsonData[0]?.['Student ID'] || '',
          faculty: jsonData[0]?.['Faculty'] || '',
          department: jsonData[0]?.['Department'] || '',
          curriculum: jsonData[0]?.['Curriculum'] || '',
          courses: jsonData.map((row: any) => ({
            courseCode: row['Course Code'] || '',
            courseName: row['Course Name'] || '',
            credits: Number(row['Credits']) || 0,
            grade: row['Grade'] || '',
            semester: row['Semester'] || '',
            status: row['Status'] || 'pending'
          }))
        };
        
        resolve(excelData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

export const generateExcelFile = (data: ExcelData): Blob => {
  // Transform data into worksheet format
  const worksheetData = [
    {
      'Student ID': data.studentId,
      'Faculty': data.faculty,
      'Department': data.department,
      'Curriculum': data.curriculum
    },
    ...data.courses.map(course => ({
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