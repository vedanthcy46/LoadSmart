import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from '../pages/Dashboard';
import TaskAllocation from '../pages/TaskAllocation';
import TeamOverview from '../pages/TeamOverview';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import EmployeeAnalytics from '../pages/analytics/EmployeeAnalytics';
import TaskAnalytics from '../pages/analytics/TaskAnalytics';
import ProductivityAnalytics from '../pages/analytics/ProductivityAnalytics';
import OverloadedAnalytics from '../pages/analytics/OverloadedAnalytics';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="lg:ml-64 pt-16 p-4 md:p-6 transition-all duration-300">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<TaskAllocation />} />
                    <Route path="/team" element={<TeamOverview />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/analytics/employees" element={<EmployeeAnalytics />} />
                    <Route path="/analytics/tasks" element={<TaskAnalytics />} />
                    <Route path="/analytics/productivity" element={<ProductivityAnalytics />} />
                    <Route path="/analytics/overloaded" element={<OverloadedAnalytics />} />
                </Routes>
            </main>
        </div>
    );
}