import { API_BASE } from '@/lib/api/laravel';

export interface CurriculumCourseSummary {
  id: string;
  curriculumId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  curriculumName: string;
}

export interface CurriculumConstraintFlags {
  overrideRequiresPermission: boolean | null;
  overrideSummerOnly: boolean | null;
  overrideRequiresSeniorStanding: boolean | null;
  overrideMinCreditThreshold: number | null;
}

export interface CurriculumConstraintResponse {
  success: boolean;
  curriculumCourse: CurriculumCourseSummary;
  baseFlags: {
    requiresPermission: boolean;
    summerOnly: boolean;
    requiresSeniorStanding: boolean;
    minCreditThreshold: number | null;
  };
  overrideFlags: CurriculumConstraintFlags;
  mergedFlags: {
    requiresPermission: boolean;
    summerOnly: boolean;
    requiresSeniorStanding: boolean;
    minCreditThreshold: number | null;
  };
  basePrerequisites: Array<{ courseId: string; code: string; name: string | null }>;
  baseCorequisites: Array<{ courseId: string; code: string; name: string | null }>;
  curriculumPrerequisites: Array<{
    id: string;
    curriculumCourseId: string;
    courseId: string;
    code: string;
    name: string | null;
    credits: number | null;
  }>;
  curriculumCorequisites: Array<{
    id: string;
    curriculumCourseId: string;
    courseId: string;
    code: string;
    name: string | null;
    credits: number | null;
  }>;
}

class CurriculumCourseConstraintsApi {
  private buildBaseUrl(curriculumId: string, curriculumCourseId: string) {
    return `${API_BASE}/curricula/${curriculumId}/courses/${curriculumCourseId}`;
  }

  async getConstraints(
    curriculumId: string,
    curriculumCourseId: string
  ): Promise<CurriculumConstraintResponse> {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/constraints`, {
      credentials: 'include'
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch curriculum course constraints');
    }

    return data as CurriculumConstraintResponse;
  }

  async updateOverrides(
    curriculumId: string,
    curriculumCourseId: string,
    overrides: Partial<CurriculumConstraintFlags>
  ): Promise<CurriculumConstraintFlags> {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/constraints`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(overrides)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update constraint overrides');
    }

    return data.overrides as CurriculumConstraintFlags;
  }

  async addPrerequisite(
    curriculumId: string,
    curriculumCourseId: string,
    targetCurriculumCourseId: string
  ) {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/prerequisites`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetCurriculumCourseId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to add curriculum prerequisite');
    }

    return data.prerequisite;
  }

  async removePrerequisite(
    curriculumId: string,
    curriculumCourseId: string,
    relationId: string
  ) {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/prerequisites/${relationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Failed to remove curriculum prerequisite');
    }
  }

  async addCorequisite(
    curriculumId: string,
    curriculumCourseId: string,
    targetCurriculumCourseId: string
  ) {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/corequisites`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetCurriculumCourseId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to add curriculum co-requisite');
    }

    return data.corequisite;
  }

  async removeCorequisite(
    curriculumId: string,
    curriculumCourseId: string,
    relationId: string
  ) {
    const response = await fetch(`${this.buildBaseUrl(curriculumId, curriculumCourseId)}/corequisites/${relationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Failed to remove curriculum co-requisite');
    }
  }
}

export const curriculumCourseConstraintsApi = new CurriculumCourseConstraintsApi();
export default curriculumCourseConstraintsApi;
