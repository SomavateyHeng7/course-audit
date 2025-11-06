import { ExcelData } from '@/components/features/excel/ExcelUtils';

export interface SessionData {
  id: string;
  startTime: number;
  lastAccessed: number;
  excelData: ExcelData | null;
  isActive: boolean;
}

class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionData>;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  private constructor() {
    this.sessions = new Map();
    if (typeof window !== 'undefined') {
      // Add beforeunload event listener
      window.addEventListener('beforeunload', () => {
        this.cleanupSession();
      });

      // Add visibility change listener
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.cleanupSession();
        }
      });

      // Periodic cleanup
      setInterval(() => {
        this.cleanupExpiredSessions();
      }, 60000); // Check every minute
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public startSession(): string {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, {
      id: sessionId,
      startTime: Date.now(),
      lastAccessed: Date.now(),
      excelData: null,
      isActive: true
    });
    return sessionId;
  }

  public updateSessionData(sessionId: string, data: ExcelData): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.excelData = data;
      session.lastAccessed = Date.now();
      this.sessions.set(sessionId, session);
      return true;
    }
    return false;
  }

  public getSessionData(sessionId: string): ExcelData | null {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.lastAccessed = Date.now();
      this.sessions.set(sessionId, session);
      return session.excelData;
    }
    return null;
  }

  public isSessionActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    const isExpired = now - session.lastAccessed > this.SESSION_TIMEOUT;
    
    if (isExpired) {
      this.endSession(sessionId);
      return false;
    }

    return session.isActive;
  }

  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.excelData = null;
      this.sessions.delete(sessionId);
    }
  }

  private cleanupSession(): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      this.endSession(currentSession);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastAccessed > this.SESSION_TIMEOUT) {
        this.endSession(sessionId);
      }
    });
  }

  private getCurrentSession(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('currentSessionId');
  }

  private generateSessionId(): string {
    const sessionId = Math.random().toString(36).substring(2, 15);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentSessionId', sessionId);
    }
    return sessionId;
  }
}

export default SessionManager; 
