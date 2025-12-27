export interface CourseStatus {
  status: 'pending' | 'not_completed' | 'completed' | 'failed' | 'withdrawn' | 'planning';
  grade?: string;
  plannedSemester?: string; // Format: "1/2026" or "2/2026"
}

export const isPendingStatus = (status?: CourseStatus['status']) =>
  !status || status === 'pending' || status === 'not_completed';

export const getDefaultSemesterLabel = (term?: string) => {
  const currentYear = new Date().getFullYear();
  if (term === '2') return `2/${currentYear}`;
  if (term === '3' || term === 'summer') return `3/${currentYear}`;
  return `1/${currentYear}`;
};
