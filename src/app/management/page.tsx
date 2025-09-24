"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProgressProvider } from "./data-entry/page"

export default function ManagementPage() {
  const router = useRouter()
  const [error, setError] = useState<string>("")

  const handleManualEntry = () => {
    router.push("/management/data-entry")
  }

  return (
    <ProgressProvider>
      <div className="p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Course Management
          </h1>
          <p className="text-muted-foreground">
            Manage your academic journey and track your progress
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Manual Entry Option */}
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200 bg-card">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Enter Courses Data</h2>
              <p className="text-muted-foreground text-sm">
                Input your completed courses to track your academic progress and generate reports.
              </p>
              <Button 
                className="mt-4 w-full" 
                onClick={handleManualEntry}
              >
                Enter Courses
              </Button>
            </div>
          </div>

          {/* Course Planning Option */}
          {/* <div className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200 bg-card">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Plan Future Courses</h2>
              <p className="text-muted-foreground text-sm">
                Plan and validate future course selections with prerequisite checking and conflict detection.
              </p>
              <Button 
                className="mt-4 w-full" 
                onClick={() => router.push('/management/course-planning')}
              >
                Plan Courses
              </Button>
            </div>
          </div> */}
        </div>

        {/* Simple feature indicators */}
        <div className="mt-8">
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
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
      </div>
    </ProgressProvider>
  )
} 