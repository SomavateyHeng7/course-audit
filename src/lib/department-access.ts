// Department access validation middleware
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface DepartmentAccessUser {
  id: string;
  role: 'SUPER_ADMIN' | 'CHAIRPERSON' | 'STUDENT' | 'ADVISOR';
  facultyId: string;
  departmentId: string;
}

/**
 * Validates if a user has access to a specific department
 */
export async function validateDepartmentAccess(
  userId: string, 
  departmentId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        faculty: { 
          include: { departments: true } 
        },
        department: true
      }
    });

    if (!user) return false;

    // Super admins have access to all departments
    if (user.role === 'SUPER_ADMIN') return true;

    // Chairpersons can access all departments within their faculty
    const facultyDepartmentIds = user.faculty.departments.map(d => d.id);
    return facultyDepartmentIds.includes(departmentId);

  } catch (error) {
    console.error('Department access validation error:', error);
    return false;
  }
}

/**
 * Gets all departments a user can access
 */
export async function getUserAccessibleDepartments(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        faculty: { 
          include: { departments: true } 
        },
        department: true
      }
    });

    if (!user) return [];

    // Super admins can access all departments
    if (user.role === 'SUPER_ADMIN') {
      return await prisma.department.findMany({
        include: { faculty: true }
      });
    }

    // Chairpersons can access departments in their faculty
    return user.faculty.departments.map(dept => ({
      ...dept,
      faculty: user.faculty,
      isUserDepartment: dept.id === user.departmentId
    }));

  } catch (error) {
    console.error('Get accessible departments error:', error);
    return [];
  }
}

/**
 * Middleware to validate department access in API routes
 */
export async function requireDepartmentAccess(departmentId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  const hasAccess = await validateDepartmentAccess(session.user.id, departmentId);
  
  if (!hasAccess) {
    throw new Error('Access denied to this department');
  }

  return session;
}

/**
 * Get departments accessible to current session user
 */
export async function getSessionAccessibleDepartments() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  return await getUserAccessibleDepartments(session.user.id);
}
