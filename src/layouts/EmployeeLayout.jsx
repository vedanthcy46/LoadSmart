import { Routes, Route } from 'react-router-dom';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import MyTasks from '../pages/MyTasks';
import MyPerformance from '../pages/MyPerformance';
import EmployeeNotifications from '../pages/EmployeeNotifications';
import Profile from '../pages/Profile';

export default function EmployeeLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <EmployeeSidebar />
            <EmployeeHeader />
            <main className="ml-64 pt-16 p-6">
                <Routes>
                    <Route path="/" element={<MyTasks />} />
                    <Route path="/performance" element={<MyPerformance />} />
                    <Route path="/notifications" element={<EmployeeNotifications />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </main>
        </div>
    );
}