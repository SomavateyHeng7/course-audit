'use client';

import { useState, useEffect } from 'react';
import { 
  getPublicFaculties, 
  getPublicDepartments, 
  getPublicCurricula 
} from '@/lib/api/laravel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAPIPage() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [curricula, setCurricula] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Test all public endpoints
        const [facultiesData, departmentsData, curriculaData] = await Promise.all([
          getPublicFaculties(),
          getPublicDepartments(),
          getPublicCurricula(),
        ]);

        setFaculties(facultiesData);
        setDepartments(departmentsData);
        setCurricula(curriculaData);
        setError('');
      } catch (err: any) {
        setError(err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading data from Laravel backend...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <p className="mt-2 text-sm">
            Make sure your Laravel backend is running on http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Laravel API Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faculties */}
        <Card>
          <CardHeader>
            <CardTitle>Faculties ({faculties.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {faculties.map((faculty) => (
                <li key={faculty.id} className="p-2 bg-gray-50 rounded">
                  {faculty.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Departments ({departments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {departments.slice(0, 10).map((dept) => (
                <li key={dept.id} className="p-2 bg-gray-50 rounded text-sm">
                  {dept.name}
                </li>
              ))}
              {departments.length > 10 && (
                <li className="text-sm text-gray-500">
                  ...and {departments.length - 10} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Curricula */}
        <Card>
          <CardHeader>
            <CardTitle>Curricula ({curricula.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {curricula.slice(0, 10).map((curriculum) => (
                <li key={curriculum.id} className="p-2 bg-gray-50 rounded text-sm">
                  {curriculum.name}
                </li>
              ))}
              {curricula.length > 10 && (
                <li className="text-sm text-gray-500">
                  ...and {curricula.length - 10} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        ✅ Successfully connected to Laravel backend!
      </div>
    </div>
  );
}
