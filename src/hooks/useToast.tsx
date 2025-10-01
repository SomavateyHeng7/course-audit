'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastProps } from '@/components/ui/toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = useCallback((newToast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const toastWithId: ToastProps = {
      ...newToast,
      id: Math.random().toString(36).substr(2, 9),
      onClose: () => setToast(null)
    };
    
    setToast(toastWithId);

    // Auto-hide toast after duration (default 4 seconds)
    const duration = newToast.duration || 4000;
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          {...toast}
        />
      )}
    </ToastContext.Provider>
  );
};

// Convenience functions for different toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'success', message, title, duration }),
    
    error: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'error', message, title, duration }),
    
    warning: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'warning', message, title, duration }),
    
    info: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'info', message, title, duration })
  };
};