import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle2, Star, Target, Calendar } from 'lucide-react';
import { employeeAPI } from '../services/api';
import { authAPI } from '../services/auth.js';

export default function MyPerformance() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserAndStats();
    }, []);

    const fetchUserAndStats = async () => {
        try {
            const { data } = await authAPI.getCurrentUser();
            setUser(data.user);
            const { data: statsData } = await employeeAPI.getStats(data.user.id);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch performance stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No performance data</h3>
                <p className="text-slate-500">Complete some tasks to see your performance metrics.</p>
            </div>
        );
    }

    const productivityScore = stats.productivityScore || 0;
    const completionRate = stats.taskCount > 0 ? Math.round((stats.completedTaskCount / stats.taskCount) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Performance</h1>
                <p className="text-slate-500">Track your productivity and task completion metrics</p>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.completedTaskCount}</p>
                            <p className="text-sm text-slate-500">Tasks Completed</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        Out of {stats.taskCount} total tasks
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{completionRate}%</p>
                            <p className="text-sm text-slate-500">Completion Rate</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        Tasks completed vs assigned
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.performanceScore}%</p>
                            <p className="text-sm text-slate-500">Performance Score</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        Based on manager evaluation
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.workload}%</p>
                            <p className="text-sm text-slate-500">Current Workload</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        Capacity utilization
                    </div>
                </div>
            </div>

            {/* Productivity Score */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Productivity Score</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Overall Productivity</span>
                            <span className="text-sm font-medium text-slate-800">{productivityScore}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                                style={{ width: `${productivityScore}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">{productivityScore}</div>
                        <div className="text-sm text-slate-500">out of 100</div>
                    </div>
                </div>
            </div>

            {/* Skills and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.skills?.map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg"
                            >
                                {skill}
                            </span>
                        )) || (
                                <p className="text-sm text-slate-500">No skills assigned</p>
                            )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Current Status</h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${stats.status === 'available' ? 'bg-emerald-500' :
                            stats.status === 'busy' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                        <span className="text-sm font-medium text-slate-800 capitalize">
                            {stats.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                        {stats.status === 'available' && 'Ready for new tasks'}
                        {stats.status === 'busy' && 'Working on current assignments'}
                        {stats.status === 'overloaded' && 'Consider workload management'}
                    </p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">Account Created</p>
                            <p className="text-xs text-slate-500">
                                {new Date(stats.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {stats.stressLevel > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                            <div className="w-4 h-4 bg-rose-100 rounded-full flex items-center justify-center">
                                <span className="text-xs text-rose-600">!</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">Last Stress Check</p>
                                <p className="text-xs text-slate-500">
                                    Level: {stats.stressLevel}/5 - {stats.stressNote || 'No notes'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}