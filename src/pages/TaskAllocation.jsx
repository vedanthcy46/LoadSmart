import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Brain, X, Plus } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { taskAPI, employeeAPI, skillAPI } from '../services/api';

const priorities = ['High', 'Medium', 'Low'];

export default function TaskAllocation() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [lastAssignment, setLastAssignment] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    requiredSkills: [],
    estimatedHours: 4,
    deadline: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, employeesRes, skillsRes] = await Promise.all([
        taskAPI.getAll(),
        employeeAPI.getAll(),
        skillAPI.getAll()
      ]);
      setTasks(tasksRes.data);
      setEmployees(employeesRes.data);
      setSkills(skillsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill) => {
    setFormData(prev => {
      const isSelected = prev.requiredSkills.includes(skill);
      if (isSelected) {
        return { ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) };
      } else {
        return { ...prev, requiredSkills: [...prev.requiredSkills, skill] };
      }
    });
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      await skillAPI.create(newSkill.trim());
      const skillsRes = await skillAPI.getAll();
      setSkills(skillsRes.data);
      setNewSkill('');
    } catch (error) {
      console.error('Failed to create skill:', error);
      alert(error.response?.data?.error || 'Failed to create skill');
    }
  };

  const handleSuggest = async () => {
    if (!formData.title || formData.requiredSkills.length === 0) return;
    setAssigning(true);
    try {
      const { data } = await taskAPI.suggest({
        title: formData.title,
        requiredSkills: formData.requiredSkills,
        priority: formData.priority
      });
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.requiredSkills.length === 0) return;

    setAssigning(true);
    try {
      const { data } = await taskAPI.autoAssign({
        ...formData,
        deadline: formData.deadline || undefined
      });

      setSuggestion(data.aiExplanation);
      setLastAssignment(data);
      setTasks(prev => [data.task, ...prev]);
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        requiredSkills: [],
        estimatedHours: 4,
        deadline: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to auto-assign task:', error);
      setSuggestion('Failed to assign task. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status);
      fetchData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Task Allocation</h1>
        <p className="text-slate-500">AI-powered smart task assignment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-slate-800">New Task</h2>
            </div>

            <form onSubmit={handleAutoAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Task description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Required Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(skill => {
                    const isSelected = formData.requiredSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          isSelected 
                            ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-300'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Add new skill..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Add skill"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {formData.requiredSkills.length === 0 && (
                  <p className="text-xs text-rose-500 mt-2">Please select at least one skill.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min={1}
                    max={40}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={handleSuggest}
                disabled={!formData.title?.trim() || formData.requiredSkills.length === 0 || assigning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Get AI Suggestion
              </button>

              <button
                type="submit"
                disabled={!formData.title?.trim() || formData.requiredSkills.length === 0 || assigning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Get Suggestion + Auto Assign
              </button>
            </form>

            {suggestion && (
              <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-cyan-700 mb-1">AI Explanation</p>
                    <p className="text-sm text-slate-600">{suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {lastAssignment && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Task Assigned Successfully!</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Employee:</span> {lastAssignment.employee.name} ({lastAssignment.employee.employeeId})
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Skills:</span> {lastAssignment.employee.skills.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-semibold text-slate-800 mb-4">Pending Tasks ({pendingTasks.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTasks.slice(0, 6).map(task => (
                <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800 mb-4">Completed ({completedTasks.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedTasks.slice(0, 4).map(task => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
