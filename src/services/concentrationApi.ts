// API service for concentration management

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
    const response = await fetch('/api/concentrations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch concentrations');
    }

    return response.json();
  },

  // Get specific concentration
  async getConcentration(id: string): Promise<ConcentrationData> {
    const response = await fetch(`/api/concentrations/${id}`, {
      method: 'GET',
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
    const response = await fetch('/api/concentrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create concentration');
    }

    return response.json();
  },

  // Update concentration
  async updateConcentration(id: string, data: UpdateConcentrationRequest): Promise<ConcentrationData> {
    const response = await fetch(`/api/concentrations/${id}`, {
      method: 'PUT',
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
    const response = await fetch(`/api/concentrations/${id}`, {
      method: 'DELETE',
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
    const response = await fetch(`/api/concentrations/${id}/courses`, {
      method: 'GET',
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
    const response = await fetch(`/api/concentrations/${id}/courses`, {
      method: 'POST',
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
    const response = await fetch(`/api/concentrations/${id}/courses`, {
      method: 'DELETE',
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
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) return [];
    
    const courses = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (row.length >= 2) {
        courses.push({
          code: row[0] || '',
          name: row[1] || '',
          credits: parseInt(row[2]) || 3,
          creditHours: row[3] || '3-0-6',
          category: row[4] || 'Major Elective',
          description: row[5] || ''
        });
      }
    }
    
    return courses;
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
      // This would normally query the courses API to map codes to IDs
      // For now, returning mock mapping results
      return codes.map(code => ({
        code,
        id: crypto.randomUUID(),
        found: false,
        isNew: true
      }));
    } catch (error) {
      console.error('Error mapping course codes to IDs:', error);
      return [];
    }
  },

  async createCoursesFromConcentrationData(coursesData: any[]): Promise<Array<{ id: string }>> {
    try {
      // This would normally create courses in the database
      // For now, returning mock course objects with IDs
      return coursesData.map(() => ({
        id: crypto.randomUUID()
      }));
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
    const response = await fetch(`/api/curricula/${curriculumId}/concentrations`);
    if (!response.ok) {
      throw new Error('Failed to fetch curriculum concentrations');
    }
    const data = await response.json();
    return data.concentrations || [];
  },

  // Add concentration to curriculum
  addCurriculumConcentration: async (curriculumId: string, concentrationId: string, requiredCourses: number = 1) => {
    const response = await fetch(`/api/curricula/${curriculumId}/concentrations`, {
      method: 'POST',
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
    const response = await fetch(`/api/curricula/${curriculumId}/concentrations/${concentrationId}`, {
      method: 'PUT',
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
    const response = await fetch(`/api/curricula/${curriculumId}/concentrations/${concentrationId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove concentration from curriculum');
    }
    
    return response.json();
  },
};
