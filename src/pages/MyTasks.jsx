import { useState, useEffect } from 'react';
import { HeartPulse, Loader2, X } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { taskAPI, aiAPI, feedbackAPI, dashboardAPI } from '../services/api';
import { MessageSquare, Trophy, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [stressForm, setStressForm] = useState({
    stressLevel: 1,
    stressNote: ''
  });
  const [stressAnalysis, setStressAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchLeaderboard();
    fetchMyTips();
  }, [user]);

  const fetchMyTips = async () => {
    try {
      const { data } = await feedbackAPI.getMyTips();
      setAllTips(data || []);
      if (data && data.length > 0) {
        setAiTips(data[0].aiTips || []);
      }
    } catch (error) {
      console.error('Failed to fetch AI tips:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await dashboardAPI.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data } = await taskAPI.getAll(null, user.id); 
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleStressSubmit = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    try {
      const { data } = await aiAPI.analyzeStress({
        ...stressForm,
        userId: user.id
      });
      setStressAnalysis(data.analysis);
    } catch (error) {
      console.error('Failed to analyze stress:', error);
      setStressAnalysis('Unable to analyze stress at this time.');
    } finally {
      setAnalyzing(false);
    }
  };

  const [aiTips, setAiTips] = useState([]);
  const [allTips, setAllTips] = useState([]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    setSubmittingFeedback(true);
    try {
      const { data } = await feedbackAPI.submit({
        message: feedback,
        stressLevel: stressForm.stressLevel
      });
      setFeedback('');
      setFeedbackSuccess(true);
      setAiTips(data.aiTips || []);
      fetchMyTips();
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;
  }

  const { searchQuery } = useSearch();
  const query = searchQuery.toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const title = task.title?.toLowerCase() || '';
    const desc = task.description?.toLowerCase() || '';
    const priority = task.priority?.toLowerCase() || '';

    return title.includes(query) || 
           desc.includes(query) || 
           priority.includes(query);
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const activeTasks = filteredTasks.filter(t => t.status === 'In Progress' || t.status === 'Rejected' || t.status === 'In Review');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="sticky top-[64px] bg-slate-50 z-30 py-4 border-b border-slate-200 mb-10 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-slate-500">Manage and track your assigned work</p>
        </div>
        <button
          onClick={() => setShowStressModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm sm:w-auto w-full"
        >
          <HeartPulse className="w-5 h-5" />
          Check Stress Level
        </button>
      </div>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              Submit Feedback to Admin
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts or concerns about your workload..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                rows="3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingFeedback || !feedback.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                >
                  {submittingFeedback ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : feedbackSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {feedbackSuccess ? 'Feedback Sent!' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>

          {aiTips.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-top duration-500">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                Your AI Coaching History
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {allTips.map((session, sIdx) => (
                  <div key={sIdx} className="min-w-[300px] flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg border border-cyan-400 p-5 text-white">
                    <p className="text-[10px] font-black uppercase opacity-70 mb-3 tracking-widest">
                      {new Date(session.createdAt).toLocaleDateString()} - Session {allTips.length - sIdx}
                    </p>
                    <ul className="space-y-3">
                      {session.aiTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white/10 p-2.5 rounded-lg border border-white/10">
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-medium leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-center">
                Confidential AI Guidance • Admin only sees your status, not these tips.
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Team Standing
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {leaderboard.map((player, index) => {
                const isPromotionZone = player.score >= 85;
                const isUser = player.userId === (user?.userId || user?.id);

                return (
                  <div key={player.userId} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isUser ? 'border-cyan-500 bg-cyan-50/50' : 
                    isPromotionZone ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                        index === 0 ? 'bg-amber-100 text-amber-600' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' : 
                        index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isUser ? 'text-cyan-700' : 'text-slate-800'}`}>
                          {player.name} {isUser && '(You)'}
                        </p>
                        {isPromotionZone && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                            Promotion Zone
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${isPromotionZone ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {player.score}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
              Score &gt; 85 = Promotion Zone
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Pending Tasks</h2>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
              {pendingTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {pendingTasks.map(task => (
              <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">No pending tasks</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Active Work</h2>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
              {activeTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {activeTasks.map(task => (
              <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
            ))}
            {activeTasks.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">No tasks in progress or review</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Completed</h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {completedTasks.map(task => (
              <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
            ))}
            {completedTasks.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">No completed tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stress Modal */}
      {showStressModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Stress Level Check
              </h3>
              <button onClick={() => setShowStressModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleStressSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stress Level (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stressForm.stressLevel}
                  onChange={e => setStressForm(prev => ({ ...prev, stressLevel: Number(e.target.value) }))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Relaxed</span>
                  <span>Overwhelmed</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">How are you feeling?</label>
                <textarea
                  value={stressForm.stressNote}
                  onChange={e => setStressForm(prev => ({ ...prev, stressNote: e.target.value }))}
                  placeholder="Share a brief note about your current workload..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !stressForm.stressNote.trim()}
                className="w-full bg-rose-500 text-white py-2 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
                Analyze Stress
              </button>
            </form>

            {stressAnalysis && (
              <div className="p-6 bg-rose-50 border-t border-rose-100">
                <p className="text-sm text-rose-800 font-medium">AI Insight:</p>
                <p className="text-sm text-rose-700 mt-1">{stressAnalysis}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}