// API service for concentration management
import { API_BASE } from '@/lib/api/laravel';

export interface ConcentrationCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  creditHours: string;
  category: string;
  description?: string;
}

export interface ConcentrationData {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  courseCount: number;
  courses: ConcentrationCourse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConcentrationRequest {
  name: string;
  description?: string;
  courseIds?: string[];
  courses?: {
    code: string;
    name: string;
    credits: number;
    creditHours?: number;
    description?: string;
    category?: string;
  }[];
}

export interface UpdateConcentrationRequest {
  name: string;
  description?: string;
  courseIds?: string[];
}

export interface ConcentrationCoursesResponse {
  concentrationId: string;
  concentrationName: string;
  courses: ConcentrationCourse[];
  totalCourses: number;
}

export interface AddCoursesRequest {
  courseIds: string[];
}

export interface RemoveCoursesRequest {
  courseIds: string[];
}

export const concentrationApi = {
  // Get all concentrations
  async getConcentrations(): Promise<ConcentrationData[]> {
    const response = await fetch(`${API_BASE}/concentrations`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch concentrations');
    }

    const data = await response.json();
    // Handle both direct array and wrapped response
    return Array.isArray(data) ? data : (data.concentrations || []);
  },

  // Get specific concentration
  async getConcentration(id: string): Promise<ConcentrationData> {
    const response = await fetch(`${API_BASE}/concentrations/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch concentration');
    }

    return response.json();
  },

  // Create new concentration
  async createConcentration(data: CreateConcentrationRequest): Promise<ConcentrationData> {
    const response = await fetch(`${API_BASE}/concentrations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create concentration');
    }

    const result = await response.json();
    // Backend returns { concentration: {...} }
    return result.concentration || result;
  },

  // Update concentration
  async updateConcentration(id: string, data: UpdateConcentrationRequest): Promise<ConcentrationData> {
    const response = await fetch(`${API_BASE}/concentrations/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update concentration');
    }

    return response.json();
  },

  // Delete concentration
  async deleteConcentration(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/concentrations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete concentration');
    }

    return response.json();
  },

  // Get courses in concentration
  async getConcentrationCourses(id: string): Promise<ConcentrationCoursesResponse> {
    const response = await fetch(`${API_BASE}/concentrations/${id}/courses`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch concentration courses');
    }

    return response.json();
  },

  // Add courses to concentration
  async addCoursesToConcentration(id: string, data: AddCoursesRequest): Promise<ConcentrationCoursesResponse> {
    const response = await fetch(`${API_BASE}/concentrations/${id}/courses`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add courses to concentration');
    }

    return response.json();
  },

  // Remove courses from concentration
  async removeCoursesFromConcentration(id: string, data: RemoveCoursesRequest): Promise<ConcentrationCoursesResponse> {
    const response = await fetch(`${API_BASE}/concentrations/${id}/courses`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to remove courses from concentration');
    }

    return response.json();
  },

  // Utility: Upload and create concentration from Excel/CSV file
  async createConcentrationFromFile(
    name: string,
    description: string | undefined,
    fileData: {
      code: string;
      name: string;
      credits: number;
      creditHours?: number;
      description?: string;
      category?: string;
    }[]
  ): Promise<ConcentrationData> {
    return this.createConcentration({
      name,
      description,
      courses: fileData,
    });
  },

  // Utility methods for file parsing and validation
  parseCSVContent(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const courses = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 2) {
        courses.push({
          code: values[0] || '',
          name: values[1] || '',
          credits: parseInt(values[2]) || 3,
          creditHours: values[3] || '3-0-6',
          category: values[4] || 'Major Elective',
          description: values[5] || ''
        });
      }
    }
    
    return courses;
  },

  async parseExcelFile(file: File): Promise<any[]> {
    const XLSX = await import('xlsx');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const courses: any[] = [];
          
          // Skip header row and process data
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;
            
            const course = {
              code: String(row[0] || '').trim(),
              name: String(row[1] || '').trim(),
              credits: parseInt(String(row[2] || '3')) || 3,
              creditHours: String(row[3] || '3-0-6').trim(),
              category: String(row[4] || 'Major Elective').trim(),
              description: row[5] ? String(row[5]).trim() : ''
            };
            
            // Only add if we have at least code and name
            if (course.code && course.name) {
              courses.push(course);
            }
          }
          
          resolve(courses);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error('Failed to parse Excel file. Please check the file format.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  },

  validateConcentrationData(data: { name: string }): string[] {
    const errors = [];
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Concentration name is required');
    }
    if (data.name && data.name.trim().length > 100) {
      errors.push('Concentration name must be less than 100 characters');
    }
    return errors;
  },

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      const concentrations = await this.getConcentrations();
      return concentrations.some(c => 
        c.name.toLowerCase() === name.toLowerCase() && 
        (!excludeId || c.id !== excludeId)
      );
    } catch (error) {
      console.error('Error checking concentration name:', error);
      return false;
    }
  },

  async mapCodesToIds(codes: string[]): Promise<Array<{
    code: string;
    id: string;
    found: boolean;
    isNew: boolean;
  }>> {
    try {
      // Query the backend to check which courses exist
      const response = await fetch(`${API_BASE}/courses/map-codes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes }),
      });

      if (!response.ok) {
        throw new Error('Failed to map course codes');
      }

      const data = await response.json();
      return data.results || codes.map(code => ({
        code,
        id: '',
        found: false,
        isNew: true
      }));
    } catch (error) {
      console.error('Error mapping course codes to IDs:', error);
      // Return all as new courses if API fails
      return codes.map(code => ({
        code,
        id: '',
        found: false,
        isNew: true
      }));
    }
  },

  async createCoursesFromConcentrationData(coursesData: any[]): Promise<Array<{ id: string; code: string; name: string }>> {
    try {
      // Create courses in the database via bulk create endpoint
      const response = await fetch(`${API_BASE}/courses/bulk-create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courses: coursesData }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create courses');
      }

      const data = await response.json();
      return data.courses || [];
    } catch (error) {
      console.error('Error creating courses:', error);
      throw new Error('Failed to create courses');
    }
  },
};

// Curriculum concentration management endpoints
export const curriculumConcentrationApi = {
  // Get concentrations assigned to a curriculum
  getCurriculumConcentrations: async (curriculumId: string) => {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/concentrations`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch curriculum concentrations');
    }
    const data = await response.json();
    return data.concentrations || [];
  },

  // Add concentration to curriculum
  addCurriculumConcentration: async (curriculumId: string, concentrationId: string, requiredCourses: number = 1) => {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/concentrations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concentrationId,
        requiredCourses
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add concentration to curriculum');
    }
    
    return response.json();
  },

  // Update concentration requirement count
  updateCurriculumConcentration: async (curriculumId: string, concentrationId: string, requiredCourses: number) => {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/concentrations/${concentrationId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requiredCourses
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update curriculum concentration');
    }
    
    return response.json();
  },

  // Remove concentration from curriculum
  removeCurriculumConcentration: async (curriculumId: string, concentrationId: string) => {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/concentrations/${concentrationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove concentration from curriculum');
    }
    
    return response.json();
  },
};
