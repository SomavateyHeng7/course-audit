// Department access validation middleware
import { prisma } from '@/lib/database/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/authOptions';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

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
  select: { role: true, facultyId: true, departmentId: true }
    });

    if (!user) return false;


    // Super admins have access to all departments
    if (user.role === 'SUPER_ADMIN') return true;

    // Chairpersons can access all departments within their faculty
    if (user.role === 'CHAIRPERSON' && user.facultyId) {
      const facultyDepartments = await prisma.department.findMany({ where: { facultyId: user.facultyId }, select: { id: true } });
      const facultyDepartmentIds = facultyDepartments.map(d => d.id);
      return facultyDepartmentIds.includes(departmentId);
    }

    // Otherwise, only their own department
    return user.departmentId === departmentId;

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
  select: { role: true, facultyId: true, departmentId: true }
    });

    if (!user) return [];

    // Super admins can access all departments
    if (user.role === 'SUPER_ADMIN') {
      return await prisma.department.findMany({ include: { faculty: true } });
    }

    // Chairpersons can access departments in their faculty
    if (user.role === 'CHAIRPERSON' && user.facultyId) {
      const facultyDepartments = await prisma.department.findMany({ where: { facultyId: user.facultyId }, include: { faculty: true } });
      return facultyDepartments.map(dept => ({
        ...dept,
        isUserDepartment: dept.id === user.departmentId
      }));
    }

    // Otherwise, only their own department
    if (user.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: user.departmentId }, include: { faculty: true } });
      return dept ? [{ ...dept, isUserDepartment: true }] : [];
    }
    return [];
  } catch (error) {
    console.error('Get accessible departments error:', error);
    return [];
  }
}

/**
 * Middleware to validate department access in API routes
 */
export async function requireDepartmentAccess(departmentId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Authentication required');
  }
  const userId = session.user.id;
  const hasAccess = await validateDepartmentAccess(userId, departmentId);
  if (!hasAccess) {
    throw new Error('Access denied to this department');
  }
  return session;
}

/**
 * Get departments accessible to current session user
 */
export async function getSessionAccessibleDepartments() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Authentication required');
  }
  const userId = session.user.id;
  return await getUserAccessibleDepartments(userId);
}
