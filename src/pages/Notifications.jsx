import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Clock, Info, MessageSquare } from 'lucide-react';
import { notificationAPI, feedbackAPI } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchNotifications();
    fetchFeedbacks();
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

  const fetchFeedbacks = async () => {
    try {
      const { data } = await feedbackAPI.getAll();
      setFeedbacks(data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
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
      <div className="sticky top-16 bg-slate-50/95 backdrop-blur-sm z-30 py-4 border-b border-slate-200/50 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Communication Hub</h1>
            <p className="text-slate-500">Manage alerts and employee feedback</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'notifications' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Alerts ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'feedback' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Feedback ({feedbacks.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'notifications' ? (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-bold"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
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
                    : 'border-cyan-200 bg-gradient-to-r from-white to-cyan-50 shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg ${notification.read ? 'bg-slate-100' : 'bg-cyan-100'}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1">
                  <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>
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
      ) : (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No feedback messages yet</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black">
                      {fb.employeeId?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{fb.employeeId}</p>
                      <p className="text-xs text-slate-400">{new Date(fb.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black ${
                    fb.stressLevel >= 4 ? 'bg-rose-100 text-rose-700' :
                    fb.stressLevel >= 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    STRESS: {fb.stressLevel}/5
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700 text-sm leading-relaxed">
                  "{fb.message}"
                </div>
                <div className="flex justify-end border-t border-slate-50 pt-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Confidential Message to Admin
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
