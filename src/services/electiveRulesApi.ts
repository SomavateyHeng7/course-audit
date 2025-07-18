// API service for elective rules management
export interface ElectiveRule {
  id: string;
  curriculumId: string;
  category: string;
  requiredCredits: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumCourse {
  id: string;
  code: string;
  name: string;
  category: string;
  credits: number;
  isRequired: boolean;
  semester: string;
  year: number;
}

export interface ElectiveRulesData {
  electiveRules: ElectiveRule[];
  courseCategories: string[];
  curriculumCourses: CurriculumCourse[];
}

export interface CreateElectiveRuleRequest {
  category: string;
  requiredCredits: number;
  description?: string;
}

export interface UpdateElectiveRuleRequest {
  requiredCredits?: number;
  description?: string;
}

export interface UpdateElectiveSettingsRequest {
  freeElectiveCredits?: number;
  freeElectiveName?: string;
  courseRequirements?: {
    courseId: string;
    isRequired: boolean;
  }[];
}

class ElectiveRulesApi {
  private baseUrl = '/api/curricula';

  // Get all elective rules for a curriculum
  async getElectiveRules(curriculumId: string): Promise<ElectiveRulesData> {
    const response = await fetch(`${this.baseUrl}/${curriculumId}/elective-rules`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch elective rules');
    }
    
    return data;
  }

  // Create new elective rule
  async createElectiveRule(
    curriculumId: string, 
    ruleData: CreateElectiveRuleRequest
  ): Promise<ElectiveRule> {
    const response = await fetch(`${this.baseUrl}/${curriculumId}/elective-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ruleData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create elective rule');
    }
    
    return data.electiveRule;
  }

  // Update elective rule
  async updateElectiveRule(
    curriculumId: string,
    ruleId: string,
    ruleData: UpdateElectiveRuleRequest
  ): Promise<ElectiveRule> {
    const response = await fetch(`${this.baseUrl}/${curriculumId}/elective-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ruleData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update elective rule');
    }
    
    return data.electiveRule;
  }

  // Delete elective rule
  async deleteElectiveRule(curriculumId: string, ruleId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${curriculumId}/elective-rules/${ruleId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to delete elective rule');
    }
  }

  // Update elective settings (free elective credits and course requirements)
  async updateElectiveSettings(
    curriculumId: string,
    settings: UpdateElectiveSettingsRequest
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${curriculumId}/elective-rules/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update elective settings');
    }
  }

  // Helper method to calculate credits by category
  calculateCreditsByCategory(courses: CurriculumCourse[]): Record<string, { required: number; elective: number; total: number }> {
    const breakdown: Record<string, { required: number; elective: number; total: number }> = {};

    courses.forEach(course => {
      if (!course.category) return;

      if (!breakdown[course.category]) {
        breakdown[course.category] = { required: 0, elective: 0, total: 0 };
      }

      const credits = course.credits || 0;
      breakdown[course.category].total += credits;

      if (course.isRequired) {
        breakdown[course.category].required += credits;
      } else {
        breakdown[course.category].elective += credits;
      }
    });

    return breakdown;
  }

  // Helper method to get unique categories from courses
  getUniqueCategories(courses: CurriculumCourse[]): string[] {
    return [...new Set(courses.map(course => course.category).filter(Boolean))].sort();
  }
}

export const electiveRulesApi = new ElectiveRulesApi();
