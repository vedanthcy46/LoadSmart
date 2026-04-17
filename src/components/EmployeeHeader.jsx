import { Bell, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { authAPI } from '../services/auth.js';

export default function EmployeeHeader() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await authAPI.getCurrentUser();
                setUser(data.user);
            } catch (error) {
                console.error('Failed to fetch user');
            }
        };

        fetchUser();

        const fetchNotifications = async () => {
            try {
                const { data } = await notificationAPI.getAll({ employeeId: user?.id });
                const unread = data.filter(n => !n.read).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        if (user?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
            <div className="flex items-center gap-4 flex-1">
                <div className="text-lg font-semibold text-slate-800">
                    Welcome back, {user?.name || 'Employee'}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-800">{user?.name || 'Employee'}</p>
                        <p className="text-xs text-slate-500">Employee</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
            </div>
        </header>
    );
}