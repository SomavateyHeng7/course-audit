'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { readExcelFile, validateExcelData } from './ExcelUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExcelUploadProps {
  onDataLoaded: (data: any) => void;
  onError: (error: string) => void;
}

export default function ExcelUpload({ onDataLoaded, onError }: ExcelUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await readExcelFile(file);      const errors = validateExcelData(data);

      if (errors.length > 0) {
        onError(errors.join('\n'));
        return;
      }

      onDataLoaded(data);
    } catch (error) {
      onError('Failed to process Excel file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => document.getElementById('excel-upload')?.click()}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          {isLoading ? 'Uploading...' : 'Upload Excel'}
        </Button>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls"
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
