import api from './auth.js';

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStress: (id, data) => api.put(`/users/${id}/stress`, data),
  getStats: (id) => api.get(`/users/${id}/stats`),
  awardBadge: (id, badge) => api.post(`/users/${id}/badge`, { badge }),
  delete: (id) => api.delete(`/users/${id}`)
};

export const employeeAPI = userAPI; // Alias for backward compatibility

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  autoAssign: (data) => api.post('/tasks/auto-assign', data),
  suggest: (data) => api.post('/tasks/suggest', data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getTeamOverview: () => api.get('/dashboard/team-overview'),
  getWorkloadDistribution: () => api.get('/dashboard/workload-distribution'),
  getTaskPriorityDistribution: () => api.get('/dashboard/task-priority-distribution'),
  getLeaderboard: () => api.get('/dashboard/leaderboard')
};

export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getAll: () => api.get('/feedback'),
  getMyTips: () => api.get('/feedback/my-tips'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getByUserId: (userId) => api.get(`/notifications/${userId}`),
  markAsRead: (id) => api.patch(`/notifications/${id}`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

export const profileAPI = {
  getById: (id) => api.get(`/profile/${id}`),
  update: (id, data) => api.put(`/profile/${id}`, data)
};

export const aiAPI = {
  analyzeStress: (data) => api.post('/ai/analyze-stress', data)
};

export const skillAPI = {
  getAll: () => api.get('/skills'),
  create: (name) => api.post('/skills', { name })
};

export const analyticsAPI = {
  getEmployees: (filter) => api.get('/analytics/employees', { params: { filter } }),
  getTasks: (filter) => api.get('/analytics/tasks', { params: { filter } }),
  getProductivity: (filter) => api.get('/analytics/productivity', { params: { filter } }),
  getOverloaded: () => api.get('/analytics/overloaded')
};

export default api;
