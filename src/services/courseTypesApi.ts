// API service for course types management

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
}

const API_BASE = '/api';

export const courseTypesApi = {
  // Get all course types for the current department
  async getAllCourseTypes(): Promise<CourseTypesResponse> {
    const response = await fetch(`${API_BASE}/course-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to fetch course types`);
    }

    return response.json();
  },

  // Create a new course type
  async createCourseType(data: CreateCourseTypeRequest): Promise<CourseTypeData> {
    const response = await fetch(`${API_BASE}/course-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to create course type`);
    }

    return response.json();
  },

  // Update an existing course type
  async updateCourseType(id: string, data: UpdateCourseTypeRequest): Promise<CourseTypeData> {
    const response = await fetch(`${API_BASE}/course-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to update course type`);
    }

    return response.json();
  },

  // Delete a course type
  async deleteCourseType(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/course-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to delete course type`);
    }

    return response.json();
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
