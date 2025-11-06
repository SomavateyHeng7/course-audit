'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { parseExcelFile, validateCourseData } from './ExcelUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExcelUploadProps {
  onDataLoaded: (data: any) => void;
  onError: (error: string) => void;
}

export default function ExcelUpload({ onDataLoaded, onError }: ExcelUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFileName(null);
    setSuccess(false);

    try {
      const data = await parseExcelFile(file);
      const validation = validateCourseData(data.courses);

      if (!validation.isValid) {
        onError(validation.errors.join('\n'));
        setFileName(file.name);
        setSuccess(false);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Validation warnings:', validation.warnings);
      }

      onDataLoaded(data);
      setFileName(file.name);
      setSuccess(true);
    } catch (error) {
      onError('Failed to process Excel file');
      setFileName(file.name);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
  <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => document.getElementById('excel-upload')?.click()}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          {isLoading ? 'Uploading...' : 'Upload Excel'}
        </Button>
        {fileName && (
          <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">{fileName}</span>
        )}
        {success && (
          <span className="text-xs text-green-600 dark:text-green-400 mt-1">File uploaded successfully!</span>
        )}
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 