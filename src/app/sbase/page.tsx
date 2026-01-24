'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search,
  BookOpen,
  GraduationCap,
  Building2,
  Calendar,
  Clock
} from 'lucide-react';
import { getPublicFaculties, getPublicDepartments } from '@/lib/api/laravel';

interface Faculty {
  id: string;
  name: string;
  code?: string;
}

interface Department {
  id: string;
  name: string;
  code?: string;
  facultyId?: string;
  faculty_id?: string;
}

export default function StudentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const data = await getPublicFaculties();
        const facultiesList = data.faculties || data;
        setFaculties(Array.isArray(facultiesList) ? facultiesList : []);
      } catch (error) {
        console.error('Error fetching faculties:', error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const data = await getPublicDepartments();
        const departmentsList = data.departments || data;
        setDepartments(Array.isArray(departmentsList) ? departmentsList : []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFaculties(), fetchDepartments()]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Filter departments based on selected faculty
  const filteredDepartments = selectedFaculty 
    ? departments.filter(dept => dept.facultyId === selectedFaculty)
    : departments;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Course Audit System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Access course information, curriculum details, and academic requirements anonymously
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Courses & Curricula
            </CardTitle>
            <CardDescription>
              Find courses, view curriculum requirements, and explore academic programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Courses</Label>
                <Input
                  id="search"
                  placeholder="Enter course code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="faculty">Faculty</Label>
                <select
                  id="faculty"
                  value={selectedFaculty}
                  onChange={(e) => {
                    setSelectedFaculty(e.target.value);
                    setSelectedDepartment(''); // Reset department when faculty changes
                  }}
                  className="w-full p-2 border rounded-md"
                  disabled={isLoading}
                >
                  <option value="">All Faculties</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isLoading}
                >
                  <option value="">All Departments</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button className="w-full md:w-auto bg-[#1F3A93] hover:bg-[#1F3A93]/90">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#1F3A93]" />
                Browse Courses
              </CardTitle>
              <CardDescription>
                Explore all available courses in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View course details, prerequisites, and credit requirements
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#2ECC71]" />
                View Curricula
              </CardTitle>
              <CardDescription>
                Check curriculum requirements by program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See course sequences and graduation requirements
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#F39C12]" />
                Faculty Info
              </CardTitle>
              <CardDescription>
                Learn about faculties and departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore academic units and their programs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Updates
            </CardTitle>
            <CardDescription>
              Latest changes to courses and curricula
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">New Curriculum Updates Available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Updated curricula with new courses and requirements
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">2 days ago</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">New Courses Added</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced courses added to various programs
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">1 week ago</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Updated Prerequisites</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Modified prerequisites for various courses
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">2 weeks ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 