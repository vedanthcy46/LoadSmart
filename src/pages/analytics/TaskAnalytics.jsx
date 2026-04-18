import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ClipboardCheck, Filter, ArrowLeft, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';

const COLORS = ['#f59e0b', '#06b6d4', '#10b981']; // Pending, In Progress, Completed

export default function TaskAnalytics() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('weekly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getTasks(filter);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch task analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  const statusData = [
    { name: 'Pending', value: data?.statusBreakdown.pending, color: '#f59e0b' },
    { name: 'In Progress', value: data?.statusBreakdown.inProgress, color: '#06b6d4' },
    { name: 'Completed', value: data?.statusBreakdown.completed, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      <div className="sticky top-[64px] bg-slate-50 z-30 py-4 border-b border-slate-200 mb-10 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Task Analytics</h1>
              <p className="text-slate-500">Task trends, status breakdown and priority distribution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === t 
                  ? 'bg-emerald-500 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">Status Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">Task Creation Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.taskTrends || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Filtered Tasks</h3>
          <span className="text-sm text-slate-500 font-medium">Total: {data?.totalTasks}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="text-left py-4 px-6 font-semibold">Task Details</th>
                <th className="text-center py-4 px-6 font-semibold">Priority</th>
                <th className="text-center py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                      task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'In Progress' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {task.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600 font-medium italic">
                      {task.assignedTo || 'Unassigned'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
