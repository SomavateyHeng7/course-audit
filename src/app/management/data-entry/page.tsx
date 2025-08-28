'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ---------- Types ----------
type Status = 'not_completed' | 'completed' | 'taking' | 'planning';

interface CourseStatus {
  status: Status;
  grade?: string;
}

interface Course {
  code: string;
  title: string;
  credits: number;
}

interface ApiFaculty { id: string; name: string; }
interface ApiDepartment { id: string; name: string; facultyId?: string }
interface ApiConcentration { id: string; name: string; }
interface ApiCurriculumCourse {
  category?: string;
  course: { code: string; title: string; credits: number };
}
interface ApiCurriculum {
  id: string;
  name: string;
  year?: number;
  faculty?: ApiFaculty;
  department?: ApiDepartment;
  concentrations?: ApiConcentration[];
  curriculumCourses: ApiCurriculumCourse[];
}
interface ApiResponse {
  curricula: ApiCurriculum[];
}

// ---------- Constants ----------
const statusLabels: Record<Status, string> = {
  not_completed: 'Not Completed',
  completed: 'Completed',
  taking: 'Currently Taking',
  planning: 'Planning for Next Semester',
};

const statusOptions: { value: Status; label: string }[] = [
  { value: 'completed', label: statusLabels.completed },
  { value: 'taking', label: statusLabels.taking },
  { value: 'planning', label: statusLabels.planning },
  { value: 'not_completed', label: statusLabels.not_completed },
];

const gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'S'];

const courseTypeOrder = [
  'General Education',
  'Core Courses',
  'Major Required',
  'Major Elective',
  'Free Elective',
  'Other',
];

// ---------- Small local components ----------
function StatusDropdown({
  code,
  value,
  onChange,
}: {
  code: string;
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Status)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((o) => (
          <SelectItem key={`${code}-${o.value}`} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------- Page ----------
export default function DataEntryPage() {
  const router = useRouter();

  // selections
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('');

  // local course-tracking state
  const [completedCourses, setCompletedCourses] = useState<Record<string, CourseStatus>>({});
  const [freeElectives] = useState<Course[]>([]); // reserved for user-added electives if you add UI later

  // data fetch
  const { data, error, isLoading } = useSWR<ApiResponse>(
    '/api/public-curricula',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch curricula');
      return res.json();
    }
  );

  // build lookup maps
  const { faculties, departmentsByFaculty, curriculaByDepartment, concentrationsByCurriculum } =
    useMemo(() => {
      const facultyMap: Record<string, ApiFaculty> = {};
      const departments: Record<string, ApiDepartment[]> = {};
      const curricula: Record<string, ApiCurriculum[]> = {};
      const concentrations: Record<string, ApiConcentration[]> = {};

      (data?.curricula ?? []).forEach((curr) => {
        if (curr.faculty) facultyMap[curr.faculty.id] = curr.faculty;

        const facultyId = curr.faculty?.id ?? '';
        const dept = curr.department;
        if (dept) {
          if (!departments[facultyId]) departments[facultyId] = [];
          if (!departments[facultyId].some((d) => d.id === dept.id)) {
            departments[facultyId].push(dept);
          }
          if (!curricula[dept.id]) curricula[dept.id] = [];
          curricula[dept.id].push(curr);
        }

        if (curr.concentrations && curr.concentrations.length > 0) {
          concentrations[curr.id] = curr.concentrations;
        }
      });

      return {
        faculties: Object.values(facultyMap),
        departmentsByFaculty: departments,
        curriculaByDepartment: curricula,
        concentrationsByCurriculum: concentrations,
      };
    }, [data]);

  // courses by category for the selected curriculum
  const coursesByCategory: Record<string, Course[]> = useMemo(() => {
    if (!selectedCurriculum) return {};
    const curr = data?.curricula.find((c) => c.id === selectedCurriculum);
    if (!curr) return {};
    const by: Record<string, Course[]> = {};
    curr.curriculumCourses.forEach((cc) => {
      const cat = cc.category || 'Other';
      if (!by[cat]) by[cat] = [];
      by[cat].push({
        code: cc.course.code,
        title: cc.course.title,
        credits: cc.course.credits,
      });
    });
    return by;
  }, [data, selectedCurriculum]);

  // handlers for cascading resets
  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
    setSelectedDepartment('');
    setSelectedCurriculum('');
    setSelectedConcentration('');
  };
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedCurriculum('');
    setSelectedConcentration('');
  };
  const handleCurriculumChange = (value: string) => {
    setSelectedCurriculum(value);
    setSelectedConcentration('');
  };
  const handleBackToManagement = () => router.push('/management');

  // excel export
  const handleExportExcel = () => {
    const rows: any[] = [];

    courseTypeOrder.forEach((category) => {
      const list = coursesByCategory[category] ?? [];
      list.forEach((course) => {
        rows.push({
          Category: category,
          Code: course.code,
          Title: course.title,
          Credits: course.credits,
          Status: completedCourses[course.code]?.status ?? 'not_completed',
          Grade: completedCourses[course.code]?.grade ?? '',
        });
      });
    });

    // include user-added free electives (if any later)
    freeElectives.forEach((course) => {
      rows.push({
        Category: 'Free Elective',
        Code: course.code,
        Title: course.title,
        Credits: course.credits,
        Status: completedCourses[course.code]?.status ?? 'not_completed',
        Grade: completedCourses[course.code]?.grade ?? '',
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'courses.xlsx');
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-2">
        <Button variant="outline" onClick={handleBackToManagement} className="mr-4">
          Back to Management
        </Button>
        <h1 className="text-2xl font-bold">Manual Course Entry</h1>
      </div>

      {/* Loading / error states */}
      {isLoading && <div className="mt-8 text-center text-muted-foreground">Loading curricula…</div>}
      {error && (
        <div className="mt-8 text-center text-red-600">
          Failed to load curricula. Please try again.
        </div>
      )}

      {/* Step 1: Selects */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-6">
            <div>
              <label className="block font-bold mb-2">Select Faculty</label>
              <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-bold mb-2">Select Department</label>
              <Select
                value={selectedDepartment}
                onValueChange={handleDepartmentChange}
                disabled={!selectedFaculty}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {(departmentsByFaculty[selectedFaculty] ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-bold mb-2">Select Curriculum</label>
              <Select
                value={selectedCurriculum}
                onValueChange={handleCurriculumChange}
                disabled={!selectedDepartment}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={!selectedDepartment ? 'Select department first' : 'Choose curriculum'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(curriculaByDepartment[selectedDepartment] ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.year ? `(${c.year})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-bold mb-2">Select Concentration</label>
              <Select
                value={selectedConcentration}
                onValueChange={setSelectedConcentration}
                disabled={!selectedCurriculum}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={!selectedCurriculum ? 'Select curriculum first' : 'Choose concentration'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(concentrationsByCurriculum[selectedCurriculum] ?? []).map((conc) => (
                    <SelectItem key={conc.id} value={conc.id}>
                      {conc.name}
                    </SelectItem>
                  ))}
                  {(concentrationsByCurriculum[selectedCurriculum] ?? []).length === 0 && (
                    <SelectItem value="none">None</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 2: Course list */}
          {selectedDepartment && selectedCurriculum && (
            <div className="flex flex-col gap-8">
              {courseTypeOrder.map((category) => (
                <div key={category} className="border border-border rounded-lg mb-2 p-6">
                  <div className="text-lg font-bold mb-2">{category}</div>
                  <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    {(coursesByCategory[category] ?? []).length === 0 ? (
                      <div className="text-muted-foreground text-center py-4">
                        No courses in this category.
                      </div>
                    ) : (
                      (coursesByCategory[category] ?? []).map((course) => {
                        const status = completedCourses[course.code]?.status ?? 'not_completed';
                        const grade = completedCourses[course.code]?.grade ?? '';
                        return (
                          <div
                            key={course.code}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <span className="font-semibold text-sm">
                                {course.code} - {course.title}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {course.credits} credits
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                              {status === 'completed' && (
                                <Select
                                  value={grade}
                                  onValueChange={(value) =>
                                    setCompletedCourses((prev) => ({
                                      ...prev,
                                      [course.code]: {
                                        ...(prev[course.code] ?? { status }),
                                        grade: value,
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue placeholder="Grade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gradeOptions.map((g) => (
                                      <SelectItem key={g} value={g}>
                                        {g}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              <StatusDropdown
                                code={course.code}
                                value={status}
                                onChange={(newStatus) =>
                                  setCompletedCourses((prev) => ({
                                    ...prev,
                                    [course.code]: {
                                      ...(prev[course.code] ?? {}),
                                      status: newStatus,
                                      ...(newStatus !== 'completed' ? { grade: '' } : {}),
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-4 mt-4">
                <Button onClick={handleExportExcel}>
                  <svg
                    className="w-5 h-5 mr-2 inline-block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                  Download as Excel
                </Button>
                <Button variant="secondary" onClick={() => router.push('/management/progress')}>
                  Show Progress
                </Button>
              </div>
            </div>
          )}

          {!selectedDepartment || !selectedCurriculum ? (
            <div className="mt-8 text-center text-gray-500">
              Data entry page content goes here.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
