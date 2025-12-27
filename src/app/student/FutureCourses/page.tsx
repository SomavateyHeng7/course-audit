'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin,
  Plus,
  Filter
} from 'lucide-react';

// Import chairperson components
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { SearchBar } from '@/components/role-specific/chairperson/SearchBar';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';
import { Pagination } from '@/components/role-specific/chairperson/Pagination';

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  description: string;
  prerequisites: string[];
  semester: string;
  instructor: string;
  schedule: string;
  location: string;
  capacity: number;
  plannedBy: number;
  category: string;
}

const FutureCoursesPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, selectedCategory, selectedSemester, pagination.page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockCourses: Course[] = [
        {
          id: '1',
          code: 'CSX4001',
          title: 'Advanced Software Engineering',
          credits: 3,
          description: 'Advanced topics in software engineering including design patterns, architecture, and project management.',
          prerequisites: ['CSX3001', 'CSX3002'],
          semester: 'Spring 2025',
          instructor: 'Dr. Johnson',
          schedule: 'MWF 10:00-11:00',
          location: 'CS Building Room 201',
          capacity: 30,
          plannedBy: 25,
          category: 'Core'
        },
        {
          id: '2',
          code: 'CSX4002',
          title: 'Machine Learning',
          credits: 3,
          description: 'Introduction to machine learning algorithms and applications.',
          prerequisites: ['MTH2001', 'CSX3003'],
          semester: 'Spring 2025',
          instructor: 'Dr. Smith',
          schedule: 'TTh 14:00-15:30',
          location: 'CS Building Room 301',
          capacity: 25,
          plannedBy: 20,
          category: 'Elective'
        }
      ];
      
      setCourses(mockCourses);
      setPagination(prev => ({
        ...prev,
        total: mockCourses.length,
        totalPages: Math.ceil(mockCourses.length / prev.limit)
      }));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const courseColumns = [
    {
      key: 'code',
      label: 'Course Code',
      className: 'w-32',
      render: (course: Course) => (
        <div>
          <div className="font-semibold">{course.code}</div>
          <div className="lg:hidden text-sm text-muted-foreground">
            {course.credits} credits
          </div>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Course Title',
      className: 'flex-1',
      render: (course: Course) => (
        <div>
          <div className="font-medium">{course.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </div>
        </div>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      className: 'w-20',
      hideOnMobile: true,
      render: (course: Course) => (
        <Badge variant="outline">{course.credits}</Badge>
      )
    },
    {
      key: 'category',
      label: 'Category',
      className: 'w-24',
      hideOnMobile: true,
      render: (course: Course) => (
        <Badge variant={course.category === 'Core' ? 'default' : 'secondary'}>
          {course.category}
        </Badge>
      )
    },
    {
      key: 'semester',
      label: 'Semester',
      className: 'w-32',
      render: (course: Course) => (
        <span className="text-sm">{course.semester}</span>
      )
    },
    {
      key: 'enrollment',
      label: 'Number of Students Planning',
      className: 'w-40',
      mobileLabel: 'Spots',
      render: (course: Course) => (
        <div className="text-sm">
          <span className="font-medium">{course.plannedBy}/{course.capacity}</span>
          <div className="text-xs text-muted-foreground">
            {course.plannedBy} students planning
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-32',
      render: (course: Course) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleViewDetails(course)}
            className="text-xs"
          >
            Details
          </Button>
        </div>
      )
    }
  ];

  const handleViewDetails = (course: Course) => {
    // Navigate to course details or open modal
    console.log('View details for:', course.code);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category.toLowerCase() === selectedCategory;
    const matchesSemester = selectedSemester === 'all' || course.semester === selectedSemester;
    
    return matchesSearch && matchesCategory && matchesSemester;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Future Courses"
          description="Browse and explore courses available for upcoming semesters"
          backButton={{
            label: "Back to Dashboard",
            onClick: () => router.back()
          }}
          actions={[
            {
              label: "Plan Courses",
              onClick: () => router.push('/student/management/course-planning'),
              icon: <Plus size={16} />
            }
          ]}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            title="Available Courses"
            value={courses.length}
            subtitle="For upcoming semesters"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Core Courses"
            value={courses.filter(c => c.category === 'Core').length}
            subtitle="Required courses"
            icon={<Users size={20} />}
          />
          <StatCard
            title="Electives"
            value={courses.filter(c => c.category === 'Elective').length}
            subtitle="Optional courses"
            icon={<Filter size={20} />}
          />
          <StatCard
            title="Number of students planning"
            value={courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.plannedBy, 0) / courses.length) : 0}
            subtitle="Average per course"
            icon={<Users size={20} />}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Search & Filter Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={handleSearch}
                placeholder="Search by course code or title..."
                className="sm:col-span-2 lg:col-span-1"
              />
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                  <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <DataTable
          data={filteredCourses}
          columns={courseColumns}
          loading={loading}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.total,
            itemsPerPage: pagination.limit,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
            onItemsPerPageChange: (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))
          }}
          emptyState={{
            icon: <BookOpen size={48} />,
            title: searchTerm ? "No courses found" : "No courses available",
            description: searchTerm 
              ? "Try adjusting your search terms or filters"
              : "No courses are currently available for future semesters",
            action: searchTerm ? undefined : {
              label: "View All Curricula",
              onClick: () => router.push('/student/allCurricula')
            }
          }}
          onRowClick={(course) => handleViewDetails(course)}
          cardMode={true}
        />
      </div>
    </div>
  );
};

export default FutureCoursesPage;