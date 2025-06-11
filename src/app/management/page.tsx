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
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedCurriculum, setSelectedCurriculum] = useState("")
  const [error, setError] = useState<string>("")
  const { startNewSession, updateSessionData, isSessionActive } = useCourseManagement()

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value)
  }

  const handleCurriculumChange = (value: string) => {
    setSelectedCurriculum(value)
  }

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
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="pt-6">
          <h1 className="text-2xl font-semibold mb-6">Course Management</h1>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Top row: Department and Curriculum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Department Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cse">Computer Science</SelectItem>
                        <SelectItem value="eee">Electrical Engineering</SelectItem>
                        <SelectItem value="me">Mechanical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="curriculum">Curriculum</Label>
                    <Select value={selectedCurriculum} onValueChange={handleCurriculumChange}>
                      <SelectTrigger id="curriculum">
                        <SelectValue placeholder="Select a curriculum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row: Excel Upload and Manual Entry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Excel Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Excel Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <ExcelUpload onDataLoaded={handleDataLoaded} onError={handleError} />
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Manual Course Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-base text-muted-foreground">Enter your courses manually to track your academic progress.</p>
                  <Button onClick={handleManualEntry} className="w-full md:w-auto text-base">
                    Manual Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 