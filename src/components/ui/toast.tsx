import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      default:
        return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 dark:bg-green-600';
      case 'error':
        return 'bg-red-500 dark:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'info':
        return 'bg-blue-500 dark:bg-blue-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        text-white 
        rounded-lg shadow-2xl 
        max-w-md min-w-[320px] w-full
        animate-slide-in-right
        border-2 border-white/20
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-bold text-base mb-1.5 line-clamp-1">
              {title}
            </div>
          )}
          <div className="text-sm font-medium opacity-95 line-clamp-2">
            {message}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;