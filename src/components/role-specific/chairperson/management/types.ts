export interface Curriculum {
  id: string;
  name: string;
  year: string;
  version: string;
  description?: string;
  startId?: string;
  endId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  faculty?: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    curriculumCourses: number;
    curriculumConstraints: number;
    electiveRules: number;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
