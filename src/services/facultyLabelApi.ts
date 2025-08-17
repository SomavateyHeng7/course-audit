// API service for faculty concentration label management
const API_BASE = '/api';

export interface FacultyLabelResponse {
  facultyId: string;
  facultyName: string;
  concentrationLabel: string;
}

export interface UpdateLabelResponse {
  success: boolean;
  faculty: {
    id: string;
    name: string;
    concentrationLabel: string;
  };
  message: string;
}

export interface UpdateLabelRequest {
  label: string;
}

export const facultyLabelApi = {
  // Get current faculty concentration label
  async getConcentrationLabel(): Promise<FacultyLabelResponse> {
    const response = await fetch(`${API_BASE}/faculty/concentration-label`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to fetch concentration label`);
    }

    return response.json();
  },

  // Update faculty concentration label
  async updateConcentrationLabel(data: UpdateLabelRequest): Promise<UpdateLabelResponse> {
    const response = await fetch(`${API_BASE}/faculty/concentration-label`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to update concentration label`);
    }

    return response.json();
  },

  // Validation helper
  validateLabel(label: string): string[] {
    const errors: string[] = [];
    
    if (!label || label.trim().length === 0) {
      errors.push('Label is required');
    } else if (label.trim().length > 50) {
      errors.push('Label must be 50 characters or less');
    }
    
    return errors;
  },
};
