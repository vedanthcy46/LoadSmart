import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/auth.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuthStatus = async () => {
        try {
            const { data } = await authAPI.getCurrentUser();
            setUser(data.user);
        } catch (error) {
            setUser(null);
            localStorage.removeItem('token'); // Clear invalid token
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const { data } = await authAPI.login(credentials);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};