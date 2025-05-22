'use client';

import { useState } from 'react';
import { ExcelUpload } from '../components/excel/ExcelUpload';
import { ExcelDownload } from '../components/excel/ExcelDownload';
import { ExcelData, CourseData } from '../components/excel/ExcelUtils';
import { generateSampleExcelFile } from '../components/excel/generateSampleExcel';
import { saveAs } from 'file-saver';

export default function HomePage() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [error, setError] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: keyof CourseData } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleDataLoaded = (data: ExcelData) => {
    setExcelData(data);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setExcelData(null);
  };

  const handleGenerateSample = () => {
    try {
      const blob = generateSampleExcelFile();
      saveAs(blob, 'sample-academic-record.xlsx');
    } catch (error) {
      setError('Failed to generate sample Excel file');
    }
  };

  const handleCellClick = (rowIndex: number, field: keyof CourseData, value: string) => {
    setEditingCell({ rowIndex, field });
    setEditValue(value);
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellSave = () => {
    if (!excelData || !editingCell) return;

    const newCourses = [...excelData.courses];
    const course = { ...newCourses[editingCell.rowIndex] };

    // Validate and transform the value based on the field
    switch (editingCell.field) {
      case 'credits':
        const credits = parseInt(editValue);
        if (!isNaN(credits) && credits > 0) {
          course.credits = credits;
        }
        break;
      case 'status':
        if (['completed', 'ongoing', 'pending'].includes(editValue)) {
          course.status = editValue as 'completed' | 'ongoing' | 'pending';
        }
        break;
      case 'grade':
        if (['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', ''].includes(editValue)) {
          course.grade = editValue || undefined;
        }
        break;
      default:
        (course[editingCell.field] as string) = editValue;
    }

    newCourses[editingCell.rowIndex] = course;
    setExcelData({ ...excelData, courses: newCourses });
    setEditingCell(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const renderCell = (course: CourseData, field: keyof CourseData, rowIndex: number) => {
    const value = course[field]?.toString() || '';
    
    if (editingCell?.rowIndex === rowIndex && editingCell?.field === field) {
      if (field === 'status') {
        return (
          <select
            value={editValue}
            onChange={handleCellEdit}
            onBlur={handleCellSave}
            onKeyDown={handleKeyPress}
            className="w-full p-1 border rounded"
            autoFocus
          >
            <option value="completed">completed</option>
            <option value="ongoing">ongoing</option>
            <option value="pending">pending</option>
          </select>
        );
      }
      
      if (field === 'grade') {
        return (
          <select
            value={editValue}
            onChange={handleCellEdit}
            onBlur={handleCellSave}
            onKeyDown={handleKeyPress}
            className="w-full p-1 border rounded"
            autoFocus
          >
            <option value="">-</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="D+">D+</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
        );
      }

      return (
        <input
          type={field === 'credits' ? 'number' : 'text'}
          value={editValue}
          onChange={handleCellEdit}
          onBlur={handleCellSave}
          onKeyDown={handleKeyPress}
          className="w-full p-1 border rounded"
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => handleCellClick(rowIndex, field, value)}
        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
      >
        {value || '-'}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Academic Record Excel Handler</h1>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Sample File Generation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Get Started</h2>
        <button
          onClick={handleGenerateSample}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Download Sample Excel File
        </button>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Academic Record</h2>
        <ExcelUpload onDataLoaded={handleDataLoaded} onError={handleError} />
      </div>

      {/* Data Preview Section */}
      {excelData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
          
          {/* Student Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Student ID:</span>
                <span className="ml-2">{excelData.studentId}</span>
              </div>
              <div>
                <span className="text-gray-600">Faculty:</span>
                <span className="ml-2">{excelData.faculty}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2">{excelData.department}</span>
              </div>
              <div>
                <span className="text-gray-600">Curriculum:</span>
                <span className="ml-2">{excelData.curriculum}</span>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Course Code</th>
                  <th className="px-4 py-2 text-left">Course Name</th>
                  <th className="px-4 py-2 text-center">Credits</th>
                  <th className="px-4 py-2 text-center">Grade</th>
                  <th className="px-4 py-2 text-center">Semester</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {excelData.courses.map((course, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{renderCell(course, 'courseCode', index)}</td>
                    <td className="px-4 py-2">{renderCell(course, 'courseName', index)}</td>
                    <td className="px-4 py-2 text-center">{renderCell(course, 'credits', index)}</td>
                    <td className="px-4 py-2 text-center">{renderCell(course, 'grade', index)}</td>
                    <td className="px-4 py-2 text-center">{renderCell(course, 'semester', index)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm
                        ${course.status === 'completed' ? 'bg-green-100 text-green-800' :
                          course.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {renderCell(course, 'status', index)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Download Button */}
          <div className="mt-6">
            <ExcelDownload 
              data={excelData}
              fileName={`academic-record-${excelData.studentId}.xlsx`}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
} 