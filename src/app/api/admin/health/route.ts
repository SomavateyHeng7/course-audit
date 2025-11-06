import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    const dbResponseTime = Date.now() - startTime;

    // Get database stats
    const tableStats = await Promise.all([
      prisma.user.count(),
      prisma.faculty.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.curriculum.count(),
    ]);

    const [userCount, facultyCount, departmentCount, courseCount, curriculumCount] = tableStats;

    // System health indicators
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
        tables: {
          users: userCount,
          faculties: facultyCount,
          departments: departmentCount,
          courses: courseCount,
          curricula: curriculumCount,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        database: {
          status: 'disconnected',
        },
      },
      { status: 500 }
    );
  }
}
