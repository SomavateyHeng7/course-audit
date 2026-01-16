'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  year: number;
}

interface ScheduleDetails {
  id: string;
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  createdAt: string;
  updatedAt: string;
  curriculum?: {
    id: string;
    name: string;
    year: string;
  };
  courses: Course[];
}

export default function AdvisorScheduleDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchScheduleDetails = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockSchedule: ScheduleDetails = {
          id: params.id,
          name: 'Fall 2024 Schedule',
          semester: 'Fall 2024',
          version: '1.0',
          department: 'Computer Science',
          batch: '2022-2026',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
          curriculum: {
            id: 'curr-1',
            name: 'Computer Science 2022',
            year: '2022'
          },
          courses: [
            { id: '1', code: 'CS101', name: 'Introduction to Programming', credits: 3, semester: 1, year: 1 },
            { id: '2', code: 'CS102', name: 'Data Structures', credits: 3, semester: 1, year: 1 },
            { id: '3', code: 'CS201', name: 'Algorithms', credits: 3, semester: 2, year: 1 },
            { id: '4', code: 'CS202', name: 'Database Systems', credits: 3, semester: 2, year: 1 },
          ]
        };
        
        setSchedule(mockSchedule);
      } catch (error) {
        console.error('Error fetching schedule details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
        <LoadingSpinner text="Loading schedule details..." />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/advisor/schedules')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedules
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Schedule not found</p>
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

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/advisor/schedules')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schedules
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{schedule.name}</h1>
          <p className="text-muted-foreground">View Only - Schedule Details</p>
        </div>

        {/* Schedule Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-semibold">{schedule.semester}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Curriculum</p>
                  <p className="font-semibold">{schedule.curriculum?.name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="font-semibold">{schedule.batch || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-semibold">{schedule.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Courses ({schedule.courses.length})
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
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Year</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.courses.map((course) => (
                    <tr key={course.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{course.code}</td>
                      <td className="p-3">{course.name}</td>
                      <td className="p-3">{course.credits}</td>
                      <td className="p-3">Year {course.year}</td>
                      <td className="p-3">Semester {course.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground">
              <p>Created: {formatDate(schedule.createdAt)}</p>
              <p>Last Updated: {formatDate(schedule.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
