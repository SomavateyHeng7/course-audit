// Course constraints API service
// Handles all constraint-related API calls for courses

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  creditHours?: string;
}

export interface CourseConstraintFlags {
  requiresPermission: boolean;
  summerOnly: boolean;
  requiresSeniorStanding: boolean;
  minCreditThreshold?: number;
}

export interface Prerequisite {
  id: string;
  prerequisite: Course;
  createdAt: string;
}

export interface Corequisite {
  id: string;
  corequisite: Course;
  createdAt: string;
}

export interface CourseConstraints {
  course: Course;
  flags: CourseConstraintFlags;
  prerequisites: Course[];
  corequisites: Course[];
  bannedCombinations: Course[]; // May be handled at curriculum level
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  data?: T;
}

class CourseConstraintsApi {
  private baseUrl = '/api/courses';

  // Get all constraints for a course
  async getConstraints(courseId: string): Promise<CourseConstraints> {
    const response = await fetch(`${this.baseUrl}/${courseId}/constraints`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch constraints');
    }
    
    return data.constraints;
  }

  // Update course constraint flags (permission, summer only, senior standing)
  async updateConstraintFlags(
    courseId: string, 
    flags: CourseConstraintFlags
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${courseId}/constraints`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flags),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update constraint flags');
    }
  }

  // Get prerequisites for a course
  async getPrerequisites(courseId: string): Promise<Prerequisite[]> {
    const response = await fetch(`${this.baseUrl}/${courseId}/prerequisites`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch prerequisites');
    }
    
    return data.prerequisites;
  }

  // Add prerequisite to a course
  async addPrerequisite(courseId: string, prerequisiteId: string): Promise<Prerequisite> {
    const response = await fetch(`${this.baseUrl}/${courseId}/prerequisites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prerequisiteId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to add prerequisite');
    }
    
    return data.prerequisite;
  }

  // Remove prerequisite from a course
  async removePrerequisite(courseId: string, prerequisiteRelationId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/${courseId}/prerequisites/${prerequisiteRelationId}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to remove prerequisite');
    }
  }

  // Get corequisites for a course
  async getCorequisites(courseId: string): Promise<Corequisite[]> {
    const response = await fetch(`${this.baseUrl}/${courseId}/corequisites`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch corequisites');
    }
    
    return data.corequisites;
  }

  // Add corequisite to a course
  async addCorequisite(courseId: string, corequisiteId: string): Promise<Corequisite> {
    const response = await fetch(`${this.baseUrl}/${courseId}/corequisites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ corequisiteId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to add corequisite');
    }
    
    return data.corequisite;
  }

  // Remove corequisite from a course
  async removeCorequisite(courseId: string, corequisiteRelationId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/${courseId}/corequisites/${corequisiteRelationId}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to remove corequisite');
    }
  }

  // Save all constraints at once (convenience method)
  async saveAllConstraints(
    courseId: string,
    constraints: {
      flags: CourseConstraintFlags;
      prerequisites: string[]; // Array of course IDs
      corequisites: string[]; // Array of course IDs
    }
  ): Promise<void> {
    // Update constraint flags
    await this.updateConstraintFlags(courseId, constraints.flags);

    // Get current constraints to determine what needs to be added/removed
    const current = await this.getConstraints(courseId);
    
    // Handle prerequisites
    const currentPrereqIds = current.prerequisites.map(p => p.id);
    const toAddPrereqs = constraints.prerequisites.filter(id => !currentPrereqIds.includes(id));
    const currentPrereqs = await this.getPrerequisites(courseId);
    const toRemovePrereqs = currentPrereqs.filter(p => !constraints.prerequisites.includes(p.prerequisite.id));

    // Add new prerequisites
    for (const prereqId of toAddPrereqs) {
      await this.addPrerequisite(courseId, prereqId);
    }

    // Remove old prerequisites
    for (const prereq of toRemovePrereqs) {
      await this.removePrerequisite(courseId, prereq.id);
    }

    // Handle corequisites
    const currentCoreqIds = current.corequisites.map(c => c.id);
    const toAddCoreqs = constraints.corequisites.filter(id => !currentCoreqIds.includes(id));
    const currentCoreqs = await this.getCorequisites(courseId);
    const toRemoveCoreqs = currentCoreqs.filter(c => !constraints.corequisites.includes(c.corequisite.id));

    // Add new corequisites
    for (const coreqId of toAddCoreqs) {
      await this.addCorequisite(courseId, coreqId);
    }

    // Remove old corequisites
    for (const coreq of toRemoveCoreqs) {
      await this.removeCorequisite(courseId, coreq.id);
    }
  }
}

// Export a singleton instance
export const courseConstraintsApi = new CourseConstraintsApi();
export default courseConstraintsApi;
