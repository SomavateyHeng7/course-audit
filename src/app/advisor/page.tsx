"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CalendarClock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdvisorDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Advisor Dashboard</h1>
          <p className="text-muted-foreground">
            View curricula and tentative schedules created by chairpersons
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* View Curricula Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/advisor/curricula')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <span>View Curricula</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Browse and view all curricula that have been created by chairpersons.
              </p>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/advisor/curricula');
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Browse Curricula
              </Button>
            </CardContent>
          </Card>

          {/* View Tentative Schedules Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/advisor/schedules')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CalendarClock className="w-6 h-6 text-primary" />
                </div>
                <span>View Tentative Schedules</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View tentative course schedules for different batches and semesters.
              </p>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/advisor/schedules');
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Browse Schedules
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-8 max-w-4xl border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">View-Only Access</h3>
                <p className="text-sm text-muted-foreground">
                  As an advisor, you have view-only access to curricula and tentative schedules. 
                  You cannot create or modify any content, only review what has been created by chairpersons.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
