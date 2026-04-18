import { useState, useEffect } from 'react';
import { Plus, X, Heart, Brain, Loader2 } from 'lucide-react';
import EmployeeCard from '../components/EmployeeCard';
import WorkloadIndicator from '../components/WorkloadIndicator';
import { userAPI, aiAPI, skillAPI } from '../services/api';

export default function TeamOverview() {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [stressAnalysis, setStressAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    skills: [],
    capacity: 50
  });

  const [editMode, setEditMode] = useState(false);

  const [stressForm, setStressForm] = useState({
    stressLevel: 1,
    stressNote: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [employeesRes, skillsRes] = await Promise.all([
        userAPI.getAll(),
        skillAPI.getAll()
      ]);
      setEmployees(employeesRes.data);
      setSkills(skillsRes.data);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await userAPI.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    // 1. Data Structuring
    const formData = {
      ...newEmployee,
      capacity: Number(newEmployee.capacity),
      // Ensure skills is an array (it should be, but let's be safe)
      skills: Array.isArray(newEmployee.skills) ? newEmployee.skills : []
    };

    console.log('[Auth Debug] Sending Data:', formData);

    // 2. Strict Validation
    if (!formData.name || !formData.email) {
      alert('Name and Email are required');
      return;
    }

    if (!editMode && !formData.password) {
      alert('Password is required for new employees');
      return;
    }

    if (formData.skills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    console.log('[Auth Debug] Saving Employee. Full State:', { 
      editMode, 
      selectedEmployeeId: selectedEmployee?.userId,
      fullSelected: selectedEmployee,
      formDataId: formData.userId
    });
    
    try {
      if (editMode && formData.userId) {
        console.log('[Auth Debug] Attempting PUT update for:', formData.userId);
        await userAPI.update(formData.userId, formData);
      } else if (editMode && !formData.userId) {
        console.error('[Auth Debug] ERROR: Edit mode is TRUE but formData.userId is MISSING!');
        alert('Error: Could not identify which employee to update. Please close and try again.');
        return;
      } else {
        console.log('[Auth Debug] Attempting POST create');
        await userAPI.create(formData);
      }
      setShowAddModal(false);
      setEditMode(false);
      setNewEmployee({ userId: '', name: '', email: '', password: '', skills: [], capacity: 50 });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert(error.response?.data?.error || 'Failed to save employee');
    }
  };

  const handleDeleteEmployee = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await userAPI.delete(userId);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const toggleSkill = (skill) => {
    setNewEmployee(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      await skillAPI.create(newSkill.trim());
      const skillsRes = await skillAPI.getAll();
      setSkills(skillsRes.data);
      // Automatically select the new skill for the employee
      toggleSkill(newSkill.trim());
      setNewSkill('');
    } catch (error) {
      console.error('Failed to create skill:', error);
      alert(error.response?.data?.error || 'Failed to create skill');
    }
  };

  const handleStressSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setAnalyzing(true);
    try {
      await userAPI.updateStress(selectedEmployee.userId, stressForm);
      const { data } = await aiAPI.analyzeStress({ ...stressForm, userId: selectedEmployee.userId });
      setStressAnalysis(data.analysis);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to analyze stress:', error);
    } finally {
      setAnalyzing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 bg-slate-50/95 backdrop-blur-sm z-30 py-4 border-b border-slate-200/50 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Overview</h1>
          <p className="text-slate-500 text-sm sm:text-base">Monitor team workload and performance</p>
        </div>
        <button
          onClick={() => {
            setEditMode(false);
            setSelectedEmployee(null);
            setNewEmployee({ userId: '', name: '', email: '', password: '', skills: [], capacity: 50 });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md sm:w-auto w-full"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(employee => (
          <EmployeeCard
            key={employee._id}
            employee={employee}
            onClick={() => {
              setSelectedEmployee(employee);
              setStressForm({
                stressLevel: employee.stressLevel || 1,
                stressNote: employee.stressNote || ''
              });
              setStressAnalysis('');
            }}
          />
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                {editMode ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setEditMode(false); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              {!editMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    value={newEmployee.userId}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Auto-generated if left blank"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required={!editMode}
                  placeholder={editMode && !newEmployee.email ? 'No email on record' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editMode ? 'New Password (Optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required={!editMode}
                  placeholder={editMode ? "Leave blank to keep current" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${newEmployee.skills.includes(skill)
                        ? 'bg-cyan-500 text-white border-cyan-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-500'
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Add other skill..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                {newEmployee.skills.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Please select at least one skill</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work Capacity: {newEmployee.capacity} tasks
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={newEmployee.capacity}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Low (1)</span>
                  <span>High (100)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
              >
                {editMode ? 'Save Changes' : 'Add Employee'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-800">{selectedEmployee.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setNewEmployee({
                        userId: selectedEmployee.userId,
                        name: selectedEmployee.name,
                        email: selectedEmployee.email || '',
                        password: '',
                        skills: selectedEmployee.skills || [],
                        capacity: selectedEmployee.capacity || 50
                      });
                      setShowAddModal(true);
                      setSelectedEmployee(null); // Close details modal to prevent stacking
                    }}
                    className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(selectedEmployee.userId)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-500">Employee ID</p>
                <p className="font-medium text-slate-800">{selectedEmployee.userId}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-800">{selectedEmployee.email}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Workload</p>
                <WorkloadIndicator workload={selectedEmployee.workload} />
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Performance Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{ width: `${selectedEmployee.performanceScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600">{selectedEmployee.performanceScore}%</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.skills?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg">
                      {skill}
                    </span>
                  ))}
                  {(!selectedEmployee.skills || selectedEmployee.skills.length === 0) && (
                    <p className="text-slate-400">No skills specified</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Work Capacity</p>
                <p className="font-medium text-slate-800">{selectedEmployee.capacity} tasks</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Current Load</p>
                <p className="font-medium text-slate-800">{selectedEmployee.currentLoad || 0} tasks</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-slate-800">Stress Level Check</h3>
              </div>

              <form onSubmit={handleStressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stress Level (1-5): {stressForm.stressLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={stressForm.stressLevel}
                    onChange={(e) => setStressForm(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">How are you feeling?</label>
                  <textarea
                    value={stressForm.stressNote}
                    onChange={(e) => setStressForm(prev => ({ ...prev, stressNote: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Describe your current state..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  Analyze Stress
                </button>
              </form>

              {stressAnalysis && (
                <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                  <p className="text-sm text-slate-600">{stressAnalysis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
