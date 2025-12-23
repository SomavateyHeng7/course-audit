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
  FileText
} from 'lucide-react'

// Import chairperson components
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader'
import { StatCard } from '@/components/role-specific/chairperson/StatCard'

export default function ManagementPage() {
  const router = useRouter()
  const [error, setError] = useState<string>("")

  const handleManualEntry = () => {
    router.push("/student/management/data-entry")
  }

  const quickActions = [
    {
      title: "Graduation Progress Check",
      description: "Enter or edit your course data",
      icon: <Plus className="h-6 w-6" />,
      action: () => router.push('/student/management/data-entry'),
      color: "bg-red-500"
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

        {/* Quick Actions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
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