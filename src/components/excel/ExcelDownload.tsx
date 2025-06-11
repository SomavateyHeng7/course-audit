'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateSampleExcel } from './generateSampleExcel';

export default function ExcelDownload() {
  const handleDownload = () => {
    const workbook = generateSampleExcel();
    workbook.writeFile('course-audit-template.xlsx');
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Download Template
    </Button>
  );
} 