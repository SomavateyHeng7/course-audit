import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'CHAIRPERSON'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get current date and date from last month
    const currentDate = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentDate,
        },
      },
    });

    // Calculate user growth percentage
    const previousMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          lt: lastMonth,
        },
      },
    });
    const userGrowthPercentage = previousMonthUsers > 0 
      ? Math.round(((usersLastMonth) / previousMonthUsers) * 100) 
      : 0;

    // Get faculty statistics
    const totalFaculties = await prisma.faculty.count();
    
    // Get department statistics
    const totalDepartments = await prisma.department.count();

    // Get course statistics
    const totalCourses = await prisma.course.count();
    const newCoursesThisMonth = await prisma.course.count({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    // Get user role distribution
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // Get faculty distribution with user counts
    const facultyDistribution = await prisma.faculty.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
    });

    // Get monthly enrollment data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEnrollment = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Process monthly data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const usersInMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const coursesInMonth = await prisma.course.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyData.push({
        month: monthName,
        students: usersInMonth,
        courses: coursesInMonth,
      });
    }

    // Calculate completion rates by program (mock data for now since we need curriculum progress)
    const programCompletionRates = [
      { program: 'BSCS', completed: 87, inProgress: 13 },
      { program: 'BSIT', completed: 92, inProgress: 8 },
      { program: 'BBA', completed: 89, inProgress: 11 },
      { program: 'MBA', completed: 94, inProgress: 6 },
    ];

    // Prepare faculty distribution for charts
    const facultyChartData = facultyDistribution.map((faculty, index) => {
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
      const totalUsers = facultyDistribution.reduce((sum, f) => sum + f._count.users, 0);
      const percentage = totalUsers > 0 ? Math.round((faculty._count.users / totalUsers) * 100) : 0;
      
      return {
        name: faculty.name,
        value: percentage,
        count: faculty._count.users,
        color: colors[index % colors.length],
      };
    });

    const dashboardStats = {
      overview: {
        totalUsers,
        userGrowth: userGrowthPercentage,
        totalFaculties,
        totalDepartments,
        totalCourses,
        newCourses: newCoursesThisMonth,
      },
      usersByRole: usersByRole.reduce((acc, role) => {
        acc[role.role] = role._count.role;
        return acc;
      }, {} as Record<string, number>),
      monthlyEnrollment: monthlyData,
      facultyDistribution: facultyChartData,
      programCompletion: programCompletionRates,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
