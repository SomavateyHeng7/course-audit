'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConsentModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onAnonymous: () => void;
}

export default function ConsentModal({ isOpen, onAgree, onAnonymous }: ConsentModalProps) {
  const [showFull, setShowFull] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            EduTrack Privacy Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            EduTrack collects and processes your academic data to provide 
            course auditing, progress tracking, and academic planning features.
          </p>

          {!showFull ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              By clicking "I Agree", you consent to the use of your academic data 
              as described. You may withdraw consent anytime. 
              <button 
                onClick={() => setShowFull(true)} 
                className="ml-1 text-blue-600 dark:text-blue-400 underline"
              >
                Read full terms
              </button>
            </p>
          ) : (
            <div className="text-sm space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              <p><strong>1. Purpose of Use:</strong> EduTrack supports course auditing, academic tracking, and curriculum management.</p>
              <p><strong>2. Data Collection:</strong> With your consent, EduTrack collects student ID, courses, GPA, and academic records. Without consent, it operates in anonymous mode.</p>
              <p><strong>3. Privacy & Security:</strong> Data is stored securely under PDPA rules, accessible only to authorized faculty/admins.</p>
              <p><strong>4. Your Rights:</strong> You may access, correct, or request deletion of your data, or withdraw consent anytime.</p>
              <p><strong>5. Consent:</strong> By agreeing, you confirm you have read and understood this notice.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onAnonymous}
            >
              Use Anonymous Mode
            </Button>
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={onAgree}
            >
              I Agree
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
