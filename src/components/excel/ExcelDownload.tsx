'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateSampleExcel, generateCurriculumTemplateExcel } from './generateSampleExcel';
import { ExcelData } from './ExcelUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExcelDownloadProps {
  data?: ExcelData;
  fileName?: string;
  className?: string;
  curriculumTemplate?: boolean;
}

export default function ExcelDownload({ data, fileName = 'course-audit-template.xlsx', className, curriculumTemplate }: ExcelDownloadProps) {
  const handleDownload = () => {
    let workbook;
    if (curriculumTemplate) {
      workbook = generateCurriculumTemplateExcel();
    } else if (data) {
      // Create workbook from provided data
      workbook = XLSX.utils.book_new();
      const coursesSheet = XLSX.utils.json_to_sheet(data.courses);
      const studentsSheet = XLSX.utils.json_to_sheet(data.students);
      const programsSheet = XLSX.utils.json_to_sheet(data.programs);
      XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses');
      XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');
      XLSX.utils.book_append_sheet(workbook, programsSheet, 'Programs');
    } else {
      // Generate sample template
      workbook = generateSampleExcel();
    }
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <Download className="h-4 w-4" />
      {curriculumTemplate
        ? 'Download Curriculum Template'
        : data
        ? 'Download Data'
        : 'Download Graduation Checklist Template'}
    </Button>
  );
}
