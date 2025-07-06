'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DataEntryPage() {
  const router = useRouter();

  const handleBackToManagement = () => {
    router.push('/management');
  };

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
            {/* Placeholder for listing completed courses */}
            <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
              <span className="text-center">Click + below to add courses</span>
            </div>
            {/* Placeholder for Add Course button/logic */}
            <div className="flex justify-center mt-4">
              <Button variant="outline">+ Add Course</Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Current Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for listing current courses */}
            <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
              <span className="text-center">Click + below to add courses</span>
            </div>
             {/* Placeholder for Add Course button/logic */}
             <div className="flex justify-center mt-4">
              <Button variant="outline">+ Add Course</Button>
            </div>
          </CardContent>
        </Card>

        {/* Planning Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Planning Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for listing planning courses */}
            <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md text-muted-foreground">
              <span className="text-center">Click + below to add courses</span>
            </div>
             {/* Placeholder for Add Course button/logic */}
             <div className="flex justify-center mt-4">
              <Button variant="outline">+ Add Course</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
