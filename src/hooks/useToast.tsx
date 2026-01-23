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
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((newToast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastWithId: ToastProps = {
      ...newToast,
      id,
      onClose: () => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }
    };
    
    setToasts(prev => [...prev, toastWithId]);

    // Auto-hide toast after duration (default 5 seconds)
    const duration = newToast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience functions for different toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'success', message, title, duration: duration || 4000 }),
    
    error: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'error', message, title, duration: duration || 6000 }),
    
    warning: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'warning', message, title, duration: duration || 5000 }),
    
    info: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'info', message, title, duration: duration || 4000 })
  };
};