import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { AlertTriangle, ArrowLeft, User, Zap, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, taskAPI } from '../../services/api';

export default function OverloadedAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reassigning, setReassigning] = useState(null); // ID of user being reassigned
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getOverloaded();
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch overloaded analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReassign = async (userId) => {
    try {
      setReassigning(userId);
      await taskAPI.reassignOverloaded(userId);
      setSuccess(userId);
      setTimeout(() => {
        setSuccess(null);
        fetchData(); // Refresh list
      }, 3000);
    } catch (error) {
      console.error('Reassignment failed:', error);
      alert('Failed to reassign tasks automatically. Please try manual reassignment.');
    } finally {
      setReassigning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-slate-800">Overloaded Employees</h1>
              <p className="text-slate-500">Employees with workload exceeding 80% capacity</p>
            </div>
          </div>
          <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {data.length} Critical Cases
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload vs Capacity Comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">Workload Intensity (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.workload > 100 ? '#be123c' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Urgent Interventions Needed
          </h3>
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">No overloaded employees found. Good job!</div>
            ) : (
              data.map((emp) => (
                <div key={emp.userId} className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-rose-100 shadow-sm">
                        <User className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{emp.userId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-600 leading-tight">{emp.workload}%</p>
                      <p className="text-[10px] text-rose-400 font-bold uppercase">Workload</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                        <span>Load: {emp.currentLoadHours || 0}h / {emp.capacity}h capacity ({emp.currentLoad} tasks)</span>
                        <span>Stress: {emp.stressLevel}/5</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, emp.workload)}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleReassign(emp.userId)}
                      disabled={reassigning === emp.userId || success === emp.userId}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                        success === emp.userId 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
                      } disabled:opacity-50`}
                    >
                      {reassigning === emp.userId ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Reassigning...
                        </>
                      ) : success === emp.userId ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </>
                      ) : (
                        'Reassign Tasks'
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
