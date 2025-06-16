import * as XLSX from 'xlsx';

export function generateSampleExcel() {
  const workbook = XLSX.utils.book_new();

  // Unified Graduation Checklist Template Data
  const checklistData = [
    // Section headers as rows
    { Section: 'GENERAL EDUCATION COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'Language', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'Humanities', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'Social Science', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'Science and Mathematics', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'BUSINESS CORE COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'SPECIALIZED/CORE COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'MAJOR REQUIRED COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'MAJOR ELECTIVE COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'FREE ELECTIVE COURSES', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 1, CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: 'PROFESSIONAL ETHICS SEMINAR', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: 'Yes/No' },
    { Section: '', No: 1, CourseCode: 'BG14031', CourseTitle: 'Professional Ethics Seminar I', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 2, CourseCode: 'BG14032', CourseTitle: 'Professional Ethics Seminar II', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 3, CourseCode: 'BG14033', CourseTitle: 'Professional Ethics Seminar III', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 4, CourseCode: 'BG14034', CourseTitle: 'Professional Ethics Seminar IV', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 5, CourseCode: 'BG14035', CourseTitle: 'Professional Ethics Seminar V', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 6, CourseCode: 'BG14036', CourseTitle: 'Professional Ethics Seminar VI', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 7, CourseCode: 'BG14037', CourseTitle: 'Professional Ethics Seminar VII', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    { Section: '', No: 8, CourseCode: 'BG14038', CourseTitle: 'Professional Ethics Seminar VIII', Credits: 0, StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
    // Add more rows as needed
    { Section: 'TOTAL', No: '', CourseCode: '', CourseTitle: '', Credits: '', StudyPlan: '', Grade: '', Remarks: '', Semester: '', Satisfactory: '' },
  ];

  // Create the Graduation Checklist worksheet
  const checklistSheet = XLSX.utils.json_to_sheet(checklistData, { header: [
    'Section', 'No', 'CourseCode', 'CourseTitle', 'Credits', 'StudyPlan', 'Grade', 'Remarks', 'Semester', 'Satisfactory'
  ] });

  XLSX.utils.book_append_sheet(workbook, checklistSheet, 'Graduation Checklist');

  // Optionally, keep other sheets for compatibility
  // const studentsSheet = XLSX.utils.json_to_sheet([]);
  // const programsSheet = XLSX.utils.json_to_sheet([]);
  // XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');
  // XLSX.utils.book_append_sheet(workbook, programsSheet, 'Programs');

  return workbook;
}

export function generateCurriculumTemplateExcel() {
  const workbook = XLSX.utils.book_new();

  // Curriculum Template Columns and Example Rows
  const curriculumData = [
    {
      Year: '1',
      Semester: '1',
      CourseCode: 'BG1001',
      CourseTitle: 'English I',
      Credits: 3,
      CourseType: 'Eng',
      Prerequisite1: '',
      Prerequisite2: '',
      Prerequisite3: '',
      Prerequisite4: '',
      Prerequisite5: '',
      Prerequisite6: '',
      Prerequisite7: '',
      Remarks: '',
      ElectiveGroup: '',
      Specialization: '',
      IsMSMEElective: '',
      IsNonMSMEElective: ''
    },
    {
      Year: '1',
      Semester: '1',
      CourseCode: 'MA1200',
      CourseTitle: 'Mathematics for Business',
      Credits: 3,
      CourseType: 'Gen Ed',
      Prerequisite1: '',
      Prerequisite2: '',
      Prerequisite3: '',
      Prerequisite4: '',
      Prerequisite5: '',
      Prerequisite6: '',
      Prerequisite7: '',
      Remarks: '',
      ElectiveGroup: '',
      Specialization: '',
      IsMSMEElective: '',
      IsNonMSMEElective: ''
    },
    // ... more example rows or leave blank for template ...
  ];

  const curriculumSheet = XLSX.utils.json_to_sheet(curriculumData, { header: [
    'Year', 'Semester', 'CourseCode', 'CourseTitle', 'Credits', 'CourseType',
    'Prerequisite1', 'Prerequisite2', 'Prerequisite3', 'Prerequisite4', 'Prerequisite5', 'Prerequisite6', 'Prerequisite7',
    'Remarks', 'ElectiveGroup', 'Specialization', 'IsMSMEElective', 'IsNonMSMEElective'
  ] });

  XLSX.utils.book_append_sheet(workbook, curriculumSheet, 'Curriculum Template');

  return workbook;
} 