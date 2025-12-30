import React from 'react';
import { SearchBar } from '@/components/role-specific/chairperson/SearchBar';

interface CurriculumSearchPanelProps {
  value: string;
  totalCurricula: number;
  visibleCount: number;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export const CurriculumSearchPanel: React.FC<CurriculumSearchPanelProps> = ({
  value,
  totalCurricula,
  visibleCount,
  onChange,
  onSearch,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <SearchBar
          value={value}
          onChange={onChange}
          onSubmit={onSearch}
          placeholder="Search curricula by name, year, or description..."
          className="flex-1 max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {visibleCount} of {totalCurricula} curricula
        </div>
      </div>
    </div>
  );
};
