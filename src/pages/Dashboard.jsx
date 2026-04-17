import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, ClipboardCheck, Clock, TrendingUp, AlertTriangle, Sparkles, Trophy, MessageSquare } from 'lucide-react';
import StatCard from '../components/StatCard';
import { dashboardAPI, feedbackAPI, userAPI } from '../services/api';

const COLORS = ['#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [workloadDist, setWorkloadDist] = useState(null);
  const [priorityDist, setPriorityDist] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, teamRes, workloadRes, priorityRes, leaderboardRes, feedbacksRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getTeamOverview(),
          dashboardAPI.getWorkloadDistribution(),
          dashboardAPI.getTaskPriorityDistribution(),
          dashboardAPI.getLeaderboard(),
          feedbackAPI.getAll()
        ]);
        setStats(statsRes.data);
        setTeamData(teamRes.data);
        setWorkloadDist(workloadRes.data);
        setPriorityDist(priorityRes.data);
        setLeaderboard(leaderboardRes.data);
        setFeedbacks(feedbacksRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  const workloadChartData = workloadDist ? [
    { name: 'Low', value: workloadDist.low, color: '#10b981' },
    { name: 'Balanced', value: workloadDist.balanced, color: '#f59e0b' },
    { name: 'Overloaded', value: workloadDist.overloaded, color: '#ef4444' }
  ] : [];

  const priorityChartData = priorityDist ? [
    { name: 'High', value: priorityDist.high, color: '#ef4444' },
    { name: 'Medium', value: priorityDist.medium, color: '#f59e0b' },
    { name: 'Low', value: priorityDist.low, color: '#10b981' }
  ] : [];

  const taskStatusData = stats ? [
    { name: 'Completed', value: stats.completedTasks },
    { name: 'In Progress', value: stats.inProgressTasks },
    { name: 'Pending', value: stats.pendingTasks }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Overview of team performance and task distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={ClipboardCheck}
          color="green"
        />
        <StatCard
          title="Avg Productivity"
          value={`${stats?.avgProductivity || 0}%`}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Overloaded"
          value={stats?.overloadedCount || 0}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {stats?.aiInsights && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">AI Productivity Insights</h3>
              <p className="text-slate-600 text-sm">{stats.aiInsights}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Team Leaderboard & Rewards</h2>
          </div>
          <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Promotion Zone (&gt;85)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-cyan-500 rounded-full"></div> High Performer</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {leaderboard.map((player, index) => {
            const isPromotionZone = player.score >= 85;
            const isHighPerformer = player.score >= 70 && player.score < 85;
            
            return (
              <div key={player.userId} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isPromotionZone ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 
                isHighPerformer ? 'bg-cyan-50/30 border-cyan-100' : 'bg-slate-50/30 border-slate-100'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                    index === 0 ? 'bg-amber-100 text-amber-600' : 
                    index === 1 ? 'bg-slate-200 text-slate-600' : 
                    index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-400'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{player.name}</span>
                      {isPromotionZone && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tighter">
                          Promotion Candidate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{player.completedTasks} Tasks Completed</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-2xl font-black ${
                      isPromotionZone ? 'text-emerald-600' : 'text-slate-700'
                    }`}>{player.score}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Productivity</div>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      try {
                        await userAPI.awardBadge(player.userId, 'Top Performer 🏆');
                        alert(`Reward given to ${player.name}!`);
                      } catch (err) {
                        alert('Failed to award badge');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      isPromotionZone 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isPromotionZone ? 'Give Reward 🎁' : 'Commend'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workloadChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {workloadChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Task Priority Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={priorityChartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {priorityChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Team Performance Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Performance</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Workload</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Tasks</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((employee) => (
                <tr key={employee._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${employee.performanceScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{employee.performanceScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            employee.workload < 40 ? 'bg-emerald-500' :
                            employee.workload <= 80 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${employee.workload}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{employee.workload}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {employee.completedTaskCount}/{employee.taskCount}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                      employee.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-6 h-6 text-cyan-600" />
          <h2 className="text-lg font-bold text-slate-800">Employee Feedback</h2>
        </div>
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <p className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">No feedback received yet.</p>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb._id} className="p-4 rounded-lg border border-slate-100 hover:border-cyan-200 transition-colors bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{fb.employeeId}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      fb.stressLevel >= 4 ? 'bg-rose-100 text-rose-700' :
                      fb.stressLevel >= 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      Stress: {fb.stressLevel}/5
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 text-sm italic">"{fb.message}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
