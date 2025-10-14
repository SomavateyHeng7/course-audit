'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, GraduationCap, TrendingUp, BookOpen, Award } from 'lucide-react';
import RoleManagement from '@/components/admin/RoleManagement';
import DepartmentManagement from '@/components/admin/DepartmentManagement';
import FacultyManagement from '@/components/admin/FacultyManagement';

interface DashboardStats {
  overview: {
    totalUsers: number;
    userGrowth: number;
    totalFaculties: number;
    totalDepartments: number;
    totalCourses: number;
    newCourses: number;
  };
  monthlyEnrollment: Array<{
    month: string;
    students: number;
    courses: number;
  }>;
  facultyDistribution: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
  }>;
  programCompletion: Array<{
    program: string;
    completed: number;
    inProgress: number;
  }>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
        // Fallback to mock data
        setDashboardData({
          overview: {
            totalUsers: 1234,
            userGrowth: 12,
            totalFaculties: 8,
            totalDepartments: 45,
            totalCourses: 342,
            newCourses: 8,
          },
          monthlyEnrollment: [
            { month: 'Jan', students: 850, courses: 45 },
            { month: 'Feb', students: 920, courses: 48 },
            { month: 'Mar', students: 1100, courses: 52 },
            { month: 'Apr', students: 1050, courses: 50 },
            { month: 'May', students: 1200, courses: 55 },
            { month: 'Jun', students: 1150, courses: 53 }
          ],
          facultyDistribution: [
            { name: 'Engineering', value: 35, count: 432, color: '#8884d8' },
            { name: 'Business', value: 25, count: 308, color: '#82ca9d' },
            { name: 'Arts & Sciences', value: 20, count: 247, color: '#ffc658' },
            { name: 'Medicine', value: 12, count: 148, color: '#ff7300' },
            { name: 'Law', value: 8, count: 99, color: '#00ff00' }
          ],
          programCompletion: [
            { program: 'BSCS', completed: 87, inProgress: 13 },
            { program: 'BSIT', completed: 92, inProgress: 8 },
            { program: 'BBA', completed: 89, inProgress: 11 },
            { program: 'MBA', completed: 94, inProgress: 6 }
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Calculate max values for scaling bars
  const maxStudents = dashboardData?.monthlyEnrollment ? Math.max(...dashboardData.monthlyEnrollment.map(item => item.students), 1) : 1;
  const maxCourses = dashboardData?.monthlyEnrollment ? Math.max(...dashboardData.monthlyEnrollment.map(item => item.courses), 1) : 1;

  return (
    <div className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Overview of roles, departments, and faculties across the system
          </p>
          {error && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              {error} - Using fallback data
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="faculties" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Faculties
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Dashboard with Charts */}
          <TabsContent value="overview" className="mt-6">
            {loading ? (
              <div className="text-center py-8">Loading dashboard data...</div>
            ) : dashboardData ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  {/* Users Card */}
                  <Card className="rounded-2xl shadow-md border-l-8 border-l-blue-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Users
                      </CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.overview.totalUsers.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{dashboardData.overview.userGrowth}% from last month
                      </p>
                    </CardContent>
                  </Card>

                  {/* Departments Card */}
                  {/* <Card className="rounded-2xl shadow-md border-l-8 border-l-green-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Departments
                      </CardTitle>
                      <Building2 className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.overview.totalDepartments}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Across all faculties
                      </p>
                    </CardContent>
                  </Card> */}

                  {/* Faculties Card */}
                  {/* <Card className="rounded-2xl shadow-md border-l-8 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Faculties
                      </CardTitle>
                      <GraduationCap className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.overview.totalFaculties}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Active faculties
                      </p>
                    </CardContent>
                  </Card> */}

                  {/* Active Courses Card */}
                  <Card className="rounded-2xl shadow-md border-l-8 border-l-purple-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Courses
                      </CardTitle>
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.overview.totalCourses}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{dashboardData.overview.newCourses} new this semester
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  {/* Monthly Enrollment Trend */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        Monthly Enrollment Trends
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400">Student enrollment and course offerings over time</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.monthlyEnrollment.map((item) => (
                          <div key={item.month} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-[80px]">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {item.month}
                              </span>
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="flex gap-2">
                                {/* Students Bar */}
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-blue-600">Students</span>
                                    <span className="font-medium">{item.students}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${(item.students / maxStudents) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                {/* Courses Bar */}
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-green-600">Courses</span>
                                    <span className="font-medium">{item.courses}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${(item.courses / maxCourses) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Faculty Distribution */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-green-600" />
                        Faculty Distribution
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400">Student distribution across different faculties</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.facultyDistribution.map((faculty) => (
                          <div key={faculty.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: faculty.color }}
                              ></div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] truncate">
                                {faculty.name}
                              </span>
                              <span className="text-xs text-gray-500">({faculty.count} users)</span>
                            </div>
                            <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                  className="h-3 rounded-full transition-all duration-500" 
                                  style={{ 
                                    width: `${faculty.value}%`, 
                                    backgroundColor: faculty.color 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[35px]">
                                {faculty.value}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-8">No data available</div>
            )}
          </TabsContent>

          {/* Roles Management Tab */}
          <TabsContent value="roles" className="mt-6">
            <RoleManagement />
          </TabsContent>

          {/* Departments Management Tab */}
          <TabsContent value="departments" className="mt-6">
            <DepartmentManagement />
          </TabsContent>

          {/* Faculties Management Tab */}
          <TabsContent value="faculties" className="mt-6">
            <FacultyManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
