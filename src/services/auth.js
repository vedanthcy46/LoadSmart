import axios from 'axios';

const API_BASE_URL = 'https://loadsmart.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to attach token from localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`[Auth Debug] Attaching token to ${config.method?.toUpperCase()} ${config.url}`);
        } else {
            console.log(`[Auth Debug] No token found in localStorage for ${config.url}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        // If the response contains a token, save it
        if (response.data?.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    logout: () => {
        localStorage.removeItem('token');
        return api.post('/auth/logout');
    },
    getCurrentUser: () => api.get('/auth/me')
};

export default api;