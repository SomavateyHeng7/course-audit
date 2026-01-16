'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, GraduationCap, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { API_BASE } from '@/lib/api/laravel';
import { useToastHelpers } from '@/hooks/useToast';

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  courseType: string;
  year: number;
  semester: number;
}

interface CurriculumDetails {
  id: string;
  name: string;
  year: string;
  totalCredits: number;
  studentIdStart: string;
  studentIdEnd: string;
  departmentName?: string;
  facultyName?: string;
  createdAt: string;
  updatedAt: string;
  courses: Course[];
}

export default function AdvisorCurriculumDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { error: showError } = useToastHelpers();
  const [curriculum, setCurriculum] = useState<CurriculumDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurriculumDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/curricula/${params.id}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
          setCurriculum(data);
        } else {
          console.error('Failed to fetch curriculum details:', data.error);
          showError('Failed to load curriculum details');
        }
      } catch (error) {
        console.error('Error fetching curriculum details:', error);
        showError('Error loading curriculum details');
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculumDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
        <LoadingSpinner text="Loading curriculum details..." />
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/advisor/curricula')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Curricula
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Curriculum not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group courses by year and semester
  const groupedCourses = curriculum.courses.reduce((acc, course) => {
    const key = `Year ${course.year} - Semester ${course.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/advisor/curricula')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curricula
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{curriculum.name}</h1>
          <p className="text-muted-foreground">View Only - Curriculum Details</p>
        </div>

        {/* Curriculum Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-semibold">{curriculum.year}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="font-semibold">{curriculum.totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Student ID Range</p>
                  <p className="font-semibold font-mono text-xs">
                    {curriculum.studentIdStart} - {curriculum.studentIdEnd}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="font-semibold">{curriculum.courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department and Faculty Info */}
        {(curriculum.departmentName || curriculum.facultyName) && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curriculum.facultyName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Faculty</p>
                    <p className="font-medium">{curriculum.facultyName}</p>
                  </div>
                )}
                {curriculum.departmentName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{curriculum.departmentName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses by Year and Semester */}
        <div className="space-y-6">
          {Object.entries(groupedCourses).map(([yearSemester, courses]) => (
            <Card key={yearSemester}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {yearSemester} ({courses.length} courses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Course Code</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Course Name</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Credits</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 font-mono text-sm">{course.courseCode}</td>
                          <td className="p-3">{course.courseName}</td>
                          <td className="p-3">{course.credits}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {course.courseType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metadata */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground">
              <p>Created: {formatDate(curriculum.createdAt)}</p>
              <p>Last Updated: {formatDate(curriculum.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
