'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin,
  ArrowLeft,
  Calendar,
  Edit,
  Download,
  Printer
} from 'lucide-react';

import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';

interface ScheduleCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  section?: string;
  days?: string[];
  time?: string;
  instructor?: string;
  seatLimit?: number;
  category?: string;
}

interface ScheduleData {
  id: string;
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  curriculumId?: string;
  curriculumName?: string;
  courses: ScheduleCourse[];
  createdAt?: string;
  updatedAt?: string;
}

const ViewSchedulePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Simulate API call - in production, fetch from backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to load from localStorage first (for demo purposes)
      const savedVersions = localStorage.getItem('tentativeScheduleVersions');
      if (savedVersions) {
        const versions = JSON.parse(savedVersions) as ScheduleData[];
        const found = versions.find(v => v.id === scheduleId);
        if (found) {
          setSchedule(found);
          setLoading(false);
          return;
        }
      }
      
      // Mock data fallback
      const mockSchedule: ScheduleData = {
        id: scheduleId,
        name: scheduleId === '1' ? 'Fall 2024 Schedule' : 'Spring 2024 Schedule',
        semester: scheduleId === '1' ? 'Fall 2024' : 'Spring 2024',
        version: scheduleId === '1' ? '1.0' : '2.1',
        department: 'Computer Science',
        batch: scheduleId === '1' ? '2022-2026' : '2021-2025',
        curriculumName: scheduleId === '1' ? 'Computer Science 2022' : 'Computer Science 2021',
        courses: [
          {
            id: '1',
            code: 'CSX3001',
            name: 'Database Systems',
            credits: 3,
            section: 'A',
            days: ['Mon', 'Wed', 'Fri'],
            time: '09:00-10:00',
            instructor: 'Dr. Smith',
            seatLimit: 40,
            category: 'Core'
          },
          {
            id: '2',
            code: 'CSX3002',
            name: 'Software Engineering',
            credits: 3,
            section: 'A',
            days: ['Tue', 'Thu'],
            time: '10:30-12:00',
            instructor: 'Dr. Johnson',
            seatLimit: 35,
            category: 'Core'
          },
          {
            id: '3',
            code: 'CSX3003',
            name: 'Data Structures',
            credits: 3,
            section: 'B',
            days: ['Mon', 'Wed'],
            time: '13:00-14:30',
            instructor: 'Prof. Williams',
            seatLimit: 45,
            category: 'Core'
          },
          {
            id: '4',
            code: 'CSX4001',
            name: 'Machine Learning',
            credits: 3,
            section: 'A',
            days: ['Tue', 'Thu'],
            time: '14:00-15:30',
            instructor: 'Dr. Brown',
            seatLimit: 30,
            category: 'Elective'
          },
          {
            id: '5',
            code: 'CSX4002',
            name: 'Web Development',
            credits: 3,
            section: 'A',
            days: ['Mon', 'Wed', 'Fri'],
            time: '15:00-16:00',
            instructor: 'Prof. Davis',
            seatLimit: 40,
            category: 'Elective'
          }
        ],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      };
      
      setSchedule(mockSchedule);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const courseColumns = [
    {
      key: 'code',
      label: 'Course Code',
      className: 'w-28',
      render: (course: ScheduleCourse) => (
        <div>
          <div className="font-semibold">{course.code}</div>
          <div className="lg:hidden text-sm text-muted-foreground">
            {course.credits} credits
          </div>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Course Name',
      className: 'flex-1',
      render: (course: ScheduleCourse) => (
        <div>
          <div className="font-medium">{course.name}</div>
          {course.section && (
            <div className="text-sm text-muted-foreground">Section {course.section}</div>
          )}
        </div>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      className: 'w-20',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <Badge variant="outline">{course.credits}</Badge>
      )
    },
    {
      key: 'category',
      label: 'Category',
      className: 'w-24',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <Badge variant={course.category === 'Core' ? 'default' : 'secondary'}>
          {course.category || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'schedule',
      label: 'Schedule',
      className: 'w-40',
      render: (course: ScheduleCourse) => (
        <div className="text-sm">
          {course.days && course.days.length > 0 ? (
            <>
              <div className="font-medium">{course.days.join(', ')}</div>
              <div className="text-muted-foreground">{course.time || 'TBA'}</div>
            </>
          ) : (
            <span className="text-muted-foreground">TBA</span>
          )}
        </div>
      )
    },
    {
      key: 'instructor',
      label: 'Instructor',
      className: 'w-32',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <span className="text-sm">{course.instructor || 'TBA'}</span>
      )
    },
    {
      key: 'seats',
      label: 'Seats',
      className: 'w-20',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <span className="text-sm">{course.seatLimit || '-'}</span>
      )
    }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalCredits = schedule?.courses.reduce((sum, c) => sum + c.credits, 0) || 0;
  const coreCount = schedule?.courses.filter(c => c.category === 'Core').length || 0;
  const electiveCount = schedule?.courses.filter(c => c.category === 'Elective' || c.category !== 'Core').length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-2xl font-bold mb-4">Schedule Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested schedule could not be found.</p>
          <Button onClick={() => router.push('/chairperson/TentativeSchedule')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedules
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={schedule.name}
          description={`${schedule.semester} • Version ${schedule.version}`}
          backButton={{
            label: "Back to Schedules",
            onClick: () => router.push('/chairperson/TentativeSchedule')
          }}
          actions={[
            {
              label: "Edit Schedule",
              onClick: () => router.push('/chairperson/TentativeSchedule/create_schedule'),
              icon: <Edit size={16} />
            }
          ]}
        />

        {/* Schedule Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Curriculum</div>
                <div className="font-medium">{schedule.curriculumName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <div className="font-medium">{schedule.department || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Batch</div>
                <div className="font-medium">{schedule.batch || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">{formatDate(schedule.updatedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            title="Total Courses"
            value={schedule.courses.length}
            subtitle="In this schedule"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Total Credits"
            value={totalCredits}
            subtitle="Credit hours"
            icon={<Calendar size={20} />}
          />
          <StatCard
            title="Core Courses"
            value={coreCount}
            subtitle="Required courses"
            icon={<Users size={20} />}
          />
          <StatCard
            title="Electives"
            value={electiveCount}
            subtitle="Optional courses"
            icon={<Clock size={20} />}
          />
        </div>

        {/* Courses Table */}
        <DataTable
          data={schedule.courses}
          columns={courseColumns}
          loading={false}
          emptyState={{
            icon: <BookOpen size={48} />,
            title: "No courses in this schedule",
            description: "This schedule doesn't have any courses yet",
            action: {
              label: "Edit Schedule",
              onClick: () => router.push('/chairperson/TentativeSchedule/create_schedule')
            }
          }}
          cardMode={true}
        />
      </div>
    </div>
  );
};

export default ViewSchedulePage;
