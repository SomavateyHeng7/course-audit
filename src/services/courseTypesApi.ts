// API service for course types management
// Now using Laravel backend
import {
  getCourseTypes,
  createCourseType as laravelCreateCourseType,
  updateCourseType as laravelUpdateCourseType,
  deleteCourseType as laravelDeleteCourseType
} from '@/lib/api/laravel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api`;

export interface CourseTypeData {
  id: string;
  name: string;
  color: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseTypeRequest {
  name: string;
  color: string;
}

export interface UpdateCourseTypeRequest {
  name: string;
  color: string;
}

export interface CourseTypesResponse {
  courseTypes: CourseTypeData[];
  total: number;
}export const courseTypesApi = {
  // Get all course types for the current department
  async getAllCourseTypes(): Promise<CourseTypesResponse> {
    const courseTypes = await getCourseTypes();
    return { courseTypes, total: courseTypes.length };
  },

  // Create a new course type
  async createCourseType(data: CreateCourseTypeRequest): Promise<CourseTypeData> {
    return await laravelCreateCourseType(data);
  },

  // Update an existing course type
  async updateCourseType(id: string, data: UpdateCourseTypeRequest): Promise<CourseTypeData> {
    return await laravelUpdateCourseType(Number(id), data);
  },

  // Delete a course type
  async deleteCourseType(id: string): Promise<{ message: string }> {
    await laravelDeleteCourseType(Number(id));
    return { message: 'Course type deleted successfully' };
  },

  // Validation helper
  validateCourseType(name: string, color: string): string[] {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Course type name is required');
    } else if (name.trim().length > 50) {
      errors.push('Course type name must be 50 characters or less');
    }
    
    if (!color || color.trim().length === 0) {
      errors.push('Color is required');
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(color.trim())) {
      errors.push('Color must be a valid hex color (e.g., #ff0000)');
    }
    
    return errors;
  },
};
