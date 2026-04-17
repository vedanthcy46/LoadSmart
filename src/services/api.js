import api from './auth.js';

export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  updateStress: (id, data) => api.put(`/employees/${id}/stress`, data),
  getStats: (id) => api.get(`/employees/${id}/stats`),
  delete: (id) => api.delete(`/employees/${id}`)
};

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
  getTaskPriorityDistribution: () => api.get('/dashboard/task-priority-distribution')
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

export default api;
