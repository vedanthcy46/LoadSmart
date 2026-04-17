import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Clock, Info } from 'lucide-react';
import { notificationAPI } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <Bell className="w-5 h-5 text-cyan-500" />;
      case 'deadline':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'stress_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4 transition-all ${
                notification.read
                  ? 'border-slate-200 opacity-75'
                  : 'border-cyan-200 bg-gradient-to-r from-white to-cyan-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${notification.read ? 'bg-slate-100' : 'bg-cyan-100'}`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1">
                <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>

              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification._id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
