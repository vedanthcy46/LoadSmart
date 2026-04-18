import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Brain, X, Plus } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { taskAPI, userAPI, skillAPI } from '../services/api';
import { useSearch } from '../contexts/SearchContext';

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
        userAPI.getAll(),
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

      setSuggestion(`Task split into ${data.tasks.length} sub-tasks by AI.`);
      setLastAssignment(data);
      setTasks(prev => [...data.tasks, ...prev]);
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

  const handleStatusChange = async (taskId, status, feedback) => {
    try {
      await taskAPI.updateStatus(taskId, status, feedback);
      fetchData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const { searchQuery } = useSearch();
  const query = searchQuery.toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const title = task.title?.toLowerCase() || '';
    const desc = task.description?.toLowerCase() || '';
    const priority = task.priority?.toLowerCase() || '';
    const assignedTo = typeof task.assignedTo === 'object' ? task.assignedTo.name?.toLowerCase() : (task.assignedTo?.toLowerCase() || '');

    return title.includes(query) || 
           desc.includes(query) || 
           priority.includes(query) || 
           assignedTo.includes(query);
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const reviewTasks = filteredTasks.filter(t => t.status === 'In Review');
  const activeTasks = filteredTasks.filter(t => t.status === 'In Progress' || t.status === 'Rejected');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="sticky top-16 bg-slate-50/95 backdrop-blur-sm z-30 py-4 border-b border-slate-200/50 mb-10">
        <h1 className="text-2xl font-bold text-slate-800">Task Allocation</h1>
        <p className="text-slate-500">AI-powered smart task assignment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {/* Form remains same */}
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

            {lastAssignment && lastAssignment.assignments && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Task Split & Assigned Successfully!</span>
                </div>
                <div className="space-y-3">
                  {lastAssignment.assignments.map((asgn, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border border-emerald-100 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-slate-800">{asgn.employeeId}</span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                          {asgn.hours} hrs
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Skill: <span className="text-slate-700 font-medium">{asgn.assignedSkill}</span></p>
                      <p className="text-xs text-slate-600 italic">"{asgn.reason}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {reviewTasks.length > 0 && (
            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
              <h2 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Awaiting Review ({reviewTasks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewTasks.map(task => (
                  <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              Pending Tasks ({pendingTasks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTasks.slice(0, 6).map(task => (
                <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-blue-600 mb-4 flex items-center gap-2">
              Active / Revision Needed ({activeTasks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTasks.slice(0, 6).map(task => (
                <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              Completed ({completedTasks.length})
            </h2>
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
