'use client';

import { useState } from 'react';
import ExcelUpload from '@/components/excel/ExcelUpload';
import ExcelDownload from '@/components/excel/ExcelDownload';
import { ExcelData, CourseData } from '@/components/excel/ExcelUtils';
import { generateSampleExcel } from '@/components/excel/generateSampleExcel';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useCourseManagement } from '../contexts/CourseManagementContext';

export default function HomePage() {
  const {
    excelData,
    isSessionActive,
    startNewSession,
    updateSessionData,
    endCurrentSession,
    timeRemaining
  } = useCourseManagement();

  const [error, setError] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: keyof CourseData } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleDataLoaded = (data: ExcelData) => {
    if (!isSessionActive) startNewSession();
    updateSessionData(data);
    setError('');
  };

  const handleError = (errorMessage: string) => setError(errorMessage);

  const handleGenerateSample = () => {
    try {
      const workbook = generateSampleExcel();
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample-academic-record.xlsx');
    } catch {
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

    switch (editingCell.field) {
      case 'credits':
        const credits = parseInt(editValue);
        if (!isNaN(credits) && credits > 0) course.credits = credits;
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
    updateSessionData({ ...excelData, courses: newCourses });
    setEditingCell(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCellSave();
    else if (e.key === 'Escape') setEditingCell(null);
  };

  const renderCell = (course: CourseData, field: keyof CourseData, rowIndex: number) => {
    const value = course[field]?.toString() || '';
    if (editingCell?.rowIndex === rowIndex && editingCell?.field === field) {
      if (field === 'status' || field === 'grade') {
        const options = field === 'status'
          ? ['completed', 'ongoing', 'pending']
          : ['', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
        return (
          <select
            value={editValue}
            onChange={handleCellEdit}
            onBlur={handleCellSave}
            onKeyDown={handleKeyPress}
            className="w-full p-1 border rounded"
            autoFocus
          >
            {options.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
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
      <div onClick={() => handleCellClick(rowIndex, field, value)} className="cursor-pointer hover:bg-gray-50 p-1 rounded">
        {value || '-'}
      </div>
    );
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <h1 className="text-2xl sm:text-4xl font-bold text-center text-gray-800">Academic Record Manager</h1>

      {isSessionActive && (
        <div className={`p-2 sm:p-3 rounded text-center w-fit mx-auto font-semibold text-xs sm:text-base ${timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          Session Time Remaining: {formatTime(timeRemaining)}
        </div>
      )}

      {error && (
        <div className="p-2 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center text-xs sm:text-base">
          {error}
        </div>
      )}

      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-2xl font-semibold">Session Controls</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <button onClick={startNewSession} disabled={isSessionActive} className={`px-4 sm:px-6 py-2 rounded text-xs sm:text-base ${isSessionActive ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>Start New Session</button>
          <button onClick={endCurrentSession} disabled={!isSessionActive} className={`px-4 sm:px-6 py-2 rounded text-xs sm:text-base ${!isSessionActive ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>End Session</button>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-2xl font-semibold">Start with Templates</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <button onClick={handleGenerateSample} className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-base">Download Sample Excel</button>
          <ExcelDownload curriculumTemplate={true} fileName="curriculum-template.xlsx" className="w-full sm:w-auto" />
          <ExcelDownload className="w-full sm:w-auto" />
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-2xl font-semibold">Upload Academic Record</h2>
        {isSessionActive ? <ExcelUpload onDataLoaded={handleDataLoaded} onError={handleError} /> : <div className="p-2 sm:p-4 bg-yellow-100 text-yellow-800 rounded text-xs sm:text-base">Please start a session to upload and manage course data.</div>}
      </section>

      {isSessionActive && excelData && (
        <section className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-2xl font-semibold">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 bg-gray-50 p-2 sm:p-4 rounded-lg text-xs sm:text-base">
            <div><strong>Student ID:</strong> {excelData.studentId || 'N/A'}</div>
            <div><strong>Faculty:</strong> {excelData.faculty || 'N/A'}</div>
            <div><strong>Department:</strong> {excelData.department || 'N/A'}</div>
            <div><strong>Curriculum:</strong> {excelData.curriculum || 'N/A'}</div>
          </div>

          <h2 className="text-lg sm:text-2xl font-semibold">Course Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg text-xs sm:text-base">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left">Code</th>
                  <th className="px-2 sm:px-4 py-2 text-left">Name</th>
                  <th className="px-2 sm:px-4 py-2 text-center">Credits</th>
                  <th className="px-2 sm:px-4 py-2 text-center">Grade</th>
                  <th className="px-2 sm:px-4 py-2 text-center">Semester</th>
                  <th className="px-2 sm:px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {excelData.courses.map((course, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-2 sm:px-4 py-2">{renderCell(course, 'courseCode', index)}</td>
                    <td className="px-2 sm:px-4 py-2">{renderCell(course, 'courseName', index)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center">{renderCell(course, 'credits', index)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center">{renderCell(course, 'grade', index)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center">{renderCell(course, 'semester', index)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center">{renderCell(course, 'status', index)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <ExcelDownload data={excelData} fileName={`academic-record-${excelData.studentId || 'data'}.xlsx`} className="w-full sm:w-auto" />
          </div>
        </section>
      )}
    </div>
  );
}
