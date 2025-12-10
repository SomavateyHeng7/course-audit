// API service for curriculum blacklist management
import { API_BASE } from '@/lib/api/laravel';

export interface CurriculumBlacklistCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: string;
  description?: string;
}

export interface CurriculumBlacklist {
  id: string;
  name: string;
  description?: string;
  courses: CurriculumBlacklistCourse[];
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedBlacklist {
  id: string;
  blacklistId: string;
  assignedAt: string;
  blacklist: CurriculumBlacklist;
}

export interface CurriculumBlacklistsResponse {
  availableBlacklists: CurriculumBlacklist[];
  assignedBlacklists: AssignedBlacklist[];
  stats: {
    totalAvailable: number;
    totalAssigned: number;
    totalBlacklistedCourses: number;
  };
}

export interface AssignBlacklistRequest {
  blacklistId: string;
}

export interface AssignBlacklistResponse {
  assignment: AssignedBlacklist;
  message: string;
}

export interface RemoveBlacklistResponse {
  message: string;
  removedAssignment: {
    id: string;
    blacklistId: string;
    blacklistName: string;
    courseCount: number;
    assignedAt: string;
  };
}

class CurriculumBlacklistApi {
  // Get curriculum blacklists (both available and assigned)
  async getCurriculumBlacklists(curriculumId: string): Promise<CurriculumBlacklistsResponse> {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/blacklists`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch curriculum blacklists');
    }
    
    return data;
  }

  // Assign blacklist to curriculum
  async assignBlacklistToCurriculum(
    curriculumId: string,
    request: AssignBlacklistRequest
  ): Promise<AssignBlacklistResponse> {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/blacklists`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to assign blacklist to curriculum');
    }
    
    return data;
  }

  // Remove blacklist from curriculum
  async removeBlacklistFromCurriculum(
    curriculumId: string,
    blacklistId: string
  ): Promise<RemoveBlacklistResponse> {
    const response = await fetch(`${API_BASE}/curricula/${curriculumId}/blacklists/${blacklistId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to remove blacklist from curriculum');
    }
    
    return data;
  }

  // Validation helpers
  validateAssignmentRequest(request: AssignBlacklistRequest): string[] {
    const errors: string[] = [];
    
    if (!request.blacklistId?.trim()) {
      errors.push('Blacklist ID is required');
    }
    
    return errors;
  }
}

export const curriculumBlacklistApi = new CurriculumBlacklistApi();
export default curriculumBlacklistApi;
