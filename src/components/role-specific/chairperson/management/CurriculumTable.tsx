import React from 'react';
import { BookOpen, Copy, Info, PencilLine, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { ActionButton } from '@/components/role-specific/chairperson/ActionButton';
import { Curriculum, PaginationInfo } from './types';

interface CurriculumTableProps {
  data: Curriculum[];
  pagination: PaginationInfo;
  loading: boolean;
  searchTerm: string;
  editingCurriculumId: string | null;
  renameModalOpen: boolean;
  onRename: (curriculum: Curriculum) => void;
  onViewDetails: (curriculum: Curriculum) => void;
  onDuplicate: (curriculum: Curriculum) => void;
  onDelete: (curriculum: Curriculum) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  onRowClick: (curriculum: Curriculum) => void;
  onCreateFirstCurriculum?: () => void;
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const CurriculumTable: React.FC<CurriculumTableProps> = ({
  data,
  pagination,
  loading,
  searchTerm,
  editingCurriculumId,
  renameModalOpen,
  onRename,
  onViewDetails,
  onDuplicate,
  onDelete,
  onPageChange,
  onItemsPerPageChange,
  onRowClick,
  onCreateFirstCurriculum,
}) => {
  const isSearching = searchTerm.trim().length > 0;

  return (
    <DataTable
      data={data}
      columns={[
        {
          key: 'name',
          label: 'Curriculum Name',
          className: 'flex-1',
          render: (curriculum: Curriculum) => (
            <div>
              <button
                type="button"
                className="w-full text-left cursor-pointer hover:text-teal-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(curriculum);
                }}
                title="Rename curriculum"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-foreground">
                    {curriculum.name} ({curriculum.year})
                  </div>
                  {editingCurriculumId === curriculum.id && renameModalOpen && (
                    <span className="text-[11px] uppercase tracking-wide text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Renaming
                    </span>
                  )}
                </div>
              </button>
              <div className="text-sm text-muted-foreground">
                Version {curriculum.version} • ID: {curriculum.startId} - {curriculum.endId}
              </div>
              {curriculum.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2 lg:hidden">
                  {curriculum.description}
                </div>
              )}
            </div>
          ),
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
          ),
        },
        {
          key: 'stats',
          label: 'Statistics',
          className: 'w-32',
          render: (curriculum: Curriculum) => (
            <div className="text-sm">
              <div className="flex items-center gap-1 text-blue-600">
                <BookOpen size={14} />
                <span>{curriculum._count.curriculumCourses} courses</span>
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {curriculum._count.curriculumConstraints} constraints
              </div>
            </div>
          ),
        },
        {
          key: 'updated',
          label: 'Last Updated',
          className: 'w-32',
          hideOnMobile: true,
          render: (curriculum: Curriculum) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(curriculum.updated_at || curriculum.updatedAt)}
            </span>
          ),
        },
        {
          key: 'actions',
          label: 'Actions',
          className: 'w-40 text-center',
          render: (curriculum: Curriculum) => (
            <div className="flex gap-2 justify-center">
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => onRename(curriculum)}
                stopPropagation
                icon={<PencilLine size={14} />}
                tooltip="Rename Curriculum"
                className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              />
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(curriculum)}
                stopPropagation
                icon={<Info size={14} />}
                tooltip="View Details"
              />
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(curriculum)}
                stopPropagation
                icon={<Copy size={14} />}
                tooltip="Duplicate Curriculum"
                className="text-blue-600 hover:text-blue-700"
              />
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => onDelete(curriculum)}
                stopPropagation
                icon={<Trash2 size={14} />}
                tooltip="Delete Curriculum"
                className="text-destructive hover:text-destructive"
              />
            </div>
          ),
        },
      ]}
      loading={loading}
      pagination={{
        currentPage: pagination?.page || 1,
        totalPages: pagination?.totalPages || 1,
        totalItems: pagination?.total || 0,
        itemsPerPage: pagination?.limit || 10,
        onPageChange,
        onItemsPerPageChange,
      }}
      emptyState={{
        icon: <BookOpen size={48} />,
        title: isSearching ? 'No curricula found' : 'No curricula yet',
        description: isSearching
          ? 'Try adjusting your search terms to find relevant curricula'
          : 'Create your first curriculum to get started with program management',
        action: !isSearching && onCreateFirstCurriculum
          ? {
              label: 'Create First Curriculum',
              onClick: onCreateFirstCurriculum,
            }
          : undefined,
      }}
      onRowClick={onRowClick}
    />
  );
};
