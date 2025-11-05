"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressProvider } from "./data-entry/page"
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Users, 
  Award,
  Plus,
  FileText,
  Target
} from 'lucide-react'

// Import chairperson components
import { PageHeader } from '@/components/chairperson/PageHeader'
import { StatCard } from '@/components/chairperson/StatCard'

export default function ManagementPage() {
  const router = useRouter()
  const [error, setError] = useState<string>("")

  const handleManualEntry = () => {
    router.push("/management/data-entry")
  }

  const quickActions = [
    {
      title: "Course Planning",
      description: "Plan your future courses and track your progress",
      icon: <Target className="h-6 w-6" />,
      action: () => router.push('/student/management/course-planning'),
      color: "bg-blue-500"
    },
    {
      title: "Future Courses",
      description: "Browse available courses for upcoming semesters",
      icon: <BookOpen className="h-6 w-6" />,
      action: () => router.push('/student/FutureCourses'),
      color: "bg-green-500"
    },
    {
      title: "Semester Courses",
      description: "View and manage your current semester courses",
      icon: <Calendar className="h-6 w-6" />,
      action: () => router.push('/student/SemesterCourse'),
      color: "bg-purple-500"
    },
    {
      title: "All Curricula",
      description: "Explore all available curriculum options",
      icon: <Award className="h-6 w-6" />,
      action: () => router.push('/student/allCurricula'),
      color: "bg-orange-500"
    },
    {
      title: "Manual Entry",
      description: "Enter course data manually",
      icon: <Plus className="h-6 w-6" />,
      action: handleManualEntry,
      color: "bg-red-500"
    }
  ]

  return (
    <ProgressProvider>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <PageHeader
          title="Student Course Management"
          description="Manage your academic journey and track your progress"
        />

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Credits"
            value="120"
            subtitle="Required for graduation"
            icon={<Award className="h-5 w-5" />}
          />
          <StatCard
            title="Completed Courses"
            value="24"
            subtitle="Courses completed"
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            title="Current Semester"
            value="Fall 2024"
            subtitle="Active semester"
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            title="Progress"
            value="75%"
            subtitle="Toward graduation"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      {action.icon}
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-500 text-white rounded-full">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Course Plan Updated</p>
                    <p className="text-sm text-muted-foreground">Added CS 301 to Spring 2025 plan</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-500 text-white rounded-full">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Course Completed</p>
                    <p className="text-sm text-muted-foreground">CS 201 marked as completed with grade A</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-500 text-white rounded-full">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Prerequisites Met</p>
                    <p className="text-sm text-muted-foreground">Now eligible for CS 401 Advanced Algorithms</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Status Indicators */}
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Course Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Progress Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Course Planning</span>
          </div>
        </div>
      </div>
    </ProgressProvider>
  )
} 