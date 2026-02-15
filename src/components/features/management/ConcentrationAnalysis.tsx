'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Local type definitions to replace missing './types' module
interface Concentration {
  id: string;
  name: string;
  description?: string;
  requiredCredits: number;
}

interface Course {
  id: string;
  code?: string;
  name?: string;
}

export interface ConcentrationProgress {
  concentration: Concentration;
  isEligible: boolean;
  progress: number; // percent 0-100
  completedCourses: Course[];
  plannedCourses: Course[];
  remainingCourses: number;
}

interface ConcentrationAnalysisProps {
  concentrationAnalysis: ConcentrationProgress[];
  onClose: () => void;
}

export const ConcentrationAnalysis: React.FC<ConcentrationAnalysisProps> = ({
  concentrationAnalysis,
  onClose
}) => {
  const router = useRouter();

  const handleViewProgress = () => {
    localStorage.setItem('concentrationAnalysis', JSON.stringify(concentrationAnalysis));
    onClose();
    router.push('/student/management/progress');
  };

  return (
    <div className="space-y-6">
      {concentrationAnalysis.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target size={48} className="mx-auto mb-4 opacity-50" />
          <p>No concentration data available.</p>
        </div>
      ) : (
        concentrationAnalysis.map((analysis) => (
          <div key={analysis.concentration.id} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{analysis.concentration.name}</h3>
                {analysis.concentration.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.concentration.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${analysis.isEligible ? 'text-green-600' : 'text-blue-600'}`}>
                  {Math.round(analysis.progress)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysis.completedCourses.length + analysis.plannedCourses.length} / {analysis.concentration.requiredCredits} credits required
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all ${
                  analysis.isEligible ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, analysis.progress)}%` }}
              />
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              {analysis.isEligible ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-600 font-medium">Eligible for this concentration!</span>
                </>
              ) : (
                <>
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-blue-600">
                    {analysis.remainingCourses} more course{analysis.remainingCourses !== 1 ? 's' : ''} needed
                  </span>
                </>
              )}
            </div>
            
            {/* Course Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Completed and Planned courses sections */}
              {/* ... (rest of the analysis content) */}
            </div>
          </div>
        ))
      )}
      
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleViewProgress}>
          View Detailed Progress
        </Button>
      </div>
    </div>
  );
};