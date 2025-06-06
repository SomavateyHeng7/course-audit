'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Sample course data based on the provided curriculum
const allCourses = [
    { code: 'BG 1001', name: 'English I' },
    { code: 'BG 1002', name: 'English II' },
    { code: 'BG 2000', name: 'English III' },
    { code: 'BG 2001', name: 'English IV' },
    { code: 'BG 1400', name: 'Business Law I' },
    { code: 'GE 2202', name: 'Ethics' },
    { code: 'MGT 1101', name: 'Introduction to Business' },
    { code: 'ACT 1601', name: 'Fundamentals of Financial Accounting' },
    { code: 'CSX 1001', name: 'Basic Mathematics and Statistics' },
    { code: 'GE 1101', name: 'Thai Civilization' },
    { code: 'GE 1102', name: 'Introduction to Philosophy' },
    { code: 'GE 2101', name: 'World Civilization' },
    { code: 'GE 2103', name: 'Art of Reasoning' },
    { code: 'GE 2104', name: 'Thai Buddhism' },
    { code: 'GE 2105', name: 'Introduction to World Religion' },
    { code: 'GE 2106', name: 'Logical Thinking and Application' },
    { code: 'GE 2107', name: 'Applied Philosophy in Social Sciences and Humanities' },
    { code: 'MGT 2404', name: 'Managerial Psychology' },
    { code: 'GE 1207', name: 'Fundamental Psychology' },
    { code: 'GE 1203', name: 'Society, Politics and Economics' },
    { code: 'GE 1205', name: 'ASEAN Ways' },
    { code: 'GE 1206', name: 'Philosophy of Sufficiency Economy' },
    { code: 'GE 2203', name: 'Art of Living' },
    { code: 'GE 2205', name: 'Communication and Multicultural society' },
    { code: 'GE 2206', name: 'Personality Development' },
    { code: 'GE 2207', name: 'Sport, Health and Wellness Development' },
    { code: 'GE 2208', name: 'Thai Politics and Government' },
    { code: 'ECO 2200', name: 'Introduction to Economics' },
    { code: 'GE 1301', name: 'Environmental Science' },
    { code: 'GE 2301', name: 'Lifestyles in Dynamic World' },
    { code: 'GE 2302', name: 'Climate Change and Human Life' },
    { code: 'GE 2303', name: 'Building Brilliant Brain' },
    { code: 'MA 1200', name: 'Mathematics for Business' },
    { code: 'GE 1403', name: 'Communication in Thai' },
    { code: 'GE 1405', name: 'Thai Language and Culture' },
    { code: 'GE 1406', name: 'Burmese Language' },
    { code: 'GE 1407', name: 'Russian Language' },
    { code: 'GE 3401', name: 'Public Speaking in Thai' },
    { code: 'CSX 2001', name: 'Introduction to Information Technology' },
    { code: 'CSX 2002', name: 'Calculus' },
    { code: 'CSX 2003', name: 'Principles of Statistics' },
    { code: 'CSX 2004', name: 'UI/UX Design and Prototyping' },
    { code: 'CSX 2005', name: 'Design Thinking' },
    { code: 'CSX 2006', name: 'Mathematics and Statistics for Data Science' },
    { code: 'CSX 2007', name: 'Data Science' },
    { code: 'CSX 2008', name: 'Mathematics Foundation for Computer Science' },
    { code: 'CSX 2009', name: 'Cloud Computing' },
    { code: 'CSX 3001', name: 'Fundamentals of Computer Programming' },
    { code: 'CSX 3002', name: 'Object-Oriented Concepts and Programming' },
    { code: 'CSX 3003', name: 'Data Structure and Algorithms' },
    { code: 'CSX 3004', name: 'Programming Languages' },
    { code: 'CSX 3005', name: 'Computer Networks' },
    { code: 'CSX 3006', name: 'Database Systems' },
    { code: 'CSX 3007', name: 'Computer Architecture' },
    { code: 'CSX 3008', name: 'Operating Systems' },
    { code: 'CSX 3009', name: 'Algorithm Design' },
    { code: 'CSX 3010', name: 'Senior Project I' },
    { code: 'CSX 3011', name: 'Senior Project II' },
    { code: 'CSX 4101', name: 'Information System Analysis and Design' },
    { code: 'CSX 4102', name: 'Software Engineering' },
    { code: 'CSX 4103', name: 'Requirement Engineering' },
    { code: 'CSX 4104', name: 'Software Testing' },
    { code: 'CSX 4105', name: 'IT Project Management' },
    { code: 'CSX 4106', name: 'Enterprise Architecture' },
    { code: 'CSX 4107', name: 'Web Application Development' },
    { code: 'CSX 4108', name: 'iOS Application Development' },
    { code: 'CSX 4109', name: 'Android Application Development' },
    { code: 'CSX 4201', name: 'Artificial Intelligence Concepts' },
    { code: 'CSX 4202', name: 'Data Mining' },
    { code: 'CSX 4203', name: 'Machine Learning' },
    { code: 'CSX 4204', name: 'Biometrics' },
    { code: 'CSX 4205', name: 'Big Data Analytics' },
    { code: 'CSX 4206', name: 'Data Warehousing and Business Intelligence' },
    { code: 'CSX 4207', name: 'Decision Support and Recommender Systems' },
    { code: 'CSX 4208', name: 'Deep Learning' },
    { code: 'CSX 4209', name: 'Intelligent System Development' },
    { code: 'CSX 4210', name: 'Natural Language Processing and Social Interactions' },
    { code: 'CSX 4301', name: 'Network Design' },
    { code: 'CSX 4302', name: 'Cisco Networking Workshop' },
    { code: 'CSX 4303', name: 'Network Security' },
    { code: 'CSX 4304', name: 'Network Management' },
    { code: 'CSX 4305', name: 'Heterogeneous Wireless Networks' },
    { code: 'CSX 4306', name: 'Internet of Things' },
    { code: 'CSX 4307', name: 'Business Continuity Planning and Management' },
    { code: 'CSX 4401', name: 'Business Systems' },
    { code: 'CSX 4402', name: 'Sales and Distribution Management System' },
    { code: 'CSX 4403', name: 'Manufacturing Management System' },
    { code: 'CSX 4404', name: 'Supply Chain Management System' },
    { code: 'CSX 4405', name: 'Finance and Accounting Information System' },
    { code: 'CSX 4406', name: 'Customer Relationship Management System' },
    { code: 'CSX 4407', name: 'Enterprise Application Development' },
    { code: 'CSX 4408', name: 'Enterprise Database System' },
    { code: 'CSX 4409', name: 'Blockchain Technology' },
    { code: 'CSX 4501', name: 'Theory of Computation' },
    { code: 'CSX 4502', name: 'Tech Startup' },
    { code: 'CSX 4503', name: 'Information Systems Security' },
    { code: 'CSX 4504', name: 'Digital Marketing' },
    { code: 'CSX 4505', name: 'Digital Transformation' },
    { code: 'CSX 4506', name: 'Image Processing' },
    { code: 'CSX 4507', name: 'Information Retrieval and Search Engines' },
    { code: 'CSX 4508', name: 'Quantitative Research for Digital Business' },
    { code: 'CSX 4600-4699', name: 'Selected Topics' },
];

export default function DataEntryPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<'completed' | 'current' | 'planning' | null>(null);

  const [completedCourses, setCompletedCourses] = useState<Array<{ code: string; name: string }>>([]);
  const [currentCourses, setCurrentCourses] = useState<Array<{ code: string; name: string }>>([]);
  const [planningCourses, setPlanningCourses] = useState<Array<{ code: string; name: string }>>([]);

  const handleBackToManagement = () => {
    router.push('/management');
  };

  const handleAddCourseClick = (category: 'completed' | 'current' | 'planning') => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.length > 1) { // Only search if query is at least 2 characters
      const results = allCourses.filter(course =>
        course.code.toLowerCase().includes(query.toLowerCase()) ||
        course.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectCourse = (course: { code: string; name: string }) => {
    if (selectedCategory) {
      const newCourse = { code: course.code, name: course.name };
      if (selectedCategory === 'completed') {
        setCompletedCourses([...completedCourses, newCourse]);
      } else if (selectedCategory === 'current') {
        setCurrentCourses([...currentCourses, newCourse]);
      } else {
        setPlanningCourses([...planningCourses, newCourse]);
      }
      setIsModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCategory(null);
    }
  };

  const renderCourseList = (courses: Array<{ code: string; name: string }>) => (
    <ul className="list-disc pl-5 space-y-1">
      {courses.map((course, index) => (
        <li key={index} className="text-sm text-foreground">
          {course.code} - {course.name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manual Course Entry</h1>
        <Button variant="outline" onClick={handleBackToManagement}>
          Back to Management
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {completedCourses.length > 0 ? (
              renderCourseList(completedCourses)
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
                 <span className="text-center">Click + below to add courses</span>
              </div>
            )}
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => handleAddCourseClick('completed')}>+ Add Course</Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Current Courses</CardTitle>
          </CardHeader>
          <CardContent>
             {currentCourses.length > 0 ? (
              renderCourseList(currentCourses)
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
                <span className="text-center">Click + below to add courses</span>
              </div>
            )}
             <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => handleAddCourseClick('current')}>+ Add Course</Button>
            </div>
          </CardContent>
        </Card>

        {/* Planning Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Planning Courses</CardTitle>
          </CardHeader>
          <CardContent>
             {planningCourses.length > 0 ? (
              renderCourseList(planningCourses)
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
                <span className="text-center">Click + below to add courses</span>
              </div>
            )}
             <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => handleAddCourseClick('planning')}>+ Add Course</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Search Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search and Add Course</DialogTitle>
            <DialogDescription>
              Search for a course by code or name and add it to your list.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search by course code or name..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="mb-4"
          />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((course) => (
              <Button
                key={course.code}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleSelectCourse(course)}
              >
                {course.code} - {course.name}
              </Button>
            ))}
            {searchQuery.length > 1 && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground">No courses found.</p>
            )}
             {searchQuery.length <= 1 && (
              <p className="text-center text-muted-foreground">Type at least 2 characters to search.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 