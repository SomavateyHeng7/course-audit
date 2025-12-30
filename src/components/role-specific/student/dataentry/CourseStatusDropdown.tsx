'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface CourseStatusDropdownProps {
  value: string;
  gradeOptions: string[];
  onValueChange: (value: string) => void;
  isPlanning: boolean;
  plannedSemester?: string;
  onSemesterChange: (value: string) => void;
  className?: string;
}

const baseClass = 'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0';

export default function CourseStatusDropdown({
  value,
  gradeOptions,
  onValueChange,
  isPlanning,
  plannedSemester,
  onSemesterChange,
  className,
}: CourseStatusDropdownProps) {
  const containerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={containerClass}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
          <SelectValue placeholder="Select Grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Currently Taking">Currently Taking</SelectItem>
          <SelectItem value="Planning">Planning</SelectItem>
          {gradeOptions.map(grade => (
            <SelectItem key={grade} value={grade}>
              {grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPlanning && (
        <Input
          type="text"
          placeholder="e.g., 1/2026"
          value={plannedSemester || ''}
          onChange={event => onSemesterChange(event.target.value)}
          className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
