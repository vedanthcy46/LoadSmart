import { NavLink } from 'react-router-dom';
import {
    ClipboardList,
    TrendingUp,
    Bell,
    Brain,
    LogOut,
    User
} from 'lucide-react';
import { authAPI } from '../services/auth.js';

const navItems = [
    { to: '/employee', icon: ClipboardList, label: 'My Tasks' },
    { to: '/employee/performance', icon: TrendingUp, label: 'My Performance' },
    { to: '/employee/notifications', icon: Bell, label: 'Notifications' },
    { to: '/employee/profile', icon: User, label: 'Profile' },
]

export default function EmployeeSidebar() {
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
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">TaskAI</h1>
                        <p className="text-xs text-slate-400">Employee Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors w-full"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}