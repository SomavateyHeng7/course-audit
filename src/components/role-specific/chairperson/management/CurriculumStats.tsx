import React from 'react';
import { BookOpen, Settings } from 'lucide-react';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';

interface CurriculumStatsProps {
  totalCurricula: number;
  activeCurricula: number;
  totalCourses: number;
}

export const CurriculumStats: React.FC<CurriculumStatsProps> = ({
  totalCurricula,
  activeCurricula,
  totalCourses,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <StatCard
        title="Total Curricula"
        value={totalCurricula}
        subtitle="Academic programs"
        icon={<BookOpen size={20} />}
      />
      <StatCard
        title="Active Programs"
        value={activeCurricula}
        subtitle="Currently offered"
        icon={<Settings size={20} />}
      />
      <StatCard
        title="Total Courses"
        value={totalCourses}
        subtitle="Across all programs"
        icon={<BookOpen size={20} />}
      />
    </div>
  );
};
