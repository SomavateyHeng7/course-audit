"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ExcelUpload from "@/components/excel/ExcelUpload"
import { useCourseManagement } from "@/app/contexts/CourseManagementContext"
import { ExcelData } from "@/components/excel/ExcelUtils"


export default function ManagementPage() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const { startNewSession, updateSessionData, isSessionActive } = useCourseManagement()

  const handleDataLoaded = (data: ExcelData) => {
    if (!isSessionActive) {
      startNewSession()
    }
    updateSessionData(data)
    setError("")
  }

  const handleError = (errorMessage: string) => { 
    setError(errorMessage)
  }

  const handleManualEntry = () => {
    router.push("/management/data-entry")
  }

  return (
  <>
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <h1 className="text-3xl font-bold text-foreground mb-6">Course Management</h1>
            {error && (
              <div className="mb-4 p-2 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-base text-center">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Excel Upload Option */}
              <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 h-96 w-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer">
                <h2 className="text-xl font-semibold mb-4 text-primary">Upload Excel</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">Upload your previous course records using an Excel file.</p>
                <ExcelUpload onDataLoaded={handleDataLoaded} onError={handleError} />
              </div>
              {/* Manual Entry Option */}
              <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 h-96 w-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer">
                <h2 className="text-xl font-semibold mb-4 text-primary">Enter Courses Manually</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">Manually input your courses to track your progress.</p>
                <Button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed" variant="default" onClick={handleManualEntry}>
                  Enter Courses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  </>
  )
} 