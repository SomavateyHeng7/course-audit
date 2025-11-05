'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar, 
  Users,
  Download,
  Eye,
  Award
} from 'lucide-react';

// Import chairperson components
import { PageHeader } from '@/components/chairperson/PageHeader';
import { SearchBar } from '@/components/chairperson/SearchBar';
import { DataTable } from '@/components/chairperson/DataTable';
import { LoadingSpinner } from '@/components/chairperson/LoadingSpinner';
import { StatCard } from '@/components/chairperson/StatCard';

interface Curriculum {
  id: string;
  name: string;
  year: string;
  version: string;
  description?: string;
  totalCourses: number;
  totalCredits: number;
  isActive: boolean;
  createdAt: string;
  department: string;
}

const AllCurriculaPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockCurricula: Curriculum[] = [
        {
          id: '1',
          name: 'Computer Science',
          year: '2024',
          version: '1.0',
          description: 'Bachelor of Science in Computer Science with focus on software development and algorithms.',
          totalCourses: 40,
          totalCredits: 120,
          isActive: true,
          createdAt: '2024-01-15',
          department: 'Computer Science'
        },
        {
          id: '2',
          name: 'Information Systems',
          year: '2024',
          version: '1.0',
          description: 'Bachelor of Science in Information Systems with emphasis on business applications.',
          totalCourses: 38,
          totalCredits: 114,
          isActive: true,
          createdAt: '2024-02-01',
          department: 'Computer Science'
        }
      ];
      
      setCurricula(mockCurricula);
    } catch (error) {
      console.error('Failed to fetch curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const curriculumColumns = [
    {
      key: 'name',
      label: 'Curriculum',
      className: 'flex-1',
      render: (curriculum: Curriculum) => (
        <div>
          <div className="font-semibold text-foreground">
            {curriculum.name} ({curriculum.year})
          </div>
          <div className="text-sm text-muted-foreground">
            Version {curriculum.version} • {curriculum.department}
          </div>
          {curriculum.description && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2 lg:hidden">
              {curriculum.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      className: 'flex-1',
      hideOnMobile: true,
      render: (curriculum: Curriculum) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {curriculum.description || 'No description available'}
        </span>
      )
    },
    {
      key: 'stats',
      label: 'Statistics',
      className: 'w-32',
      render: (curriculum: Curriculum) => (
        <div className="text-sm">
          <div>{curriculum.totalCourses} courses</div>
          <div className="text-muted-foreground">{curriculum.totalCredits} credits</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (curriculum: Curriculum) => (
        <Badge variant={curriculum.isActive ? 'default' : 'secondary'}>
          {curriculum.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-40',
      render: (curriculum: Curriculum) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewCurriculum(curriculum)}
            className="text-xs"
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadCurriculum(curriculum)}
            className="text-xs"
          >
            <Download size={14} />
          </Button>
        </div>
      )
    }
  ];

  const handleViewCurriculum = (curriculum: Curriculum) => {
    router.push(`/student/curriculum/${curriculum.id}`);
  };

  const handleDownloadCurriculum = (curriculum: Curriculum) => {
    // Handle curriculum download
    console.log('Download curriculum:', curriculum.name);
  };

  const filteredCurricula = curricula.filter(curriculum =>
    curriculum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="All Curricula"
          description="Browse and explore available academic curricula and degree programs"
          backButton={{
            label: "Back to Dashboard",
            onClick: () => router.back()
          }}
          actions={[
            {
              label: "My Progress",
              onClick: () => router.push('/student/management'),
              variant: "outline" as const,
              icon: <Award size={16} />
            }
          ]}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            title="Total Curricula"
            value={curricula.length}
            subtitle="Available programs"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Active Programs"
            value={curricula.filter(c => c.isActive).length}
            subtitle="Currently offered"
            icon={<Award size={20} />}
          />
          <StatCard
            title="Average Courses"
            value={Math.round(curricula.reduce((acc, c) => acc + c.totalCourses, 0) / curricula.length || 0)}
            subtitle="Per curriculum"
            icon={<Users size={20} />}
          />
          <StatCard
            title="Average Credits"
            value={Math.round(curricula.reduce((acc, c) => acc + c.totalCredits, 0) / curricula.length || 0)}
            subtitle="Per program"
            icon={<Calendar size={20} />}
          />
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search curricula by name, department, or description..."
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Curricula Table */}
        <DataTable
          data={filteredCurricula}
          columns={curriculumColumns}
          loading={loading}
          emptyState={{
            icon: <BookOpen size={48} />,
            title: searchTerm ? "No curricula found" : "No curricula available",
            description: searchTerm 
              ? "Try adjusting your search terms to find relevant curricula"
              : "No curricula are currently available in the system",
            action: {
              label: "Back to Dashboard",
              onClick: () => router.push('/student/management')
            }
          }}
          onRowClick={(curriculum) => handleViewCurriculum(curriculum)}
          cardMode={true}
        />
      </div>
    </div>
  );
};

export default AllCurriculaPage;