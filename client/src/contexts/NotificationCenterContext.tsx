import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationData } from '../components/NotificationCenter';

interface NotificationCenterContextType {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationData, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
}

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

interface NotificationCenterProviderProps {
  children: ReactNode;
}

export const NotificationCenterProvider: React.FC<NotificationCenterProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        type: 'review',
        title: 'New Review Received',
        message: 'Sarah Johnson left a 5-star review for Amazing Italian Restaurant',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          businessName: 'Amazing Italian Restaurant',
          userName: 'Sarah Johnson',
          rating: 5,
          reviewId: 'review123'
        }
      },
      {
        id: '2',
        type: 'response',
        title: 'Business Responded',
        message: 'TechFix Computer Repair responded to your review',
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        metadata: {
          businessName: 'TechFix Computer Repair'
        }
      },
      {
        id: '3',
        type: 'system',
        title: 'Profile Updated',
        message: 'Your business profile has been successfully updated',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: '4',
        type: 'business',
        title: 'New Business Follower',
        message: 'Mike Customer is now following your business',
        isRead: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        metadata: {
          userName: 'Mike Customer'
        }
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notificationData: Omit<NotificationData, 'id' | 'createdAt'>) => {
    const newNotification: NotificationData = {
      ...notificationData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationCenterContext.Provider>
  );
};

export const useNotificationCenter = (): NotificationCenterContextType => {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
  }
  return context;
};

export default NotificationCenterProvider;