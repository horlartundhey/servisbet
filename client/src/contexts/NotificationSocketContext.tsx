import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const addNotification = useCallback((notification: Omit<Notification, 'read'>) => {
    setNotifications(prev => [
      { ...notification, read: false },
      ...prev.slice(0, 49) // Keep only last 50 notifications
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://servisbeta-server-ten.vercel.app'  // Update with your production URL
      : 'http://localhost:5000';

    const newSocket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to notification server');
      setIsConnected(true);

      // Authenticate with server
      newSocket.emit('authenticate', {
        userId: user._id,
        userRole: user.role,
        businessIds: user.businessIds || [] // Add business IDs if available
      });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification server');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      if (data.success) {
        console.log('✅ Successfully authenticated with notification server');
      }
    });

    newSocket.on('authentication_error', (data) => {
      console.error('❌ Authentication failed:', data.error);
    });

    newSocket.on('notification', (notification) => {
      console.log('📢 New notification received:', notification);
      addNotification(notification);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico', // Add your app icon
          tag: notification.id
        });
      }

      // Play notification sound
      try {
        const audio = new Audio('/notification-sound.mp3'); // Add notification sound file
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound'));
      } catch (error) {
        // Ignore audio errors
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, addNotification]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};