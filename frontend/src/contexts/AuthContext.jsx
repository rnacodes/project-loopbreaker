import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5033/api';
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            const { token: newToken, username: userName, expiresAt } = response.data;
            
            // Store token and user info
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify({ 
                username: userName, 
                expiresAt 
            }));
            
            setToken(newToken);
            setUser({ username: userName, expiresAt });
            
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        // Remove token and user info from storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = () => {
        if (!token || !user) return false;
        
        // Check if token is expired
        if (user.expiresAt) {
            const expiryDate = new Date(user.expiresAt);
            if (expiryDate <= new Date()) {
                logout();
                return false;
            }
        }
        
        return true;
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: isAuthenticated()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
