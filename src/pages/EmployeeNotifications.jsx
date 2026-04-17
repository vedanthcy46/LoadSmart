import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { authAPI } from '../services/auth.js';

export default function EmployeeNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserAndNotifications();
    }, []);

    const fetchUserAndNotifications = async () => {
        try {
            const { data } = await authAPI.getCurrentUser();
            setUser(data.user);
            const { data: notificationsData } = await notificationAPI.getAll({ employeeId: data.user.id });
            setNotifications(notificationsData);
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
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'task_assigned':
                return <User className="w-4 h-4 text-cyan-600" />;
            case 'deadline':
                return <Clock className="w-4 h-4 text-amber-600" />;
            case 'stress_alert':
                return <AlertTriangle className="w-4 h-4 text-rose-600" />;
            default:
                return <Bell className="w-4 h-4 text-slate-600" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                    <p className="text-slate-500">
                        Stay updated with your tasks and important updates
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark All Read
                    </button>
                )}
            </div>

            {/* Notification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{notifications.length}</p>
                            <p className="text-sm text-slate-500">Total</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{unreadCount}</p>
                            <p className="text-sm text-slate-500">Unread</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{notifications.length - unreadCount}</p>
                            <p className="text-sm text-slate-500">Read</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No notifications</h3>
                        <p className="text-slate-500">You're all caught up! Check back later for updates.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-6 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-cyan-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${notification.read ? 'bg-slate-100' : 'bg-cyan-100'
                                        }`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-800 font-medium'
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className="ml-4 px-3 py-1 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                        </div>

                                        {notification.taskId && (
                                            <div className="mt-2 text-xs text-slate-500">
                                                Task: {notification.taskId.title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}