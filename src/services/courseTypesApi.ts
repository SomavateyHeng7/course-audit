// API service for course types management
// Using Laravel backend

import {
  getCourseTypes,
  createCourseType as laravelCreateCourseType,
  updateCourseType as laravelUpdateCourseType,
  deleteCourseType as laravelDeleteCourseType
} from '@/lib/api/laravel';

export interface CourseTypeData {
  id: string;
  name: string;
  color: string;
  departmentId: string;
  seeded?: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  usageCount?: number;
  childCount?: number;
}

export interface CreateCourseTypeRequest {
  name: string;
  color: string;
  parentId?: string | null;
}

export interface UpdateCourseTypeRequest {
  name: string;
  color: string;
  parentId?: string | null;
}

export interface CourseTypesResponse {
  courseTypes: CourseTypeData[];
  seeded: boolean;
  total: number;
}

export const courseTypesApi = {
  /* =====================================================
   * GET /course-types
   * ===================================================== */
  async getAllCourseTypes(): Promise<CourseTypesResponse> {
    const response = await getCourseTypes();

    // 🔥 Expect full Laravel response
    return {
      courseTypes: response.courseTypes,
      seeded: response.seeded,
      total: response.total,
    };
  },

  /* =====================================================
   * POST /course-types
   * ===================================================== */
  async createCourseType(
    data: CreateCourseTypeRequest
  ): Promise<CourseTypeData> {
    return await laravelCreateCourseType(data);
  },

  /* =====================================================
   * PUT /course-types/{id}
   * ===================================================== */
  async updateCourseType(
    id: string,
    data: UpdateCourseTypeRequest
  ): Promise<CourseTypeData> {
    return await laravelUpdateCourseType(id, data);
  },

  /* =====================================================
   * DELETE /course-types/{id}
   * ===================================================== */
  async deleteCourseType(id: string): Promise<{ message: string }> {
    await laravelDeleteCourseType(id);
    return { message: 'Course type deleted successfully' };
  },

  /* =====================================================
   * Validation helper
   * ===================================================== */
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
