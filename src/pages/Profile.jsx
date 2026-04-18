import { useState, useEffect } from 'react';
import { User, Mail, Lock, Briefcase, Save, X, Plus, Trash2 } from 'lucide-react';
import { profileAPI, skillAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skills: [],
    capacity: 50
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, skillsRes] = await Promise.all([
        profileAPI.getById(user.id),
        skillAPI.getAll()
      ]);
      
      const data = profileRes.data;
      setProfile(data);
      setAllSkills(skillsRes.data);
      
      setFormData({
        name: data.name || data.username || '',
        email: data.email || '',
        password: '',
        confirmPassword: '',
        skills: data.skills || [],
        capacity: data.capacity || 50
      });
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      setMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate passwords if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        skills: formData.skills,
        capacity: formData.capacity
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const { data } = await profileAPI.update(user.id, updateData);
      setProfile(data);
      setMessage('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between sticky top-16 bg-slate-50/95 backdrop-blur-sm z-30 py-4 border-b border-slate-200/50 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-500">Manage your account information</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {user?.role === 'admin' ? 'Username' : 'Name'}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Employee-specific fields */}
          {user?.role === 'employee' && (
            <>
              {/* Skills */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Skills
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select your skills</label>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.skills.includes(skill)
                            ? 'bg-cyan-500 text-white border-cyan-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-500'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {formData.skills.length === 0 && (
                    <p className="text-sm text-slate-500 mt-2">Please select at least one skill</p>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Work Capacity</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maximum tasks: {formData.capacity}
                  </label>
                  <input
                    type="range"
                    name="capacity"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Low (1)</span>
                    <span>High (100)</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: profile?.name || profile?.username || '',
                  email: profile?.email || '',
                  password: '',
                  confirmPassword: '',
                  skills: profile?.skills || [],
                  capacity: profile?.capacity || 50
                });
                setMessage('');
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
