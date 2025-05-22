import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelData, readExcelFile } from './ExcelUtils';

interface ExcelUploadProps {
  onDataLoaded: (data: ExcelData) => void;
  onError: (error: string) => void;
}

export const ExcelUpload = ({ onDataLoaded, onError }: ExcelUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      onError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsLoading(true);
    try {
      const data = await readExcelFile(file);
      onDataLoaded(data);
    } catch (error) {
      onError('Failed to read Excel file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <div className="text-gray-600">Loading...</div>
      ) : isDragActive ? (
        <div className="text-blue-500">Drop the Excel file here</div>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">Drag and drop an Excel file here, or click to select</p>
          <p className="text-sm text-gray-500">Supports .xlsx and .xls files</p>
        </div>
      )}
    </div>
  );
}; 