import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.persistent ? undefined : 5000)
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600'
  };

  const Icon = icons[notification.type];

  return (
    <div className={`
      ${colors[notification.type]}
      border rounded-lg p-4 shadow-lg animate-in slide-in-from-right-full duration-300
      relative
    `}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${iconColors[notification.type]} flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          )}
          
          {notification.action && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-1 text-xs hover:bg-white/20"
              onClick={notification.action.onClick}
            >
              {notification.action.label}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 hover:bg-white/20 flex-shrink-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Hook for common notification patterns
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const showSuccess = (title: string, message?: string, action?: Notification['action']) => {
    return addNotification({ type: 'success', title, message, action });
  };

  const showError = (title: string, message?: string, action?: Notification['action']) => {
    return addNotification({ type: 'error', title, message, action, duration: 8000 });
  };

  const showInfo = (title: string, message?: string, action?: Notification['action']) => {
    return addNotification({ type: 'info', title, message, action });
  };

  const showWarning = (title: string, message?: string, action?: Notification['action']) => {
    return addNotification({ type: 'warning', title, message, action });
  };

  return { showSuccess, showError, showInfo, showWarning };
};

export default NotificationProvider;