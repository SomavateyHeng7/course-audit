// API service for blacklist management
// Now using Laravel backend
import { 
  getBlacklists as laravelGetBlacklists,
  getBlacklist as laravelGetBlacklist,
  createBlacklist as laravelCreateBlacklist,
  updateBlacklist as laravelUpdateBlacklist,
  deleteBlacklist as laravelDeleteBlacklist
} from '@/lib/api/laravel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api`;
export interface BlacklistCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: string;
  description?: string;
}

export interface BlacklistData {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  courses: BlacklistCourse[];
  courseCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlacklistRequest {
  name: string;
  description?: string;
  courseIds?: string[];
}

export interface UpdateBlacklistRequest {
  name?: string;
  description?: string;
  courseIds?: string[];
}

export interface BlacklistsResponse {
  blacklists: BlacklistData[];
}

class BlacklistApi {
  private baseUrl = `${API_BASE}/blacklists`;

  // Get all blacklists for the user's department
  async getBlacklists(): Promise<BlacklistsResponse> {
    const response = await laravelGetBlacklists();
    console.log('Fetched blacklists:', response);
    // Backend returns { blacklists: [...] }
    return response;
  }

  // Get specific blacklist
  async getBlacklist(id: string): Promise<BlacklistData> {
    return await laravelGetBlacklist(id);
  }

  // Create new blacklist
  async createBlacklist(blacklistData: CreateBlacklistRequest): Promise<BlacklistData> {
    return await laravelCreateBlacklist(blacklistData);
  }

  // Update blacklist
  async updateBlacklist(
    id: string,
    blacklistData: UpdateBlacklistRequest
  ): Promise<BlacklistData> {
    return await laravelUpdateBlacklist(id, blacklistData);
  }

  // Delete blacklist
  async deleteBlacklist(id: string): Promise<void> {
    await laravelDeleteBlacklist(id);
  }

  // Helper method to parse CSV file content for blacklist courses
  parseCSVContent(fileContent: string): BlacklistCourse[] {
    const lines = fileContent.trim().split('\n');
    const courses: BlacklistCourse[] = [];
    
    // Skip header row (assumes first row is headers)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 3) {
        const course: BlacklistCourse = {
          id: `temp_${i}`, // Will be replaced when saving
          code: columns[0],
          name: columns[1],
          credits: parseInt(columns[2]) || 0,
          category: columns[3] || 'Unknown',
          description: columns[4] || undefined
        };
        courses.push(course);
      }
    }
    
    return courses;
  }

  // Helper method to parse Excel file for blacklist courses
  async parseExcelFile(file: File): Promise<BlacklistCourse[]> {
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
          
          const courses: BlacklistCourse[] = [];
          
          // Skip header row and process data
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 3) continue;
            
            const course: BlacklistCourse = {
              id: `temp_${i}`,
              code: String(row[0] || '').trim(),
              name: String(row[1] || '').trim(),
              credits: parseInt(String(row[2] || '0')) || 0,
              category: String(row[3] || 'Unknown').trim(),
              description: row[4] ? String(row[4]).trim() : undefined
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
  }

  // Helper method to map course codes to course IDs or create new courses
  async mapCodesToIds(courseCodes: string[]): Promise<{ id: string; code: string; found: boolean; isNew: boolean }[]> {
    try {
      const results: { id: string; code: string; found: boolean; isNew: boolean }[] = [];
      
      // For each course code, search in existing courses first
      for (const code of courseCodes) {
        try {
          // Search in existing courses
          const response = await fetch(`${API_BASE}/courses?search=${encodeURIComponent(code)}&limit=100`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });          let foundInCourses = false;
          
          if (response.ok) {
            const data = await response.json();
            const courses = data.courses || [];
            
            // Find exact match (case-insensitive)
            const exactMatch = courses.find((c: any) => 
              c.code.toLowerCase() === code.toLowerCase()
            );
            
            if (exactMatch) {
              results.push({
                id: exactMatch.id,
                code: exactMatch.code,
                found: true,
                isNew: false
              });
              foundInCourses = true;
            }
          }
          
          // If not found in courses, search in blacklist courses
          if (!foundInCourses) {
            const blacklistResponse = await fetch(`${API_BASE}/blacklists/courses/search?code=${encodeURIComponent(code)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            
            if (blacklistResponse.ok) {
              const blacklistData = await blacklistResponse.json();
              const blacklistCourse = blacklistData.course;
              
              if (blacklistCourse) {
                results.push({
                  id: blacklistCourse.id,
                  code: blacklistCourse.code,
                  found: true,
                  isNew: false
                });
              } else {
                // Course not found anywhere, mark for creation
                results.push({
                  id: '',
                  code: code,
                  found: false,
                  isNew: true
                });
              }
            } else {
              // Course not found anywhere, mark for creation
              results.push({
                id: '',
                code: code,
                found: false,
                isNew: true
              });
            }
          }
        } catch (error) {
          console.error(`Error searching for course ${code}:`, error);
          results.push({
            id: '',
            code: code,
            found: false,
            isNew: true
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error mapping course codes to IDs:', error);
      return courseCodes.map(code => ({ id: '', code, found: false, isNew: true }));
    }
  }

  // Helper method to create courses that don't exist
  async createCoursesFromBlacklistData(courses: BlacklistCourse[]): Promise<{ id: string; code: string }[]> {
    try {
      const courseData = courses.map(course => ({
        code: course.code,
        name: course.name,
        credits: course.credits,
        category: course.category,
        description: course.description,
        isActive: true,
        // Mark these as blacklist-created courses
        isBlacklistCourse: true
      }));

      console.log('Sending course data to bulk create:', courseData);

      const response = await fetch(`${API_BASE}/courses/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courses: courseData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create courses');
      }

      const data = await response.json();
      return data.courses.map((c: any) => ({ id: c.id, code: c.code }));
    } catch (error) {
      console.error('Error creating courses:', error);
      throw error;
    }
  }

  // Helper method to validate blacklist data
  validateBlacklistData(data: CreateBlacklistRequest | UpdateBlacklistRequest): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Blacklist name is required');
      } else if (data.name.trim().length > 100) {
        errors.push('Blacklist name must be 100 characters or less');
      }
    }
    
    if (data.description && data.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
    
    if (data.courseIds && !Array.isArray(data.courseIds)) {
      errors.push('Course IDs must be an array');
    }
    
    return errors;
  }

  // Helper method to check if blacklist name already exists
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getBlacklists();
      return response.blacklists.some(bl => 
        bl.name.toLowerCase() === name.toLowerCase() && bl.id !== excludeId
      );
    } catch {
      return false;
    }
  }
}

export const blacklistApi = new BlacklistApi();
