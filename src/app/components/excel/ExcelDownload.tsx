import { saveAs } from 'file-saver';
import { ExcelData, generateExcelFile } from './ExcelUtils';

interface ExcelDownloadProps {
  data: ExcelData;
  fileName?: string;
  className?: string;
}

export const ExcelDownload = ({ data, fileName = 'academic-record.xlsx', className = '' }: ExcelDownloadProps) => {
  const handleDownload = () => {
    try {
      const blob = generateExcelFile(data);
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Failed to generate Excel file:', error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${className}`}
    >
      Download Excel
    </button>
  );
}; 