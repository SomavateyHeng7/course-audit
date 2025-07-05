'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ExcelData } from '@/components/excel/ExcelUtils';
import SessionManager from '../services/SessionManager';

interface CourseManagementContextType {
  sessionId: string | null;
  excelData: ExcelData | null;
  isSessionActive: boolean;
  startNewSession: () => void;
  updateSessionData: (data: ExcelData) => void;
  endCurrentSession: () => void;
  timeRemaining: number;
}

const CourseManagementContext = createContext<CourseManagementContextType | undefined>(undefined);

export function CourseManagementProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds

  const sessionManager = SessionManager.getInstance();

  useEffect(() => {
    // Check for existing session
    const currentSessionId = sessionStorage.getItem('currentSessionId');
    if (currentSessionId && sessionManager.isSessionActive(currentSessionId)) {
      setSessionId(currentSessionId);
      setIsSessionActive(true);
      const data = sessionManager.getSessionData(currentSessionId);
      if (data) setExcelData(data);
    }

    // Set up cleanup on tab/window close
    const handleVisibilityChange = () => {
      if (document.hidden && sessionId) {
        endCurrentSession();
      }
    };

    const handleBeforeUnload = () => {
      if (sessionId) {
        endCurrentSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Timer for session expiration
    const timer = setInterval(() => {
      if (isSessionActive) {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            endCurrentSession();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timer);
    };
  }, [sessionId, isSessionActive]);

  const startNewSession = () => {
    const newSessionId = sessionManager.startSession();
    setSessionId(newSessionId);
    setIsSessionActive(true);
    setTimeRemaining(30 * 60);
    setExcelData(null);
  };

  const updateSessionData = (data: ExcelData) => {
    if (sessionId && sessionManager.updateSessionData(sessionId, data)) {
      setExcelData(data);
      // Reset timer when data is updated
      setTimeRemaining(30 * 60);
    }
  };

  const endCurrentSession = () => {
    if (sessionId) {
      sessionManager.endSession(sessionId);
      setSessionId(null);
      setExcelData(null);
      setIsSessionActive(false);
      setTimeRemaining(0);
      sessionStorage.removeItem('currentSessionId');
    }
  };

  return (
    <CourseManagementContext.Provider
      value={{
        sessionId,
        excelData,
        isSessionActive,
        startNewSession,
        updateSessionData,
        endCurrentSession,
        timeRemaining,
      }}
    >
      {children}
    </CourseManagementContext.Provider>
  );
}

export function useCourseManagement() {
  const context = useContext(CourseManagementContext);
  if (context === undefined) {
    throw new Error('useCourseManagement must be used within a CourseManagementProvider');
  }
  return context;
} 
