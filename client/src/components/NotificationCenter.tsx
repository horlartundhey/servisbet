import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationSocketContext';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isConnected } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">{isConnected ? 'Real-time active' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
